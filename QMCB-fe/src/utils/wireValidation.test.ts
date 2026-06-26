import { describe, expect, it } from "vitest";

import { isValidSingleWire } from "./wireValidation";

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
