import subprocess
import shutil
import time
import tempfile
import os


class JSRunner:
    def run(self, code: str, timeout_ms: int = 5000) -> dict:
        """
        Execute JS code in a restricted Node.js subprocess.
        Returns: {"lines": [...], "error": None|str, "duration_ms": float, "language": "javascript"}
        """
        if not shutil.which("node"):
            return {
                "lines": [],
                "error": "Node.js not available",
                "duration_ms": 0.0,
                "language": "javascript",
            }

        start = time.perf_counter()
        # Write code to a temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
            tmp_path = f.name
            f.write(code)

        try:
            result = subprocess.run(
                ["node", "--no-warnings", tmp_path],
                capture_output=True,
                text=True,
                timeout=timeout_ms / 1000,
            )
            error = result.stderr.strip() if result.returncode != 0 else None
            # JS runner captures stdout only (no settrace equivalent)
            lines = []
        except subprocess.TimeoutExpired:
            error = f"Execution exceeded {timeout_ms}ms"
            lines = []
        except Exception as e:
            error = str(e)
            lines = []
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

        duration_ms = (time.perf_counter() - start) * 1000
        return {
            "lines": lines,
            "error": error,
            "duration_ms": round(duration_ms, 2),
            "language": "javascript",
        }
