"""
Tests for ResearchProgram model (Phase 4.1)

Covers: SearchDimension validation, ResearchProgram creation, defaults,
serialization, constraint validation, and UUID generation.
"""

import pytest
import json
from datetime import datetime
from pydantic import ValidationError

from autoresearch.program import (
    SearchDimension,
    ResearchProgram,
    DEFAULT_PROGRAMS,
)


# ============================================================================
# Test 1: SearchDimension Model
# ============================================================================

def test_search_dimension_int_creation():
    """Create SearchDimension with int type"""
    dim = SearchDimension(
        name="lora_rank",
        type="int",
        min_val=4.0,
        max_val=32.0,
        current=8,
    )
    assert dim.name == "lora_rank"
    assert dim.type == "int"
    assert dim.min_val == 4.0
    assert dim.max_val == 32.0
    assert dim.current == 8
    assert dim.options is None


def test_search_dimension_float_creation():
    """Create SearchDimension with float type"""
    dim = SearchDimension(
        name="learning_rate",
        type="float",
        min_val=1e-5,
        max_val=5e-4,
        current=2e-4,
    )
    assert dim.name == "learning_rate"
    assert dim.type == "float"
    assert dim.min_val == 1e-5
    assert dim.max_val == 5e-4
    assert dim.current == 2e-4


def test_search_dimension_categorical_creation():
    """Create SearchDimension with categorical type"""
    dim = SearchDimension(
        name="lora_rank",
        type="categorical",
        options=[4, 8, 16, 32],
        current=8,
    )
    assert dim.name == "lora_rank"
    assert dim.type == "categorical"
    assert dim.options == [4, 8, 16, 32]
    assert dim.current == 8
    assert dim.min_val is None
    assert dim.max_val is None


def test_search_dimension_json_serialization():
    """Serialize/deserialize SearchDimension to/from JSON"""
    original = SearchDimension(
        name="batch_size",
        type="int",
        min_val=4.0,
        max_val=64.0,
        current=16,
    )
    
    # Serialize
    json_data = original.model_dump_json()
    
    # Deserialize
    restored = SearchDimension.model_validate_json(json_data)
    
    assert restored.name == original.name
    assert restored.type == original.type
    assert restored.min_val == original.min_val
    assert restored.max_val == original.max_val
    assert restored.current == original.current


# ============================================================================
# Test 2: ResearchProgram Creation and Basics
# ============================================================================

def test_research_program_minimal_creation():
    """Create minimal valid ResearchProgram"""
    program = ResearchProgram(
        run_tag="test-run",
        goal="Test goal",
        description="Test description",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="microsoft/phi-2",
        dataset_path="/data/test",
        search_dimensions=[
            SearchDimension(
                name="lora_rank",
                type="int",
                min_val=4.0,
                max_val=32.0,
                current=8,
            ),
        ],
    )
    
    assert program.run_tag == "test-run"
    assert program.goal == "Test goal"
    assert program.primary_metric == "val_loss"
    assert program.time_budget_seconds == 600
    assert len(program.search_dimensions) == 1


def test_research_program_uuid_generation():
    """ResearchProgram generates UUID by default"""
    program1 = ResearchProgram(
        run_tag="test-run",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="test-model",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="param1",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
    )
    
    program2 = ResearchProgram(
        run_tag="test-run",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="test-model",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="param1",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
    )
    
    # UUIDs should be different
    assert program1.id != program2.id
    # But both should be valid UUIDs (non-empty strings)
    assert len(program1.id) > 0
    assert len(program2.id) > 0


def test_research_program_defaults():
    """ResearchProgram has sensible defaults"""
    program = ResearchProgram(
        run_tag="test",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        base_model="test",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="p",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
    )
    
    assert program.strategy == "random"
    assert program.status == "pending"
    assert program.experiments_completed == 0
    assert program.max_experiments is None  # Can run indefinitely
    assert program.max_vram_mb is None
    assert program.simplicity_preference == 0.5


def test_research_program_created_at_timestamp():
    """ResearchProgram records creation timestamp"""
    before = datetime.now()
    program = ResearchProgram(
        run_tag="test",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="test",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="p",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
    )
    after = datetime.now()
    
    assert before <= program.created_at <= after


# ============================================================================
# Test 3: Constraint Validation
# ============================================================================

def test_research_program_invalid_run_tag():
    """ResearchProgram rejects empty run_tag"""
    with pytest.raises(ValidationError):
        ResearchProgram(
            run_tag="",  # Empty!
            goal="Test",
            description="Test",
            primary_metric="val_loss",
            time_budget_seconds=600,
            base_model="test",
            dataset_path="/data",
            search_dimensions=[
                SearchDimension(
                    name="p",
                    type="int",
                    min_val=1.0,
                    max_val=10.0,
                    current=5,
                ),
            ],
        )


def test_research_program_invalid_empty_search_dimensions():
    """ResearchProgram rejects empty search_dimensions"""
    with pytest.raises(ValidationError):
        ResearchProgram(
            run_tag="test",
            goal="Test",
            description="Test",
            primary_metric="val_loss",
            time_budget_seconds=600,
            base_model="test",
            dataset_path="/data",
            search_dimensions=[],  # Empty!
        )


def test_research_program_invalid_strategy():
    """ResearchProgram rejects invalid strategy"""
    with pytest.raises(ValidationError):
        ResearchProgram(
            run_tag="test",
            goal="Test",
            description="Test",
            primary_metric="val_loss",
            time_budget_seconds=600,
            base_model="test",
            dataset_path="/data",
            search_dimensions=[
                SearchDimension(
                    name="p",
                    type="int",
                    min_val=1.0,
                    max_val=10.0,
                    current=5,
                ),
            ],
            strategy="invalid_strategy",  # Not in allowed list
        )


def test_research_program_invalid_time_budget():
    """ResearchProgram rejects non-positive time budget"""
    with pytest.raises(ValidationError):
        ResearchProgram(
            run_tag="test",
            goal="Test",
            description="Test",
            primary_metric="val_loss",
            time_budget_seconds=0,  # Must be > 0
            base_model="test",
            dataset_path="/data",
            search_dimensions=[
                SearchDimension(
                    name="p",
                    type="int",
                    min_val=1.0,
                    max_val=10.0,
                    current=5,
                ),
            ],
        )


def test_research_program_invalid_max_experiments():
    """ResearchProgram rejects invalid max_experiments"""
    with pytest.raises(ValidationError):
        ResearchProgram(
            run_tag="test",
            goal="Test",
            description="Test",
            primary_metric="val_loss",
            time_budget_seconds=600,
            base_model="test",
            dataset_path="/data",
            search_dimensions=[
                SearchDimension(
                    name="p",
                    type="int",
                    min_val=1.0,
                    max_val=10.0,
                    current=5,
                ),
            ],
            max_experiments=0,  # Must be > 0 if specified
        )


def test_research_program_valid_max_experiments():
    """ResearchProgram accepts positive max_experiments"""
    program = ResearchProgram(
        run_tag="test",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="test",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="p",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
        max_experiments=10,
    )
    assert program.max_experiments == 10


# ============================================================================
# Test 4: Serialization/Deserialization
# ============================================================================

def test_research_program_json_serialization():
    """Serialize ResearchProgram to JSON"""
    program = ResearchProgram(
        run_tag="test-serialize",
        goal="Test goal",
        description="Test description",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="microsoft/phi-2",
        dataset_path="/data/test",
        search_dimensions=[
            SearchDimension(
                name="lora_rank",
                type="int",
                min_val=4.0,
                max_val=32.0,
                current=8,
            ),
        ],
    )
    
    json_str = program.model_dump_json()
    data = json.loads(json_str)
    
    assert data["run_tag"] == "test-serialize"
    assert data["goal"] == "Test goal"
    assert data["primary_metric"] == "val_loss"
    assert len(data["search_dimensions"]) == 1


def test_research_program_json_deserialization():
    """Deserialize ResearchProgram from JSON"""
    original = ResearchProgram(
        run_tag="test-deserialize",
        goal="Test goal",
        description="Test description",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="microsoft/phi-2",
        dataset_path="/data/test",
        search_dimensions=[
            SearchDimension(
                name="lora_rank",
                type="int",
                min_val=4.0,
                max_val=32.0,
                current=8,
            ),
            SearchDimension(
                name="learning_rate",
                type="float",
                min_val=1e-5,
                max_val=5e-4,
                current=2e-4,
            ),
        ],
        strategy="bayesian",
    )
    
    # Serialize
    json_str = original.model_dump_json()
    
    # Deserialize
    restored = ResearchProgram.model_validate_json(json_str)
    
    assert restored.run_tag == original.run_tag
    assert restored.goal == original.goal
    assert restored.primary_metric == original.primary_metric
    assert restored.strategy == original.strategy
    assert len(restored.search_dimensions) == 2


def test_research_program_dict_serialization():
    """Serialize ResearchProgram to dict"""
    program = ResearchProgram(
        run_tag="test-dict",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="test",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="p",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
    )
    
    data = program.model_dump()
    
    assert isinstance(data, dict)
    assert data["run_tag"] == "test-dict"
    assert "created_at" in data
    assert "id" in data


# ============================================================================
# Test 5: Default Programs
# ============================================================================

def test_default_programs_exist():
    """DEFAULT_PROGRAMS contains expected programs"""
    assert "quick-explore" in DEFAULT_PROGRAMS
    assert "overnight-run" in DEFAULT_PROGRAMS


def test_quick_explore_program():
    """Verify quick-explore default program is valid"""
    program = DEFAULT_PROGRAMS["quick-explore"]
    
    assert program.run_tag == "quick-explore"
    assert program.goal == "Quick exploration of LoRA hyperparameters"
    assert program.time_budget_seconds == 300
    assert program.max_experiments == 12
    assert program.strategy == "random"
    assert len(program.search_dimensions) == 2
    
    # Check search dimensions
    dim_names = {d.name for d in program.search_dimensions}
    assert "lora_rank" in dim_names
    assert "lora_alpha" in dim_names


def test_overnight_run_program():
    """Verify overnight-run default program is valid"""
    program = DEFAULT_PROGRAMS["overnight-run"]
    
    assert program.run_tag == "overnight-run"
    assert program.goal == "Overnight autonomous hyperparameter search"
    assert program.time_budget_seconds == 600
    assert program.max_experiments is None  # Runs indefinitely
    assert program.strategy == "bayesian"
    assert len(program.search_dimensions) == 4
    
    # Check search dimensions
    dim_names = {d.name for d in program.search_dimensions}
    assert "lora_rank" in dim_names
    assert "lora_alpha" in dim_names
    assert "learning_rate" in dim_names
    assert "batch_size" in dim_names


def test_default_programs_are_valid():
    """All default programs are valid ResearchProgram instances"""
    for name, program in DEFAULT_PROGRAMS.items():
        assert isinstance(program, ResearchProgram)
        assert len(program.search_dimensions) > 0
        assert program.run_tag is not None
        assert program.goal is not None


# ============================================================================
# Test 6: Strategy Validation
# ============================================================================

def test_research_program_valid_strategies():
    """ResearchProgram accepts all valid strategies"""
    valid_strategies = ["random", "sequential", "bayesian", "agent"]
    
    for strategy in valid_strategies:
        program = ResearchProgram(
            run_tag="test",
            goal="Test",
            description="Test",
            primary_metric="val_loss",
            time_budget_seconds=600,
            base_model="test",
            dataset_path="/data",
            search_dimensions=[
                SearchDimension(
                    name="p",
                    type="int",
                    min_val=1.0,
                    max_val=10.0,
                    current=5,
                ),
            ],
            strategy=strategy,
        )
        assert program.strategy == strategy


# ============================================================================
# Test 7: Complex Multi-Dimensional Search Space
# ============================================================================

def test_research_program_multi_dimensional():
    """Create ResearchProgram with complex search space"""
    program = ResearchProgram(
        run_tag="complex-search",
        goal="Comprehensive hyperparameter search",
        description="Search across multiple dimensions",
        primary_metric="val_loss",
        time_budget_seconds=900,
        max_experiments=100,
        base_model="microsoft/phi-2",
        dataset_path="/data/large",
        search_dimensions=[
            SearchDimension(
                name="lora_rank",
                type="int",
                min_val=4.0,
                max_val=64.0,
                current=16,
            ),
            SearchDimension(
                name="lora_alpha",
                type="int",
                min_val=8.0,
                max_val=128.0,
                current=32,
            ),
            SearchDimension(
                name="learning_rate",
                type="float",
                min_val=1e-5,
                max_val=1e-3,
                current=2e-4,
            ),
            SearchDimension(
                name="batch_size",
                type="categorical",
                options=[4, 8, 16, 32],
                current=16,
            ),
            SearchDimension(
                name="lora_dropout",
                type="float",
                min_val=0.01,
                max_val=0.3,
                current=0.1,
            ),
        ],
        strategy="bayesian",
        max_vram_mb=8192,
        simplicity_preference=0.7,
    )
    
    assert len(program.search_dimensions) == 5
    assert program.simplicity_preference == 0.7
    assert program.max_vram_mb == 8192


# ============================================================================
# Test 8: Metadata and Status Tracking
# ============================================================================

def test_research_program_status_tracking():
    """ResearchProgram tracks status and progress"""
    program = ResearchProgram(
        run_tag="track-status",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="test",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="p",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
        status="running",
        experiments_completed=5,
    )
    
    assert program.status == "running"
    assert program.experiments_completed == 5


def test_research_program_status_default():
    """ResearchProgram defaults to pending status"""
    program = ResearchProgram(
        run_tag="test",
        goal="Test",
        description="Test",
        primary_metric="val_loss",
        time_budget_seconds=600,
        base_model="test",
        dataset_path="/data",
        search_dimensions=[
            SearchDimension(
                name="p",
                type="int",
                min_val=1.0,
                max_val=10.0,
                current=5,
            ),
        ],
    )
    
    assert program.status == "pending"
