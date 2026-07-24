import { describe, expect, it } from "vitest";

import { TWO_QUBIT_GLYPH_Y_PAD, twoQubitGlyphLayout, twoQubitGlyphLayoutForGate } from "./canvasGeometry";

/** Mirrors CircuitCanvas computeWireYs for a 3-qubit, 240px canvas. */
const WIRE_YS_3Q = [60, 120, 180];

/** Mirrors CircuitCanvas computeWireYs for a 2-qubit, 200px canvas. */
const WIRE_YS_2Q = [200 / 3, 400 / 3];

describe("twoQubitGlyphLayout", () => {
  it("places adjacent wires 0–1 on a 3-qubit canvas", () => {
    const layout = twoQubitGlyphLayout(WIRE_YS_3Q, [0, 1]);
    expect(layout.top).toBe(WIRE_YS_3Q[0] - TWO_QUBIT_GLYPH_Y_PAD);
    expect(layout.wireSpan).toBe(WIRE_YS_3Q[1] - WIRE_YS_3Q[0]);
  });

  it("places adjacent wires 1–2 on a 3-qubit canvas", () => {
    const layout = twoQubitGlyphLayout(WIRE_YS_3Q, [1, 2]);
    expect(layout.top).toBe(WIRE_YS_3Q[1] - TWO_QUBIT_GLYPH_Y_PAD);
    expect(layout.wireSpan).toBe(WIRE_YS_3Q[2] - WIRE_YS_3Q[1]);
  });

  it("places skip-wire pair 0–2 spanning full 3-qubit height", () => {
    const layout = twoQubitGlyphLayout(WIRE_YS_3Q, [0, 2]);
    expect(layout.top).toBe(WIRE_YS_3Q[0] - TWO_QUBIT_GLYPH_Y_PAD);
    expect(layout.wireSpan).toBe(WIRE_YS_3Q[2] - WIRE_YS_3Q[0]);
    // Mid wire is between endpoints; stem crosses it with no extra mark in the glyph.
    expect(layout.wireSpan).toBeGreaterThan(WIRE_YS_3Q[1] - WIRE_YS_3Q[0]);
    expect(layout.wireSpan).toBe(120);
  });

  it("clamps to the only adjacent pair on a 2-qubit canvas", () => {
    const at01 = twoQubitGlyphLayout(WIRE_YS_2Q, [0, 1]);
    const at12 = twoQubitGlyphLayout(WIRE_YS_2Q, [1, 2]);
    expect(at01).toEqual(at12);
    expect(at01.top).toBe(WIRE_YS_2Q[0] - TWO_QUBIT_GLYPH_Y_PAD);
    expect(at01.wireSpan).toBe(WIRE_YS_2Q[1] - WIRE_YS_2Q[0]);
  });
});

describe("twoQubitGlyphLayoutForGate", () => {
  it("uses absoluteWires for adjacent baseWire 0", () => {
    expect(twoQubitGlyphLayoutForGate(WIRE_YS_3Q, { baseWire: 0 })).toEqual(
      twoQubitGlyphLayout(WIRE_YS_3Q, [0, 1])
    );
  });

  it("uses absoluteWires for adjacent baseWire 1", () => {
    expect(twoQubitGlyphLayoutForGate(WIRE_YS_3Q, { baseWire: 1 })).toEqual(
      twoQubitGlyphLayout(WIRE_YS_3Q, [1, 2])
    );
  });

  it("uses absoluteWires for extended skip-wire span", () => {
    expect(
      twoQubitGlyphLayoutForGate(WIRE_YS_3Q, { baseWire: 0, extended: true })
    ).toEqual(twoQubitGlyphLayout(WIRE_YS_3Q, [0, 2]));
    expect(
      twoQubitGlyphLayoutForGate(WIRE_YS_3Q, { baseWire: 1, extended: true })
    ).toEqual(twoQubitGlyphLayout(WIRE_YS_3Q, [0, 2]));
  });
});
