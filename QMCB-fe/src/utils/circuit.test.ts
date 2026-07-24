import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import { gatesInColumnOrder, moveGate } from "./circuit";

function fixture(): PlacedGate[] {
  return [
    { id: "cnot", type: Gate.CNOT, order: [0, 1] as const, baseWire: 0, column: 0 },
    { id: "h", type: Gate.H, wire: 0, column: 1 },
    { id: "x", type: Gate.X, wire: 0, column: 2 },
  ];
}

function assertGaplessColumns(gates: PlacedGate[]) {
  const ordered = gatesInColumnOrder(gates);
  expect(ordered.map((g) => g.column)).toEqual([...ordered.keys()]);
  expect(new Set(gates.map((g) => g.column)).size).toBe(gates.length);
}

describe("moveGate", () => {
  it("reorders on the same wire without changing wire", () => {
    const gates = fixture();
    const result = moveGate(gates, "h", 0);

    expect(result.length).toBe(3);
    const ordered = gatesInColumnOrder(result);
    expect(ordered.map((g) => g.id)).toEqual(["h", "cnot", "x"]);
    expect(ordered.map((g) => g.column)).toEqual([0, 1, 2]);

    const h = ordered.find((g) => g.id === "h");
    expect(h).toBeDefined();
    expect("wire" in h! && h.wire).toBe(0);
    assertGaplessColumns(result);
  });

  it("moves a gate across wires and updates column position", () => {
    const gates = fixture();
    const result = moveGate(gates, "x", 1, 1);

    expect(result.length).toBe(3);
    const ordered = gatesInColumnOrder(result);
    expect(ordered.map((g) => g.id)).toEqual(["cnot", "x", "h"]);
    expect(ordered.map((g) => g.column)).toEqual([0, 1, 2]);

    const x = ordered.find((g) => g.id === "x");
    expect(x).toBeDefined();
    expect("wire" in x! && x.wire).toBe(1);
    assertGaplessColumns(result);
  });

  it("ignores wire param for two-qubit gates and only moves column", () => {
    const gates = fixture();
    const result = moveGate(gates, "cnot", 2, 1);

    expect(result.length).toBe(3);
    const ordered = gatesInColumnOrder(result);
    expect(ordered.map((g) => g.id)).toEqual(["h", "x", "cnot"]);
    expect(ordered.map((g) => g.column)).toEqual([0, 1, 2]);

    const cnot = ordered.find((g) => g.id === "cnot");
    expect(cnot).toBeDefined();
    expect("wire" in cnot!).toBe(false);
    assertGaplessColumns(result);
  });

  it("preserves gate count on every move", () => {
    const gates = fixture();
    const cases = [
      moveGate(gates, "h", 0),
      moveGate(gates, "x", 1, 1),
      moveGate(gates, "cnot", 2, 1),
    ];

    for (const result of cases) {
      expect(result.length).toBe(gates.length);
    }
  });
});
