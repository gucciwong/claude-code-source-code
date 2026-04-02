import sys
import io
import time
from .sandbox import ResourceLimits, run_with_timeout, TimeoutError


class PythonRunner:
    def __init__(self, limits: ResourceLimits = None):
        self.limits = limits or ResourceLimits()

    def run(self, code: str, timeout_ms: int = 5000) -> dict:
        """
        Execute Python code in a restricted environment.
        Returns: {"lines": [...], "error": None|str, "duration_ms": float, "language": "python"}
        """
        trace_events = []
        start = time.perf_counter()

        # Check for forbidden modules
        for module in self.limits.forbidden_modules:
            if f'import {module}' in code or f'from {module}' in code:
                return {
                    "lines": [],
                    "error": f"Module '{module}' is not allowed",
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
                namespace = {'__builtins__': __builtins__}
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
