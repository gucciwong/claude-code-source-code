"""Base benchmark runner class - abstract interface for all benchmarks."""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class BenchmarkResult:
    """Single test case result."""

    problem_id: str
    passed: bool
    error: Optional[str]
    execution_time: float
    output: Optional[str]
    code_snippet: Optional[str]
    language: str = "python"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class BenchmarkStats:
    """Aggregated benchmark statistics."""

    total_problems: int
    passed: int
    failed: int
    pass_rate: float  # 0.0-1.0
    average_execution_time: float
    errors: Dict[str, int]  # error type -> count
    timestamp: str
    benchmark_name: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class BaseBenchmarkRunner(ABC):
    """Abstract base class for benchmark runners."""

    def __init__(
        self,
        model_client,
        language: str = "python",
        timeout_seconds: int = 10,
        max_workers: int = 4,
    ):
        """Initialize benchmark runner.

        Args:
            model_client: Generator or async function that takes prompt, returns code
            language: Programming language (python)
            timeout_seconds: Per-problem execution timeout
            max_workers: Concurrent execution parallelism
        """
        self.model_client = model_client
        self.language = language
        self.timeout_seconds = timeout_seconds
        self.max_workers = max_workers
        self.results: List[BenchmarkResult] = []

    @abstractmethod
    async def get_problems(self) -> List[Dict[str, Any]]:
        """Fetch benchmark problems.

        Returns:
            List of problem dicts: {problem_id, task_id, prompt, reference_solution, test_cases}
        """
        pass

    @abstractmethod
    async def execute_solution(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        problem_id: str,
    ) -> Tuple[bool, Optional[str], float]:
        """Execute code against test cases.

        Args:
            code: Generated solution code
            test_cases: Test cases to run against
            problem_id: Problem ID (for logging)

        Returns:
            (passed: bool, error: Optional[str], exec_time: float)
        """
        pass

    async def generate_solution(self, prompt: str) -> str:
        """Generate solution code from prompt.

        Args:
            prompt: Problem description

        Returns:
            Generated code string
        """
        if asyncio.iscoroutinefunction(self.model_client):
            return await self.model_client(prompt)
        elif hasattr(self.model_client, "__call__"):
            result = self.model_client(prompt)
            if asyncio.iscoroutine(result):
                return await result
            return result
        else:
            raise TypeError(
                f"model_client must be async function or callable, got {type(self.model_client)}"
            )

    def _extract_code_block(self, text: str) -> str:
        """Extract Python code from markdown or plain text.

        Handles:
        - ```python ... ``` blocks
        - ```python ... ``` blocks with language prefix
        - Plain Python code
        """
        # Try markdown code block
        if "```python" in text:
            parts = text.split("```python")
            if len(parts) > 1:
                code_block = parts[1].split("```")[0]
                return code_block.strip()

        # Try generic code block
        if "```" in text:
            parts = text.split("```")
            if len(parts) >= 2:
                return parts[1].strip()

        # Plain text (assume it's code)
        return text.strip()

    async def run_single_problem(
        self, problem: Dict[str, Any]
    ) -> BenchmarkResult:
        """Run a single benchmark problem.

        Args:
            problem: Problem dict from get_problems()

        Returns:
            BenchmarkResult with pass/fail and timing
        """
        problem_id = problem["problem_id"]
        prompt = problem["prompt"]
        test_cases = problem.get("test_cases", [])

        try:
            # Generate solution
            start_gen = asyncio.get_event_loop().time()
            raw_code = await self.generate_solution(prompt)
            code = self._extract_code_block(raw_code)
            gen_time = asyncio.get_event_loop().time() - start_gen

            # Execute solution
            passed, error, exec_time = await self.execute_solution(
                code, test_cases, problem_id
            )

            total_time = gen_time + exec_time

            return BenchmarkResult(
                problem_id=problem_id,
                passed=passed,
                error=error,
                execution_time=total_time,
                output=code[:200] if code else None,
                code_snippet=code[:500] if code else None,
                language=self.language,
            )

        except asyncio.TimeoutError:
            logger.warning(f"Problem {problem_id} timed out")
            return BenchmarkResult(
                problem_id=problem_id,
                passed=False,
                error="timeout",
                execution_time=self.timeout_seconds,
                output=None,
                code_snippet=None,
                language=self.language,
            )

        except Exception as e:
            logger.error(f"Problem {problem_id} failed: {e}")
            return BenchmarkResult(
                problem_id=problem_id,
                passed=False,
                error=str(type(e).__name__),
                execution_time=0.0,
                output=None,
                code_snippet=None,
                language=self.language,
            )

    async def run_all(
        self, limit: Optional[int] = None, save_path: Optional[Path] = None
    ) -> BenchmarkStats:
        """Run all benchmark problems.

        Args:
            limit: Max problems to run (None = all)
            save_path: Optional path to save detailed results as JSONL

        Returns:
            BenchmarkStats with aggregated results
        """
        logger.info(f"Starting {self.__class__.__name__}")

        # Fetch problems
        problems = await self.get_problems()
        if limit:
            problems = problems[:limit]

        logger.info(f"Running {len(problems)} problems")

        # Run with concurrency limit
        self.results = []
        semaphore = asyncio.Semaphore(self.max_workers)

        async def run_with_semaphore(problem):
            async with semaphore:
                return await self.run_single_problem(problem)

        tasks = [run_with_semaphore(p) for p in problems]
        self.results = await asyncio.gather(*tasks, return_exceptions=False)

        # Aggregate stats
        passed_count = sum(1 for r in self.results if r.passed)
        failed_count = len(self.results) - passed_count
        pass_rate = passed_count / len(self.results) if self.results else 0.0
        avg_exec_time = (
            sum(r.execution_time for r in self.results) / len(self.results)
            if self.results
            else 0.0
        )

        # Error histogram
        errors: Dict[str, int] = {}
        for result in self.results:
            if result.error:
                errors[result.error] = errors.get(result.error, 0) + 1

        stats = BenchmarkStats(
            total_problems=len(self.results),
            passed=passed_count,
            failed=failed_count,
            pass_rate=pass_rate,
            average_execution_time=avg_exec_time,
            errors=errors,
            timestamp=datetime.utcnow().isoformat(),
            benchmark_name=self.__class__.__name__,
        )

        logger.info(
            f"Benchmark complete: {passed_count}/{len(self.results)} passed "
            f"({pass_rate:.1%}) in {avg_exec_time:.2f}s avg"
        )

        # Save detailed results if requested
        if save_path:
            self._save_results(stats, save_path)

        return stats

    def _save_results(self, stats: BenchmarkStats, save_path: Path) -> None:
        """Save benchmark results to JSONL file.

        Args:
            stats: Aggregated statistics
            save_path: Path to save results (will create parent dirs)
        """
        save_path.parent.mkdir(parents=True, exist_ok=True)

        with open(save_path, "w") as f:
            # Write stats header
            f.write(json.dumps({"type": "stats", **stats.to_dict()}) + "\n")

            # Write individual results
            for result in self.results:
                f.write(json.dumps({"type": "result", **result.to_dict()}) + "\n")

        logger.info(f"Results saved to {save_path}")

    def get_stats(self) -> BenchmarkStats:
        """Get aggregated statistics from last run."""
        if not self.results:
            raise RuntimeError("No results available - run run_all() first")

        passed_count = sum(1 for r in self.results if r.passed)
        failed_count = len(self.results) - passed_count
        pass_rate = passed_count / len(self.results)
        avg_exec_time = sum(r.execution_time for r in self.results) / len(self.results)

        errors: Dict[str, int] = {}
        for result in self.results:
            if result.error:
                errors[result.error] = errors.get(result.error, 0) + 1

        return BenchmarkStats(
            total_problems=len(self.results),
            passed=passed_count,
            failed=failed_count,
            pass_rate=pass_rate,
            average_execution_time=avg_exec_time,
            errors=errors,
            timestamp=datetime.utcnow().isoformat(),
            benchmark_name=self.__class__.__name__,
        )
