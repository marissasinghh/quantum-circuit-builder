/**
 * API client: POST the request DTO to your Flask backend.
 * This module does not build DTOs; it just performs the network call.
 */

import type { UnitaryRequestDTO } from "../interfaces/unitary";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

type ErrorBody = {
  message?: unknown;
  data?: { error?: unknown } | null;
};

/** Prefer ResponseBuilder.error's message (+ nested data.error) over bare HTTP status. */
export async function errorMessageFromResponse(res: Response): Promise<string> {
  const fallback = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as ErrorBody;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const detail =
      body.data && typeof body.data.error === "string" ? body.data.error.trim() : "";
    if (message && detail) return `${message} (${detail})`;
    if (message) return message;
    if (detail) return detail;
  } catch {
    // Non-JSON error body — keep status fallback.
  }
  return fallback;
}

export async function simulateUnitary(body: UnitaryRequestDTO) {
  const url = `${API_BASE_URL}/api/simulate`; // ← IMPORTANT
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await errorMessageFromResponse(res));
  }
  return res.json();
}
