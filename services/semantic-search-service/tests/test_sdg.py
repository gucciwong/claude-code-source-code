"""
Tests for Semantic Dependency Graph (SDG) — Innovation #7
"""

import pytest
from search.semantic_dep_graph import (
    SemanticDependencyGraph,
    DependencyNode,
    DependencyEdge,
    DependencyType,
    ImpactLevel,
)


SAMPLE_PYTHON = '''
import os
from typing import List, Optional

class BaseService:
    """Base service class."""
    def process(self, data):
        return data

class UserService(BaseService):
    """User service that extends BaseService."""
    
    def get_user(self, user_id: str) -> dict:
        result = self.query_db(user_id)
        return self.process(result)
    
    def query_db(self, user_id: str):
        return {"id": user_id, "name": "Test"}

def create_service() -> UserService:
    return UserService()
'''

SAMPLE_JS = '''
import { fetchApi } from './api';
import { Logger } from './logger';

class AuthService extends BaseService {
    async login(credentials) {
        const user = await fetchApi('/auth/login', credentials);
        return user;
    }
}

function createAuthService() {
    return new AuthService();
}
'''


class TestSemanticDependencyGraph:
    def setup_method(self):
        self.graph = SemanticDependencyGraph()

    def test_index_python_file(self):
        nodes = self.graph.index_file("service.py", SAMPLE_PYTHON, "python")
        assert len(nodes) >= 1
        assert self.graph.get_stats()["total_nodes"] >= 1

    def test_index_javascript_file(self):
        nodes = self.graph.index_file("auth.js", SAMPLE_JS, "javascript")
        assert len(nodes) >= 1

    def test_import_dependencies(self):
        self.graph.index_file("service.py", SAMPLE_PYTHON, "python")
        deps = self.graph.get_dependencies("service.py", DependencyType.IMPORT)
        assert len(deps) >= 1

    def test_behavioral_dependencies(self):
        self.graph.index_file("service.py", SAMPLE_PYTHON, "python")
        # UserService extends BaseService — should have behavioral dependency
        behavioral = self.graph.get_dependencies("service.py", DependencyType.BEHAVIORAL)
        assert len(behavioral) >= 1

    def test_compute_impact(self):
        self.graph.index_file("service.py", SAMPLE_PYTHON, "python")
        self.graph.index_file("consumer.py", "from service import UserService\nu = UserService()", "python")
        report = self.graph.compute_impact("service.py", ["UserService"])
        assert report.changed_file == "service.py"
        assert isinstance(report.impacted_files, list)

    def test_compute_impact_no_dependents(self):
        self.graph.index_file("standalone.py", "x = 1\ny = 2\n", "python")
        report = self.graph.compute_impact("standalone.py")
        assert report.impact_level in (ImpactLevel.LOW, ImpactLevel.MEDIUM)

    def test_get_dependents(self):
        self.graph.index_file("service.py", SAMPLE_PYTHON, "python")
        dependents = self.graph.get_dependents("service.py")
        assert isinstance(dependents, list)

    def test_get_stats(self):
        self.graph.index_file("service.py", SAMPLE_PYTHON, "python")
        stats = self.graph.get_stats()
        assert "total_nodes" in stats
        assert "total_edges" in stats
        assert "files_indexed" in stats

    def test_add_custom_node(self):
        node = DependencyNode(
            id="custom-1",
            file_path="custom.py",
            symbol_name="CustomClass",
            node_type="class",
        )
        self.graph.add_node(node)
        assert "custom-1" in self.graph.nodes

    def test_add_custom_edge(self):
        n1 = DependencyNode(id="n1", file_path="a.py", symbol_name="A")
        n2 = DependencyNode(id="n2", file_path="b.py", symbol_name="B")
        self.graph.add_node(n1)
        self.graph.add_node(n2)
        edge = DependencyEdge(
            source_id="n1",
            target_id="n2",
            dep_type=DependencyType.DATA_FLOW,
            description="A sends data to B",
        )
        self.graph.add_edge(edge)
        assert len(self.graph.edges) == 1

    def test_generic_language_indexing(self):
        nodes = self.graph.index_file("test.txt", "some code", "unknown")
        assert len(nodes) >= 1

    def test_impact_report_to_dict(self):
        self.graph.index_file("service.py", SAMPLE_PYTHON, "python")
        report = self.graph.compute_impact("service.py")
        d = report.to_dict()
        assert "changed_file" in d
        assert "impact_level" in d


class TestDependencyTypes:
    def test_all_dependency_types(self):
        types = list(DependencyType)
        assert len(types) == 6

    def test_dependency_type_values(self):
        assert DependencyType.IMPORT.value == "import"
        assert DependencyType.DATA_FLOW.value == "data_flow"
        assert DependencyType.BEHAVIORAL.value == "behavioral"

    def test_impact_levels(self):
        assert ImpactLevel.LOW.value == "low"
        assert ImpactLevel.CRITICAL.value == "critical"
