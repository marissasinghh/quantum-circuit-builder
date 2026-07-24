import { describe, expect, it } from "vitest";

import { Gate } from "../types/global";
import { arityFor, isTwoQubitToolboxGate } from "./gates";

describe("isTwoQubitToolboxGate", () => {
  it("includes CONTROLLED_H and CONTROLLED_U (arity 2)", () => {
    expect(isTwoQubitToolboxGate(Gate.CONTROLLED_H)).toBe(true);
    expect(isTwoQubitToolboxGate(Gate.CONTROLLED_U)).toBe(true);
    expect(arityFor(Gate.CONTROLLED_H)).toBe(2);
    expect(arityFor(Gate.CONTROLLED_U)).toBe(2);
  });

  it("includes all Phase-D two-qubit primitives", () => {
    for (const g of [
      Gate.CNOT,
      Gate.CNOT_FLIPPED,
      Gate.CONTROLLED_Z,
      Gate.SWAP,
      Gate.CONTROLLED_H,
      Gate.CONTROLLED_U,
    ]) {
      expect(isTwoQubitToolboxGate(g)).toBe(true);
    }
  });

  it("excludes single- and three-qubit gates", () => {
    expect(isTwoQubitToolboxGate(Gate.RZ)).toBe(false);
    expect(isTwoQubitToolboxGate(Gate.H)).toBe(false);
    expect(isTwoQubitToolboxGate(Gate.TOFFOLI)).toBe(false);
    expect(isTwoQubitToolboxGate(Gate.FREDKIN)).toBe(false);
  });
});
