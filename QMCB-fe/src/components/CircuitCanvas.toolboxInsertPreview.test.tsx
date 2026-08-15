import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Gate, type PlacedGate, type PlacedSingleQubitGate, type PlacedTwoQubitGate } from "../types/global";
import { CircuitCanvas } from "./CircuitCanvas";
import { TooltipProvider } from "./Tooltip";
import { CANVAS_COL_W, CANVAS_PAD_X } from "../utils/canvasGeometry";
import { formatGateDisplayName } from "../utils/gateDisplayNames";

/**
 * Toolbox-hover insert preview: neighbors must slide via speculativeMap + chip
 * `left`, same pipeline as placed-gate reorder. DragOverlay is omitted here
 * (SSR); we assert the committed chips' inline left (and top for D2).
 */

const SQ_W = 44;
const SQ_H = 40;
const MULTI_W = 80;

function leftForColumn(col: number, chipWidth: number): number {
  return CANVAS_PAD_X + col * CANVAS_COL_W - chipWidth / 2;
}

function canvasHeightFor(numberOfQubits: number): number {
  return numberOfQubits >= 3 ? 240 : 200;
}

function computeWireYs(numberOfQubits: number, canvasH: number): number[] {
  return Array.from(
    { length: numberOfQubits },
    (_, i) => (canvasH * (i + 1)) / (numberOfQubits + 1),
  );
}

const noop = {
  onRemoveGate: vi.fn(),
  onSetGateOrder: vi.fn(),
  onSetThreeQubitTarget: vi.fn(),
  onSetGateTheta: vi.fn(),
  onClear: vi.fn(),
  isChecking: false,
};

function renderCanvas(
  gates: PlacedGate[],
  numberOfQubits: number,
  activeId?: string | null,
  hoveredCellId?: string | null,
): string {
  return renderToStaticMarkup(
    <TooltipProvider>
      <CircuitCanvas
        gates={gates}
        numberOfQubits={numberOfQubits}
        activeId={activeId ?? null}
        hoveredCellId={hoveredCellId ?? null}
        {...noop}
      />
    </TooltipProvider>,
  );
}

function extractChipLeft(markup: string, ariaLabel: string): number {
  const labelIdx = markup.indexOf(`aria-label="${ariaLabel}"`);
  expect(labelIdx, `expected chip with aria-label "${ariaLabel}"`).toBeGreaterThan(-1);
  const tagStart = markup.lastIndexOf("<div", labelIdx);
  const tagEnd = markup.indexOf(">", labelIdx);
  const openingTag = markup.slice(tagStart, tagEnd);
  const leftMatch = openingTag.match(/left:\s*([\d.]+)px/);
  expect(leftMatch, `expected left:Npx on "${ariaLabel}"`).not.toBeNull();
  return Number(leftMatch![1]);
}

function extractChipTop(markup: string, ariaLabel: string): number {
  const labelIdx = markup.indexOf(`aria-label="${ariaLabel}"`);
  expect(labelIdx, `expected chip with aria-label "${ariaLabel}"`).toBeGreaterThan(-1);
  const tagStart = markup.lastIndexOf("<div", labelIdx);
  const tagEnd = markup.indexOf(">", labelIdx);
  const openingTag = markup.slice(tagStart, tagEnd);
  const topMatch = openingTag.match(/top:\s*([\d.]+)px/);
  expect(topMatch, `expected top:Npx on "${ariaLabel}"`).not.toBeNull();
  return Number(topMatch![1]);
}

const x0: PlacedSingleQubitGate = { id: "x0", type: Gate.X, wire: 0, column: 0 };
const z1: PlacedSingleQubitGate = { id: "z1", type: Gate.Z, wire: 0, column: 1 };
const hWire1: PlacedSingleQubitGate = { id: "h1", type: Gate.H, wire: 1, column: 1 };
const cnot0: PlacedTwoQubitGate = {
  id: "cnot0",
  type: Gate.CNOT,
  order: [0, 1],
  baseWire: 0,
  column: 0,
};

describe("CircuitCanvas — toolbox hover slides neighbors (insert preview)", () => {
  it("1q toolbox hover mid-circuit shifts later chips one column right", () => {
    const committed = renderCanvas([x0, z1], 2);
    expect(extractChipLeft(committed, `${formatGateDisplayName(Gate.X)} gate on wire 0`)).toBe(
      leftForColumn(0, SQ_W),
    );
    expect(extractChipLeft(committed, `${formatGateDisplayName(Gate.Z)} gate on wire 0`)).toBe(
      leftForColumn(1, SQ_W),
    );

    const hovering = renderCanvas([x0, z1], 2, "tool-h", "cell-col1-wire0");
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.X)} gate on wire 0`)).toBe(
      leftForColumn(0, SQ_W),
    );
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.Z)} gate on wire 0`)).toBe(
      leftForColumn(2, SQ_W),
    );
  });

  it("2q toolbox hover mid-circuit shifts later chips on every wire", () => {
    const gates: PlacedGate[] = [x0, hWire1];
    const hovering = renderCanvas(gates, 2, "tool-cnot", "cell-col1-wire0");
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.X)} gate on wire 0`)).toBe(
      leftForColumn(0, SQ_W),
    );
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.H)} gate on wire 1`)).toBe(
      leftForColumn(2, SQ_W),
    );
  });

  it("3q toolbox hover mid-circuit shifts later chips including a placed CNOT", () => {
    const later: PlacedSingleQubitGate = { id: "z2", type: Gate.Z, wire: 2, column: 1 };
    const hovering = renderCanvas([cnot0, later], 3, "tool-toffoli", "cell-col1-wire1");
    expect(extractChipLeft(hovering, `${Gate.CNOT} gate`)).toBe(leftForColumn(0, MULTI_W));
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.Z)} gate on wire 2`)).toBe(
      leftForColumn(2, SQ_W),
    );
  });

  it("hovering the trailing empty cell does not move existing chips", () => {
    const hovering = renderCanvas([x0, z1], 2, "tool-h", "cell-col2-wire0");
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.X)} gate on wire 0`)).toBe(
      leftForColumn(0, SQ_W),
    );
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.Z)} gate on wire 0`)).toBe(
      leftForColumn(1, SQ_W),
    );
  });

  it("clearing the drag (cancel) restores committed positions", () => {
    const hovering = renderCanvas([x0, z1], 2, "tool-h", "cell-col1-wire0");
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.Z)} gate on wire 0`)).toBe(
      leftForColumn(2, SQ_W),
    );

    const cancelled = renderCanvas([x0, z1], 2, null, null);
    expect(extractChipLeft(cancelled, `${formatGateDisplayName(Gate.Z)} gate on wire 0`)).toBe(
      leftForColumn(1, SQ_W),
    );
  });
});

describe("CircuitCanvas — placed-gate preview is unchanged", () => {
  it("D1 reorder: dragging Z onto column 0 slides X to the right", () => {
    const hovering = renderCanvas([x0, z1], 2, z1.id, "cell-col0-wire0");
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.Z)} gate on wire 0`)).toBe(
      leftForColumn(0, SQ_W),
    );
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.X)} gate on wire 0`)).toBe(
      leftForColumn(1, SQ_W),
    );
  });

  it("D2 cross-wire: dragging X to wire 1 keeps column and updates top", () => {
    const numberOfQubits = 2;
    const wireYs = computeWireYs(numberOfQubits, canvasHeightFor(numberOfQubits));
    const hovering = renderCanvas([x0, z1], numberOfQubits, x0.id, "cell-col0-wire1");
    expect(extractChipLeft(hovering, `${formatGateDisplayName(Gate.X)} gate on wire 0`)).toBe(
      leftForColumn(0, SQ_W),
    );
    expect(extractChipTop(hovering, `${formatGateDisplayName(Gate.X)} gate on wire 0`)).toBeCloseTo(
      wireYs[1] - SQ_H / 2,
      5,
    );
  });
});
