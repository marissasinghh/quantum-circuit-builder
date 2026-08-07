"""
Metrics namespace — instrumentation events from the frontend (level start,
level complete, submission attempt, skip).

Routes:
  POST /api/metrics/event

Writes each event as a single structured JSON log line via the existing
logging module. No database, no new dependency — mirrors the
"side-channel that must never affect the caller" shape used by
app/services/github_issue.py, but simpler: there's no external call, so the
only failure mode is a malformed request body.
"""

from flask_restx import Namespace, Resource
from flask import request
from app.utils.response_builder import ResponseBuilder
import json
import logging

metrics_ns = Namespace("metrics", description="Frontend instrumentation events.")
logger = logging.getLogger(__name__)


def _success_payload():
    return ResponseBuilder.success(message="Event recorded.")


@metrics_ns.route("/event")
class MetricsEvent(Resource):
    def post(self):  # type: ignore
        """
        Accept a single metrics event and write it as a structured log line.
        Always returns success to the caller unless the body itself is invalid —
        a metrics failure must never surface as something worth the frontend
        retrying or surfacing to a student.
        """
        try:
            body = request.get_json(silent=True)
            if not isinstance(body, dict):
                return ResponseBuilder.fail(
                    "Request body must be a valid JSON object.",
                )

            event_type = body.get("eventType")
            level_id = body.get("levelId")
            timestamp = body.get("timestamp")

            if not isinstance(event_type, str) or not event_type.strip():
                return ResponseBuilder.fail("eventType must be a non-empty string.")
            if not isinstance(level_id, str) or not level_id.strip():
                return ResponseBuilder.fail("levelId must be a non-empty string.")
            if not isinstance(timestamp, str) or not timestamp.strip():
                return ResponseBuilder.fail("timestamp must be a non-empty string.")

            logger.info(
                json.dumps(
                    {
                        "eventType": event_type.strip(),
                        "levelId": level_id.strip(),
                        "timestamp": timestamp.strip(),
                    }
                )
            )

            return _success_payload()

        except Exception:
            logger.exception("Unexpected error handling metrics event.")
            return ResponseBuilder.error(
                message="Unable to record event right now.",
            )
