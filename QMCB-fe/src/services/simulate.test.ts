import { describe, expect, it, vi } from "vitest";

import { errorMessageFromResponse } from "./simulate";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("errorMessageFromResponse", () => {
  it("surfaces ResponseBuilder.error message and nested detail", async () => {
    const msg = await errorMessageFromResponse(
      jsonResponse(500, {
        status: "error",
        message: "Unexpected error occured when simulating circuit",
        data: { error: "angles=(alpha, beta, gamma) is required" },
      }),
    );
    expect(msg).toContain("Unexpected error occured");
    expect(msg).toContain("angles=(alpha, beta, gamma) is required");
  });

  it("falls back to HTTP status when body is not JSON", async () => {
    const res = {
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("no json");
      },
    } as unknown as Response;
    expect(await errorMessageFromResponse(res)).toBe("HTTP 500");
  });

  it("uses message alone when data.error is absent", async () => {
    expect(
      await errorMessageFromResponse(
        jsonResponse(500, { status: "error", message: "boom", data: null }),
      ),
    ).toBe("boom");
  });
});

describe("simulateUnitary non-OK", () => {
  it("throws the surfaced message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(500, {
          status: "error",
          message: "Unexpected error occured when simulating circuit",
          data: { error: "detail" },
        }),
      ),
    );
    // Dynamic import after stub — module reads VITE_API_BASE_URL at call time via fetch URL.
    const { simulateUnitary } = await import("./simulate");
    await expect(
      simulateUnitary({
        target_unitary: "X",
        number_of_qubits: 1,
        gates: ["X"],
        qubit_order: [[0, 0]],
      } as never),
    ).rejects.toThrow(/Unexpected error occured/);
    vi.unstubAllGlobals();
  });
});
