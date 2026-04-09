"""
Pytest configuration and fixtures for autoresearch tests.

Mocks heavy dependencies (torch, transformers, etc.) that aren't needed for hypothesis generator tests.
"""

import sys
from unittest.mock import MagicMock

# Mock heavy ML dependencies before any imports from runner
sys.modules["torch"] = MagicMock()
sys.modules["transformers"] = MagicMock()
sys.modules["datasets"] = MagicMock()
sys.modules["peft"] = MagicMock()
sys.modules["bitsandbytes"] = MagicMock()
sys.modules["training"] = MagicMock()
sys.modules["training.qla_trainer"] = MagicMock()
sys.modules["evaluation"] = MagicMock()
sys.modules["evaluation.runner"] = MagicMock()

