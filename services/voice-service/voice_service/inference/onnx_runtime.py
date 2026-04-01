"""ONNX Runtime inference wrapper with GPU optimization."""

import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
import numpy as np
import time

logger = logging.getLogger(__name__)


class ONNXInferenceEngine:
    """ONNX Runtime inference engine with GPU/CPU support."""

    def __init__(
        self,
        model_path: Path,
        device: str = "cpu",
        providers: Optional[List[str]] = None,
    ):
        """
        Initialize ONNX inference engine.

        Args:
            model_path: Path to ONNX model file
            device: Device to use ("cpu", "cuda", "trt")
            providers: List of ONNX Runtime providers (auto-detect if None)
        """
        self.model_path = Path(model_path)
        self.device = device
        self.session = None
        self.input_shape = None
        self.output_names = None

        try:
            import onnxruntime as ort

            # Auto-detect providers if not specified
            if providers is None:
                providers = self._get_providers(device)

            # Create session with optimization
            logger.info(f"Creating ONNX session with providers: {providers}")
            sess_options = ort.SessionOptions()
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            sess_options.inter_op_num_threads = 4
            sess_options.intra_op_num_threads = 4

            self.session = ort.InferenceSession(
                str(model_path), sess_options, providers=providers
            )

            # Get model info
            self.input_names = [inp.name for inp in self.session.get_inputs()]
            self.output_names = [out.name for out in self.session.get_outputs()]
            self.input_shape = self.session.get_inputs()[0].shape if self.input_names else None

            logger.info(
                f"ONNX model loaded: inputs={self.input_names}, "
                f"outputs={self.output_names}"
            )
        except ImportError:
            logger.error("onnxruntime not installed. Install with: pip install onnxruntime")
            raise
        except Exception as e:
            logger.error(f"Failed to load ONNX model: {e}")
            raise

    def _get_providers(self, device: str) -> List[str]:
        """Get ONNX Runtime providers for device."""
        if device == "cuda":
            return ["CUDAExecutionProvider", "CPUExecutionProvider"]
        elif device == "trt":
            return ["TensorrtExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]
        else:
            return ["CPUExecutionProvider"]

    def predict(self, inputs: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Run inference on input.

        Args:
            inputs: Dictionary of input names to numpy arrays

        Returns:
            Dictionary of output names to numpy arrays
        """
        if self.session is None:
            raise RuntimeError("ONNX session not initialized")

        start_time = time.time()
        try:
            outputs = self.session.run(self.output_names, inputs)
            inference_time = time.time() - start_time

            result = {name: output for name, output in zip(self.output_names, outputs)}
            result["_inference_time_ms"] = inference_time * 1000

            return result
        except Exception as e:
            logger.error(f"Inference error: {e}")
            raise

    def get_input_info(self) -> Dict[str, Any]:
        """Get input tensor information."""
        if not self.session:
            return {}

        info = {}
        for inp in self.session.get_inputs():
            info[inp.name] = {
                "shape": inp.shape,
                "type": inp.type,
            }
        return info

    def get_output_info(self) -> Dict[str, Any]:
        """Get output tensor information."""
        if not self.session:
            return {}

        info = {}
        for out in self.session.get_outputs():
            info[out.name] = {
                "shape": out.shape,
                "type": out.type,
            }
        return info

    def benchmark(
        self,
        input_data: Dict[str, np.ndarray],
        num_iterations: int = 100,
    ) -> Dict[str, Any]:
        """
        Benchmark inference performance.

        Args:
            input_data: Sample input data
            num_iterations: Number of iterations

        Returns:
            Benchmark statistics
        """
        times = []

        # Warmup
        for _ in range(5):
            self.predict(input_data)

        # Measure
        for _ in range(num_iterations):
            start = time.time()
            self.predict(input_data)
            times.append((time.time() - start) * 1000)

        times = np.array(times)

        return {
            "iterations": num_iterations,
            "latency_ms": {
                "mean": float(np.mean(times)),
                "min": float(np.min(times)),
                "max": float(np.max(times)),
                "std": float(np.std(times)),
                "p95": float(np.percentile(times, 95)),
                "p99": float(np.percentile(times, 99)),
            },
            "throughput_samples_per_sec": float(1000 / np.mean(times)),
        }

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        if not self.session:
            return {}

        model_size_mb = self.model_path.stat().st_size / (1024 * 1024) if self.model_path.exists() else 0

        return {
            "model_path": str(self.model_path),
            "model_size_mb": model_size_mb,
            "device": self.device,
            "providers": self.session.get_providers() if self.session else [],
            "inputs": self.get_input_info(),
            "outputs": self.get_output_info(),
        }

    def unload(self) -> None:
        """Unload ONNX session."""
        self.session = None
        logger.debug("ONNX session unloaded")
