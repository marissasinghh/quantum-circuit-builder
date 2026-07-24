import { describe, expect, it } from "vitest";

import { Gate, type PlacedGate } from "../types/global";
import {
  buildWireContainers,
  globalIndexForWireDrop,
  moveBetweenContainers,
} from "./placedGateDrag";
import { moveGate } from "./circuit";
import { gatesInColumnOrder } from "./circuit";

function interleavedFixture(): PlacedGate[] {
  return [
    { id: "cnot", type: Gate.CNOT, order: [0, 1] as const, baseWire: 0, column: 0 },
    { id: "h", type: Gate.H, wire: 0, column: 1 },
    { id: "y", type: Gate.T, wire: 1, column: 2 },
    { id: "x", type: Gate.X, wire: 0, column: 3 },
  ];
}

describe("placedGateDrag", () => {
  it("buildWireContainers puts multi-qubit gates on wire 0 only", () => {
    const gates = interleavedFixture();
    const containers = buildWireContainers(gates, 2);
    expect(containers[0]).toEqual(["cnot", "h", "x"]);
    expect(containers[1]).toEqual(["y"]);
  });

  it("globalIndexForWireDrop appends 1q gate after last wire-0 slot in global order", () => {
    const gates = interleavedFixture();
    const { to } = globalIndexForWireDrop(gates, "h", 0, 2, 2);
    expect(to).toBe(3);

    const result = moveGate(gates, "h", to);
    expect(gatesInColumnOrder(result).map((g) => g.id)).toEqual(["cnot", "y", "x", "h"]);
  });

  it("globalIndexForWireDrop reorders multi-qubit gate in global sequence", () => {
    const gates = interleavedFixture();
    const { to } = globalIndexForWireDrop(gates, "cnot", 0, 1, 2);
    expect(to).toBe(2);

    const result = moveGate(gates, "cnot", to);
    expect(gatesInColumnOrder(result).map((g) => g.id)).toEqual(["h", "y", "cnot", "x"]);
  });

  it("globalIndexForWireDrop maps wire-local index to moveGate to for 1q on wire 0", () => {
    const gates = interleavedFixture();
    const { to } = globalIndexForWireDrop(gates, "x", 0, 1, 2);
    expect(to).toBe(1);

    const result = moveGate(gates, "x", to);
    expect(gatesInColumnOrder(result).map((g) => g.id)).toEqual(["cnot", "x", "h", "y"]);
  });

  it("moveBetweenContainers previews cross-wire move for 1q gates", () => {
    const gates = interleavedFixture();
    const containers = buildWireContainers(gates, 2);
    const next = moveBetweenContainers(containers, "h", 0, 1, 0);
    expect(next[0]).toEqual(["cnot", "x"]);
    expect(next[1]).toEqual(["h", "y"]);
  });

  it("globalIndexForWireDrop handles cross-wire insert before existing gate", () => {
    const gates = interleavedFixture();
    const { to, wire } = globalIndexForWireDrop(gates, "h", 1, 0, 2);
    expect(to).toBe(1);
    expect(wire).toBe(1);

    const result = moveGate(gates, "h", to, wire);
    expect(gatesInColumnOrder(result).map((g) => g.id)).toEqual(["cnot", "h", "y", "x"]);
  });
});
