import sys
import io
import time
import re
from .sandbox import ResourceLimits, run_with_timeout, TimeoutError


# Minimal safe builtins — no __import__, no open, no eval/exec/compile
_SAFE_BUILTINS = {
    'abs': abs, 'all': all, 'any': any, 'bin': bin, 'bool': bool,
    'chr': chr, 'dict': dict, 'divmod': divmod, 'enumerate': enumerate,
    'filter': filter, 'float': float, 'format': format, 'frozenset': frozenset,
    'hash': hash, 'hex': hex, 'int': int, 'isinstance': isinstance,
    'issubclass': issubclass, 'iter': iter, 'len': len, 'list': list,
    'map': map, 'max': max, 'min': min, 'next': next, 'oct': oct,
    'ord': ord, 'pow': pow, 'print': print, 'range': range, 'repr': repr,
    'reversed': reversed, 'round': round, 'set': set, 'slice': slice,
    'sorted': sorted, 'str': str, 'sum': sum, 'tuple': tuple, 'type': type,
    'zip': zip, 'True': True, 'False': False, 'None': None,
    'Exception': Exception, 'ValueError': ValueError, 'TypeError': TypeError,
    'KeyError': KeyError, 'IndexError': IndexError, 'AttributeError': AttributeError,
    'RuntimeError': RuntimeError, 'StopIteration': StopIteration,
    'NotImplementedError': NotImplementedError, 'AssertionError': AssertionError,
}


class PythonRunner:
    def __init__(self, limits: ResourceLimits = None):
        self.limits = limits or ResourceLimits()

    @staticmethod
    def _detect_forbidden_imports(code: str, forbidden: list) -> str | None:
        """Detect forbidden module imports using AST-aware regex patterns.
        
        Catches: import X, import X as Y, from X import Y, from X import *,
        __import__('X'), importlib.import_module('X'), and multi-line variants.
        """
        # Strip comments and string literals to avoid false positives
        stripped = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        stripped = re.sub(r'"""[\s\S]*?"""', '""', stripped)
        stripped = re.sub(r"'''[\s\S]*?'''", "''", stripped)
        stripped = re.sub(r'"[^"]*"', '""', stripped)
        stripped = re.sub(r"'[^']*'", "''", stripped)

        for module in forbidden:
            # import X / import X as Y / import X, Y
            if re.search(rf'\bimport\s+{re.escape(module)}\b', stripped):
                return module
            # from X import ... / from X import *
            if re.search(rf'\bfrom\s+{re.escape(module)}\b', stripped):
                return module
            # __import__('X') / __import__("X")
            if re.search(rf"__import__\s*\(\s*['\"]({re.escape(module)})['\"]", stripped):
                return module
            # importlib.import_module('X')
            if re.search(rf"import_module\s*\(\s*['\"]({re.escape(module)})['\"]", stripped):
                return module
        return None

    def run(self, code: str, timeout_ms: int = 5000) -> dict:
        """
        Execute Python code in a restricted environment.
        Returns: {"lines": [...], "error": None|str, "duration_ms": float, "language": "python"}
        """
        trace_events = []
        start = time.perf_counter()

        # Check for forbidden modules using AST-aware detection
        forbidden = self._detect_forbidden_imports(code, self.limits.forbidden_modules)
        if forbidden:
            return {
                "lines": [],
                "error": f"Module '{forbidden}' is not allowed",
                "duration_ms": 0.0,
                "language": "python",
            }

        # Block direct use of __import__ and other dangerous builtins
        dangerous_names = ['__import__', 'eval', 'exec', 'compile', 'open',
                          'globals', 'locals', 'vars', 'dir', 'getattr',
                          'setattr', 'delattr', 'breakpoint', 'exit', 'quit']
        for name in dangerous_names:
            # Match name( which indicates a call
            if re.search(rf'\b{name}\s*\(', code):
                return {
                    "lines": [],
                    "error": f"Use of '{name}()' is not allowed in sandbox",
                    "duration_ms": 0.0,
                    "language": "python",
                }

        # Use sys.settrace to capture variable assignments at each step.
        # The 'line' event fires BEFORE the line executes, so we track the
        # previous line and emit the captured vars on the next event (which is
        # AFTER the previous line ran).  We do the same on 'return' so that the
        # last line of every frame is always captured.
        frame_prev_line: dict = {}

        def tracer(frame, event, arg):
            fid = id(frame)
            if event == 'call':
                frame_prev_line[fid] = None
                return tracer
            if event == 'line':
                prev = frame_prev_line.get(fid)
                if prev is not None:
                    local_vars = {
                        k: repr(v)
                        for k, v in frame.f_locals.items()
                        if not k.startswith('_') and k not in ('__builtins__',)
                    }
                    if local_vars:
                        trace_events.append({"line": prev, "vars": local_vars})
                frame_prev_line[fid] = frame.f_lineno
            elif event == 'return':
                prev = frame_prev_line.get(fid)
                if prev is not None:
                    local_vars = {
                        k: repr(v)
                        for k, v in frame.f_locals.items()
                        if not k.startswith('_') and k not in ('__builtins__',)
                    }
                    if local_vars:
                        trace_events.append({"line": prev, "vars": local_vars})
                frame_prev_line.pop(fid, None)
            return tracer

        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
        error = None

        try:
            def do_exec():
                # Compile first to catch syntax errors
                compiled = compile(code, '<sandbox>', 'exec')
                namespace = {'__builtins__': _SAFE_BUILTINS}
                sys.settrace(tracer)
                try:
                    exec(compiled, namespace)
                finally:
                    sys.settrace(None)

            run_with_timeout(do_exec, timeout_ms)
        except TimeoutError as e:
            error = str(e)
        except SyntaxError as e:
            error = f"SyntaxError: {e}"
        except Exception as e:
            error = f"{type(e).__name__}: {e}"
        finally:
            sys.stdout = old_stdout

        duration_ms = (time.perf_counter() - start) * 1000
        return {
            "lines": trace_events,
            "error": error,
            "duration_ms": round(duration_ms, 2),
            "language": "python",
        }
