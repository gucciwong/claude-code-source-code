"""
Pytest configuration and fixtures for autoresearch tests.

Mocks heavy ML dependencies (torch, transformers, etc.) that aren't needed
for hypothesis-generator tests — BUT only when those packages are not
actually installed. CI installs the real torch/transformers/datasets/peft/
bitsandbytes via requirements.txt; mocking them there would shadow the
real packages and break tests/test_metrics.py, tests/test_evaluation_runner.py,
tests/test_validation_data.py which do `import torch.nn.functional`.

We deliberately do NOT mock `evaluation` or `training` because both are
real first-party packages in this service — mocking them would break
sibling tests that need the real evaluation.{metrics, runner, data} modules.
"""

import sys
from unittest.mock import MagicMock


def _mock_if_missing(modname: str) -> None:
    """Install a MagicMock for `modname` only when the real package is
    not importable. Keeps CI (real deps installed) green AND keeps minimal
    dev environments (no GPU stack) able to run hypothesis tests."""
    try:
        __import__(modname)
    except ImportError:
        sys.modules[modname] = MagicMock()


# Mock heavy ML deps only if they're missing (e.g., dev box without GPU
# stack). CI installs them via requirements.txt so the real packages win.
for _mod in ("torch", "transformers", "datasets", "peft", "bitsandbytes"):
    _mock_if_missing(_mod)

# `training.qla_trainer` is always mocked — it does heavy import-time
# work that we don't want even in CI for hypothesis tests. The `training`
# package itself stays REAL so siblings import OK.
sys.modules["training.qla_trainer"] = MagicMock()
# `evaluation` package is real; do not shadow it with MagicMock.

