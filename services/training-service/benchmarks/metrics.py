"""Benchmark metrics aggregation and reporting."""

import json
import logging
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class BenchmarkComparison:
    """Comparison between two benchmark runs (old vs new)."""

    benchmark_name: str
    old_pass_rate: float
    new_pass_rate: float
    improvement: float  # percentage points
    old_avg_time: float
    new_avg_time: float
    speed_improvement: float  # percentage (negative = slower)
    problems_solved: int  # Additionally solved
    problems_regressed: int  # Previously passing now failing
    timestamp: str

    def __str__(self) -> str:
        """Format for display."""
        improvement_str = (
            f"+{self.improvement:.1f}%" if self.improvement > 0 else f"{self.improvement:.1f}%"
        )
        speed_str = (
            f"+{self.speed_improvement:.1f}%" if self.speed_improvement > 0 else f"{self.speed_improvement:.1f}%"
        )

        return f"""
{self.benchmark_name}:
  Pass rate:     {self.old_pass_rate:.1%} → {self.new_pass_rate:.1%} ({improvement_str})
  Avg time:      {self.old_avg_time:.2f}s → {self.new_avg_time:.2f}s ({speed_str})
  Newly solved:  {self.problems_solved} problems
  Regressions:   {self.problems_regressed} problems
"""

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class TrainingQualityReport:
    """Comprehensive quality report after training."""

    training_run_id: str
    timestamp: str
    model_id: str
    cycle_type: str  # "quick" or "full"
    training_loss: float
    eval_loss: Optional[float]
    benchmark_results: List[BenchmarkComparison]
    overall_pass_rate: float
    quality_gate_passed: bool
    quality_gate_reason: Optional[str]  # Reason if gate failed
    metrics: Dict[str, float]  # Custom metrics

    def __str__(self) -> str:
        """Format for display."""
        result = f"""
{'='*60}
TRAINING QUALITY REPORT
{'='*60}
Run ID:            {self.training_run_id}
Model:             {self.model_id}
Cycle:             {self.cycle_type}
Timestamp:         {self.timestamp}

Training Loss:     {self.training_loss:.4f}
Eval Loss:         {self.eval_loss:.4f if self.eval_loss else 'N/A'}
Overall Pass Rate: {self.overall_pass_rate:.1%}

Quality Gate:      {'✓ PASSED' if self.quality_gate_passed else '✗ FAILED'}
{f"Reason:          {self.quality_gate_reason}" if self.quality_gate_reason else ""}

Benchmark Results:
{chr(10).join(str(b) for b in self.benchmark_results)}

Additional Metrics:
"""
        for key, value in self.metrics.items():
            result += f"  {key}: {value}\n"

        result += "=" * 60 + "\n"
        return result

    def to_dict(self) -> Dict:
        return {
            "training_run_id": self.training_run_id,
            "timestamp": self.timestamp,
            "model_id": self.model_id,
            "cycle_type": self.cycle_type,
            "training_loss": self.training_loss,
            "eval_loss": self.eval_loss,
            "benchmark_results": [b.to_dict() for b in self.benchmark_results],
            "overall_pass_rate": self.overall_pass_rate,
            "quality_gate_passed": self.quality_gate_passed,
            "quality_gate_reason": self.quality_gate_reason,
            "metrics": self.metrics,
        }

    def save(self, path: Path) -> None:
        """Save report to JSON file."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
        logger.info(f"Quality report saved to {path}")

    @classmethod
    def load(cls, path: Path) -> "TrainingQualityReport":
        """Load report from JSON file."""
        with open(path, "r") as f:
            data = json.load(f)

        # Reconstruct BenchmarkComparison objects
        benchmark_results = [BenchmarkComparison(**b) for b in data["benchmark_results"]]
        data["benchmark_results"] = benchmark_results

        return cls(**data)


class BenchmarkMetricsAggregator:
    """Aggregate and report on benchmark metrics for training cycles."""

    def __init__(self, cache_dir: Optional[Path] = None):
        """Initialize metrics aggregator.

        Args:
            cache_dir: Location for storing historical data (default: ~/.cache/training_metrics)
        """
        self.cache_dir = cache_dir or Path.home() / ".cache" / "training_metrics"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.history_file = self.cache_dir / "benchmark_history.jsonl"

    def compute_improvement(
        self,
        baseline_results: Dict,  # {benchmark_name: BenchmarkStats}
        new_results: Dict,  # {benchmark_name: BenchmarkStats}
    ) -> List[BenchmarkComparison]:
        """Compute improvement between baseline and new benchmark results.

        Args:
            baseline_results: Previous benchmark results {name: stats}
            new_results: Current benchmark results {name: stats}

        Returns:
            List of BenchmarkComparison objects
        """
        comparisons = []

        for name in new_results:
            # Get baseline (default to 0% pass rate if not available)
            baseline = baseline_results.get(name)

            old_pass_rate = baseline.pass_rate if baseline else 0.0
            old_avg_time = baseline.average_execution_time if baseline else 0.0

            new_results_obj = new_results[name]
            new_pass_rate = new_results_obj.pass_rate
            new_avg_time = new_results_obj.average_execution_time

            # Calculate improvements
            pass_rate_improvement = new_pass_rate - old_pass_rate
            speed_improvement = (
                (old_avg_time - new_avg_time) / old_avg_time * 100
                if old_avg_time > 0
                else 0.0
            )

            # Count newly solved and regressed (if we have detail-level data)
            # This would require tracking individual problem results through runs.
            # Tracked-In: 2026-05-11-ga-runway-plan.md (post-GA — benchmark v2;
            # problem-level tracking requires schema change on benchmark_results).
            newly_solved = 0  # post-GA: problem-level diff
            regressed = 0     # post-GA: problem-level diff

            comparison = BenchmarkComparison(
                benchmark_name=name,
                old_pass_rate=old_pass_rate,
                new_pass_rate=new_pass_rate,
                improvement=pass_rate_improvement,
                old_avg_time=old_avg_time,
                new_avg_time=new_avg_time,
                speed_improvement=speed_improvement,
                problems_solved=newly_solved,
                problems_regressed=regressed,
                timestamp=datetime.utcnow().isoformat(),
            )
            comparisons.append(comparison)

        return comparisons

    def create_quality_report(
        self,
        training_run_id: str,
        model_id: str,
        cycle_type: str,  # "quick" or "full"
        training_loss: float,
        eval_loss: Optional[float],
        benchmark_comparisons: List[BenchmarkComparison],
        custom_metrics: Optional[Dict[str, float]] = None,
        quality_gate_threshold: float = 0.01,  # 1% improvement for quality gate
    ) -> TrainingQualityReport:
        """Create a comprehensive quality report for a training cycle.

        Args:
            training_run_id: Unique identifier for this training run
            model_id: Model identifier
            cycle_type: "quick" or "full"
            training_loss: Final training loss
            eval_loss: Validation loss (optional)
            benchmark_comparisons: Benchmark improvement data
            custom_metrics: Additional metrics to include
            quality_gate_threshold: Minimum improvement for quality gate

        Returns:
            TrainingQualityReport object
        """
        # Compute overall pass rate (average across benchmarks)
        overall_pass_rate = (
            sum(c.new_pass_rate for c in benchmark_comparisons) / len(benchmark_comparisons)
            if benchmark_comparisons
            else 0.0
        )

        # Determine quality gate status
        quality_gate_passed = True
        quality_gate_reason = None

        if cycle_type == "full":
            # For full cycles, expect measurable improvement
            total_improvement = sum(c.improvement for c in benchmark_comparisons)
            avg_improvement = total_improvement / len(benchmark_comparisons) if benchmark_comparisons else 0.0

            if avg_improvement < quality_gate_threshold:
                quality_gate_passed = False
                quality_gate_reason = (
                    f"Insufficient improvement: {avg_improvement:.2%} < {quality_gate_threshold:.2%}"
                )

        # Assemble metrics
        metrics = custom_metrics or {}
        metrics["num_benchmarks"] = len(benchmark_comparisons)
        metrics["avg_improvement"] = (
            sum(c.improvement for c in benchmark_comparisons) / len(benchmark_comparisons)
            if benchmark_comparisons
            else 0.0
        )

        report = TrainingQualityReport(
            training_run_id=training_run_id,
            timestamp=datetime.utcnow().isoformat(),
            model_id=model_id,
            cycle_type=cycle_type,
            training_loss=training_loss,
            eval_loss=eval_loss,
            benchmark_results=benchmark_comparisons,
            overall_pass_rate=overall_pass_rate,
            quality_gate_passed=quality_gate_passed,
            quality_gate_reason=quality_gate_reason,
            metrics=metrics,
        )

        return report

    def save_metrics_history(self, report: TrainingQualityReport) -> None:
        """Append metrics to historical log.

        Args:
            report: TrainingQualityReport to save
        """
        with open(self.history_file, "a") as f:
            f.write(json.dumps(report.to_dict()) + "\n")

        logger.info(f"Metrics saved to history: {self.history_file}")

    def get_metrics_history(self, model_id: Optional[str] = None) -> List[TrainingQualityReport]:
        """Retrieve historical metrics.

        Args:
            model_id: Filter by model (None = all models)

        Returns:
            List of TrainingQualityReport objects
        """
        if not self.history_file.exists():
            return []

        reports = []
        with open(self.history_file, "r") as f:
            for line in f:
                if line.strip():
                    data = json.loads(line)
                    if model_id is None or data["model_id"] == model_id:
                        # Reconstruct BenchmarkComparison objects
                        comparisons = [
                            BenchmarkComparison(**b) for b in data["benchmark_results"]
                        ]
                        data["benchmark_results"] = comparisons
                        reports.append(TrainingQualityReport(**data))

        return reports

    def get_trend(self, model_id: str, metric: str = "overall_pass_rate") -> Dict:
        """Get trend data for a specific metric over time.

        Args:
            model_id: Model to analyze
            metric: Metric to track (overall_pass_rate, training_loss, etc.)

        Returns:
            {timestamps: [...], values: [...]}
        """
        history = self.get_metrics_history(model_id=model_id)

        return {
            "model_id": model_id,
            "metric": metric,
            "timestamps": [r.timestamp for r in history],
            "values": [getattr(r, metric, None) for r in history],
        }

    def summarize_training_cycle(
        self, model_id: str, num_reports: int = 5
    ) -> Dict:
        """Summarize recent training cycles.

        Args:
            model_id: Model to summarize
            num_reports: Number of recent reports to include

        Returns:
            Summary stats
        """
        history = self.get_metrics_history(model_id=model_id)[-num_reports:]

        if not history:
            return {}

        avg_pass_rate = sum(r.overall_pass_rate for r in history) / len(history)
        avg_loss = sum(r.training_loss for r in history) / len(history)
        best_pass_rate = max(r.overall_pass_rate for r in history)
        last_report = history[-1]

        return {
            "model_id": model_id,
            "cycles_analyzed": len(history),
            "avg_pass_rate": avg_pass_rate,
            "best_pass_rate": best_pass_rate,
            "avg_training_loss": avg_loss,
            "quality_gate_passed_rate": sum(1 for r in history if r.quality_gate_passed)
            / len(history),
            "latest_cycle_type": last_report.cycle_type,
            "latest_timestamp": last_report.timestamp,
        }
