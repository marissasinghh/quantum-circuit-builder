import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import { gatesInColumnOrder, moveGate, serializeOrders, setBaseWire, setTwoQubitSpan, validateCircuitForSimulate } from "./circuit";

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

  it("updates baseWire for two-qubit gates while moving column", () => {
    const gates = fixture();
    const result = moveGate(gates, "cnot", 2, 1);

    expect(result.length).toBe(3);
    const ordered = gatesInColumnOrder(result);
    expect(ordered.map((g) => g.id)).toEqual(["h", "x", "cnot"]);
    expect(ordered.map((g) => g.column)).toEqual([0, 1, 2]);

    const cnot = ordered.find((g) => g.id === "cnot");
    expect(cnot).toBeDefined();
    expect("wire" in cnot!).toBe(false);
    expect("order" in cnot! && cnot.baseWire).toBe(1);
    assertGaplessColumns(result);
  });

  it("preserves column when only baseWire changes for a two-qubit gate", () => {
    const gates = fixture();
    const result = moveGate(gates, "cnot", 0, 1);
    const cnot = gatesInColumnOrder(result).find((g) => g.id === "cnot");
    expect(cnot?.column).toBe(0);
    expect("order" in cnot! && cnot.baseWire).toBe(1);
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

  it("clears extended when a two-qubit gate is moved via the adjacent-pair DnD path", () => {
    const gates: PlacedGate[] = [
      { id: "cnot", type: Gate.CNOT, order: [0, 1], baseWire: 0, extended: true, column: 0 },
      { id: "h", type: Gate.H, wire: 0, column: 1 },
    ];
    const result = moveGate(gates, "cnot", 0, 1);
    const cnot = gatesInColumnOrder(result).find((g) => g.id === "cnot");
    expect(cnot).toBeDefined();
    expect("order" in cnot! && cnot.baseWire).toBe(1);
    expect("order" in cnot! && cnot.extended).toBeUndefined();
  });

  it("preserves extended on column-only reorder (no wire argument)", () => {
    const gates: PlacedGate[] = [
      { id: "cnot", type: Gate.CNOT, order: [0, 1], baseWire: 0, extended: true, column: 0 },
      { id: "h", type: Gate.H, wire: 0, column: 1 },
    ];
    const result = moveGate(gates, "cnot", 1);
    const cnot = gatesInColumnOrder(result).find((g) => g.id === "cnot");
    expect(cnot).toBeDefined();
    expect("order" in cnot! && cnot.extended).toBe(true);
  });
});

describe("setBaseWire", () => {
  it("clears extended when changing baseWire", () => {
    const gates: PlacedGate[] = [
      { id: "cnot", type: Gate.CNOT, order: [0, 1], baseWire: 0, extended: true, column: 0 },
    ];
    const result = setBaseWire(gates, "cnot", 1);
    const cnot = result.find((g) => g.id === "cnot");
    expect(cnot).toBeDefined();
    expect("order" in cnot! && cnot.baseWire).toBe(1);
    expect("order" in cnot! && cnot.extended).toBeUndefined();
  });
});

describe("setTwoQubitSpan", () => {
  it("extends while preserving baseWire as retract origin", () => {
    const gates: PlacedGate[] = [
      { id: "cnot", type: Gate.CNOT, order: [0, 1], baseWire: 1, column: 0 },
    ];
    const result = setTwoQubitSpan(gates, "cnot", { baseWire: 1, extended: true });
    const cnot = result.find((g) => g.id === "cnot");
    expect("order" in cnot! && cnot.extended).toBe(true);
    expect("order" in cnot! && cnot.baseWire).toBe(1);
  });

  it("retracts to an explicit baseWire and clears extended", () => {
    const gates: PlacedGate[] = [
      { id: "cnot", type: Gate.CNOT, order: [0, 1], baseWire: 0, extended: true, column: 0 },
    ];
    const to01 = setTwoQubitSpan(gates, "cnot", { baseWire: 0, extended: false });
    expect("order" in to01[0]! && to01[0].baseWire).toBe(0);
    expect("order" in to01[0]! && to01[0].extended).toBeUndefined();

    const to12 = setTwoQubitSpan(gates, "cnot", { baseWire: 1, extended: false });
    expect("order" in to12[0]! && to12[0].baseWire).toBe(1);
    expect("order" in to12[0]! && to12[0].extended).toBeUndefined();
  });
});

describe("serializeOrders", () => {
  it("emits absolute pairs from baseWire + relative order", () => {
    const gates: PlacedGate[] = [
      { id: "a", type: Gate.CNOT, order: [0, 1], baseWire: 0, column: 0 },
      { id: "b", type: Gate.CNOT, order: [1, 0], baseWire: 0, column: 1 },
      { id: "c", type: Gate.CNOT, order: [0, 1], baseWire: 1, column: 2 },
      { id: "d", type: Gate.CNOT, order: [1, 0], baseWire: 1, column: 3 },
      { id: "e", type: Gate.X, wire: 2, column: 4 },
    ];
    expect(serializeOrders(gates)).toEqual([
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
      [2, 2],
    ]);
  });

  it("emits distinct pairs for CONTROLLED_H (not [w,w])", () => {
    const gates: PlacedGate[] = [
      { id: "ch", type: Gate.CONTROLLED_H, order: [0, 1], baseWire: 0, column: 0 },
      { id: "ch2", type: Gate.CONTROLLED_H, order: [1, 0], baseWire: 1, column: 1 },
    ];
    expect(serializeOrders(gates)).toEqual([
      [0, 1],
      [2, 1],
    ]);
  });

  it("emits skip-wire pairs [0,2]/[2,0] when extended", () => {
    const gates: PlacedGate[] = [
      { id: "a", type: Gate.CNOT, order: [0, 1], baseWire: 0, extended: true, column: 0 },
      { id: "b", type: Gate.CNOT, order: [1, 0], baseWire: 1, extended: true, column: 1 },
      { id: "c", type: Gate.CONTROLLED_Z, order: [0, 1], baseWire: 0, extended: true, column: 2 },
    ];
    expect(serializeOrders(gates)).toEqual([
      [0, 2],
      [2, 0],
      [0, 2],
    ]);
  });

  it("keeps adjacent pairs unchanged when extended is omitted or false", () => {
    const gates: PlacedGate[] = [
      { id: "a", type: Gate.CNOT, order: [0, 1], baseWire: 0, column: 0 },
      { id: "b", type: Gate.CNOT, order: [0, 1], baseWire: 0, extended: false, column: 1 },
      { id: "c", type: Gate.CNOT, order: [0, 1], baseWire: 1, column: 2 },
    ];
    expect(serializeOrders(gates)).toEqual([
      [0, 1],
      [0, 1],
      [1, 2],
    ]);
  });
});

describe("validateCircuitForSimulate", () => {
  it("rejects a 2q gate stored as a single-qubit placement", () => {
    const gates: PlacedGate[] = [
      { id: "bad", type: Gate.CONTROLLED_H as never, wire: 0, column: 0 },
    ];
    expect(validateCircuitForSimulate(gates)).toMatch(/single-qubit/);
  });

  it("rejects equal-index absolute pairs", () => {
    const gates: PlacedGate[] = [
      // Impossible via normal order+baseWire, but guard equal indices explicitly.
      { id: "bad", type: Gate.CNOT, order: [0, 0] as never, baseWire: 0, column: 0 },
    ];
    expect(validateCircuitForSimulate(gates)).toMatch(/invalid qubit pair/);
  });

  it("rejects CONTROLLED_U (not reusable without seeded angles)", () => {
    const gates: PlacedGate[] = [
      { id: "cu", type: Gate.CONTROLLED_U, order: [0, 1], baseWire: 0, column: 0 },
    ];
    expect(validateCircuitForSimulate(gates)).toMatch(/CONTROLLED_U/);
  });

  it("allows CONTROLLED_H with a valid pair", () => {
    const gates: PlacedGate[] = [
      { id: "ch", type: Gate.CONTROLLED_H, order: [0, 1], baseWire: 1, column: 0 },
      { id: "rz", type: Gate.RZ, wire: 0, column: 1, theta: 0.5 },
    ];
    expect(validateCircuitForSimulate(gates)).toBeNull();
  });
});
