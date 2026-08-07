import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Gate, type PlacedThreeQubitGate } from "../types/global";
import { CircuitCanvas } from "./CircuitCanvas";
import { TooltipProvider } from "./Tooltip";

/**
 * Regression test for the span bug reported live: a placed Toffoli's chip was
 * sized to a hardcoded 90px height regardless of the real 3-qubit canvas wire
 * spacing, so the chip's bottom edge stopped ~40-60px short of wire q2's real
 * line — the glyph never visually touched the bottom wire even though its
 * `order` data spanned all 3 wires.
 *
 * Every prior Toffoli test rendered `ToffoliGlyph` / `SortablePlacedMultiQubitGate`
 * directly with a manually-supplied width/height (80/90) — none of them routed
 * through CircuitCanvas's real wire-geometry pipeline
 * (canvasHeightFor → computeWireYs → twoQubitGlyphLayout → multiQubitGlyphDimensions)
 * to check the computed height actually reaches the bottom wire. This test closes
 * that integration gap by rendering the real CircuitCanvas component and reading
 * back the placed chip's inline `top`/`height` style.
 *
 * CircuitCanvas's canvasHeightFor/computeWireYs are private, so the expected wire
 * Ys are recomputed here from the same public formula (documented in CircuitCanvas.tsx)
 * rather than importing anything — if that formula ever changes, this test's local
 * copy must be updated too, which is an intentional tripwire.
 */

function canvasHeightFor(numberOfQubits: number): number {
  return numberOfQubits >= 3 ? 240 : 200;
}

function computeWireYs(numberOfQubits: number, canvasH: number): number[] {
  return Array.from(
    { length: numberOfQubits },
    (_, i) => (canvasH * (i + 1)) / (numberOfQubits + 1),
  );
}

const TWO_QUBIT_GLYPH_Y_PAD = 12;

function extractChipTopAndHeight(markup: string, gateId: string): { top: number; height: number } {
  // The placed Toffoli chip is the outer div rendered by SortablePlacedMultiQubitGate,
  // identified by its aria-label; its inline style carries top/height in px.
  const labelIdx = markup.indexOf(`aria-label="${Gate.TOFFOLI} gate"`);
  expect(labelIdx, `expected to find a rendered chip for ${gateId}`).toBeGreaterThan(-1);
  // Walk backwards from the aria-label to the start of this element's opening tag
  // to read its style attribute (style is emitted before aria-label by React SSR).
  const tagStart = markup.lastIndexOf("<div", labelIdx);
  const tagEnd = markup.indexOf(">", labelIdx);
  const openingTag = markup.slice(tagStart, tagEnd);

  const topMatch = openingTag.match(/top:\s*([\d.]+)px/);
  const heightMatch = openingTag.match(/height:\s*([\d.]+)px/);
  expect(topMatch, "expected a top:Npx style on the chip").not.toBeNull();
  expect(heightMatch, "expected a height:Npx style on the chip").not.toBeNull();

  return { top: Number(topMatch![1]), height: Number(heightMatch![1]) };
}

describe("CircuitCanvas — placed Toffoli spans the real 3-qubit wire geometry", () => {
  it("chip bottom edge reaches wire q2's real y-position (not a fixed 90px guess)", () => {
    const numberOfQubits = 3;
    const canvasH = canvasHeightFor(numberOfQubits);
    const wireYs = computeWireYs(numberOfQubits, canvasH);
    expect(wireYs).toEqual([60, 120, 180]);

    const toffoli: PlacedThreeQubitGate = {
      id: "toffoli-geom-test",
      type: Gate.TOFFOLI,
      order: [0, 1, 2],
      column: 0,
    };

    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <CircuitCanvas
          gates={[toffoli]}
          numberOfQubits={numberOfQubits}
          onRemoveGate={vi.fn()}
          onSetGateOrder={vi.fn()}
          onSetThreeQubitTarget={vi.fn()}
          onSetGateTheta={vi.fn()}
          onClear={vi.fn()}
          isChecking={false}
        />
      </TooltipProvider>
    );

    const { top, height } = extractChipTopAndHeight(markup, toffoli.id);
    const bottomEdge = top + height;

    // Before the fix: height was a hardcoded 90, giving bottomEdge = 48 + 90 = 138 —
    // 42px short of wire q2 (180). The chip must reach at least wireYs[2], with the
    // same pad convention twoQubitGlyphLayout uses for every other multi-qubit gate.
    expect(top).toBeCloseTo(wireYs[0] - TWO_QUBIT_GLYPH_Y_PAD, 5);
    expect(bottomEdge).toBeGreaterThanOrEqual(wireYs[2]);
  });

  it("the target-wire picker's rows are positioned within the corrected (not the old undersized) chip height", () => {
    const numberOfQubits = 3;
    const wireYs = computeWireYs(numberOfQubits, canvasHeightFor(numberOfQubits));

    const toffoli: PlacedThreeQubitGate = {
      id: "toffoli-picker-test",
      type: Gate.TOFFOLI,
      order: [0, 1, 2],
      column: 0,
    };

    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <CircuitCanvas
          gates={[toffoli]}
          numberOfQubits={numberOfQubits}
          onRemoveGate={vi.fn()}
          onSetGateOrder={vi.fn()}
          onSetThreeQubitTarget={vi.fn()}
          onSetGateTheta={vi.fn()}
          onClear={vi.fn()}
          isChecking={false}
        />
      </TooltipProvider>
    );

    const { top, height } = extractChipTopAndHeight(markup, toffoli.id);

    // Regression guard for the old bug (height=90): the fixed chip must be tall
    // enough that its own internal wireYs (threeWireYs) land close to where the
    // real canvas wires actually are, not compressed into the top fraction of the
    // real span.
    const realSpan = wireYs[2] - wireYs[0];
    expect(height).toBeGreaterThanOrEqual(realSpan);
    expect(top + height).toBeGreaterThanOrEqual(wireYs[2]);
  });
});
