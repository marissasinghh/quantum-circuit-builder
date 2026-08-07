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

/**
 * Regression test for the dashed placement-preview span bug: dragging a Toffoli
 * (either a fresh toolbox chip or an already-placed one being reordered) must
 * show a dashed box spanning the FULL 3-wire range, not the old hardcoded
 * adjacent-pair (2-wire) box that pairDropPreview used for every multi-qubit
 * gate regardless of arity.
 */
describe("CircuitCanvas — Toffoli drag shows a full 3-wire dashed preview", () => {
  const SQ_H = 40;

  function extractPreviewBox(markup: string): { top: number; height: number } | null {
    // Locate the dashed-preview div via its distinctive outline style, then read
    // its top/height back off the same inline style string.
    const idx = markup.indexOf("outline:2px dashed");
    if (idx === -1) return null;
    const tagStart = markup.lastIndexOf("<div", idx);
    const tagEnd = markup.indexOf(">", idx);
    const openingTag = markup.slice(tagStart, tagEnd);
    const topMatch = openingTag.match(/top:([\d.]+)px/);
    const heightMatch = openingTag.match(/height:([\d.]+)px/);
    if (!topMatch || !heightMatch) return null;
    return { top: Number(topMatch[1]), height: Number(heightMatch[1]) };
  }

  it("toolbox drag of a fresh Toffoli spans wires 0–2, not just an adjacent pair", () => {
    const numberOfQubits = 3;
    const wireYs = computeWireYs(numberOfQubits, canvasHeightFor(numberOfQubits));
    expect(wireYs).toEqual([60, 120, 180]);

    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <CircuitCanvas
          gates={[]}
          numberOfQubits={numberOfQubits}
          activeId="tool-toffoli"
          hoveredCellId="cell-col0-wire1"
          onRemoveGate={vi.fn()}
          onSetGateOrder={vi.fn()}
          onSetThreeQubitTarget={vi.fn()}
          onSetGateTheta={vi.fn()}
          onClear={vi.fn()}
          isChecking={false}
        />
      </TooltipProvider>
    );

    const box = extractPreviewBox(markup);
    expect(box, "expected a dashed preview box to render for a Toffoli toolbox drag").not.toBeNull();
    // Full span regardless of which wire is hovered — must reach wire 0's top and wire 2's bottom
    // (box top/bottom are pairDropPreview's own SQ_H/2-based inset, per its `top:
    // wireYs[baseWire] - SQ_H/2` computation — not the glyph-container's TWO_QUBIT_GLYPH_Y_PAD).
    expect(box!.top).toBeCloseTo(wireYs[0] - SQ_H / 2, 5);
    expect(box!.top + box!.height).toBeCloseTo(wireYs[2] + SQ_H / 2, 5);
  });

  it("reordering an already-placed Toffoli also spans wires 0–2 (not the old 2-wire pair box)", () => {
    const numberOfQubits = 3;
    const wireYs = computeWireYs(numberOfQubits, canvasHeightFor(numberOfQubits));

    const toffoli: PlacedThreeQubitGate = {
      id: "toffoli-reorder-test",
      type: Gate.TOFFOLI,
      order: [0, 1, 2],
      column: 0,
    };

    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <CircuitCanvas
          gates={[toffoli]}
          numberOfQubits={numberOfQubits}
          activeId={toffoli.id}
          hoveredCellId="cell-col1-wire1"
          onRemoveGate={vi.fn()}
          onSetGateOrder={vi.fn()}
          onSetThreeQubitTarget={vi.fn()}
          onSetGateTheta={vi.fn()}
          onClear={vi.fn()}
          isChecking={false}
        />
      </TooltipProvider>
    );

    const box = extractPreviewBox(markup);
    expect(box, "expected a dashed preview box when reordering a placed Toffoli").not.toBeNull();
    expect(box!.top).toBeCloseTo(wireYs[0] - SQ_H / 2, 5);
    expect(box!.top + box!.height).toBeCloseTo(wireYs[2] + SQ_H / 2, 5);
  });

  it("CNOT drag preview is unchanged — still a 2-wire adjacent-pair box", () => {
    const numberOfQubits = 3;
    const wireYs = computeWireYs(numberOfQubits, canvasHeightFor(numberOfQubits));

    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <CircuitCanvas
          gates={[]}
          numberOfQubits={numberOfQubits}
          activeId="tool-cnot"
          hoveredCellId="cell-col0-wire0"
          onRemoveGate={vi.fn()}
          onSetGateOrder={vi.fn()}
          onSetThreeQubitTarget={vi.fn()}
          onSetGateTheta={vi.fn()}
          onClear={vi.fn()}
          isChecking={false}
        />
      </TooltipProvider>
    );

    const box = extractPreviewBox(markup);
    expect(box, "expected a dashed preview box for a CNOT drag").not.toBeNull();
    // Adjacent-pair span (wires 0-1), NOT the full 0-2 Toffoli span.
    expect(box!.top).toBeCloseTo(wireYs[0] - SQ_H / 2, 5);
    const bottomEdge = box!.top + box!.height;
    expect(bottomEdge).toBeLessThan(wireYs[2]);
    expect(bottomEdge).toBeCloseTo(wireYs[1] + SQ_H / 2, 5);
  });
});
