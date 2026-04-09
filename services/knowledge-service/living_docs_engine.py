"""
Living Documentation Engine (LDE) — Innovation #4

Documentation that evolves with the code. Maintains bidirectional links
between code and docs, detects stale documentation, and proposes updates.

Priority: P2 | Service: knowledge-service (port 8003)
"""

from __future__ import annotations

import hashlib
import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Tuple, Set
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class DocStatus(Enum):
    """Status of a documentation section."""
    FRESH = "fresh"           # Documentation is up-to-date
    STALE = "stale"           # Code changed but doc not updated
    MISSING = "missing"       # Code has no documentation
    ORPHANED = "orphaned"     # Documentation with no corresponding code


class DocType(Enum):
    """Types of documentation."""
    DOCSTRING = "docstring"
    README = "readme"
    COMMENT = "comment"
    API_DOC = "api_doc"
    TUTORIAL = "tutorial"
    CHANGELOG = "changelog"


@dataclass
class CodeRegion:
    """A region of code that is linked to documentation."""
    file_path: str
    start_line: int
    end_line: int
    symbol_name: str = ""
    code_hash: str = ""
    language: str = "python"

    @property
    def content_signature(self) -> str:
        return f"{self.file_path}:{self.start_line}-{self.end_line}"

    def to_dict(self) -> dict:
        return {
            "file_path": self.file_path,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "symbol_name": self.symbol_name,
            "code_hash": self.code_hash,
            "language": self.language,
        }


@dataclass
class DocSection:
    """A section of documentation linked to code."""
    id: str
    doc_type: DocType
    title: str
    content: str
    status: DocStatus = DocStatus.FRESH
    linked_code: List[str] = field(default_factory=list)  # CodeRegion signatures
    file_path: str = ""
    line_number: int = 0
    last_verified_at: float = 0.0
    staleness_score: float = 0.0  # 0.0 = fresh, 1.0 = very stale

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "doc_type": self.doc_type.value,
            "title": self.title,
            "content": self.content[:200],  # Truncate for API responses
            "status": self.status.value,
            "linked_code": self.linked_code,
            "file_path": self.file_path,
            "line_number": self.line_number,
            "staleness_score": round(self.staleness_score, 3),
        }


@dataclass
class DocLink:
    """A bidirectional link between code and documentation."""
    code_region: CodeRegion
    doc_section: DocSection
    strength: float = 1.0  # How strong the link is (0.0-1.0)
    created_at: float = field(default_factory=time.time)


class DocGraph:
    """The living documentation graph that maintains bidirectional code↔doc links.

    This is the core data structure for the LDE. It tracks:
    - Which code regions are documented
    - Which doc sections describe which code
    - When code changes, which docs are affected
    - Staleness scores for each doc section
    """

    def __init__(self) -> None:
        self.code_regions: Dict[str, CodeRegion] = {}
        self.doc_sections: Dict[str, DocSection] = {}
        self.links: List[DocLink] = []
        self._code_hashes: Dict[str, str] = {}  # region_sig -> hash

    def add_code_region(self, region: CodeRegion) -> None:
        """Add a code region to the graph."""
        sig = region.content_signature
        self.code_regions[sig] = region
        # Compute and store hash
        self._code_hashes[sig] = region.code_hash

    def add_doc_section(self, section: DocSection) -> None:
        """Add a documentation section to the graph."""
        self.doc_sections[section.id] = section

    def link(self, code_sig: str, doc_id: str, strength: float = 1.0) -> None:
        """Create a bidirectional link between code and doc."""
        if code_sig not in self.code_regions:
            logger.warning(f"Code region {code_sig} not found in graph")
            return
        if doc_id not in self.doc_sections:
            logger.warning(f"Doc section {doc_id} not found in graph")
            return

        link = DocLink(
            code_region=self.code_regions[code_sig],
            doc_section=self.doc_sections[doc_id],
            strength=strength,
        )
        self.links.append(link)

        # Update bidirectional references
        if code_sig not in self.doc_sections[doc_id].linked_code:
            self.doc_sections[doc_id].linked_code.append(code_sig)

    def detect_stale_docs(self, current_hashes: Dict[str, str]) -> List[DocSection]:
        """Detect documentation sections that are stale due to code changes.

        Args:
            current_hashes: Map of code region signatures to their current hashes

        Returns:
            List of doc sections that need updating
        """
        stale_sections = []

        for doc in self.doc_sections.values():
            if doc.status == DocStatus.MISSING:
                continue

            max_staleness = 0.0
            for code_sig in doc.linked_code:
                old_hash = self._code_hashes.get(code_sig)
                new_hash = current_hashes.get(code_sig)

                if old_hash and new_hash and old_hash != new_hash:
                    # Code has changed since doc was last verified
                    staleness = 1.0
                elif old_hash and not new_hash:
                    # Code region no longer exists
                    staleness = 1.0
                else:
                    staleness = 0.0

                max_staleness = max(max_staleness, staleness)

            doc.staleness_score = max_staleness

            if max_staleness > 0.5:
                doc.status = DocStatus.STALE
                stale_sections.append(doc)
            elif max_staleness > 0:
                doc.status = DocStatus.STALE
                stale_sections.append(doc)
            else:
                doc.status = DocStatus.FRESH

        return stale_sections

    def find_orphaned_docs(self) -> List[DocSection]:
        """Find documentation sections with no linked code."""
        return [
            doc for doc in self.doc_sections.values()
            if not doc.linked_code and doc.doc_type != DocType.README
        ]

    def find_undocumented_code(self) -> List[CodeRegion]:
        """Find code regions with no linked documentation."""
        documented_sigs = set()
        for link in self.links:
            documented_sigs.add(link.code_region.content_signature)

        return [
            region for sig, region in self.code_regions.items()
            if sig not in documented_sigs
        ]

    def get_freshness_report(self) -> dict:
        """Get an overall documentation freshness report."""
        total = len(self.doc_sections)
        fresh = sum(1 for d in self.doc_sections.values() if d.status == DocStatus.FRESH)
        stale = sum(1 for d in self.doc_sections.values() if d.status == DocStatus.STALE)
        missing = sum(1 for d in self.doc_sections.values() if d.status == DocStatus.MISSING)
        orphaned = len(self.find_orphaned_docs())
        undocumented = len(self.find_undocumented_code())

        return {
            "total_docs": total,
            "fresh": fresh,
            "stale": stale,
            "missing": missing,
            "orphaned": orphaned,
            "undocumented_regions": undocumented,
            "freshness_rate": fresh / total if total > 0 else 1.0,
            "links": len(self.links),
        }

    def to_dict(self) -> dict:
        return {
            "code_regions": {k: v.to_dict() for k, v in self.code_regions.items()},
            "doc_sections": {k: v.to_dict() for k, v in self.doc_sections.items()},
            "links_count": len(self.links),
        }


class CodeParser:
    """Parses code to extract documentable regions and existing documentation."""

    # Python patterns
    PY_FUNC_PATTERN = re.compile(r'^(\s*)def\s+(\w+)\s*\(', re.MULTILINE)
    PY_CLASS_PATTERN = re.compile(r'^(\s*)class\s+(\w+)', re.MULTILINE)
    PY_DOCSTRING_PATTERN = re.compile(r'("""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')', re.MULTILINE)

    # JavaScript patterns
    JS_FUNC_PATTERN = re.compile(r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z]+)\s*=>)', re.MULTILINE)
    JS_CLASS_PATTERN = re.compile(r'class\s+(\w+)', re.MULTILINE)
    JS_COMMENT_PATTERN = re.compile(r'/\*\*[\s\S]*?\*/', re.MULTILINE)

    def parse_file(
        self,
        file_path: str,
        code: str,
        language: str = "python",
    ) -> Tuple[List[CodeRegion], List[DocSection]]:
        """Parse a code file to extract documentable regions and existing docs.

        Returns:
            Tuple of (code_regions, doc_sections)
        """
        regions = []
        docs = []
        lines = code.split("\n")

        if language == "python":
            regions, docs = self._parse_python(file_path, code, lines)
        elif language in ("javascript", "typescript", "js", "ts"):
            regions, docs = self._parse_javascript(file_path, code, lines)
        else:
            # Generic: just find functions
            regions, docs = self._parse_generic(file_path, code, lines)

        # Compute hashes for each region
        for region in regions:
            region_lines = lines[region.start_line - 1:region.end_line]
            region.code_hash = hashlib.md5("\n".join(region_lines).encode()).hexdigest()

        return regions, docs

    def _parse_python(
        self,
        file_path: str,
        code: str,
        lines: List[str],
    ) -> Tuple[List[CodeRegion], List[DocSection]]:
        """Parse Python code for functions, classes, and docstrings."""
        regions = []
        docs = []

        # Find functions
        for match in self.PY_FUNC_PATTERN.finditer(code):
            name = match.group(2)
            line_num = code[:match.start()].count("\n") + 1
            # Find end of function (next def or class at same or lower indent)
            end_line = self._find_block_end(lines, line_num)
            regions.append(CodeRegion(
                file_path=file_path,
                start_line=line_num,
                end_line=end_line,
                symbol_name=name,
                language="python",
            ))

        # Find classes
        for match in self.PY_CLASS_PATTERN.finditer(code):
            name = match.group(2)
            line_num = code[:match.start()].count("\n") + 1
            end_line = self._find_block_end(lines, line_num)
            regions.append(CodeRegion(
                file_path=file_path,
                start_line=line_num,
                end_line=end_line,
                symbol_name=name,
                language="python",
            ))

        # Find docstrings
        for i, match in enumerate(self.PY_DOCSTRING_PATTERN.finditer(code)):
            content = match.group(1).strip('"\' \n')
            line_num = code[:match.start()].count("\n") + 1
            docs.append(DocSection(
                id=f"docstring-{i}",
                doc_type=DocType.DOCSTRING,
                title=f"Docstring at line {line_num}",
                content=content,
                file_path=file_path,
                line_number=line_num,
            ))

        return regions, docs

    def _parse_javascript(
        self,
        file_path: str,
        code: str,
        lines: List[str],
    ) -> Tuple[List[CodeRegion], List[DocSection]]:
        """Parse JavaScript/TypeScript code."""
        regions = []
        docs = []

        # Find functions
        for match in self.JS_FUNC_PATTERN.finditer(code):
            name = match.group(1) or match.group(2)
            line_num = code[:match.start()].count("\n") + 1
            end_line = min(line_num + 20, len(lines))
            regions.append(CodeRegion(
                file_path=file_path,
                start_line=line_num,
                end_line=end_line,
                symbol_name=name,
                language="javascript",
            ))

        # Find classes
        for match in self.JS_CLASS_PATTERN.finditer(code):
            name = match.group(1)
            line_num = code[:match.start()].count("\n") + 1
            end_line = min(line_num + 30, len(lines))
            regions.append(CodeRegion(
                file_path=file_path,
                start_line=line_num,
                end_line=end_line,
                symbol_name=name,
                language="javascript",
            ))

        # Find JSDoc comments
        for i, match in enumerate(self.JS_COMMENT_PATTERN.finditer(code)):
            content = match.group(0).strip("/* \n")
            line_num = code[:match.start()].count("\n") + 1
            docs.append(DocSection(
                id=f"jsdoc-{i}",
                doc_type=DocType.COMMENT,
                title=f"JSDoc at line {line_num}",
                content=content,
                file_path=file_path,
                line_number=line_num,
            ))

        return regions, docs

    def _parse_generic(
        self,
        file_path: str,
        code: str,
        lines: List[str],
    ) -> Tuple[List[CodeRegion], List[DocSection]]:
        """Generic parser for unknown languages."""
        regions = []
        docs = []

        # Find function-like patterns
        func_pattern = re.compile(r'(?:function|def|fn|func|sub)\s+(\w+)', re.IGNORECASE)
        for match in func_pattern.finditer(code):
            name = match.group(1)
            line_num = code[:match.start()].count("\n") + 1
            end_line = min(line_num + 15, len(lines))
            regions.append(CodeRegion(
                file_path=file_path,
                start_line=line_num,
                end_line=end_line,
                symbol_name=name,
                language="unknown",
            ))

        return regions, docs

    @staticmethod
    def _find_block_end(lines: List[str], start_line: int) -> int:
        """Find the end of a Python block by tracking indentation."""
        if start_line > len(lines):
            return start_line

        first_line = lines[start_line - 1]
        base_indent = len(first_line) - len(first_line.lstrip())

        for i in range(start_line, len(lines)):
            line = lines[i]
            if line.strip() == "":
                continue
            current_indent = len(line) - len(line.lstrip())
            if current_indent <= base_indent and line.strip():
                return i

        return len(lines)


class LivingDocumentationEngine:
    """High-level API for the Living Documentation Engine.

    Usage:
        engine = LivingDocumentationEngine()
        graph = engine.index_file("my_module.py", code, "python")
        report = engine.get_freshness_report()
        stale = engine.detect_stale_docs(current_hashes)
    """

    def __init__(self) -> None:
        self.parser = CodeParser()
        self._graphs: Dict[str, DocGraph] = {}

    def index_file(
        self,
        file_path: str,
        code: str,
        language: str = "python",
    ) -> DocGraph:
        """Index a code file and create a documentation graph.

        Args:
            file_path: Path to the file
            code: Source code content
            language: Programming language

        Returns:
            DocGraph with code regions and doc sections
        """
        regions, docs = self.parser.parse_file(file_path, code, language)

        graph = DocGraph()

        # Add code regions
        for region in regions:
            graph.add_code_region(region)

        # Add doc sections
        for doc in docs:
            graph.add_doc_section(doc)

        # Auto-link: link docstrings to the function/class they follow
        for doc in docs:
            for region in regions:
                if abs(doc.line_number - (region.start_line - 1)) <= 1:
                    graph.link(region.content_signature, doc.id)

        self._graphs[file_path] = graph
        logger.info(
            f"LDE: Indexed {file_path} — "
            f"{len(regions)} regions, {len(docs)} doc sections"
        )
        return graph

    def detect_stale_docs(
        self,
        file_path: str,
        current_code: str,
        language: str = "python",
    ) -> List[DocSection]:
        """Detect documentation that is stale due to code changes.

        Args:
            file_path: Path to the file
            current_code: Current source code content
            language: Programming language

        Returns:
            List of stale doc sections
        """
        if file_path not in self._graphs:
            # File not previously indexed — index it first
            self.index_file(file_path, current_code, language)
            return []

        # Compute current hashes
        current_regions, _ = self.parser.parse_file(file_path, current_code, language)
        current_hashes = {
            r.content_signature: r.code_hash for r in current_regions
        }

        return self._graphs[file_path].detect_stale_docs(current_hashes)

    def get_freshness_report(self, file_path: str = "") -> dict:
        """Get a documentation freshness report.

        Args:
            file_path: Optional specific file path. If empty, returns overall report.

        Returns:
            Freshness report dictionary
        """
        if file_path and file_path in self._graphs:
            return self._graphs[file_path].get_freshness_report()

        # Overall report
        total_docs = 0
        total_fresh = 0
        total_stale = 0
        total_missing = 0
        total_orphaned = 0
        total_undocumented = 0

        for graph in self._graphs.values():
            report = graph.get_freshness_report()
            total_docs += report["total_docs"]
            total_fresh += report["fresh"]
            total_stale += report["stale"]
            total_missing += report["missing"]
            total_orphaned += report["orphaned"]
            total_undocumented += report["undocumented_regions"]

        return {
            "total_docs": total_docs,
            "fresh": total_fresh,
            "stale": total_stale,
            "missing": total_missing,
            "orphaned": total_orphaned,
            "undocumented_regions": total_undocumented,
            "freshness_rate": total_fresh / total_docs if total_docs > 0 else 1.0,
            "files_indexed": len(self._graphs),
        }

    def get_graph(self, file_path: str) -> Optional[DocGraph]:
        """Retrieve a stored documentation graph."""
        return self._graphs.get(file_path)

    def propose_update(
        self,
        file_path: str,
        doc_id: str,
        current_code: str,
        language: str = "python",
    ) -> dict:
        """Propose an update for a stale documentation section.

        Args:
            file_path: Path to the file
            doc_id: ID of the stale doc section
            current_code: Current source code
            language: Programming language

        Returns:
            Proposed update with old and new content
        """
        graph = self._graphs.get(file_path)
        if not graph:
            return {"error": f"File {file_path} not indexed"}

        doc = graph.doc_sections.get(doc_id)
        if not doc:
            return {"error": f"Doc section {doc_id} not found"}

        # Find linked code regions
        linked_regions = []
        for sig in doc.linked_code:
            region = graph.code_regions.get(sig)
            if region:
                linked_regions.append(region.to_dict())

        return {
            "doc_id": doc_id,
            "current_content": doc.content,
            "status": doc.status.value,
            "staleness_score": doc.staleness_score,
            "linked_code_regions": linked_regions,
            "suggestion": f"Update documentation for: {doc.title}",
        }