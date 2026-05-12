"""
Pytest configuration and fixtures for autoresearch tests.

Mocks heavy ML dependencies (torch, transformers, etc.) that aren't needed
for hypothesis-generator tests. We deliberately do NOT mock `evaluation`
or `training` because both are real first-party packages in this service —
mocking them would break sibling tests in tests/test_metrics.py,
tests/test_evaluation_runner.py, tests/test_validation_data.py which need
to import the real evaluation.{metrics, runner, data} modules.
"""

import sys
from unittest.mock import MagicMock

# Mock heavy ML dependencies before any imports from runner
sys.modules["torch"] = MagicMock()
sys.modules["transformers"] = MagicMock()
sys.modules["datasets"] = MagicMock()
sys.modules["peft"] = MagicMock()
sys.modules["bitsandbytes"] = MagicMock()
# NOTE: `training.qla_trainer` is mocked (heavy ML import) but `training`
# package itself stays REAL so other modules in the package import OK.
# The qla_trainer mock is enough for autoresearch.
sys.modules["training.qla_trainer"] = MagicMock()
# `evaluation` package is real; do not shadow it with MagicMock.

