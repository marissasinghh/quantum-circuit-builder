import { describe, expect, it } from "vitest";

import { baseWireFromDropWire, isValidSingleWire } from "./wireValidation";

describe("isValidSingleWire", () => {
  it("accepts wire 2 on a 3-qubit level", () => {
    expect(isValidSingleWire(2, 3)).toBe(true);
  });

  it("rejects wire 2 on a 1- or 2-qubit level", () => {
    expect(isValidSingleWire(2, 1)).toBe(false);
    expect(isValidSingleWire(2, 2)).toBe(false);
  });

  it("accepts wires 0 and 1 for any level with at least 2 qubits", () => {
    expect(isValidSingleWire(0, 2)).toBe(true);
    expect(isValidSingleWire(1, 2)).toBe(true);
  });
});

describe("baseWireFromDropWire", () => {
  it("maps wire 0 → base 0 and wires 1|2 → base 1 on a 3-qubit canvas", () => {
    expect(baseWireFromDropWire(0, 3)).toBe(0);
    expect(baseWireFromDropWire(1, 3)).toBe(1);
    expect(baseWireFromDropWire(2, 3)).toBe(1);
  });

  it("always returns 0 on a 2-qubit canvas (only one adjacent pair)", () => {
    expect(baseWireFromDropWire(0, 2)).toBe(0);
    expect(baseWireFromDropWire(1, 2)).toBe(0);
  });

  it("never yields a single-wire or out-of-range base", () => {
    for (const w of [-1, 0, 1, 2, 99]) {
      const base = baseWireFromDropWire(w, 3);
      expect(base === 0 || base === 1).toBe(true);
    }
  });
});
