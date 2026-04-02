import threading
from dataclasses import dataclass, field


@dataclass
class ResourceLimits:
    max_timeout_ms: int = 10_000
    max_output_chars: int = 50_000
    forbidden_modules: list = field(default_factory=lambda: [
        'os', 'sys', 'subprocess', 'socket', 'shutil', 'requests', 'urllib', 'http'
    ])

    def __post_init__(self):
        if self.forbidden_modules is None:
            self.forbidden_modules = [
                'os', 'sys', 'subprocess', 'socket', 'shutil', 'requests', 'urllib', 'http'
            ]


class TimeoutError(Exception):
    pass


def run_with_timeout(fn, timeout_ms: int):
    """Run fn() in a thread; raise TimeoutError if it exceeds timeout_ms."""
    result = [None]
    exc = [None]

    def target():
        try:
            result[0] = fn()
        except Exception as e:
            exc[0] = e

    t = threading.Thread(target=target, daemon=True)
    t.start()
    t.join(timeout=timeout_ms / 1000)
    if t.is_alive():
        raise TimeoutError(f"Execution exceeded {timeout_ms}ms")
    if exc[0]:
        raise exc[0]
    return result[0]
