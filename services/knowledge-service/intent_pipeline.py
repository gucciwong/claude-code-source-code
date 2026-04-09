"""
Intent-to-Code Pipeline (I2CP) — Innovation #1

A bidirectional intent layer between the user and the model.
Generates an Intent Graph from user prompts, validates generated code
against intent nodes, and tracks satisfaction status.

Priority: P1 | Service: knowledge-service (port 8003)
"""

from __future__ import annotations

import json
import re
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class IntentStatus(Enum):
    """Status of an intent node."""
    PENDING = "pending"
    SATISFIED = "satisfied"
    PARTIALLY_SATISFIED = "partially_satisfied"
    UNSATISFIED = "unsatisfied"
    CONFLICTING = "conflicting"


class IntentType(Enum):
    """Types of intent nodes."""
    FUNCTIONAL = "functional"       # What the code should do
    CONSTRAINT = "constraint"        # Limitations and requirements
    PERFORMANCE = "performance"      # Speed/memory requirements
    SECURITY = "security"           # Security requirements
    USABILITY = "usability"         # UX requirements
    MAINTAINABILITY = "maintainability"  # Code quality requirements


@dataclass
class IntentNode:
    """A single intent in the Intent Graph."""
    id: str
    description: str
    intent_type: IntentType
    status: IntentStatus = IntentStatus.PENDING
    priority: int = 5  # 1-10, higher = more important
    constraints: List[str] = field(default_factory=list)
    success_criteria: List[str] = field(default_factory=list)
    satisfied_by: List[str] = field(default_factory=list)  # Code block IDs
    parent_id: Optional[str] = None
    children: List[str] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "description": self.description,
            "intent_type": self.intent_type.value,
            "status": self.status.value,
            "priority": self.priority,
            "constraints": self.constraints,
            "success_criteria": self.success_criteria,
            "satisfied_by": self.satisfied_by,
            "parent_id": self.parent_id,
            "children": self.children,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


@dataclass
class CodeBlock:
    """A generated code block mapped to intent nodes."""
    id: str
    code: str
    language: str = "python"
    satisfies: List[str] = field(default_factory=list)  # Intent node IDs
    file_path: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None


@dataclass
class IntentGraph:
    """The complete intent graph for a coding session."""
    id: str
    prompt: str
    nodes: Dict[str, IntentNode] = field(default_factory=dict)
    code_blocks: Dict[str, CodeBlock] = field(default_factory=dict)
    version: int = 1
    created_at: float = field(default_factory=time.time)

    def add_node(self, node: IntentNode) -> None:
        self.nodes[node.id] = node
        if node.parent_id and node.parent_id in self.nodes:
            self.nodes[node.parent_id].children.append(node.id)

    def add_code_block(self, block: CodeBlock) -> None:
        self.code_blocks[block.id] = block
        for intent_id in block.satisfies:
            if intent_id in self.nodes:
                self.nodes[intent_id].satisfied_by.append(block.id)

    def get_unsatisfied_intents(self) -> List[IntentNode]:
        return [n for n in self.nodes.values()
                if n.status in (IntentStatus.PENDING, IntentStatus.UNSATISFIED)]

    def get_satisfaction_report(self) -> dict:
        total = len(self.nodes)
        satisfied = sum(1 for n in self.nodes.values()
                       if n.status == IntentStatus.SATISFIED)
        partially = sum(1 for n in self.nodes.values()
                        if n.status == IntentStatus.PARTIALLY_SATISFIED)
        unsatisfied = sum(1 for n in self.nodes.values()
                         if n.status == IntentStatus.UNSATISFIED)
        pending = sum(1 for n in self.nodes.values()
                      if n.status == IntentStatus.PENDING)

        return {
            "graph_id": self.id,
            "total_intents": total,
            "satisfied": satisfied,
            "partially_satisfied": partially,
            "unsatisfied": unsatisfied,
            "pending": pending,
            "satisfaction_rate": satisfied / total if total > 0 else 0.0,
            "version": self.version,
        }

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "prompt": self.prompt,
            "nodes": {k: v.to_dict() for k, v in self.nodes.items()},
            "code_blocks": {k: {
                "id": v.id, "code": v.code, "language": v.language,
                "satisfies": v.satisfies, "file_path": v.file_path,
                "line_start": v.line_start, "line_end": v.line_end,
            } for k, v in self.code_blocks.items()},
            "version": self.version,
            "created_at": self.created_at,
        }


class IntentExtractor:
    """Extracts intent nodes from a natural language prompt.

    Uses heuristic pattern matching to identify:
    - Functional requirements (what to do)
    - Constraints (limitations, requirements)
    - Performance requirements
    - Security requirements
    """

    # Patterns that signal different intent types
    FUNCTIONAL_PATTERNS = [
        r"(?:create|build|implement|add|write|develop|make|generate)\s+(?:a\s+|an\s+)?(.+?)(?:\.|$|that|which|so)",
        r"(?:should|must|needs?\s+to)\s+(.+?)(?:\.|$|,|and)",
        r"(?:i\s+want|we\s+need|the\s+goal)\s+(?:is\s+)?(?:to\s+)?(.+?)(?:\.|$)",
    ]

    CONSTRAINT_PATTERNS = [
        r"(?:must|should|has\s+to|needs?\s+to)\s+(?:be|have|use|support|handle)\s+(.+?)(?:\.|$|,|and)",
        r"(?:without|don'?t|never|avoid)\s+(.+?)(?:\.|$|,|and)",
        r"(?:only|exclusively|specifically)\s+(.+?)(?:\.|$|,|and)",
    ]

    PERFORMANCE_PATTERNS = [
        r"(?:fast|performant|efficient|quick|responsive|scalable|optimize)\s*(.+?)(?:\.|$|,|and)",
        r"(?:under|within|less\s+than|below)\s+\d+\s*(?:ms|seconds?|s)\b(.+?)(?:\.|$|,|and)",
        r"(?:handle|support|process)\s+\d+\s*(?:requests?|users?|items?|per\s+second)(.+?)(?:\.|$|,|and)",
    ]

    SECURITY_PATTERNS = [
        r"(?:secure|encrypt|auth(?:enticate|orize)?|validate|sanitize|escape|protect)\s*(.+?)(?:\.|$|,|and)",
        r"(?:no\s+(?:plain|raw|unencrypted|unhashed)\s+\w+)",
        r"(?:compliant|conform|follow)\s+(?:with\s+)?(?:OWASP|PCI|HIPAA|GDPR|SOC2?)(.+?)(?:\.|$|,|and)",
    ]

    def extract(self, prompt: str) -> IntentGraph:
        """Extract an Intent Graph from a user prompt.

        Args:
            prompt: The user's natural language description of what they want

        Returns:
            An IntentGraph with extracted intent nodes
        """
        graph_id = str(uuid.uuid4())[:8]
        graph = IntentGraph(id=graph_id, prompt=prompt)

        # Extract functional intents
        for pattern in self.FUNCTIONAL_PATTERNS:
            for match in re.finditer(pattern, prompt, re.IGNORECASE):
                description = match.group(1).strip()
                if description:
                    node = IntentNode(
                        id=f"intent-{uuid.uuid4().hex[:8]}",
                        description=description,
                        intent_type=IntentType.FUNCTIONAL,
                        priority=7,
                    )
                    graph.add_node(node)

        # Extract constraints
        for pattern in self.CONSTRAINT_PATTERNS:
            for match in re.finditer(pattern, prompt, re.IGNORECASE):
                description = match.group(1).strip()
                if description:
                    node = IntentNode(
                        id=f"constraint-{uuid.uuid4().hex[:8]}",
                        description=description,
                        intent_type=IntentType.CONSTRAINT,
                        priority=8,
                    )
                    graph.add_node(node)

        # Extract performance intents
        for pattern in self.PERFORMANCE_PATTERNS:
            for match in re.finditer(pattern, prompt, re.IGNORECASE):
                description = match.group(0).strip()
                if description:
                    node = IntentNode(
                        id=f"perf-{uuid.uuid4().hex[:8]}",
                        description=description,
                        intent_type=IntentType.PERFORMANCE,
                        priority=6,
                    )
                    graph.add_node(node)

        # Extract security intents
        for pattern in self.SECURITY_PATTERNS:
            for match in re.finditer(pattern, prompt, re.IGNORECASE):
                description = match.group(0).strip()
                if description:
                    node = IntentNode(
                        id=f"sec-{uuid.uuid4().hex[:8]}",
                        description=description,
                        intent_type=IntentType.SECURITY,
                        priority=9,
                    )
                    graph.add_node(node)

        # If no intents were extracted, create a single root intent from the full prompt
        if not graph.nodes:
            node = IntentNode(
                id=f"root-{uuid.uuid4().hex[:8]}",
                description=prompt[:200],
                intent_type=IntentType.FUNCTIONAL,
                priority=5,
            )
            graph.add_node(node)

        logger.info(f"I2CP: Extracted {len(graph.nodes)} intent nodes from prompt")
        return graph


class IntentValidator:
    """Validates generated code against an Intent Graph.

    Checks whether each intent node is satisfied by the generated code.
    """

    # Keywords that indicate code satisfies certain intent types
    SATISFACTION_KEYWORDS: Dict[IntentType, List[str]] = {
        IntentType.FUNCTIONAL: [
            "def ", "class ", "function ", "async def ",
            "return ", "yield ", "raise ",
        ],
        IntentType.CONSTRAINT: [
            "if ", "assert ", "validate", "check", "guard",
            "max_length", "min_length", "limit",
        ],
        IntentType.PERFORMANCE: [
            "cache", "memoize", "lazy", "async", "batch",
            "index", "optimize", "efficient",
        ],
        IntentType.SECURITY: [
            "sanitize", "escape", "encrypt", "hash", "verify",
            "validate", "auth", "token", "csrf", "xss",
        ],
    }

    def validate(
        self,
        graph: IntentGraph,
        code_blocks: List[CodeBlock],
    ) -> IntentGraph:
        """Validate code blocks against intent nodes.

        Args:
            graph: The intent graph to validate against
            code_blocks: Generated code blocks to check

        Returns:
            Updated IntentGraph with satisfaction statuses
        """
        # Add code blocks to graph
        for block in code_blocks:
            graph.add_code_block(block)

        # Check each intent node
        for node in graph.nodes.values():
            if node.satisfied_by:
                # Explicitly linked code blocks
                node.status = IntentStatus.SATISFIED
            else:
                # Heuristic check: does any code block seem to satisfy this intent?
                node.status = self._check_satisfaction(node, code_blocks)

            node.updated_at = time.time()

        graph.version += 1
        logger.info(
            f"I2CP: Validation complete - "
            f"{sum(1 for n in graph.nodes.values() if n.status == IntentStatus.SATISFIED)}/{len(graph.nodes)} satisfied"
        )
        return graph

    def _check_satisfaction(
        self,
        node: IntentNode,
        code_blocks: List[CodeBlock],
    ) -> IntentStatus:
        """Heuristic check for whether code satisfies an intent."""
        keywords = self.SATISFACTION_KEYWORDS.get(node.intent_type, [])
        all_code = "\n".join(b.code for b in code_blocks).lower()
        desc_lower = node.description.lower()

        # Check if any code block explicitly references the intent
        for block in code_blocks:
            # Check if intent description keywords appear in code
            desc_words = [w for w in desc_lower.split() if len(w) > 3]
            matching_words = sum(1 for w in desc_words if w in block.code.lower())
            if matching_words >= len(desc_words) * 0.5 and len(desc_words) > 0:
                return IntentStatus.SATISFIED

        # Check if code has patterns matching the intent type
        keyword_matches = sum(1 for kw in keywords if kw in all_code)
        if keyword_matches >= 2:
            return IntentStatus.PARTIALLY_SATISFIED
        if keyword_matches >= 1:
            return IntentStatus.PARTIALLY_SATISFIED

        return IntentStatus.UNSATISFIED


class IntentPipeline:
    """High-level API for the Intent-to-Code Pipeline.

    Usage:
        pipeline = IntentPipeline()
        graph = pipeline.extract_intent("Create a fast, secure login endpoint")
        blocks = pipeline.generate_code_mapping(graph, generated_code)
        report = pipeline.get_satisfaction_report(graph)
    """

    def __init__(self) -> None:
        self.extractor = IntentExtractor()
        self.validator = IntentValidator()
        self._graphs: Dict[str, IntentGraph] = {}

    def extract_intent(self, prompt: str) -> IntentGraph:
        """Extract an Intent Graph from a user prompt."""
        graph = self.extractor.extract(prompt)
        self._graphs[graph.id] = graph
        return graph

    def validate_code(
        self,
        graph_id: str,
        code: str,
        language: str = "python",
        file_path: Optional[str] = None,
    ) -> IntentGraph:
        """Validate generated code against an intent graph.

        Args:
            graph_id: ID of the intent graph
            code: Generated code to validate
            language: Programming language
            file_path: Optional file path for the code

        Returns:
            Updated IntentGraph with satisfaction statuses
        """
        if graph_id not in self._graphs:
            raise ValueError(f"Intent graph {graph_id} not found")

        graph = self._graphs[graph_id]

        # Create a code block that satisfies all pending intents
        pending_ids = [
            n.id for n in graph.nodes.values()
            if n.status == IntentStatus.PENDING
        ]
        block = CodeBlock(
            id=f"block-{uuid.uuid4().hex[:8]}",
            code=code,
            language=language,
            satisfies=pending_ids,
            file_path=file_path,
        )

        graph = self.validator.validate(graph, [block])
        self._graphs[graph_id] = graph
        return graph

    def get_graph(self, graph_id: str) -> Optional[IntentGraph]:
        """Retrieve a stored intent graph."""
        return self._graphs.get(graph_id)

    def get_satisfaction_report(self, graph_id: str) -> dict:
        """Get a satisfaction report for an intent graph."""
        graph = self._graphs.get(graph_id)
        if not graph:
            raise ValueError(f"Intent graph {graph_id} not found")
        return graph.get_satisfaction_report()

    def search_by_intent(self, query: str) -> List[IntentGraph]:
        """Search for intent graphs matching a query.

        Args:
            query: Natural language intent query

        Returns:
            List of matching intent graphs
        """
        query_lower = query.lower()
        results = []
        for graph in self._graphs.values():
            for node in graph.nodes.values():
                if query_lower in node.description.lower():
                    results.append(graph)
                    break
        return results