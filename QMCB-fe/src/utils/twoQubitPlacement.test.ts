import { describe, expect, it } from "vitest";

import { Gate, type PlacedTwoQubitGate } from "../types/global";
import { absoluteWires, isExtended, twoQubitSpanControls } from "./twoQubitPlacement";

function twoQubit(overrides: Partial<PlacedTwoQubitGate> = {}): PlacedTwoQubitGate {
  return {
    id: "g",
    type: Gate.CNOT,
    order: [0, 1],
    baseWire: 0,
    column: 0,
    ...overrides,
  };
}

describe("isExtended", () => {
  it("is false when extended is omitted", () => {
    expect(isExtended(twoQubit())).toBe(false);
  });

  it("is false when extended is explicitly false", () => {
    expect(isExtended(twoQubit({ extended: false }))).toBe(false);
  });

  it("is true only when extended is true", () => {
    expect(isExtended(twoQubit({ extended: true }))).toBe(true);
  });
});

describe("absoluteWires", () => {
  it("returns adjacent pair [0, 1] when baseWire is 0 and not extended", () => {
    expect(absoluteWires(twoQubit({ baseWire: 0 }))).toEqual([0, 1]);
  });

  it("returns adjacent pair [1, 2] when baseWire is 1 and not extended", () => {
    expect(absoluteWires(twoQubit({ baseWire: 1 }))).toEqual([1, 2]);
  });

  it("returns skip-wire pair [0, 2] when extended", () => {
    expect(absoluteWires(twoQubit({ baseWire: 0, extended: true }))).toEqual([0, 2]);
    expect(absoluteWires(twoQubit({ baseWire: 1, extended: true }))).toEqual([0, 2]);
  });
});

describe("twoQubitSpanControls", () => {
  it("returns no controls on 2-qubit levels", () => {
    expect(twoQubitSpanControls(twoQubit({ baseWire: 0 }), 2)).toEqual([]);
    expect(twoQubitSpanControls(twoQubit({ baseWire: 1 }), 2)).toEqual([]);
    expect(twoQubitSpanControls(twoQubit({ extended: true }), 2)).toEqual([]);
  });

  it("shows down-extend when on wires 0–1 on a 3-qubit level", () => {
    expect(twoQubitSpanControls(twoQubit({ baseWire: 0 }), 3)).toEqual([
      { kind: "extend", direction: "down" },
    ]);
  });

  it("shows up-extend when on wires 1–2 on a 3-qubit level", () => {
    expect(twoQubitSpanControls(twoQubit({ baseWire: 1 }), 3)).toEqual([
      { kind: "extend", direction: "up" },
    ]);
  });

  it("shows both retract controls when extended on a 3-qubit level", () => {
    expect(twoQubitSpanControls(twoQubit({ baseWire: 0, extended: true }), 3)).toEqual([
      { kind: "retract", targetBaseWire: 0, position: "top" },
      { kind: "retract", targetBaseWire: 1, position: "bottom" },
    ]);
  });
});
