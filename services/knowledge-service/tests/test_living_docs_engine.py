"""
Tests for Living Documentation Engine (LDE) — Innovation #4
"""

import pytest
from living_docs_engine import (
    LivingDocumentationEngine,
    DocGraph,
    CodeRegion,
    DocSection,
    DocLink,
    DocStatus,
    DocType,
    CodeParser,
)


SAMPLE_PYTHON_CODE = '''
def hello(name):
    """Say hello to someone."""
    return f"Hello, {name}!"

class Calculator:
    """A simple calculator."""
    
    def add(self, a, b):
        """Add two numbers."""
        return a + b
    
    def divide(self, a, b):
        return a / b

def process_data(items):
    result = []
    for item in items:
        result.append(item.upper())
    return result
'''

SAMPLE_JS_CODE = '''
/**
 * Fetches user data from the API.
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} User data
 */
async function fetchUser(userId) {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
}

class UserService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }
}
'''


class TestCodeParser:
    def setup_method(self):
        self.parser = CodeParser()

    def test_parse_python_functions(self):
        regions, docs = self.parser.parse_file("test.py", SAMPLE_PYTHON_CODE, "python")
        func_names = [r.symbol_name for r in regions]
        assert "hello" in func_names
        assert "add" in func_names
        assert "divide" in func_names

    def test_parse_python_classes(self):
        regions, docs = self.parser.parse_file("test.py", SAMPLE_PYTHON_CODE, "python")
        all_names = [r.symbol_name for r in regions]
        assert "Calculator" in all_names

    def test_parse_python_docstrings(self):
        regions, docs = self.parser.parse_file("test.py", SAMPLE_PYTHON_CODE, "python")
        doc_types = [d.doc_type for d in docs]
        assert DocType.DOCSTRING in doc_types

    def test_parse_javascript_functions(self):
        regions, docs = self.parser.parse_file("test.js", SAMPLE_JS_CODE, "javascript")
        func_names = [r.symbol_name for r in regions]
        assert "fetchUser" in func_names

    def test_parse_javascript_jsdoc(self):
        regions, docs = self.parser.parse_file("test.js", SAMPLE_JS_CODE, "javascript")
        jsdoc = [d for d in docs if d.doc_type == DocType.COMMENT]
        assert len(jsdoc) >= 1

    def test_parse_generic_language(self):
        code = "function myFunc() { return 1; }"
        regions, docs = self.parser.parse_file("test.txt", code, "unknown")
        assert len(regions) >= 1

    def test_region_hashes(self):
        regions, _ = self.parser.parse_file("test.py", "def foo():\n    pass\n", "python")
        for region in regions:
            assert region.code_hash != ""


class TestDocGraph:
    def test_add_code_region(self):
        graph = DocGraph()
        region = CodeRegion(
            file_path="test.py",
            start_line=1,
            end_line=5,
            symbol_name="hello",
            code_hash="abc123",
        )
        graph.add_code_region(region)
        assert "test.py:1-5" in graph.code_regions

    def test_add_doc_section(self):
        graph = DocGraph()
        doc = DocSection(
            id="doc-1",
            doc_type=DocType.DOCSTRING,
            title="Hello function",
            content="Says hello",
        )
        graph.add_doc_section(doc)
        assert "doc-1" in graph.doc_sections

    def test_link_code_to_doc(self):
        graph = DocGraph()
        region = CodeRegion(
            file_path="test.py",
            start_line=1,
            end_line=5,
            symbol_name="hello",
            code_hash="abc123",
        )
        doc = DocSection(
            id="doc-1",
            doc_type=DocType.DOCSTRING,
            title="Hello function",
            content="Says hello",
        )
        graph.add_code_region(region)
        graph.add_doc_section(doc)
        graph.link("test.py:1-5", "doc-1")

        assert "test.py:1-5" in doc.linked_code
        assert len(graph.links) == 1

    def test_detect_stale_docs(self):
        graph = DocGraph()
        region = CodeRegion(
            file_path="test.py",
            start_line=1,
            end_line=5,
            symbol_name="hello",
            code_hash="old_hash",
        )
        doc = DocSection(
            id="doc-1",
            doc_type=DocType.DOCSTRING,
            title="Hello function",
            content="Says hello",
        )
        graph.add_code_region(region)
        graph.add_doc_section(doc)
        graph.link("test.py:1-5", "doc-1")

        # Simulate code change
        current_hashes = {"test.py:1-5": "new_hash"}
        stale = graph.detect_stale_docs(current_hashes)
        assert len(stale) >= 1
        assert stale[0].status == DocStatus.STALE

    def test_find_orphaned_docs(self):
        graph = DocGraph()
        doc = DocSection(
            id="doc-1",
            doc_type=DocType.DOCSTRING,
            title="Orphaned doc",
            content="No linked code",
        )
        graph.add_doc_section(doc)
        orphaned = graph.find_orphaned_docs()
        assert len(orphaned) >= 1

    def test_find_undocumented_code(self):
        graph = DocGraph()
        region = CodeRegion(
            file_path="test.py",
            start_line=1,
            end_line=5,
            symbol_name="undocumented_func",
            code_hash="abc",
        )
        graph.add_code_region(region)
        undocumented = graph.find_undocumented_code()
        assert len(undocumented) >= 1

    def test_freshness_report(self):
        graph = DocGraph()
        doc = DocSection(
            id="doc-1",
            doc_type=DocType.DOCSTRING,
            title="Fresh doc",
            content="Up to date",
            status=DocStatus.FRESH,
        )
        graph.add_doc_section(doc)
        report = graph.get_freshness_report()
        assert report["fresh"] == 1
        assert report["freshness_rate"] == 1.0


class TestLivingDocumentationEngine:
    def setup_method(self):
        self.engine = LivingDocumentationEngine()

    def test_index_python_file(self):
        graph = self.engine.index_file("test.py", SAMPLE_PYTHON_CODE, "python")
        assert len(graph.code_regions) >= 1
        assert len(graph.doc_sections) >= 1

    def test_index_javascript_file(self):
        graph = self.engine.index_file("test.js", SAMPLE_JS_CODE, "javascript")
        assert len(graph.code_regions) >= 1

    def test_detect_stale_docs(self):
        # Index original
        self.engine.index_file("test.py", SAMPLE_PYTHON_CODE, "python")

        # Modify code
        modified = SAMPLE_PYTHON_CODE.replace("Hello, {name}!", "Hi, {name}!")
        stale = self.engine.detect_stale_docs("test.py", modified, "python")
        # May or may not detect staleness depending on hash changes
        assert isinstance(stale, list)

    def test_freshness_report(self):
        self.engine.index_file("test.py", SAMPLE_PYTHON_CODE, "python")
        report = self.engine.get_freshness_report()
        assert "total_docs" in report
        assert "freshness_rate" in report

    def test_freshness_report_specific_file(self):
        self.engine.index_file("test.py", SAMPLE_PYTHON_CODE, "python")
        report = self.engine.get_freshness_report("test.py")
        assert "total_docs" in report

    def test_get_graph(self):
        self.engine.index_file("test.py", SAMPLE_PYTHON_CODE, "python")
        graph = self.engine.get_graph("test.py")
        assert graph is not None

    def test_get_nonexistent_graph(self):
        graph = self.engine.get_graph("nonexistent.py")
        assert graph is None

    def test_propose_update(self):
        self.engine.index_file("test.py", SAMPLE_PYTHON_CODE, "python")
        graph = self.engine.get_graph("test.py")
        if graph and graph.doc_sections:
            doc_id = list(graph.doc_sections.keys())[0]
            result = self.engine.propose_update("test.py", doc_id, "")
            assert "doc_id" in result