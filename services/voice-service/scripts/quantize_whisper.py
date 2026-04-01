#!/usr/bin/env python3
"""Script to convert and quantize Whisper models for optimal size/speed tradeoffs."""

import argparse
import logging
import sys
from pathlib import Path
from typing import Optional, Dict, Any

import torch
import numpy as np

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)


def check_dependencies():
    """Check required dependencies."""
    required = ["torch", "transformers"]
    optional = ["onnx", "onnxruntime"]

    for package in required:
        try:
            __import__(package)
            logger.info(f"✓ {package} installed")
        except ImportError:
            logger.error(f"✗ {package} not installed (required)")
            sys.exit(1)

    for package in optional:
        try:
            __import__(package)
            logger.info(f"✓ {package} installed (optional)")
        except ImportError:
            logger.warning(f"✗ {package} not installed (optional, some features unavailable)")


def download_whisper_model(model_size: str = "base", cache_dir: Optional[Path] = None) -> str:
    """
    Download Whisper model from OpenAI.

    Args:
        model_size: Model size (tiny, base, small, medium, large)
        cache_dir: Cache directory for models

    Returns:
        Path to downloaded model
    """
    import whisper

    logger.info(f"Loading Whisper {model_size} model...")
    model = whisper.load_model(model_size, cache_dir=str(cache_dir) if cache_dir else None)
    return model


def convert_to_onnx(
    model,
    model_size: str,
    output_path: Path,
    device: str = "cpu",
):
    """
    Convert Whisper model to ONNX format.

    Args:
        model: Loaded Whisper model
        model_size: Model size for naming
        output_path: Path to save ONNX model
        device: Device to use (cpu or cuda)
    """
    logger.info(f"Converting Whisper {model_size} to ONNX...")

    try:
        # Create dummy inputs
        mel_spec = torch.randn(1, 80, 3000, device=device)  # Batch, mel bins, time steps
        tokens = torch.ones(1, 1, dtype=torch.long, device=device)

        # Export to ONNX
        torch.onnx.export(
            model,
            (mel_spec, tokens),
            str(output_path),
            input_names=["mel_spectrogram", "tokens"],
            output_names=["logits"],
            opset_version=14,
            dynamic_axes={
                "mel_spectrogram": {2: "time"},
                "tokens": {1: "sequence_length"},
                "logits": {1: "sequence_length"},
            },
            verbose=False,
        )

        logger.info(f"✓ Exported to ONNX: {output_path}")
        logger.info(f"  File size: {output_path.stat().st_size / 1024 / 1024:.1f}MB")

    except Exception as e:
        logger.error(f"Failed to convert to ONNX: {e}")
        raise


def quantize_onnx(
    onnx_model_path: Path,
    output_path: Path,
    quantization_type: str = "int8",
    calibration_data_size: int = 100,
):
    """
    Quantize ONNX model.

    Args:
        onnx_model_path: Path to ONNX model
        output_path: Path to save quantized model
        quantization_type: Type of quantization (int8, int4, or int8_dynamic)
        calibration_data_size: Number of calibration samples
    """
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        logger.error(
            "ONNX Runtime Quantization not available. "
            "Install with: pip install onnxruntime[quantization]"
        )
        return

    logger.info(f"Quantizing ONNX model to {quantization_type}...")

    try:
        if quantization_type == "int8":
            # Static quantization (better accuracy)
            quantize_dynamic(
                str(onnx_model_path),
                str(output_path),
                weight_type=QuantType.QInt8,
                optimize_model=True,
                per_channel=True,
            )
        elif quantization_type == "int8_dynamic":
            # Dynamic quantization (faster)
            quantize_dynamic(
                str(onnx_model_path),
                str(output_path),
                weight_type=QuantType.QInt8,
                optimize_model=True,
            )
        else:
            logger.warning(f"Quantization type {quantization_type} not supported")
            return

        original_size = onnx_model_path.stat().st_size / 1024 / 1024
        quantized_size = output_path.stat().st_size / 1024 / 1024
        reduction = (1 - quantized_size / original_size) * 100

        logger.info(f"✓ Quantized successfully")
        logger.info(f"  Original size: {original_size:.1f}MB")
        logger.info(f"  Quantized size: {quantized_size:.1f}MB")
        logger.info(f"  Size reduction: {reduction:.1f}%")
        logger.info(f"  Saved to: {output_path}")

    except Exception as e:
        logger.error(f"Quantization failed: {e}")
        raise


def benchmark_model(
    model_path: Path,
    model_size: str = "base",
    num_iterations: int = 10,
) -> Dict[str, Any]:
    """
    Benchmark model inference performance.

    Args:
        model_path: Path to ONNX model
        model_size: Model size
        num_iterations: Number of iterations for benchmarking

    Returns:
        Dictionary with benchmark results
    """
    logger.info(f"Benchmarking model ({num_iterations} iterations)...")

    try:
        import onnxruntime as ort

        sess = ort.InferenceSession(str(model_path))

        # Create dummy input
        mel_spec = np.random.randn(1, 80, 3000).astype(np.float32)
        tokens = np.ones((1, 1), dtype=np.int64)

        inputs = {
            "mel_spectrogram": mel_spec,
            "tokens": tokens,
        }

        # Warmup
        for _ in range(2):
            sess.run(None, inputs)

        # Measure
        import time

        times = []
        for _ in range(num_iterations):
            start = time.time()
            sess.run(None, inputs)
            times.append((time.time() - start) * 1000)

        times = np.array(times)

        result = {
            "model_size": model_size,
            "file_size_mb": model_path.stat().st_size / 1024 / 1024,
            "iterations": num_iterations,
            "latency_ms": {
                "mean": float(np.mean(times)),
                "std": float(np.std(times)),
                "min": float(np.min(times)),
                "max": float(np.max(times)),
            },
            "throughput_samples_per_sec": float(1000 / np.mean(times)),
        }

        logger.info(f"Benchmark results:")
        logger.info(f"  Mean latency: {result['latency_ms']['mean']:.2f}ms")
        logger.info(f"  Std dev: {result['latency_ms']['std']:.2f}ms")
        logger.info(f"  Throughput: {result['throughput_samples_per_sec']:.1f} samples/sec")

        return result

    except ImportError:
        logger.warning("ONNX Runtime not available, skipping benchmark")
        return {}
    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        return {}


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Convert and quantize Whisper models for optimal performance"
    )
    parser.add_argument(
        "--model-size",
        default="base",
        choices=["tiny", "base", "small", "medium", "large"],
        help="Whisper model size",
    )
    parser.add_argument(
        "--quantization",
        default="int8",
        choices=["int8", "int8_dynamic", "int4"],
        help="Quantization type",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./models"),
        help="Output directory for ONNX models",
    )
    parser.add_argument(
        "--benchmark",
        action="store_true",
        help="Run benchmarks after quantization",
    )
    parser.add_argument(
        "--device",
        default="cpu",
        choices=["cpu", "cuda"],
        help="Device for conversion",
    )

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Whisper Model Quantization Pipeline")
    logger.info("=" * 60)

    # Check dependencies
    check_dependencies()

    # Create output directory
    args.output_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Download model
        model = download_whisper_model(args.model_size)

        # Convert to ONNX
        onnx_path = args.output_dir / f"whisper-{args.model_size}.onnx"
        convert_to_onnx(model, args.model_size, onnx_path, device=args.device)

        # Quantize
        quantized_path = args.output_dir / f"whisper-{args.model_size}-{args.quantization}.onnx"
        quantize_onnx(onnx_path, quantized_path, args.quantization)

        # Benchmark if requested
        if args.benchmark:
            benchmark_model(quantized_path, args.model_size)

        logger.info("=" * 60)
        logger.info("✓ Pipeline completed successfully")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
