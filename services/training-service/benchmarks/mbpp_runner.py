"""MBPP benchmark runner - Mostly Basic Programming Problems."""

import asyncio
import json
import logging
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from benchmarks.base_runner import BaseBenchmarkRunner

logger = logging.getLogger(__name__)


class MBPPRunner(BaseBenchmarkRunner):
    """MBPP benchmark runner for basic programming problems.

    Reference: https://huggingface.co/datasets/google-research-datasets/mbpp
    1000 basic programming problems with solutions and test cases
    Entry-level coding tasks (string manipulation, math, data structures)
    """

    MBPP_URL = "https://huggingface.co/datasets/google-research-datasets/mbpp/raw/main/mbpp.jsonl"

    def __init__(
        self,
        model_client,
        cache_dir: Optional[Path] = None,
        timeout_seconds: int = 10,
        max_workers: int = 4,
    ):
        """Initialize MBPP runner.

        Args:
            model_client: Async function (prompt) -> code
            cache_dir: Cache directory for dataset (default: ~/.cache/mbpp)
            timeout_seconds: Per-problem execution timeout (default: 10s)
            max_workers: Concurrent executions (default: 4)
        """
        super().__init__(
            model_client,
            language="python",
            timeout_seconds=timeout_seconds,
            max_workers=max_workers,
        )

        self.cache_dir = cache_dir or Path.home() / ".cache" / "mbpp"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.problems_file = self.cache_dir / "mbpp.jsonl"
        self.problems: Dict[str, Dict[str, Any]] = {}

    async def get_problems(self) -> List[Dict[str, Any]]:
        """Fetch MBPP problems from cache or download.

        Returns:
            List of problems: {problem_id, text, code, test_list, challenge_test_list}
        """
        # Load from cache if available
        if self.problems_file.exists():
            logger.info(f"Loading cached MBPP problems from {self.problems_file}")
            return await self._load_problems_from_file()

        # Download problems
        logger.info("Downloading MBPP dataset...")
        try:
            import urllib.request

            urllib.request.urlretrieve(self.MBPP_URL, self.problems_file)
            logger.info(f"Downloaded to {self.problems_file}")
            return await self._load_problems_from_file()
        except Exception as e:
            logger.error(f"Failed to download MBPP: {e}")
            raise

    async def _load_problems_from_file(self) -> List[Dict[str, Any]]:
        """Load and parse JSONL problems file."""
        problems = []
        with open(self.problems_file, "r") as f:
            for line in f:
                if line.strip():
                    problem = json.loads(line)

                    # Normalize to base class interface
                    problem["problem_id"] = f"mbpp_{problem.get('task_id', len(problems))}"
                    problem["prompt"] = problem.get(
                        "text", problem.get("description", "")
                    )
                    problem["test_cases"] = self._parse_test_cases(problem)

                    problems.append(problem)
                    self.problems[problem["problem_id"]] = problem

        logger.info(f"Loaded {len(problems)} MBPP problems")
        return problems

    def _parse_test_cases(self, problem: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse MBPP test cases from problem dict.

        MBPP has:
        - test_list: [input, expected_output] pairs
        - challenge_test_list: harder test cases (subset used for final eval)

        Returns:
            List of {input, expected, description}
        """
        test_cases = []

        # Use test_list (main test cases)
        for i, test in enumerate(problem.get("test_list", [])):
            if isinstance(test, (list, tuple)) and len(test) >= 2:
                test_cases.append(
                    {
                        "description": f"Test case {i}",
                        "input": test[0],
                        "expected": test[1],
                        "type": "standard",
                    }
                )

        # Add challenge tests (if available, for harder evaluation)
        for i, test in enumerate(problem.get("challenge_test_list", [])):
            if isinstance(test, (list, tuple)) and len(test) >= 2:
                test_cases.append(
                    {
                        "description": f"Challenge test case {i}",
                        "input": test[0],
                        "expected": test[1],
                        "type": "challenge",
                    }
                )

        return test_cases

    async def execute_solution(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        problem_id: str,
    ) -> Tuple[bool, Optional[str], float]:
        """Execute code against MBPP test cases.

        Args:
            code: Generated solution
            test_cases: List of test cases with input/expected
            problem_id: Problem ID for context

        Returns:
            (passed: bool, error: Optional[str], exec_time: float)
        """
        problem = self.problems.get(problem_id, {})

        # Build execution script that:
        # 1. Defines the solution function
        # 2. Extracts the test cases and runs them
        exec_script = f"""
import sys

{code}

def run_tests():
    test_results = []
"""

        # Add test case execution
        test_idx = 0
        for test_case in test_cases:
            if "_assert" not in test_case:  # Skip if it's a raw assertion string
                # Build test execution
                exec_script += f"""
    try:
        # Test case {test_idx}: {test_case.get('description', '')}
        result = {test_case.get('input', '')}
        expected = {test_case.get('expected', '')}
        if result == expected:
            test_results.append(True)
        else:
            test_results.append(False)
            return False
    except Exception as e:
        test_results.append(False)
        print(f"Error in test case {test_idx}: {{str(e)}}", file=sys.stderr)
        return False
"""
                test_idx += 1

        exec_script += """
    return all(test_results)

result = run_tests()
sys.exit(0 if result else 1)
"""

        # Execute with timeout
        start_time = asyncio.get_event_loop().time()

        try:
            result = subprocess.run(
                ["python", "-c", exec_script],
                capture_output=True,
                timeout=self.timeout_seconds,
                text=True,
            )
            exec_time = asyncio.get_event_loop().time() - start_time

            if result.returncode == 0:
                return True, None, exec_time
            else:
                error_msg = result.stderr or result.stdout or "test failed"
                return False, error_msg[:200], exec_time

        except subprocess.TimeoutExpired:
            exec_time = asyncio.get_event_loop().time() - start_time
            logger.debug(f"Problem {problem_id} execution timed out after {exec_time:.2f}s")
            return False, "timeout", exec_time

        except Exception as e:
            exec_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"Failed to execute problem {problem_id}: {e}")
            return False, str(e)[:200], exec_time

    async def generate_solution(self, prompt: str) -> str:
        """Generate solution with MBPP-specific formatting."""
        # Get raw model output
        raw_code = await super().generate_solution(prompt)

        # Extract function definition (similar to HumanEval)
        lines = raw_code.split("\n")
        code_lines = []
        in_function = False

        for line in lines:
            # Start collecting when we see def
            if line.strip().startswith("def "):
                in_function = True

            if in_function:
                # Stop at next function/class definition
                if code_lines and (
                    line.strip().startswith("def ") or line.strip().startswith("class ")
                ):
                    break

                code_lines.append(line)

        return "\n".join(code_lines) if code_lines else raw_code


class MBPPLiteRunner(MBPPRunner):
    """Lightweight MBPP runner for quick evaluation.

    Uses subset of problems (first 50) for faster benchmarking during training.
    """

    async def run_all(self, limit: Optional[int] = None, save_path: Optional[Path] = None):
        """Override to default to 50 problems for lightweight eval."""
        if limit is None:
            limit = 50  # Use subset by default

        return await super().run_all(limit=limit, save_path=save_path)


if __name__ == "__main__":
    # Example usage
    import logging

    logging.basicConfig(level=logging.DEBUG)

    async def mock_model(prompt: str) -> str:
        """Mock model that returns a simple solution."""
        return """
def solution(x, y):
    return x + y
"""

    async def main():
        runner = MBPPRunner(mock_model, timeout_seconds=5, max_workers=2)

        # Run on first 10 problems
        stats = await runner.run_all(limit=10)

        print(f"\nResults: {stats.passed}/{stats.total_problems} passed ({stats.pass_rate:.1%})")
        print(f"Average time: {stats.average_execution_time:.2f}s")
        if stats.errors:
            print(f"Errors: {stats.errors}")

    asyncio.run(main())
