import subprocess
import shutil
import time
import tempfile
import os
import re


# Minimal safe globals for JS sandbox — no require, no process, no eval/Function
_JS_SANDBOX_PREAMBLE = """\
"use strict";
const console = { log: (...a) => globalThis.__out.push(a.map(String).join(' ')) };
const Math = globalThis.Math;
const JSON = globalThis.JSON;
const parseInt = globalThis.parseInt;
const parseFloat = globalThis.parseFloat;
const isNaN = globalThis.isNaN;
const isFinite = globalThis.isFinite;
const String = globalThis.String;
const Number = globalThis.Number;
const Boolean = globalThis.Boolean;
const Array = globalThis.Array;
const Object = globalThis.Object;
const Map = globalThis.Map;
const Set = globalThis.Set;
const Date = globalThis.Date;
const RegExp = globalThis.RegExp;
const Error = globalThis.Error;
const TypeError = globalThis.TypeError;
const RangeError = globalThis.RangeError;
const Promise = globalThis.Promise;
const Symbol = globalThis.Symbol;
const Intl = globalThis.Intl;
const undefined = globalThis.undefined;
const Infinity = globalThis.Infinity;
const NaN = globalThis.NaN;
globalThis.__out = [];
"""

_JS_FORBIDDEN_PATTERNS = [
    (r'\brequire\s*\(', 'require() is not allowed in sandbox'),
    (r'\bprocess\b', 'process is not allowed in sandbox'),
    (r'\beval\s*\(', 'eval() is not allowed in sandbox'),
    (r'\bFunction\s*\(', 'Function() constructor is not allowed in sandbox'),
    (r'\bimport\s*\(', 'dynamic import() is not allowed in sandbox'),
    (r'\b__proto__\b', '__proto__ is not allowed in sandbox'),
    (r'\bconstructor\s*\[\s*["\']?', 'constructor access is not allowed in sandbox'),
]


class JSRunner:
    @staticmethod
    def _detect_forbidden(code: str) -> str | None:
        """Detect forbidden JS patterns using regex, stripping strings/comments first."""
        # Strip single-line comments
        stripped = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        # Strip multi-line comments
        stripped = re.sub(r'/\*[\s\S]*?\*/', '', stripped)
        # Strip string literals to avoid false positives
        stripped = re.sub(r'"[^"]*"', '""', stripped)
        stripped = re.sub(r"'[^']*'", "''", stripped)
        stripped = re.sub(r'`[^`]*`', '``', stripped)

        for pattern, msg in _JS_FORBIDDEN_PATTERNS:
            if re.search(pattern, stripped):
                return msg
        return None

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

        # Check for forbidden patterns before execution
        forbidden = self._detect_forbidden(code)
        if forbidden:
            return {
                "lines": [],
                "error": forbidden,
                "duration_ms": 0.0,
                "language": "javascript",
            }

        start = time.perf_counter()

        # Wrap user code in sandbox preamble that overrides globals
        sandboxed_code = _JS_SANDBOX_PREAMBLE + "\n" + code + "\n;globalThis.__result = globalThis.__out;"

        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
            tmp_path = f.name
            f.write(sandboxed_code)

        try:
            result = subprocess.run(
                ["node", "--no-warnings", tmp_path],
                capture_output=True,
                text=True,
                timeout=timeout_ms / 1000,
            )
            error = result.stderr.strip() if result.returncode != 0 else None
            # Parse captured console.log output as trace lines
            lines = []
            if result.returncode == 0 and result.stdout.strip():
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        lines.append({"output": line.strip()})
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
