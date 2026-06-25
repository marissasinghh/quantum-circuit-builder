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
    { id: "cnot", type: Gate.CNOT, order: [0, 1] as const, column: 0 },
    { id: "h", type: Gate.H, wire: 0, column: 1 },
    { id: "y", type: Gate.T, wire: 1, column: 2 },
    { id: "x", type: Gate.X, wire: 0, column: 3 },
  ];
}

describe("placedGateDrag", () => {
  it("buildWireContainers splits 1q gates by wire in column order", () => {
    const gates = interleavedFixture();
    const containers = buildWireContainers(gates, 2);
    expect(containers[0]).toEqual(["h", "x"]);
    expect(containers[1]).toEqual(["y"]);
  });

  it("globalIndexForWireDrop maps wire-local index to moveGate to", () => {
    const gates = interleavedFixture();
    const { to } = globalIndexForWireDrop(gates, "x", 0, 0);
    expect(to).toBe(1);

    const result = moveGate(gates, "x", to);
    expect(gatesInColumnOrder(result).map((g) => g.id)).toEqual(["cnot", "x", "h", "y"]);
  });

  it("globalIndexForWireDrop handles cross-wire insert before existing gate", () => {
    const gates = interleavedFixture();
    const { to, wire } = globalIndexForWireDrop(gates, "h", 1, 0);
    expect(to).toBe(1);
    expect(wire).toBe(1);

    const result = moveGate(gates, "h", to, wire);
    const ordered = gatesInColumnOrder(result);
    expect(ordered.find((g) => g.id === "h")).toMatchObject({ wire: 1, column: 1 });
    expect(ordered.map((g) => g.id)).toEqual(["cnot", "h", "y", "x"]);
  });

  it("globalIndexForWireDrop appends when insert index is past end of wire list", () => {
    const gates = interleavedFixture();
    const { to, wire } = globalIndexForWireDrop(gates, "h", 1, 99);
    expect(wire).toBe(1);
    expect(to).toBe(2);

    const result = moveGate(gates, "h", to, wire);
    expect(gatesInColumnOrder(result).map((g) => g.id)).toEqual(["cnot", "y", "h", "x"]);
  });

  it("moveBetweenContainers previews cross-wire move without mutating source shape", () => {
    const gates = interleavedFixture();
    const containers = buildWireContainers(gates, 2);
    const next = moveBetweenContainers(containers, "h", 0, 1, 0);
    expect(next[0]).toEqual(["x"]);
    expect(next[1]).toEqual(["h", "y"]);
  });
});
