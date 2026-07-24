import { describe, expect, it } from "vitest";

import { TWO_QUBIT_GLYPH_Y_PAD, twoQubitGlyphLayout } from "./canvasGeometry";

/** Mirrors CircuitCanvas computeWireYs for a 3-qubit, 240px canvas. */
const WIRE_YS_3Q = [60, 120, 180];

/** Mirrors CircuitCanvas computeWireYs for a 2-qubit, 200px canvas. */
const WIRE_YS_2Q = [200 / 3, 400 / 3];

describe("twoQubitGlyphLayout", () => {
  it("places baseWire 0 on wires 0–1 on a 3-qubit canvas", () => {
    const layout = twoQubitGlyphLayout(WIRE_YS_3Q, 0);
    expect(layout.top).toBe(WIRE_YS_3Q[0] - TWO_QUBIT_GLYPH_Y_PAD);
    expect(layout.wireSpan).toBe(WIRE_YS_3Q[1] - WIRE_YS_3Q[0]);
  });

  it("places baseWire 1 on wires 1–2 on a 3-qubit canvas", () => {
    const layout = twoQubitGlyphLayout(WIRE_YS_3Q, 1);
    expect(layout.top).toBe(WIRE_YS_3Q[1] - TWO_QUBIT_GLYPH_Y_PAD);
    expect(layout.wireSpan).toBe(WIRE_YS_3Q[2] - WIRE_YS_3Q[1]);
  });

  it("clamps to the only adjacent pair on a 2-qubit canvas", () => {
    const at0 = twoQubitGlyphLayout(WIRE_YS_2Q, 0);
    const at1 = twoQubitGlyphLayout(WIRE_YS_2Q, 1);
    expect(at0).toEqual(at1);
    expect(at0.top).toBe(WIRE_YS_2Q[0] - TWO_QUBIT_GLYPH_Y_PAD);
    expect(at0.wireSpan).toBe(WIRE_YS_2Q[1] - WIRE_YS_2Q[0]);
  });
});
