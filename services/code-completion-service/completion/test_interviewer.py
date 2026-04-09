"""
Conversational Test Generation (CTG) — Innovation #6

A conversational test generator that interviews the user about what matters,
then generates tests that match the user's intent, not just code coverage.

Priority: P2 | Service: code-completion-service (port 8007)
"""

from __future__ import annotations

import re
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Set
import logging

logger = logging.getLogger(__name__)


class QuestionType(Enum):
    """Types of interview questions."""
    EDGE_CASE = "edge_case"               # What happens at boundaries?
    INVARIANT = "invariant"               # What should always be true?
    ERROR_HANDLING = "error_handling"       # What errors should be handled?
    BEHAVIOR = "behavior"                  # What should this do?
    PERFORMANCE = "performance"             # What are the performance expectations?
    SECURITY = "security"                  # What security constraints exist?
    INPUT_VALIDATION = "input_validation"  # What inputs are valid/invalid?


class AnswerType(Enum):
    """Types of answers."""
    YES_NO = "yes_no"
    TEXT = "text"
    CHOICE = "choice"
    MULTI_CHOICE = "multi_choice"
    CODE_EXAMPLE = "code_example"


@dataclass
class InterviewQuestion:
    """A question in the test interview."""
    id: str
    question_type: QuestionType
    question: str
    answer_type: AnswerType
    choices: List[str] = field(default_factory=list)
    context: str = ""
    priority: int = 5  # 1-10, higher = more important


@dataclass
class InterviewAnswer:
    """An answer to an interview question."""
    question_id: str
    answer: str
    additional_context: str = ""


@dataclass
class TestSpec:
    """A specification for a test to be generated."""
    id: str
    name: str
    description: str
    test_type: str  # unit, integration, edge_case, error_handling
    function_name: str = ""
    inputs: Dict = field(default_factory=dict)
    expected_behavior: str = ""
    assertions: List[str] = field(default_factory=list)
    priority: int = 5


@dataclass
class InterviewSession:
    """A complete interview session for test generation."""
    id: str
    code: str
    language: str
    function_name: str = ""
    questions: List[InterviewQuestion] = field(default_factory=list)
    answers: List[InterviewAnswer] = field(default_factory=list)
    test_specs: List[TestSpec] = field(default_factory=list)
    status: str = "pending"  # pending, in_progress, completed
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "function_name": self.function_name,
            "language": self.language,
            "status": self.status,
            "questions_count": len(self.questions),
            "answers_count": len(self.answers),
            "test_specs_count": len(self.test_specs),
            "created_at": self.created_at,
        }


class TestInterviewer:
    """Conducts a conversational interview to generate meaningful tests.

    Instead of "generate tests for this function," it asks:
    "What should happen if the input is negative?"
    "Should this ever return null?"
    "What's the maximum input size?"

    Then generates tests that match the user's intent.
    """

    # Question templates organized by type
    QUESTION_TEMPLATES: Dict[QuestionType, List[str]] = {
        QuestionType.EDGE_CASE: [
            "What should happen when {name} receives an empty input?",
            "What should happen when {name} receives a very large input (e.g., 10,000+ items)?",
            "What should happen when {name} receives a negative value?",
            "What should happen when {name} receives zero?",
            "What should happen when {name} receives None/null?",
            "What should happen when {name} receives duplicate values?",
        ],
        QuestionType.INVARIANT: [
            "What should always be true about the return value of {name}?",
            "What should never happen when {name} is called?",
            "Are there any conditions where {name} must always return the same result?",
        ],
        QuestionType.ERROR_HANDLING: [
            "What errors should {name} raise and when?",
            "Should {name} silently handle invalid input or raise an error?",
            "What should happen if a dependency of {name} fails?",
        ],
        QuestionType.BEHAVIOR: [
            "What is the primary purpose of {name}?",
            "What are the expected inputs and outputs of {name}?",
            "Are there any side effects of calling {name}?",
        ],
        QuestionType.PERFORMANCE: [
            "What is the maximum acceptable execution time for {name}?",
            "How should {name} handle concurrent calls?",
            "What is the expected input size range for {name}?",
        ],
        QuestionType.SECURITY: [
            "Should {name} validate or sanitize its inputs?",
            "Are there any security constraints on {name}'s behavior?",
            "Should {name} limit access based on permissions?",
        ],
        QuestionType.INPUT_VALIDATION: [
            "What types of input should {name} accept?",
            "What types of input should {name} reject?",
            "Should {name} coerce input types (e.g., string to int)?",
        ],
    }

    def __init__(self) -> None:
        self._sessions: Dict[str, InterviewSession] = {}

    def start_interview(
        self,
        code: str,
        language: str = "python",
        function_name: str = "",
    ) -> InterviewSession:
        """Start a new test interview session.

        Args:
            code: The code to generate tests for
            language: Programming language
            function_name: Optional specific function to focus on

        Returns:
            InterviewSession with generated questions
        """
        session_id = f"interview-{uuid.uuid4().hex[:8]}"

        # Extract function name if not provided
        if not function_name:
            function_name = self._extract_function_name(code, language)

        # Generate questions based on code analysis
        questions = self._generate_questions(code, language, function_name)

        session = InterviewSession(
            id=session_id,
            code=code,
            language=language,
            function_name=function_name,
            questions=questions,
            status="in_progress",
        )

        self._sessions[session_id] = session
        logger.info(f"CTG: Started interview {session_id} for {function_name}")
        return session

    def submit_answer(
        self,
        session_id: str,
        question_id: str,
        answer: str,
        additional_context: str = "",
    ) -> InterviewSession:
        """Submit an answer to an interview question.

        Args:
            session_id: The interview session ID
            question_id: The question being answered
            answer: The answer text
            additional_context: Optional additional context

        Returns:
            Updated InterviewSession
        """
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.answers.append(InterviewAnswer(
            question_id=question_id,
            answer=answer,
            additional_context=additional_context,
        ))

        return session

    def generate_tests(self, session_id: str) -> List[TestSpec]:
        """Generate test specifications from interview answers.

        Args:
            session_id: The interview session ID

        Returns:
            List of TestSpec objects describing tests to generate
        """
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        test_specs = []

        # Generate tests from each answered question
        for answer in session.answers:
            question = next(
                (q for q in session.questions if q.id == answer.question_id),
                None,
            )
            if not question:
                continue

            spec = self._answer_to_test_spec(
                question, answer, session.function_name, session.language
            )
            if spec:
                test_specs.append(spec)

        # Add default tests for unanswered questions
        answered_ids = {a.question_id for a in session.answers}
        for question in session.questions:
            if question.id not in answered_ids and question.priority >= 7:
                spec = self._default_test_spec(
                    question, session.function_name, session.language
                )
                if spec:
                    test_specs.append(spec)

        session.test_specs = test_specs
        session.status = "completed"

        logger.info(
            f"CTG: Generated {len(test_specs)} test specs for {session.function_name}"
        )
        return test_specs

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Retrieve an interview session."""
        return self._sessions.get(session_id)

    def _extract_function_name(self, code: str, language: str) -> str:
        """Extract the primary function name from code."""
        if language == "python":
            match = re.search(r'def\s+(\w+)\s*\(', code)
            if match:
                return match.group(1)
        elif language in ("javascript", "typescript"):
            match = re.search(r'function\s+(\w+)\s*\(', code)
            if match:
                return match.group(1)
            match = re.search(r'(?:const|let|var)\s+(\w+)\s*=', code)
            if match:
                return match.group(1)
        return "target_function"

    def _generate_questions(
        self,
        code: str,
        language: str,
        function_name: str,
    ) -> List[InterviewQuestion]:
        """Generate interview questions based on code analysis."""
        questions = []

        # Analyze code for specific patterns
        has_params = bool(re.search(r'\(([^)]+)\)', code))
        has_return = 'return' in code
        has_error_handling = bool(re.search(r'raise|throw|except|catch|try', code))
        has_loops = bool(re.search(r'for\s+|while\s+|\.forEach|\.map', code))
        has_async = bool(re.search(r'async\s+|await\s+|Promise', code))

        # Always ask behavior questions
        for template in self.QUESTION_TEMPLATES[QuestionType.BEHAVIOR][:2]:
            questions.append(InterviewQuestion(
                id=f"q-{uuid.uuid4().hex[:6]}",
                question_type=QuestionType.BEHAVIOR,
                question=template.format(name=function_name),
                answer_type=AnswerType.TEXT,
                priority=8,
            ))

        # Ask edge case questions if function has parameters
        if has_params:
            for template in self.QUESTION_TEMPLATES[QuestionType.EDGE_CASE][:3]:
                questions.append(InterviewQuestion(
                    id=f"q-{uuid.uuid4().hex[:6]}",
                    question_type=QuestionType.EDGE_CASE,
                    question=template.format(name=function_name),
                    answer_type=AnswerType.TEXT,
                    priority=7,
                ))

        # Ask error handling questions if not already handled
        if not has_error_handling:
            questions.append(InterviewQuestion(
                id=f"q-{uuid.uuid4().hex[:6]}",
                question_type=QuestionType.ERROR_HANDLING,
                question=self.QUESTION_TEMPLATES[QuestionType.ERROR_HANDLING][0].format(
                    name=function_name
                ),
                answer_type=AnswerType.CHOICE,
                choices=["Raise an error", "Return a default value", "Log and continue", "Let it crash"],
                priority=8,
            ))

        # Ask invariant questions
        questions.append(InterviewQuestion(
            id=f"q-{uuid.uuid4().hex[:6]}",
            question_type=QuestionType.INVARIANT,
            question=self.QUESTION_TEMPLATES[QuestionType.INVARIANT][0].format(
                name=function_name
            ),
            answer_type=AnswerType.TEXT,
            priority=7,
        ))

        # Ask input validation questions
        if has_params:
            questions.append(InterviewQuestion(
                id=f"q-{uuid.uuid4().hex[:6]}",
                question_type=QuestionType.INPUT_VALIDATION,
                question=self.QUESTION_TEMPLATES[QuestionType.INPUT_VALIDATION][0].format(
                    name=function_name
                ),
                answer_type=AnswerType.TEXT,
                priority=6,
            ))

        # Ask performance questions for loops/async
        if has_loops or has_async:
            questions.append(InterviewQuestion(
                id=f"q-{uuid.uuid4().hex[:6]}",
                question_type=QuestionType.PERFORMANCE,
                question="What is the expected input size range for {name}?".format(
                    name=function_name
                ),
                answer_type=AnswerType.CHOICE,
                choices=["1-10 items", "10-100 items", "100-10,000 items", "10,000+ items"],
                priority=5,
            ))

        return questions

    def _answer_to_test_spec(
        self,
        question: InterviewQuestion,
        answer: InterviewAnswer,
        function_name: str,
        language: str,
    ) -> Optional[TestSpec]:
        """Convert an interview answer to a test specification."""
        test_type_map = {
            QuestionType.EDGE_CASE: "edge_case",
            QuestionType.INVARIANT: "unit",
            QuestionType.ERROR_HANDLING: "error_handling",
            QuestionType.BEHAVIOR: "unit",
            QuestionType.PERFORMANCE: "performance",
            QuestionType.SECURITY: "security",
            QuestionType.INPUT_VALIDATION: "validation",
        }

        test_type = test_type_map.get(question.question_type, "unit")

        # Generate assertions based on answer
        assertions = self._generate_assertions(question, answer, function_name)

        return TestSpec(
            id=f"test-{uuid.uuid4().hex[:6]}",
            name=f"test_{function_name}_{question.question_type.value}_{answer.question_id[:6]}",
            description=f"Test derived from: {question.question}",
            test_type=test_type,
            function_name=function_name,
            expected_behavior=answer.answer,
            assertions=assertions,
            priority=question.priority,
        )

    def _default_test_spec(
        self,
        question: InterviewQuestion,
        function_name: str,
        language: str,
    ) -> Optional[TestSpec]:
        """Generate a default test spec for unanswered high-priority questions."""
        return TestSpec(
            id=f"test-{uuid.uuid4().hex[:6]}",
            name=f"test_{function_name}_{question.question_type.value}_default",
            description=f"Default test for: {question.question}",
            test_type="exploratory",
            function_name=function_name,
            expected_behavior="Verify behavior matches documentation",
            assertions=["Result should be valid for expected inputs"],
            priority=question.priority,
        )

    def _generate_assertions(
        self,
        question: InterviewQuestion,
        answer: InterviewAnswer,
        function_name: str,
    ) -> List[str]:
        """Generate test assertions from an interview answer."""
        assertions = []
        answer_lower = answer.answer.lower()

        if question.question_type == QuestionType.EDGE_CASE:
            if "empty" in question.question.lower():
                assertions.append(f"{function_name} should handle empty input gracefully")
            if "null" in question.question.lower() or "none" in question.question.lower():
                assertions.append(f"{function_name} should handle None/null input")
            if "negative" in question.question.lower():
                assertions.append(f"{function_name} should handle negative values")
            if "large" in question.question.lower():
                assertions.append(f"{function_name} should handle large inputs without timeout")

        elif question.question_type == QuestionType.ERROR_HANDLING:
            if "raise" in answer_lower or "error" in answer_lower:
                assertions.append(f"{function_name} should raise appropriate error for invalid input")
            elif "default" in answer_lower:
                assertions.append(f"{function_name} should return default value for invalid input")

        elif question.question_type == QuestionType.INVARIANT:
            assertions.append(f"{function_name} invariant: {answer.answer}")

        elif question.question_type == QuestionType.BEHAVIOR:
            assertions.append(f"{function_name} should {answer.answer}")

        elif question.question_type == QuestionType.INPUT_VALIDATION:
            assertions.append(f"{function_name} should validate input types")

        if not assertions:
            assertions.append(f"{function_name} should behave as described: {answer.answer}")

        return assertions