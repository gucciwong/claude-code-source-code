"""
Hypothesis Generators for Autonomous Research (Phase 4.2)

Three strategies for generating next experiment hypotheses:

1. BayesianHypothesisGenerator: Uses Bayesian optimization (Optuna's TPESampler)
   to explore promising regions of the hyperparameter space based on past results.

2. SequentialHypothesisGenerator: Performs systematic grid search, trying each
   categorical option and exploring numeric ranges sequentially.

3. AgentHypothesisGenerator: Uses Claude LLM to intelligently suggest next
   experiment based on experiment history and research context.

All inherit from HypothesisGenerator ABC defined in runner.py.
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from datetime import datetime

import optuna
from optuna.samplers import TPESampler

# Try to import from runner, but provide fallback for testing
try:
    from autoresearch.runner import HypothesisGenerator
except (ImportError, ModuleNotFoundError):
    # Fallback ABC for testing environments without full dependencies
    class HypothesisGenerator(ABC):
        """Abstract base for experiment hypothesis generation"""

        @abstractmethod
        async def generate(self) -> Dict[str, Any]:
            """Generate next experiment config (changes from baseline)"""
            pass


from autoresearch.program import ResearchProgram, SearchDimension
from experiments.models import Experiment

try:
    import anthropic
except ImportError:
    anthropic = None

logger = logging.getLogger(__name__)


class BayesianHypothesisGenerator(HypothesisGenerator):
    """
    Bayesian Optimization Hypothesis Generator

    Uses Optuna's Tree-structured Parzen Estimator (TPESampler) to guide
    hyperparameter exploration. Learns from experiment history to propose
    promising configurations in regions that have historically performed well.

    Key mechanisms:
    - Tracks validation metric vs. configuration in history
    - Builds surrogate model of metric landscape
    - Proposes next config by balancing exploration vs. exploitation
    - Respects all SearchDimension bounds and types

    References:
    - Optuna documentation: https://optuna.readthedocs.io/
    - TPESampler paper: Bergstra et al., "Algorithms for Hyper-Parameter Optimization"
    """

    def __init__(self, program: ResearchProgram):
        """
        Initialize Bayesian generator for a research program.

        Args:
            program: ResearchProgram defining search space and metrics
        """
        self.program = program
        self.history: List[Dict[str, Any]] = []  # Tracked experiments with metrics

        # Create Optuna study with TPESampler
        self.sampler = TPESampler(seed=42)
        self.study = optuna.create_study(
            direction="minimize",  # Assuming we minimize primary metric
            sampler=self.sampler,
        )

        logger.info(f"Initialized BayesianHypothesisGenerator for {program.run_tag}")

    def update_history(self, experiments: List[Experiment]) -> None:
        """
        Update history with experiment results for learning.

        Extracts config and primary metric from each experiment,
        filtering for valid (non-crashed) results.

        Args:
            experiments: List of completed experiments
        """
        for exp in experiments:
            if exp.primary_metric is None:
                logger.warning(f"Skipping exp {exp.id} - no primary metric")
                continue

            self.history.append(
                {
                    "config": exp.config,
                    "metric": exp.primary_metric,
                    "status": exp.status,
                }
            )

            # Add trial to Optuna study if not already present
            try:
                # Map experiment config to Optuna trial
                trial_params = self._config_to_optuna_params(exp.config)
                self.study.tell(
                    optuna.trial.create_trial(
                        state=optuna.trial.TrialState.COMPLETE,
                        value=exp.primary_metric,
                        datetime_complete=datetime.now(),
                        params=trial_params,
                    )
                )
            except Exception as e:
                logger.warning(f"Could not add trial to Optuna study: {e}")

        logger.info(f"Updated history with {len(experiments)} experiments")

    async def generate(self, history: Optional[List[Experiment]] = None) -> Dict[str, Any]:
        """
        Generate next configuration using Bayesian optimization.

        If history is provided, uses it to inform the proposal.
        Falls back to random exploration if history is empty.

        Args:
            history: Optional list of past experiments for learning

        Returns:
            Dict mapping dimension names to proposed values
        """
        if history:
            self.update_history(history)

        # If no history, return random valid config
        if not self.history:
            logger.info("No history - generating random initial config")
            return self._generate_random_config()

        # Create trial and ask for next params
        trial = self.study.ask()

        # Map Optuna params to our search dimensions
        config = self._optuna_trial_to_config(trial)

        logger.info(f"Generated Bayesian hypothesis: {config}")
        return config

    def _generate_random_config(self) -> Dict[str, Any]:
        """Generate random configuration respecting bounds"""
        import random

        config = {}
        for dim in self.program.search_dimensions:
            if dim.type == "int":
                config[dim.name] = random.randint(int(dim.min_val), int(dim.max_val))
            elif dim.type == "float":
                config[dim.name] = random.uniform(dim.min_val, dim.max_val)
            elif dim.type == "categorical":
                config[dim.name] = random.choice(dim.options)

        return config

    def _config_to_optuna_params(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Convert experiment config to Optuna trial parameters"""
        params = {}
        for dim in self.program.search_dimensions:
            if dim.name not in config:
                continue

            val = config[dim.name]

            if dim.type == "int":
                params[dim.name] = int(val)
            elif dim.type == "float":
                params[dim.name] = float(val)
            elif dim.type == "categorical":
                # Store categorical as string
                params[dim.name] = str(val)

        return params

    def _optuna_trial_to_config(self, trial: optuna.Trial) -> Dict[str, Any]:
        """Convert Optuna trial suggestion to config"""
        config = {}

        for dim in self.program.search_dimensions:
            if dim.type == "int":
                config[dim.name] = trial.suggest_int(
                    dim.name, int(dim.min_val), int(dim.max_val)
                )
            elif dim.type == "float":
                config[dim.name] = trial.suggest_float(dim.name, dim.min_val, dim.max_val)
            elif dim.type == "categorical":
                config[dim.name] = trial.suggest_categorical(dim.name, dim.options)

        return config


class SequentialHypothesisGenerator(HypothesisGenerator):
    """
    Sequential Grid Search Hypothesis Generator

    Systematically explores the hyperparameter space by iterating through
    each categorical option and sampling numeric parameters systematically.

    Useful for:
    - Early-stage research to understand parameter sensitivity
    - Interpretable exploration (each experiment has clear intent)
    - Smaller search spaces where full grid is feasible

    Process:
    1. For categorical parameters, iterate through each option
    2. For numeric parameters, sample from min to max uniformly
    3. Reset to beginning when all combinations are exhausted
    """

    def __init__(self, program: ResearchProgram):
        """
        Initialize sequential generator.

        Args:
            program: ResearchProgram defining search space
        """
        self.program = program
        self.reset()

        logger.info(f"Initialized SequentialHypothesisGenerator for {program.run_tag}")

    def reset(self) -> None:
        """Reset generator to initial state for new search cycle"""
        # Track position in categorical parameter iteration
        self._categorical_indices: Dict[str, int] = {}
        self._trial_count = 0

        # Initialize categorical indices to 0
        for dim in self.program.search_dimensions:
            if dim.type == "categorical":
                self._categorical_indices[dim.name] = 0

        logger.info("Reset sequential generator state")

    async def generate(self, history: Optional[List[Experiment]] = None) -> Dict[str, Any]:
        """
        Generate next configuration sequentially.

        Cycles through categorical options for each parameter.
        Progressively explores numeric ranges.

        Args:
            history: Ignored for sequential generation

        Returns:
            Dict mapping dimension names to proposed values
        """
        import math

        config = {}

        for dim in self.program.search_dimensions:
            if dim.type == "int":
                # For integers, divide range into buckets based on trial count
                steps = min(10, int(dim.max_val - dim.min_val) + 1)
                step_size = (dim.max_val - dim.min_val) / steps
                step = self._trial_count % steps
                config[dim.name] = int(dim.min_val + step * step_size)

            elif dim.type == "float":
                # For floats, create 10 samples across range
                steps = 10
                step_size = (dim.max_val - dim.min_val) / steps
                step = self._trial_count % steps
                config[dim.name] = dim.min_val + step * step_size

            elif dim.type == "categorical":
                # Cycle through categorical options
                idx = self._categorical_indices[dim.name]
                config[dim.name] = dim.options[idx % len(dim.options)]
                
                # Advance index for next generation
                self._categorical_indices[dim.name] = (idx + 1) % len(dim.options)

        self._trial_count += 1

        logger.info(
            f"Generated sequential hypothesis (trial {self._trial_count}): {config}"
        )
        return config


class AgentHypothesisGenerator(HypothesisGenerator):
    """
    LLM-Based Agent Hypothesis Generator

    Uses Claude (via Anthropic API) to intelligently propose next experiment
    based on experiment history and research context.

    The agent reads:
    - Experiment history (past configs, metrics, outcomes)
    - Research program goals and constraints
    - Current best and worst configurations

    And generates:
    - Next configuration to try
    - Rationale for the proposal
    - Expected metric improvement direction

    This leverages Claude's ability to:
    - Identify patterns in hyperparameter effectiveness
    - Suggest complementary parameter changes
    - Reason about tradeoffs (e.g., learning rate vs. batch size)

    Requires:
    - ANTHROPIC_API_KEY environment variable set
    - anthropic library installed

    References:
    - autoresearch program.md concept: agent-driven hypothesis generation
    - Anthropic API: https://docs.anthropic.com/
    """

    def __init__(self, program: ResearchProgram):
        """
        Initialize agent-based generator.

        Args:
            program: ResearchProgram defining research goals and space

        Raises:
            ValueError: If ANTHROPIC_API_KEY not set or anthropic not installed
        """
        if anthropic is None:
            raise ValueError(
                "anthropic library not installed. Install with: pip install anthropic"
            )

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY environment variable not set. "
                "Set it to enable agent-based hypothesis generation."
            )

        self.program = program
        self.client = anthropic.Anthropic(api_key=api_key)

        logger.info(f"Initialized AgentHypothesisGenerator for {program.run_tag}")

    async def generate(self, history: Optional[List[Experiment]] = None) -> Dict[str, Any]:
        """
        Generate next configuration using Claude agent.

        Sends experiment history and research context to Claude,
        receives back a proposed configuration with rationale.

        Args:
            history: List of past experiments to learn from

        Returns:
            Dict mapping dimension names to proposed values

        Raises:
            ValueError: If Claude response cannot be parsed as JSON
        """
        # Build context for Claude
        context = self._build_agent_context(history or [])

        # Call Claude
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[
                {
                    "role": "user",
                    "content": context,
                }
            ],
        )

        # Parse response
        response_text = response.content[0].text
        logger.debug(f"Claude response: {response_text}")

        try:
            config = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {response_text}")
            raise ValueError(f"Invalid JSON from Claude: {e}")

        # Validate config against bounds
        config = self._validate_and_clamp_config(config)

        logger.info(f"Generated agent hypothesis: {config}")
        return config

    def _build_agent_context(self, history: List[Experiment]) -> str:
        """Build Claude prompt with research context"""
        # Format search space
        search_space_desc = "## Search Space\n"
        for dim in self.program.search_dimensions:
            if dim.type in ["int", "float"]:
                search_space_desc += (
                    f"- {dim.name} ({dim.type}): [{dim.min_val}, {dim.max_val}]\n"
                )
            elif dim.type == "categorical":
                search_space_desc += (
                    f"- {dim.name} (categorical): {dim.options}\n"
                )

        # Format history
        history_desc = ""
        if history:
            history_desc = "## Experiment History\n"
            for i, exp in enumerate(history[-10:], 1):  # Last 10 experiments
                history_desc += f"\n{i}. {exp.description}\n"
                history_desc += f"   Config: {json.dumps(exp.config, indent=2)}\n"
                if exp.primary_metric is not None:
                    history_desc += f"   Primary Metric: {exp.primary_metric}\n"
                history_desc += f"   Status: {exp.status}\n"
        else:
            history_desc = "## Experiment History\nNo experiments yet - generating initial baseline.\n"

        # Find best config so far
        best_desc = ""
        if history:
            best_exp = min(
                [e for e in history if e.primary_metric is not None],
                key=lambda e: e.primary_metric,
                default=None,
            )
            if best_exp:
                best_desc = f"\n## Best Configuration So Far\n"
                best_desc += f"Metric: {best_exp.primary_metric}\n"
                best_desc += f"Config: {json.dumps(best_exp.config, indent=2)}\n"

        prompt = f"""You are an expert hyperparameter optimization agent for neural network training.

Research Goal: {self.program.goal}
Primary Metric: {self.program.primary_metric} (lower is better)

{search_space_desc}

{history_desc}{best_desc}

Based on the experiment history and search space, propose the NEXT hyperparameter configuration to try.

Your response MUST be valid JSON with the following structure:
{{
    "learning_rate": <float>,
    "batch_size": <int>,
    "lora_rank": <int>,
    "optimizer": <string>,
    "rationale": "<explanation of why these values should work better>"
}}

Respond ONLY with the JSON object, no additional text."""

        return prompt

    def _validate_and_clamp_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate config against search dimensions and clamp to bounds"""
        validated = {}

        for dim in self.program.search_dimensions:
            if dim.name not in config:
                logger.warning(
                    f"Claude did not provide {dim.name}, using current value"
                )
                validated[dim.name] = dim.current
                continue

            val = config[dim.name]

            if dim.type == "int":
                val = int(val)
                # Clamp to bounds
                val = max(int(dim.min_val), min(int(dim.max_val), val))
                validated[dim.name] = val

            elif dim.type == "float":
                val = float(val)
                # Clamp to bounds
                val = max(dim.min_val, min(dim.max_val, val))
                validated[dim.name] = val

            elif dim.type == "categorical":
                # Check if value is in options
                if val not in dim.options:
                    logger.warning(
                        f"Claude provided invalid categorical value {val} for {dim.name}, "
                        f"using first option {dim.options[0]}"
                    )
                    val = dim.options[0]
                validated[dim.name] = val

        return validated
