"""
HTTP tests for POST /api/feedback/solution.
Mocks GitHub so no real PAT or network is required.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app import create_app
from app.services.github_issue import GitHubIssueError


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


VALID_BODY = {
    "levelId": "X",
    "gates": ["H", "X"],
    "qubitOrder": [[0, 0], [0, 0]],
    "note": "should pass",
    "honeypot": "",
}


def test_honeypot_returns_success_without_github(client):
    body = {**VALID_BODY, "honeypot": "http://spam.example"}
    with patch("app.api.feedback.create_feedback_issue") as mock_create:
        res = client.post("/api/feedback/solution", json=body)
        assert res.status_code == 200
        data = res.get_json()
        assert data["status"] == "success"
        assert data["message"] == "Submission received."
        assert data["data"]["issue_url"] is None
        mock_create.assert_not_called()


def test_malformed_payload_returns_400(client):
    res = client.post(
        "/api/feedback/solution",
        json={"levelId": "", "gates": [], "qubitOrder": [], "note": "", "honeypot": ""},
    )
    assert res.status_code == 400
    assert res.get_json()["status"] == "fail"

    res2 = client.post(
        "/api/feedback/solution",
        json={"levelId": "X", "gates": "not-a-list", "qubitOrder": [], "honeypot": ""},
    )
    assert res2.status_code == 400


def test_success_returns_issue_url(client):
    with patch(
        "app.api.feedback.create_feedback_issue",
        return_value="https://github.com/example/repo/issues/1",
    ) as mock_create:
        res = client.post("/api/feedback/solution", json=VALID_BODY)
        assert res.status_code == 200
        data = res.get_json()
        assert data["status"] == "success"
        assert data["data"]["issue_url"] == "https://github.com/example/repo/issues/1"
        mock_create.assert_called_once_with("X", ["H", "X"], [[0, 0], [0, 0]], "should pass")


def test_github_failure_returns_clean_502(client):
    with patch(
        "app.api.feedback.create_feedback_issue",
        side_effect=GitHubIssueError(),
    ):
        res = client.post("/api/feedback/solution", json=VALID_BODY)
        assert res.status_code == 502
        data = res.get_json()
        assert data["status"] == "error"
        assert "Unable to submit feedback" in data["message"]
        # No PAT / raw GitHub body leakage
        blob = str(data).lower()
        assert "bearer" not in blob
        assert "github_pat" not in blob
        assert "ghp_" not in blob


def test_create_feedback_issue_missing_pat_raises():
    from app.services import github_issue as mod

    with patch.object(mod.Config, "GITHUB_PAT", ""):
        with pytest.raises(GitHubIssueError):
            mod.create_feedback_issue("X", [], [], "")


def test_create_feedback_issue_posts_and_returns_url():
    from app.services import github_issue as mod

    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.json.return_value = {
        "html_url": "https://github.com/marissasinghh/quantum-circuit-builder/issues/42"
    }

    with patch.object(mod.Config, "GITHUB_PAT", "test-token-not-real"):
        with patch.object(mod.Config, "GITHUB_REPO", "marissasinghh/quantum-circuit-builder"):
            with patch.object(mod.requests, "post", return_value=mock_resp) as mock_post:
                url = mod.create_feedback_issue("SWAP", ["CNOT"], [[0, 1]], "hi")
                assert url.endswith("/issues/42")
                mock_post.assert_called_once()
                kwargs = mock_post.call_args.kwargs
                assert kwargs["json"]["labels"] == ["student-submission"]
                assert "[Solution Submission] SWAP" == kwargs["json"]["title"]
                # Ensure Authorization is set but we don't assert the token into logs
                assert "Authorization" in kwargs["headers"]
