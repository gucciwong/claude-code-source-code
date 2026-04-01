"""Benchmarking suite for GPU acceleration performance testing."""

import os
import sys
import time
import tempfile
import logging
from pathlib import Path
from typing import Dict, List
import numpy as np

# Setup path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from voice_service.models.whisper import WhisperASR
from voice_service.config.device_config import DeviceConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_test_audio(duration_seconds: float = 10.0, sample_rate: int = 16000) -> str:
    """
    Generate synthetic test audio file.
    
    Args:
        duration_seconds: Duration of audio
        sample_rate: Sample rate in Hz
        
    Returns:
        Path to generated WAV file
    """
    try:
        import soundfile as sf
    except ImportError:
        logger.error("soundfile not installed. Install with: pip install soundfile")
        return ""
    
    # Generate sine wave (1kHz tone)
    num_samples = int(duration_seconds * sample_rate)
    t = np.linspace(0, duration_seconds, num_samples)
    audio = 0.3 * np.sin(2 * np.pi * 1000 * t)  # 1kHz tone
    
    # Save to temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        sf.write(f.name, audio, sample_rate)
        return f.name


def benchmark_model_loading(model_size: str = "base", num_runs: int = 3) -> Dict:
    """
    Benchmark model loading time on CPU vs GPU.
    
    Args:
        model_size: Whisper model size
        num_runs: Number of benchmark runs
        
    Returns:
        Benchmark results
    """
    results = {
        "model_size": model_size,
        "runs": []
    }
    
    devices = ["cpu"]
    if DeviceConfig.get_available_device() == "cuda":
        devices.append("cuda")
    
    for device in devices:
        logger.info(f"\nBenchmarking model loading on {device.upper()}")
        device_results = {
            "device": device,
            "load_times": []
        }
        
        for run in range(num_runs):
            logger.info(f"  Run {run + 1}/{num_runs}...")
            model = WhisperASR(model_size=model_size, device=device)
            device_results["load_times"].append(model.load_time)
            model.unload()
            time.sleep(1)  # Cool down between runs
        
        device_results["avg_time"] = np.mean(device_results["load_times"])
        device_results["std_time"] = np.std(device_results["load_times"])
        results["runs"].append(device_results)
    
    return results


def benchmark_transcription(
    model_size: str = "base",
    audio_duration: float = 10.0,
    num_runs: int = 3
) -> Dict:
    """
    Benchmark transcription inference time on CPU vs GPU.
    
    Args:
        model_size: Whisper model size
        audio_duration: Duration of test audio
        num_runs: Number of benchmark runs
        
    Returns:
        Benchmark results
    """
    # Generate test audio
    logger.info("Generating test audio...")
    audio_file = generate_test_audio(duration_seconds=audio_duration)
    if not audio_file:
        return {"error": "Failed to generate test audio"}
    
    results = {
        "model_size": model_size,
        "audio_duration": audio_duration,
        "runs": []
    }
    
    devices = ["cpu"]
    if DeviceConfig.get_available_device() == "cuda":
        devices.append("cuda")
    
    try:
        for device in devices:
            logger.info(f"\nBenchmarking transcription on {device.upper()}")
            device_results = {
                "device": device,
                "inference_times": [],
                "throughputs": []  # seconds of audio per second
            }
            
            model = WhisperASR(model_size=model_size, device=device)
            if not model.is_loaded:
                logger.warning(f"Failed to load model on {device}, skipping")
                continue
            
            for run in range(num_runs):
                logger.info(f"  Run {run + 1}/{num_runs}...")
                result = model.transcribe(audio_file, language="en")
                
                if "inference_time" in result:
                    inference_time = result["inference_time"]
                    device_results["inference_times"].append(inference_time)
                    
                    # Calculate throughput
                    throughput = audio_duration / inference_time if inference_time > 0 else 0
                    device_results["throughputs"].append(throughput)
                    
                    logger.info(f"    Inference time: {inference_time:.3f}s, Throughput: {throughput:.2f}x")
                
                time.sleep(0.5)  # Cool down between runs
            
            if device_results["inference_times"]:
                device_results["avg_time"] = np.mean(device_results["inference_times"])
                device_results["std_time"] = np.std(device_results["inference_times"])
                device_results["avg_throughput"] = np.mean(device_results["throughputs"])
            
            model.unload()
            results["runs"].append(device_results)
    
    finally:
        # Clean up test audio
        if os.path.exists(audio_file):
            os.remove(audio_file)
    
    return results


def print_benchmark_results(results: Dict) -> None:
    """Pretty-print benchmark results."""
    print("\n" + "=" * 80)
    print("BENCHMARK RESULTS")
    print("=" * 80)
    
    for run in results.get("runs", []):
        device = run["device"].upper()
        print(f"\n{device} Device:")
        print("-" * 40)
        
        if "load_times" in run:
            print(f"  Model Load Time:")
            print(f"    Average: {run['avg_time']:.3f}s")
            print(f"    Std Dev: {run['std_time']:.3f}s")
        
        if "inference_times" in run:
            print(f"  Transcription Inference:")
            print(f"    Average: {run['avg_time']:.3f}s")
            print(f"    Std Dev: {run['std_time']:.3f}s")
            print(f"    Throughput: {run['avg_throughput']:.2f}x real-time")
    
    # Calculate speedup
    if len(results.get("runs", [])) >= 2:
        cpu_time = results["runs"][0].get("avg_time", float("inf"))
        gpu_time = results["runs"][1].get("avg_time", float("inf"))
        
        if cpu_time > 0 and gpu_time > 0:
            speedup = cpu_time / gpu_time
            print(f"\nSpeedup (GPU vs CPU): {speedup:.1f}x")
    
    print("\n" + "=" * 80)


def main():
    """Run all benchmarks."""
    logger.info("VibeVoice GPU Acceleration Benchmarks")
    logger.info("=" * 60)
    
    # Device info
    device_info = DeviceConfig.get_device_info()
    logger.info("\nDevice Information:")
    logger.info(f"  Device: {device_info['device']}")
    logger.info(f"  CUDA Available: {device_info['cuda_available']}")
    if device_info.get("gpu"):
        gpu = device_info["gpu"]
        logger.info(f"  GPU: {gpu['device_name']}")
        logger.info(f"  Total VRAM: {gpu['total_memory_gb']:.2f}GB")
    
    # Benchmark 1: Model loading
    logger.info("\n" + "=" * 60)
    logger.info("Benchmark 1: Model Loading")
    logger.info("=" * 60)
    load_results = benchmark_model_loading(model_size="base", num_runs=2)
    print_benchmark_results(load_results)
    
    # Benchmark 2: Transcription
    logger.info("\n" + "=" * 60)
    logger.info("Benchmark 2: Transcription Performance")
    logger.info("=" * 60)
    inference_results = benchmark_transcription(
        model_size="base",
        audio_duration=10.0,
        num_runs=2
    )
    print_benchmark_results(inference_results)


if __name__ == "__main__":
    main()
