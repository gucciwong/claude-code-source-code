"""
Tests for Intent-to-Code Pipeline (I2CP) — Innovation #1
"""

import pytest
from intent_pipeline import (
    IntentExtractor,
    IntentValidator,
    IntentPipeline,
    IntentGraph,
    IntentNode,
    CodeBlock,
    IntentType,
    IntentStatus,
)


class TestIntentExtractor:
    def setup_method(self):
        self.extractor = IntentExtractor()

    def test_extract_functional_intent(self):
        graph = self.extractor.extract("Create a user authentication system")
        assert len(graph.nodes) >= 1
        functional_nodes = [n for n in graph.nodes.values()
                           if n.intent_type == IntentType.FUNCTIONAL]
        assert len(functional_nodes) >= 1

    def test_extract_constraint_intent(self):
        graph = self.extractor.extract("Build a login that must be secure and handle errors")
        assert len(graph.nodes) >= 1

    def test_extract_security_intent(self):
        graph = self.extractor.extract("Implement secure password hashing with encryption")
        security_nodes = [n for n in graph.nodes.values()
                         if n.intent_type == IntentType.SECURITY]
        assert len(security_nodes) >= 1

    def test_extract_performance_intent(self):
        graph = self.extractor.extract("Create a fast API endpoint that handles 1000 requests per second")
        perf_nodes = [n for n in graph.nodes.values()
                      if n.intent_type == IntentType.PERFORMANCE]
        assert len(perf_nodes) >= 1

    def test_extract_empty_prompt_creates_root(self):
        graph = self.extractor.extract("xyzzy foobar baz")
        assert len(graph.nodes) >= 1  # Should create a root intent

    def test_extract_multiple_intents(self):
        graph = self.extractor.extract(
            "Create a fast, secure login endpoint that must validate input"
        )
        assert len(graph.nodes) >= 2

    def test_graph_has_unique_ids(self):
        graph = self.extractor.extract("Create a function that processes data")
        ids = [n.id for n in graph.nodes.values()]
        assert len(ids) == len(set(ids))


class TestIntentValidator:
    def setup_method(self):
        self.validator = IntentValidator()

    def test_validate_satisfied_intent(self):
        graph = IntentGraph(id="test", prompt="Create a login function")
        node = IntentNode(
            id="intent-1",
            description="login function",
            intent_type=IntentType.FUNCTIONAL,
        )
        graph.add_node(node)

        block = CodeBlock(
            id="block-1",
            code="def login(username, password):\n    return authenticate(username, password)",
            satisfies=["intent-1"],
        )

        result = self.validator.validate(graph, [block])
        assert result.nodes["intent-1"].status == IntentStatus.SATISFIED

    def test_validate_unsatisfied_intent(self):
        graph = IntentGraph(id="test", prompt="Create a secure encryption module")
        node = IntentNode(
            id="intent-1",
            description="secure encryption module",
            intent_type=IntentType.SECURITY,
        )
        graph.add_node(node)

        block = CodeBlock(
            id="block-1",
            code="x = 1 + 1",
            satisfies=[],
        )

        result = self.validator.validate(graph, [block])
        # Should be unsatisfied or partially satisfied
        assert result.nodes["intent-1"].status in (
            IntentStatus.UNSATISFIED,
            IntentStatus.PARTIALLY_SATISFIED,
        )

    def test_validate_security_keywords(self):
        graph = IntentGraph(id="test", prompt="Validate and sanitize input")
        node = IntentNode(
            id="intent-1",
            description="validate and sanitize input",
            intent_type=IntentType.SECURITY,
        )
        graph.add_node(node)

        block = CodeBlock(
            id="block-1",
            code="def sanitize(data):\n    return validate(escape(data))",
            satisfies=[],
        )

        result = self.validator.validate(graph, [block])
        assert result.nodes["intent-1"].status in (
            IntentStatus.SATISFIED,
            IntentStatus.PARTIALLY_SATISFIED,
        )


class TestIntentPipeline:
    def setup_method(self):
        self.pipeline = IntentPipeline()

    def test_extract_and_validate(self):
        # Extract
        graph = self.pipeline.extract_intent(
            "Create a fast, secure login endpoint"
        )
        assert len(graph.nodes) >= 1

        # Validate
        result = self.pipeline.validate_code(
            graph_id=graph.id,
            code="def login(user, pwd):\n    return authenticate(user, sanitize(pwd))",
            language="python",
        )
        report = self.pipeline.get_satisfaction_report(graph.id)
        assert "total_intents" in report
        assert report["total_intents"] >= 1

    def test_search_by_intent(self):
        graph1 = self.pipeline.extract_intent("Create a database query optimizer")
        graph2 = self.pipeline.extract_intent("Build a user interface component")

        results = self.pipeline.search_by_intent("database")
        assert len(results) >= 1

    def test_get_nonexistent_graph(self):
        result = self.pipeline.get_graph("nonexistent")
        assert result is None

    def test_validate_nonexistent_graph(self):
        with pytest.raises(ValueError):
            self.pipeline.validate_code(
                graph_id="nonexistent",
                code="x = 1",
            )

    def test_satisfaction_report_structure(self):
        graph = self.pipeline.extract_intent("Create a function")
        report = self.pipeline.get_satisfaction_report(graph.id)
        assert "graph_id" in report
        assert "total_intents" in report
        assert "satisfied" in report
        assert "satisfaction_rate" in report


class TestIntentGraph:
    def test_add_node(self):
        graph = IntentGraph(id="test", prompt="test")
        node = IntentNode(
            id="n1",
            description="test node",
            intent_type=IntentType.FUNCTIONAL,
        )
        graph.add_node(node)
        assert "n1" in graph.nodes

    def test_add_code_block(self):
        graph = IntentGraph(id="test", prompt="test")
        node = IntentNode(
            id="n1",
            description="test node",
            intent_type=IntentType.FUNCTIONAL,
        )
        graph.add_node(node)

        block = CodeBlock(
            id="b1",
            code="def test(): pass",
            satisfies=["n1"],
        )
        graph.add_code_block(block)
        assert "b1" in graph.code_blocks
        assert "b1" in graph.nodes["n1"].satisfied_by

    def test_get_unsatisfied_intents(self):
        graph = IntentGraph(id="test", prompt="test")
        node1 = IntentNode(
            id="n1",
            description="satisfied",
            intent_type=IntentType.FUNCTIONAL,
            status=IntentStatus.SATISFIED,
        )
        node2 = IntentNode(
            id="n2",
            description="pending",
            intent_type=IntentType.FUNCTIONAL,
            status=IntentStatus.PENDING,
        )
        graph.add_node(node1)
        graph.add_node(node2)

        unsatisfied = graph.get_unsatisfied_intents()
        assert len(unsatisfied) == 1
        assert unsatisfied[0].id == "n2"

    def test_to_dict(self):
        graph = IntentGraph(id="test", prompt="test prompt")
        node = IntentNode(
            id="n1",
            description="test node",
            intent_type=IntentType.FUNCTIONAL,
        )
        graph.add_node(node)

        d = graph.to_dict()
        assert d["id"] == "test"
        assert d["prompt"] == "test prompt"
        assert "n1" in d["nodes"]