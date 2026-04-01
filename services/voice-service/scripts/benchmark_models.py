"""Benchmark suite for comparing model performance across quantization levels."""

import argparse
import logging
import sys
import time
from pathlib import Path
from typing import Dict, Any, List

import numpy as np

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)


def benchmark_model_inference(
    model_path: Path,
    num_iterations: int = 100,
    input_shape: tuple = (1, 80, 3000),
) -> Dict[str, Any]:
    """
    Benchmark ONNX model inference performance.

    Args:
        model_path: Path to ONNX model
        num_iterations: Number of iterations
        input_shape: Input tensor shape

    Returns:
        Benchmark results dictionary
    """
    try:
        import onnxruntime as ort
    except ImportError:
        logger.error("ONNX Runtime not installed")
        return {}

    logger.info(f"Benchmarking {model_path.name}...")

    try:
        sess = ort.InferenceSession(str(model_path))

        # Create dummy inputs
        mel_spec = np.random.randn(*input_shape).astype(np.float32)
        tokens = np.ones((1, 1), dtype=np.int64)

        inputs = {
            "mel_spectrogram": mel_spec,
            "tokens": tokens,
        }

        # Warmup
        for _ in range(5):
            sess.run(None, inputs)

        # Benchmark
        times = []
        for _ in range(num_iterations):
            start = time.time()
            sess.run(None, inputs)
            times.append((time.time() - start) * 1000)

        times_array = np.array(times)

        file_size_mb = model_path.stat().st_size / (1024 * 1024)

        result = {
            "model_path": str(model_path),
            "model_size_mb": file_size_mb,
            "iterations": num_iterations,
            "latency_ms": {
                "mean": float(np.mean(times_array)),
                "median": float(np.median(times_array)),
                "std": float(np.std(times_array)),
                "min": float(np.min(times_array)),
                "max": float(np.max(times_array)),
                "p95": float(np.percentile(times_array, 95)),
                "p99": float(np.percentile(times_array, 99)),
            },
            "throughput_samples_per_sec": float(1000 / np.mean(times_array)),
        }

        return result

    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        return {}


def compare_models(
    model_paths: List[Path],
    num_iterations: int = 100,
) -> None:
    """
    Compare performance of multiple models.

    Args:
        model_paths: List of model paths to benchmark
        num_iterations: Number of iterations per model
    """
    logger.info("=" * 80)
    logger.info("Model Performance Comparison")
    logger.info("=" * 80)

    results = []
    for model_path in model_paths:
        if model_path.exists():
            result = benchmark_model_inference(model_path, num_iterations)
            results.append(result)
        else:
            logger.warning(f"Model not found: {model_path}")

    # Print results table
    if results:
        print("\n" + "=" * 120)
        print(f"{'Model':<40} {'Size (MB)':<12} {'Latency (ms)':<15} {'Throughput':<15} {'Speedup':<10}")
        print("=" * 120)

        baseline_latency = None
        for result in results:
            model_name = Path(result["model_path"]).name
            size_mb = result["model_size_mb"]
            latency = result["latency_ms"]["mean"]
            throughput = result["throughput_samples_per_sec"]

            if baseline_latency is None:
                baseline_latency = latency
                speedup = 1.0
            else:
                speedup = baseline_latency / latency

            print(
                f"{model_name:<40} {size_mb:>10.1f}MB {latency:>13.2f}ms "
                f"{throughput:>13.1f} s/s {speedup:>8.1f}x"
            )

        print("=" * 120 + "\n")

        # Summary
        logger.info("Summary:")
        logger.info(
            f"  Best latency: {min(r['latency_ms']['mean'] for r in results):.2f}ms"
        )
        logger.info(
            f"  Best throughput: {max(r['throughput_samples_per_sec'] for r in results):.1f} samples/sec"
        )
        logger.info(
            f"  Smallest model: {min(r['model_size_mb'] for r in results):.1f}MB"
        )


def print_size_comparison() -> None:
    """Print theoretical model size reduction comparison."""
    print("\n" + "=" * 80)
    print("Theoretical Model Size Reduction")
    print("=" * 80)

    base_size = 291.0  # Whisper Base in MB

    reductions = {
        "FP32 (No quantization)": 1.0,
        "FP16 (Half precision)": 0.5,
        "INT8 (8-bit integer)": 0.25,
        "INT4 (4-bit integer)": 0.125,
        "Mixed (FP32+INT8)": 0.375,
    }

    print(f"\nBase Model Size: {base_size}MB\n")
    print(f"{'Quantization Type':<30} {'Size (MB)':<12} {'Reduction':<15}")
    print("-" * 60)

    for quant_type, multiplier in reductions.items():
        quantized_size = base_size * multiplier
        reduction_pct = (1 - multiplier) * 100
        print(
            f"{quant_type:<30} {quantized_size:>10.1f}MB "
            f"{reduction_pct:>13.1f}%"
        )

    print("\n")


def print_speedup_expectations() -> None:
    """Print expected speedup with different quantization types."""
    print("\n" + "=" * 80)
    print("Expected Inference Speedup")
    print("=" * 80)

    speedups = {
        "FP32 on CPU": 1.0,
        "FP32 on GPU": 3.0,
        "FP16 on GPU": 4.5,
        "INT8 on GPU": 7.0,
        "INT4 on GPU": 9.0,
        "INT8 + Flash Attention": 10.0,
    }

    print("\n")
    print(f"{'Configuration':<30} {'Expected Speedup':<15}")
    print("-" * 50)

    for config, speedup in speedups.items():
        print(f"{config:<30} {speedup:>13.1f}x")

    print("\n")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Benchmark and compare model performance"
    )
    parser.add_argument(
        "--model-dir",
        type=Path,
        default=Path("./models"),
        help="Directory containing ONNX models",
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=100,
        help="Number of benchmark iterations",
    )
    parser.add_argument(
        "--show-theory",
        action="store_true",
        help="Show theoretical speedup/size reduction",
    )

    args = parser.parse_args()

    if args.show_theory:
        print_size_comparison()
        print_speedup_expectations()
        return

    # Find ONNX models
    if args.model_dir.exists():
        model_paths = sorted(args.model_dir.glob("*.onnx"))
        if model_paths:
            compare_models(model_paths, args.iterations)
        else:
            logger.warning(f"No ONNX models found in {args.model_dir}")
    else:
        logger.error(f"Model directory not found: {args.model_dir}")


if __name__ == "__main__":
    main()
