import { describe, expect, it } from "vitest";
import type { Active, ClientRect, DroppableContainer } from "@dnd-kit/core";

import {
  cellFirstCollision,
  isTwoQubitActiveDrag,
  resolvePairBaseWireFromPointerY,
} from "./collisionDetection";

function asActive(partial: { id: string; data: { current: unknown } }): Active {
  return partial as unknown as Active;
}

/** Equal-spaced 3-wire centres (matches canvas layout proportions). */
const WIRE_YS_3 = [60, 120, 180] as const;
const WIRE_YS_2 = [66, 133] as const;

describe("resolvePairBaseWireFromPointerY", () => {
  it("prefers pair 0–1 when pointer is at the lower wire of that pair (tie → lower base)", () => {
    // Wire 1 is equidistant from mid(0,1) and mid(1,2); ties keep base 0.
    expect(resolvePairBaseWireFromPointerY(WIRE_YS_3[1], WIRE_YS_3)).toBe(0);
  });

  it("selects pair 0–1 when pointer is near the top wire / pair-0 midpoint", () => {
    const mid01 = (WIRE_YS_3[0] + WIRE_YS_3[1]) / 2;
    expect(resolvePairBaseWireFromPointerY(mid01, WIRE_YS_3)).toBe(0);
    expect(resolvePairBaseWireFromPointerY(WIRE_YS_3[0], WIRE_YS_3)).toBe(0);
  });

  it("selects pair 1–2 when pointer is nearer that pair's midpoint", () => {
    const mid12 = (WIRE_YS_3[1] + WIRE_YS_3[2]) / 2;
    expect(resolvePairBaseWireFromPointerY(mid12, WIRE_YS_3)).toBe(1);
    expect(resolvePairBaseWireFromPointerY(WIRE_YS_3[2], WIRE_YS_3)).toBe(1);
  });

  it("always returns 0 on a 2-wire canvas", () => {
    expect(resolvePairBaseWireFromPointerY(WIRE_YS_2[0], WIRE_YS_2)).toBe(0);
    expect(resolvePairBaseWireFromPointerY(WIRE_YS_2[1], WIRE_YS_2)).toBe(0);
  });
});

describe("isTwoQubitActiveDrag", () => {
  it("reads multiQubit from drag data", () => {
    expect(
      isTwoQubitActiveDrag(asActive({ id: "g1", data: { current: { multiQubit: true } } })),
    ).toBe(true);
    expect(
      isTwoQubitActiveDrag(asActive({ id: "g1", data: { current: { multiQubit: false } } })),
    ).toBe(false);
  });

  it("infers toolbox 2q from tool id when data is absent", () => {
    expect(
      isTwoQubitActiveDrag(asActive({ id: "tool-cnot", data: { current: undefined } })),
    ).toBe(true);
    expect(
      isTwoQubitActiveDrag(asActive({ id: "tool-rz", data: { current: undefined } })),
    ).toBe(false);
  });
});

function makeRect(left: number, top: number, width: number, height: number): ClientRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function buildThreeWireColumn(col: number, wireYs: readonly number[]) {
  const containers: DroppableContainer[] = [];
  const rects = new Map<string | number, ClientRect>();
  const SQ_W = 44;
  const SQ_H = 40;
  const PAD_X = 100;
  const COL_W = 90;

  for (let w = 0; w < wireYs.length; w++) {
    const id = `cell-col${col}-wire${w}`;
    containers.push({ id } as DroppableContainer);
    rects.set(
      id,
      makeRect(PAD_X + col * COL_W - SQ_W / 2, wireYs[w]! - SQ_H / 2, SQ_W, SQ_H),
    );
  }
  return { containers, rects };
}

describe("cellFirstCollision — 2q pair targeting", () => {
  const { containers, rects } = buildThreeWireColumn(0, WIRE_YS_3);
  const twoQubitActive = asActive({
    id: "cnot-1",
    data: { current: { multiQubit: true } },
  });
  const oneQubitActive = asActive({
    id: "rz-1",
    data: { current: { multiQubit: false } },
  });

  it("bottom-of-glyph Y (wire 1 centre) keeps pair 0–1 for a 2q drag", () => {
    const result = cellFirstCollision({
      active: twoQubitActive,
      collisionRect: makeRect(0, 0, 1, 1),
      droppableContainers: containers,
      droppableRects: rects,
      pointerCoordinates: {
        x: 100, // column 0 centre-ish
        y: WIRE_YS_3[1],
      },
    });
    expect(result).toEqual([{ id: "cell-col0-wire0" }]);
  });

  it("pointer near pair 1–2 midpoint returns wire1 cell for a 2q drag", () => {
    const mid12 = (WIRE_YS_3[1] + WIRE_YS_3[2]) / 2;
    const result = cellFirstCollision({
      active: twoQubitActive,
      collisionRect: makeRect(0, 0, 1, 1),
      droppableContainers: containers,
      droppableRects: rects,
      pointerCoordinates: { x: 100, y: mid12 },
    });
    expect(result).toEqual([{ id: "cell-col0-wire1" }]);
  });

  it("1q drag still uses nearest single cell (wire 1 stays wire 1)", () => {
    const result = cellFirstCollision({
      active: oneQubitActive,
      collisionRect: makeRect(0, 0, 1, 1),
      droppableContainers: containers,
      droppableRects: rects,
      pointerCoordinates: { x: 100, y: WIRE_YS_3[1] },
    });
    expect(result).toEqual([{ id: "cell-col0-wire1" }]);
  });

  it("does not read order / flip state — only multiQubit flag", () => {
    const flipped = asActive({
      id: "cnot-1",
      data: { current: { multiQubit: true, order: [1, 0] } },
    });
    const unflipped = asActive({
      id: "cnot-1",
      data: { current: { multiQubit: true, order: [0, 1] } },
    });
    const args = {
      collisionRect: makeRect(0, 0, 1, 1),
      droppableContainers: containers,
      droppableRects: rects,
      pointerCoordinates: { x: 100, y: WIRE_YS_3[1] },
    };
    expect(cellFirstCollision({ ...args, active: flipped })).toEqual(
      cellFirstCollision({ ...args, active: unflipped }),
    );
  });
});
