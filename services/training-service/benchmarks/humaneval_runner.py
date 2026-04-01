"""HumanEval benchmark runner - code generation evaluation."""

import asyncio
import json
import logging
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from benchmarks.base_runner import BaseBenchmarkRunner

logger = logging.getLogger(__name__)


class HumanEvalRunner(BaseBenchmarkRunner):
    """HumanEval benchmark runner for code generation tasks.

    Reference: https://github.com/openai/human-eval
    164 problems testing programming abilities (functions, algorithms, data structures)
    """

    HUMANEVAL_REPO = "https://github.com/openai/human-eval.git"
    PROBLEMS_URL = "https://huggingface.co/datasets/openai_humaneval/raw/main/data/HumanEval.jsonl"

    def __init__(
        self,
        model_client,
        cache_dir: Optional[Path] = None,
        timeout_seconds: int = 10,
        max_workers: int = 4,
    ):
        """Initialize HumanEval runner.

        Args:
            model_client: Async function (prompt) -> code
            cache_dir: Cache directory for downloaded dataset (default: ~/.cache/humaneval)
            timeout_seconds: Per-problem execution timeout (default: 10s)
            max_workers: Concurrent executions (default: 4)
        """
        super().__init__(
            model_client,
            language="python",
            timeout_seconds=timeout_seconds,
            max_workers=max_workers,
        )

        self.cache_dir = cache_dir or Path.home() / ".cache" / "humaneval"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.problems_file = self.cache_dir / "HumanEval.jsonl"
        self.problems: Dict[str, Dict[str, Any]] = {}

    async def get_problems(self) -> List[Dict[str, Any]]:
        """Fetch HumanEval problems from cache or download.

        Returns:
            List of problems: {problem_id, task_id, prompt, entry_point, canonical_solution, test}
        """
        # Load from cache if available
        if self.problems_file.exists():
            logger.info(f"Loading cached problems from {self.problems_file}")
            return await self._load_problems_from_file()

        # Download problems
        logger.info("Downloading HumanEval dataset...")
        try:
            import urllib.request

            urllib.request.urlretrieve(self.PROBLEMS_URL, self.problems_file)
            logger.info(f"Downloaded to {self.problems_file}")
            return await self._load_problems_from_file()
        except Exception as e:
            logger.error(f"Failed to download HumanEval: {e}")
            raise

    async def _load_problems_from_file(self) -> List[Dict[str, Any]]:
        """Load and parse JSONL problems file."""
        problems = []
        with open(self.problems_file, "r") as f:
            for line in f:
                if line.strip():
                    problem = json.loads(line)
                    # Add task_id and test_cases to match base class interface
                    problem["task_id"] = problem.get("task_id", problem["problem_id"])
                    problem["test_cases"] = self._parse_test_cases(problem["test"])
                    problems.append(problem)
                    self.problems[problem["problem_id"]] = problem

        logger.info(f"Loaded {len(problems)} HumanEval problems")
        return problems

    def _parse_test_cases(self, test_string: str) -> List[Dict[str, Any]]:
        """Parse HumanEval test string into test cases.

        HumanEval format: space-separated assertions like:
        "assert is_palindrome('a') == True\nassert is_palindrome('ab') == False"

        Returns:
            List of {input, expected_output, description}
        """
        test_cases = []
        for i, line in enumerate(test_string.strip().split("\n")):
            if line.strip() and line.strip().startswith("assert"):
                test_cases.append(
                    {
                        "description": f"Test case {i}",
                        "assertion": line.strip(),
                        "index": i,
                    }
                )
        return test_cases

    async def execute_solution(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        problem_id: str,
    ) -> Tuple[bool, Optional[str], float]:
        """Execute code against HumanEval test cases.

        Args:
            code: Generated solution
            test_cases: List of test assertions
            problem_id: Problem ID for context

        Returns:
            (passed: bool, error: Optional[str], exec_time: float)
        """
        problem = self.problems.get(problem_id, {})
        entry_point = problem.get("entry_point", "solution")

        # Build execution script
        # 1. Define the function from generated code
        # 2. Run test assertions
        exec_code = f"""
import sys
import traceback

{code}

def run_tests():
    try:
"""

        # Add test assertions
        for test_case in test_cases:
            exec_code += f"        {test_case['assertion']}\n"

        exec_code += """
        return True
    except Exception as e:
        return False, str(e)

result = run_tests()
sys.exit(0 if result is True else 1)
"""

        # Execute in subprocess with timeout
        start_time = asyncio.get_event_loop().time()

        try:
            result = subprocess.run(
                ["python", "-c", exec_code],
                capture_output=True,
                timeout=self.timeout_seconds,
                text=True,
            )
            exec_time = asyncio.get_event_loop().time() - start_time

            if result.returncode == 0:
                return True, None, exec_time
            else:
                error_msg = result.stderr or result.stdout or "unknown error"
                return False, error_msg[:200], exec_time

        except subprocess.TimeoutExpired:
            exec_time = asyncio.get_event_loop().time() - start_time
            logger.debug(f"Problem {problem_id} execution timed out after {exec_time:.2f}s")
            return False, "timeout", exec_time

        except Exception as e:
            exec_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"Failed to execute problem {problem_id}: {e}")
            return False, str(e)[:200], exec_time

    def _generate_prompt(self, problem: Dict[str, Any]) -> str:
        """Generate prompt for model from problem data.

        Combines problem description with hints and function signature.
        """
        prompt = problem.get("prompt", "")

        # Add entry point info if available
        if "entry_point" in problem:
            prompt += f"\n\nFunction name: {problem['entry_point']}"

        return prompt

    async def generate_solution(self, prompt: str) -> str:
        """Generate solution with HumanEval-specific formatting."""
        # Get raw model output
        raw_code = await super().generate_solution(prompt)

        # Extract only the function definition
        # HumanEval expects just the function, not imports or test code
        lines = raw_code.split("\n")
        code_lines = []
        in_function = False

        for line in lines:
            # Start collecting when we see def
            if line.strip().startswith("def "):
                in_function = True

            if in_function:
                # Stop at next function or class def (unless it's the first one)
                if code_lines and (
                    line.strip().startswith("def ") or line.strip().startswith("class ")
                ):
                    break

                code_lines.append(line)

        # Return extracted function or full code if no function found
        return "\n".join(code_lines) if code_lines else raw_code


if __name__ == "__main__":
    # Example usage
    import logging

    logging.basicConfig(level=logging.DEBUG)

    async def mock_model(prompt: str) -> str:
        """Mock model that returns a simple solution."""
        return """
def solution(x):
    return x * 2
"""

    async def main():
        runner = HumanEvalRunner(mock_model, timeout_seconds=5, max_workers=2)

        # Run on first 5 problems
        stats = await runner.run_all(limit=5)

        print(f"\nResults: {stats.passed}/{stats.total_problems} passed ({stats.pass_rate:.1%})")
        print(f"Average time: {stats.average_execution_time:.2f}s")
        if stats.errors:
            print(f"Errors: {stats.errors}")

    asyncio.run(main())
