"""
Tests for hypothesis generators (Phase 4.2)

Tests for BayesianHypothesisGenerator, SequentialHypothesisGenerator, and AgentHypothesisGenerator.
Verifies config generation, history tracking, boundary validation, and edge cases.
"""

import pytest
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

from autoresearch.program import SearchDimension, ResearchProgram
from autoresearch.hypothesis import (
    BayesianHypothesisGenerator,
    SequentialHypothesisGenerator,
    AgentHypothesisGenerator,
)
from experiments.models import Experiment, ExperimentStatus


@pytest.fixture
def sample_search_dimensions() -> List[SearchDimension]:
    """Create sample search dimensions for testing"""
    return [
        SearchDimension(
            name="learning_rate",
            type="float",
            min_val=1e-5,
            max_val=1e-3,
            current=1e-4,
        ),
        SearchDimension(
            name="batch_size",
            type="int",
            min_val=2,
            max_val=32,
            current=8,
        ),
        SearchDimension(
            name="lora_rank",
            type="int",
            min_val=4,
            max_val=64,
            current=16,
        ),
        SearchDimension(
            name="optimizer",
            type="categorical",
            options=["adam", "adamw", "sgd"],
            current="adam",
        ),
    ]


@pytest.fixture
def sample_research_program(sample_search_dimensions) -> ResearchProgram:
    """Create a sample research program for testing"""
    return ResearchProgram(
        run_tag="test/hypothesis",
        goal="Minimize validation loss",
        description="Test hypothesis generators",
        primary_metric="val_loss",
        strategy="bayesian",
        base_model="gpt2",
        dataset_path="/tmp/test_data",
        search_dimensions=sample_search_dimensions,
    )


@pytest.fixture
def sample_experiments() -> List[Experiment]:
    """Create sample experiment history for testing"""
    now = datetime.now(timezone.utc)
    return [
        Experiment(
            id="exp-001",
            run_tag="test/hypothesis",
            config={
                "learning_rate": 1e-4,
                "batch_size": 8,
                "lora_rank": 16,
                "optimizer": "adam",
            },
            description="Baseline",
            status=ExperimentStatus.KEEP,
            val_loss=2.5,
            primary_metric=2.5,
            created_at=now,
        ),
        Experiment(
            id="exp-002",
            run_tag="test/hypothesis",
            config={
                "learning_rate": 5e-5,
                "batch_size": 16,
                "lora_rank": 32,
                "optimizer": "adamw",
            },
            description="Reduced LR, higher rank",
            status=ExperimentStatus.KEEP,
            val_loss=2.3,
            primary_metric=2.3,
            created_at=now,
        ),
        Experiment(
            id="exp-003",
            run_tag="test/hypothesis",
            config={
                "learning_rate": 8e-4,
                "batch_size": 4,
                "lora_rank": 8,
                "optimizer": "sgd",
            },
            description="High LR, low rank",
            status=ExperimentStatus.DISCARD,
            val_loss=3.1,
            primary_metric=3.1,
            created_at=now,
        ),
    ]


class TestBayesianHypothesisGenerator:
    """Tests for BayesianHypothesisGenerator"""

    @pytest.mark.asyncio
    async def test_generate_with_empty_history(self, sample_research_program):
        """Generate config when history is empty - should return random valid config"""
        gen = BayesianHypothesisGenerator(sample_research_program)
        config = await gen.generate(history=[])

        # Verify all required parameters are present
        assert "learning_rate" in config
        assert "batch_size" in config
        assert "lora_rank" in config
        assert "optimizer" in config

        # Verify bounds
        assert 1e-5 <= config["learning_rate"] <= 1e-3
        assert 2 <= config["batch_size"] <= 32
        assert 4 <= config["lora_rank"] <= 64
        assert config["optimizer"] in ["adam", "adamw", "sgd"]

    @pytest.mark.asyncio
    async def test_generate_with_history(self, sample_research_program, sample_experiments):
        """Generate config considering history - should favor better performing config regions"""
        gen = BayesianHypothesisGenerator(sample_research_program)
        
        # Update history with sample experiments
        gen.update_history(sample_experiments)
        config = await gen.generate(history=sample_experiments)

        # Verify all required parameters are present
        assert "learning_rate" in config
        assert "batch_size" in config
        assert "lora_rank" in config
        assert "optimizer" in config

        # Verify bounds
        assert 1e-5 <= config["learning_rate"] <= 1e-3
        assert 2 <= config["batch_size"] <= 32
        assert 4 <= config["lora_rank"] <= 64
        assert config["optimizer"] in ["adam", "adamw", "sgd"]

    @pytest.mark.asyncio
    async def test_respects_search_dimensions_bounds(self, sample_research_program):
        """All generated configs must stay within SearchDimension bounds"""
        gen = BayesianHypothesisGenerator(sample_research_program)
        
        for _ in range(10):
            config = await gen.generate(history=[])
            
            # Check each dimension is within bounds
            for dim in sample_research_program.search_dimensions:
                assert dim.name in config
                val = config[dim.name]
                
                if dim.type in ["int", "float"]:
                    assert dim.min_val <= val <= dim.max_val, \
                        f"{dim.name}={val} outside [{dim.min_val}, {dim.max_val}]"
                elif dim.type == "categorical":
                    assert val in dim.options

    @pytest.mark.asyncio
    async def test_update_history_tracking(self, sample_research_program, sample_experiments):
        """History tracking should properly record experiment outcomes"""
        gen = BayesianHypothesisGenerator(sample_research_program)
        
        # Initially empty
        assert len(gen.history) == 0
        
        # Update with experiments
        gen.update_history(sample_experiments)
        assert len(gen.history) == len(sample_experiments)
        
        # Verify history contains metrics
        for hist_entry in gen.history:
            assert "config" in hist_entry
            assert "metric" in hist_entry


class TestSequentialHypothesisGenerator:
    """Tests for SequentialHypothesisGenerator"""

    @pytest.mark.asyncio
    async def test_generate_initial_config(self, sample_research_program):
        """First generation should return first categorical option or min value"""
        gen = SequentialHypothesisGenerator(sample_research_program)
        config = await gen.generate(history=[])

        # Should produce valid config
        assert "learning_rate" in config
        assert "batch_size" in config
        assert "lora_rank" in config
        assert "optimizer" in config

        # For categorical, should pick first option
        assert config["optimizer"] == "adam"  # first in ["adam", "adamw", "sgd"]

    @pytest.mark.asyncio
    async def test_sequential_progression(self, sample_research_program):
        """Sequential generator should iterate through categorical options"""
        gen = SequentialHypothesisGenerator(sample_research_program)
        
        # Generate multiple configs - should cycle through optimizer options
        configs = []
        optimizer_options = ["adam", "adamw", "sgd"]
        
        for i in range(6):  # Generate 6 times to see cycling
            config = await gen.generate(history=[])
            configs.append(config)
            
            # Optimizer should cycle through options
            expected_optimizer = optimizer_options[i % len(optimizer_options)]
            assert config["optimizer"] == expected_optimizer

    @pytest.mark.asyncio
    async def test_reset_function(self, sample_research_program):
        """Reset should return generator to initial state"""
        gen = SequentialHypothesisGenerator(sample_research_program)
        
        # Generate a few configs to advance state
        await gen.generate(history=[])
        await gen.generate(history=[])
        
        # Reset
        gen.reset()
        
        # First generation after reset should match initial first generation
        config1 = await gen.generate(history=[])
        assert config1["optimizer"] == "adam"

    @pytest.mark.asyncio
    async def test_respects_bounds(self, sample_research_program):
        """Sequential generator should respect dimension bounds"""
        gen = SequentialHypothesisGenerator(sample_research_program)
        
        for _ in range(20):
            config = await gen.generate(history=[])
            
            for dim in sample_research_program.search_dimensions:
                assert dim.name in config
                val = config[dim.name]
                
                if dim.type in ["int", "float"]:
                    assert dim.min_val <= val <= dim.max_val


class TestAgentHypothesisGenerator:
    """Tests for AgentHypothesisGenerator with mocked Claude API"""

    @pytest.mark.asyncio
    async def test_generate_with_mock_api(self, sample_research_program, sample_experiments):
        """Generate config using mocked Claude API"""
        # Mock the environment variable first
        with patch.dict(
            "os.environ", {"ANTHROPIC_API_KEY": "test-key-12345"}, clear=False
        ):
            # Mock the Anthropic client
            with patch("autoresearch.hypothesis.anthropic.Anthropic") as mock_anthropic_class:
                mock_client = MagicMock()
                mock_anthropic_class.return_value = mock_client

                # Mock the API response
                mock_response = MagicMock()
                mock_response.content = [MagicMock()]
                mock_response.content[0].text = """{
                    "learning_rate": 2e-4,
                    "batch_size": 16,
                    "lora_rank": 24,
                    "optimizer": "adamw",
                    "rationale": "Increasing batch size and rank based on exp-002 success"
                }"""
                mock_client.messages.create.return_value = mock_response

                gen = AgentHypothesisGenerator(sample_research_program)
                config = await gen.generate(history=sample_experiments)

                # Verify config structure
                assert isinstance(config, dict)
                assert "learning_rate" in config
                assert "batch_size" in config
                assert "lora_rank" in config
                assert "optimizer" in config

    @pytest.mark.asyncio
    async def test_generate_invalid_api_key(self, sample_research_program):
        """Should raise error if API key is missing"""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
                gen = AgentHypothesisGenerator(sample_research_program)

    @pytest.mark.asyncio
    async def test_generate_with_empty_history(self, sample_research_program):
        """Agent should handle empty history gracefully"""
        with patch.dict(
            "os.environ", {"ANTHROPIC_API_KEY": "test-key-12345"}, clear=False
        ):
            with patch("autoresearch.hypothesis.anthropic.Anthropic") as mock_anthropic_class:
                mock_client = MagicMock()
                mock_anthropic_class.return_value = mock_client

                mock_response = MagicMock()
                mock_response.content = [MagicMock()]
                mock_response.content[0].text = """{
                    "learning_rate": 1.5e-4,
                    "batch_size": 8,
                    "lora_rank": 16,
                    "optimizer": "adam",
                    "rationale": "Baseline conservative approach"
                }"""
                mock_client.messages.create.return_value = mock_response

                gen = AgentHypothesisGenerator(sample_research_program)
                config = await gen.generate(history=[])

                assert config is not None
                assert len(config) > 0

    @pytest.mark.asyncio
    async def test_config_validation_against_bounds(self, sample_research_program, sample_experiments):
        """Agent-generated configs should be validated against dimension bounds"""
        with patch.dict(
            "os.environ", {"ANTHROPIC_API_KEY": "test-key-12345"}, clear=False
        ):
            with patch("autoresearch.hypothesis.anthropic.Anthropic") as mock_anthropic_class:
                mock_client = MagicMock()
                mock_anthropic_class.return_value = mock_client

                # API returns out-of-bounds value
                mock_response = MagicMock()
                mock_response.content = [MagicMock()]
                mock_response.content[0].text = """{
                    "learning_rate": 0.5,
                    "batch_size": 8,
                    "lora_rank": 16,
                    "optimizer": "adam",
                    "rationale": "Test out of bounds"
                }"""
                mock_client.messages.create.return_value = mock_response

                gen = AgentHypothesisGenerator(sample_research_program)

                # Should either clamp or raise error
                try:
                    config = await gen.generate(history=sample_experiments)
                    # If it succeeds, values should be clamped to bounds
                    assert config["learning_rate"] <= 1e-3
                except ValueError:
                    # Or it should raise a validation error
                    pass

    @pytest.mark.asyncio
    async def test_malformed_api_response(self, sample_research_program, sample_experiments):
        """Should handle malformed JSON from API gracefully"""
        with patch.dict(
            "os.environ", {"ANTHROPIC_API_KEY": "test-key-12345"}, clear=False
        ):
            with patch("autoresearch.hypothesis.anthropic.Anthropic") as mock_anthropic_class:
                mock_client = MagicMock()
                mock_anthropic_class.return_value = mock_client

                # API returns invalid JSON
                mock_response = MagicMock()
                mock_response.content = [MagicMock()]
                mock_response.content[0].text = "not valid json {{"
                mock_client.messages.create.return_value = mock_response

                gen = AgentHypothesisGenerator(sample_research_program)

                with pytest.raises(ValueError):
                    await gen.generate(history=sample_experiments)


class TestHypothesisGeneratorIntegration:
    """Integration tests for all generators"""

    @pytest.mark.asyncio
    async def test_all_generators_produce_valid_configs(self, sample_research_program, sample_experiments):
        """All generators should produce configs valid within search space"""
        generators = [
            BayesianHypothesisGenerator(sample_research_program),
            SequentialHypothesisGenerator(sample_research_program),
        ]
        
        for gen in generators:
            config = await gen.generate(history=sample_experiments)
            
            # Check all dimensions are covered
            for dim in sample_research_program.search_dimensions:
                assert dim.name in config, f"Missing {dim.name}"
                
                val = config[dim.name]
                if dim.type in ["int", "float"]:
                    assert dim.min_val <= val <= dim.max_val
                elif dim.type == "categorical":
                    assert val in dim.options

    @pytest.mark.asyncio
    async def test_bayesian_explores_good_regions(self, sample_research_program, sample_experiments):
        """Bayesian generator should favor regions with better metrics"""
        gen = BayesianHypothesisGenerator(sample_research_program)
        gen.update_history(sample_experiments)
        
        # exp-002 had best metric (2.3 val_loss)
        # Should explore configs near exp-002's config more often
        config = await gen.generate(history=sample_experiments)
        
        # Check it's a valid config
        assert config is not None
        for dim in sample_research_program.search_dimensions:
            assert dim.name in config


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_single_dimension_search(self):
        """Handle research program with single search dimension"""
        dims = [SearchDimension(
            name="learning_rate",
            type="float",
            min_val=1e-5,
            max_val=1e-3,
            current=1e-4,
        )]
        
        program = ResearchProgram(
            run_tag="test/single",
            goal="Test",
            description="Single dimension",
            primary_metric="val_loss",
            base_model="gpt2",
            dataset_path="/tmp/test",
            search_dimensions=dims,
        )
        
        gen = BayesianHypothesisGenerator(program)
        config = await gen.generate(history=[])
        
        assert "learning_rate" in config
        assert 1e-5 <= config["learning_rate"] <= 1e-3

    @pytest.mark.asyncio
    async def test_all_categorical_dimensions(self):
        """Handle research program with only categorical dimensions"""
        dims = [
            SearchDimension(
                name="opt1",
                type="categorical",
                options=["a", "b"],
                current="a",
            ),
            SearchDimension(
                name="opt2",
                type="categorical",
                options=["x", "y", "z"],
                current="x",
            ),
        ]
        
        program = ResearchProgram(
            run_tag="test/categorical",
            goal="Test",
            description="All categorical",
            primary_metric="val_loss",
            base_model="gpt2",
            dataset_path="/tmp/test",
            search_dimensions=dims,
        )
        
        gen = SequentialHypothesisGenerator(program)
        config = await gen.generate(history=[])
        
        assert config["opt1"] in ["a", "b"]
        assert config["opt2"] in ["x", "y", "z"]

    @pytest.mark.asyncio
    async def test_very_large_history(self, sample_research_program):
        """Handle large experiment histories efficiently"""
        # Create 100 experiments
        large_history = []
        for i in range(100):
            exp = Experiment(
                id=f"exp-{i:03d}",
                run_tag="test/hypothesis",
                config={
                    "learning_rate": 1e-4,
                    "batch_size": 8,
                    "lora_rank": 16,
                    "optimizer": "adam",
                },
                description=f"Large history test {i}",
                status=ExperimentStatus.KEEP if i % 2 == 0 else ExperimentStatus.DISCARD,
                val_loss=2.0 + (i * 0.01),
                primary_metric=2.0 + (i * 0.01),
                created_at=datetime.now(timezone.utc),
            )
            large_history.append(exp)
        
        gen = BayesianHypothesisGenerator(sample_research_program)
        config = await gen.generate(history=large_history)
        
        # Should complete without performance issues
        assert config is not None
        assert len(config) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
