/**
 * API client: POST Feedback page solution submissions to the Flask backend.
 */

import { errorMessageFromResponse } from "./simulate";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type FeedbackSolutionRequest = {
  levelId: string;
  gates: unknown[];
  qubitOrder: unknown[];
  note: string;
  honeypot: string;
};

export type FeedbackSolutionResponse = {
  status: string;
  message: string;
  data: { issue_url: string | null } | null;
};

export async function submitFeedbackSolution(
  body: FeedbackSolutionRequest,
): Promise<FeedbackSolutionResponse> {
  const url = `${API_BASE_URL}/api/feedback/solution`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await errorMessageFromResponse(res));
  }
  return res.json() as Promise<FeedbackSolutionResponse>;
}
