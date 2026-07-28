"""
Create a GitHub Issue for a Feedback page solution submission.
Never logs or returns the PAT or raw GitHub error bodies that might leak secrets.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import requests

from app.settings import Config

logger = logging.getLogger(__name__)

LABEL_STUDENT_SUBMISSION = "student-submission"


class GitHubIssueError(Exception):
    """Safe, client-facing failure creating a GitHub issue."""

    def __init__(self, message: str = "Unable to submit feedback right now.") -> None:
        super().__init__(message)
        self.message = message


def _format_issue_body(
    level_id: str,
    gates: list[Any],
    qubit_order: list[Any],
    note: str,
) -> str:
    gates_block = json.dumps(gates, indent=2)
    order_block = json.dumps(qubit_order, indent=2)
    note_text = note.strip() if note else "(none)"
    return (
        f"## Level\n`{level_id}`\n\n"
        f"## Gates\n```json\n{gates_block}\n```\n\n"
        f"## Qubit order\n```json\n{order_block}\n```\n\n"
        f"## Note\n{note_text}\n"
    )


def create_feedback_issue(
    level_id: str,
    gates: list[Any],
    qubit_order: list[Any],
    note: str,
) -> str:
    """
    POST a new issue to GITHUB_REPO labeled student-submission.
    Returns the issue html_url.
    """
    pat = (Config.GITHUB_PAT or "").strip()
    repo = (Config.GITHUB_REPO or "").strip()
    if not pat:
        logger.error("GITHUB_PAT is not configured; cannot create feedback issue.")
        raise GitHubIssueError()
    if not repo or "/" not in repo:
        logger.error("GITHUB_REPO is missing or invalid.")
        raise GitHubIssueError()

    url = f"https://api.github.com/repos/{repo}/issues"
    payload = {
        "title": f"[Solution Submission] {level_id}",
        "body": _format_issue_body(level_id, gates, qubit_order, note),
        "labels": [LABEL_STUDENT_SUBMISSION],
    }
    headers = {
        "Authorization": f"Bearer {pat}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
    except requests.RequestException:
        logger.exception("Network error calling GitHub Issues API for repo=%s", repo)
        raise GitHubIssueError() from None

    if not (200 <= response.status_code < 300):
        logger.error(
            "GitHub Issues API returned HTTP %s for repo=%s",
            response.status_code,
            repo,
        )
        raise GitHubIssueError()

    try:
        data = response.json()
    except ValueError:
        logger.error("GitHub Issues API returned non-JSON body (HTTP %s)", response.status_code)
        raise GitHubIssueError() from None

    html_url = data.get("html_url")
    if not isinstance(html_url, str) or not html_url:
        logger.error("GitHub Issues API response missing html_url")
        raise GitHubIssueError()

    return html_url
