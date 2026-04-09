"""
Tests for Conversational Test Generation (CTG) — Innovation #6
"""

import pytest
from completion.test_interviewer import (
    TestInterviewer,
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    TestSpec,
    QuestionType,
    AnswerType,
)


SAMPLE_CODE = '''
def calculate_discount(price, discount_percent, customer_tier="standard"):
    """Calculate the discounted price for a customer."""
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    
    tier_multipliers = {
        "standard": 1.0,
        "premium": 1.2,
        "vip": 1.5,
    }
    
    multiplier = tier_multipliers.get(customer_tier, 1.0)
    discount = price * (discount_percent / 100) * multiplier
    return max(0, price - discount)
'''


class TestTestInterviewer:
    def setup_method(self):
        self.interviewer = TestInterviewer()

    def test_start_interview(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")
        assert session.id.startswith("interview-")
        assert session.function_name == "calculate_discount"
        assert len(session.questions) >= 1
        assert session.status == "in_progress"

    def test_start_interview_custom_function(self):
        session = self.interviewer.start_interview(
            SAMPLE_CODE, "python", function_name="my_func"
        )
        assert session.function_name == "my_func"

    def test_questions_generated(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")
        # Should have behavior, edge case, and error handling questions
        question_types = {q.question_type for q in session.questions}
        assert QuestionType.BEHAVIOR in question_types

    def test_submit_answer(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")
        question_id = session.questions[0].id

        updated = self.interviewer.submit_answer(
            session_id=session.id,
            question_id=question_id,
            answer="It should calculate the discounted price",
        )
        assert len(updated.answers) == 1

    def test_generate_tests(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")

        # Answer all questions
        for q in session.questions:
            self.interviewer.submit_answer(
                session_id=session.id,
                question_id=q.id,
                answer="It should work correctly",
            )

        test_specs = self.interviewer.generate_tests(session.id)
        assert len(test_specs) >= 1
        assert all(isinstance(spec, TestSpec) for spec in test_specs)

    def test_generate_tests_partial_answers(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")

        # Answer only some questions
        if len(session.questions) >= 2:
            self.interviewer.submit_answer(
                session_id=session.id,
                question_id=session.questions[0].id,
                answer="It should work",
            )

        test_specs = self.interviewer.generate_tests(session.id)
        # Should still generate some tests (including defaults for unanswered)
        assert len(test_specs) >= 1

    def test_test_spec_has_assertions(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")

        for q in session.questions:
            self.interviewer.submit_answer(
                session_id=session.id,
                question_id=q.id,
                answer="It should handle the case properly",
            )

        test_specs = self.interviewer.generate_tests(session.id)
        for spec in test_specs:
            assert len(spec.assertions) >= 1

    def test_get_session(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")
        retrieved = self.interviewer.get_session(session.id)
        assert retrieved is not None
        assert retrieved.id == session.id

    def test_get_nonexistent_session(self):
        result = self.interviewer.get_session("nonexistent")
        assert result is None

    def test_submit_answer_nonexistent_session(self):
        with pytest.raises(ValueError):
            self.interviewer.submit_answer(
                session_id="nonexistent",
                question_id="q-1",
                answer="test",
            )

    def test_generate_tests_nonexistent_session(self):
        with pytest.raises(ValueError):
            self.interviewer.generate_tests("nonexistent")

    def test_javascript_code(self):
        js_code = "function add(a, b) { return a + b; }"
        session = self.interviewer.start_interview(js_code, "javascript")
        assert session.function_name == "add"
        assert len(session.questions) >= 1

    def test_session_to_dict(self):
        session = self.interviewer.start_interview(SAMPLE_CODE, "python")
        d = session.to_dict()
        assert "id" in d
        assert "function_name" in d
        assert "status" in d
        assert "questions_count" in d


class TestQuestionTypes:
    def test_all_question_types(self):
        types = list(QuestionType)
        assert len(types) == 7

    def test_question_type_values(self):
        assert QuestionType.EDGE_CASE.value == "edge_case"
        assert QuestionType.ERROR_HANDLING.value == "error_handling"
        assert QuestionType.BEHAVIOR.value == "behavior"

    def test_answer_types(self):
        types = list(AnswerType)
        assert AnswerType.TEXT in types
        assert AnswerType.YES_NO in types
        assert AnswerType.CHOICE in types