"""
Feedback namespace — student solution submissions → GitHub Issues.

Routes:
  POST /api/feedback/solution
"""

from flask_restx import Namespace, Resource
from flask import request
from app.services.github_issue import GitHubIssueError, create_feedback_issue
from app.utils.response_builder import ResponseBuilder
from app.utils.constants import HttpStatus
from app.dto.response_dto import ResponseDTO
import logging

feedback_ns = Namespace("feedback", description="Student feedback / solution submissions.")
logger = logging.getLogger(__name__)


def _success_payload(issue_url: str | None):
    return ResponseBuilder.success(
        message="Submission received.",
        data=ResponseDTO(issue_url=issue_url),
    )


@feedback_ns.route("/solution")
class FeedbackSolution(Resource):
    def post(self):  # type: ignore
        """
        Accept a Feedback page solution payload and open a GitHub Issue.
        Honeypot: non-empty honeypot → 200 success without calling GitHub.
        """
        try:
            body = request.get_json(silent=True)
            if not isinstance(body, dict):
                return ResponseBuilder.fail(
                    "Request body must be a valid JSON object.",
                )

            honeypot = body.get("honeypot", "")
            if isinstance(honeypot, str) and honeypot.strip():
                logger.info("Feedback honeypot triggered; returning success without GitHub call.")
                return _success_payload(None)

            level_id = body.get("levelId")
            gates = body.get("gates")
            qubit_order = body.get("qubitOrder")
            note_raw = body.get("note", "")

            if not isinstance(level_id, str) or not level_id.strip():
                return ResponseBuilder.fail("levelId must be a non-empty string.")
            if not isinstance(gates, list):
                return ResponseBuilder.fail("gates must be an array.")
            if not isinstance(qubit_order, list):
                return ResponseBuilder.fail("qubitOrder must be an array.")

            note = note_raw if isinstance(note_raw, str) else str(note_raw or "")

            try:
                issue_url = create_feedback_issue(
                    level_id.strip(),
                    gates,
                    qubit_order,
                    note,
                )
            except GitHubIssueError as err:
                return ResponseBuilder.error(
                    message=err.message,
                    status_code=HttpStatus.BAD_GATEWAY.value,
                )

            return _success_payload(issue_url)

        except Exception:
            logger.exception("Unexpected error handling feedback solution submission.")
            return ResponseBuilder.error(
                message="Unable to submit feedback right now.",
            )
