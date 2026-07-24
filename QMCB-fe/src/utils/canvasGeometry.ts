/**
 * Shared canvas layout constants.
 * Re-exported here so CircuitCanvas, useDragAndDrop, and tests all read from
 * one source of truth instead of duplicating the numbers.
 */

import type { PlacedTwoQubitGate } from "../types/global";
import { absoluteWires } from "./twoQubitPlacement";

/** Left/right padding before the first gate column (px). */
export const CANVAS_PAD_X = 100;

/** Horizontal distance between adjacent gate columns (px). */
export const CANVAS_COL_W = 90;

/** Vertical pad above the top endpoint of a 2-qubit glyph (matches GateDesign yTop). */
export const TWO_QUBIT_GLYPH_Y_PAD = 12;

/**
 * Absolute top + wire-pair span for a 2-qubit glyph on the canvas.
 * `wires` are absolute endpoint indices (from absoluteWires): adjacent [0,1]/[1,2]
 * or skip-wire [0,2]. Glyph endpoints sit on those wires; any wire between is
 * visually crossed by the stem with no mark.
 */
export function twoQubitGlyphLayout(
  wireYs: readonly number[],
  wires: readonly [number, number]
): { top: number; wireSpan: number } {
  const maxIdx = Math.max(0, wireYs.length - 1);
  let lo = Math.min(wires[0], wires[1]);
  let hi = Math.max(wires[0], wires[1]);
  lo = Math.max(0, Math.min(lo, maxIdx));
  hi = Math.max(lo, Math.min(hi, maxIdx));
  // Degenerate after clamp (e.g. [1,2] asked on a 2-wire canvas) → sole adjacent pair.
  if (hi === lo && maxIdx >= 1) {
    lo = Math.max(0, maxIdx - 1);
    hi = maxIdx;
  }
  const topY = wireYs[lo] ?? 0;
  const botY = wireYs[hi] ?? topY;
  return {
    top: topY - TWO_QUBIT_GLYPH_Y_PAD,
    wireSpan: Math.max(0, botY - topY),
  };
}

/** Layout from a placed 2q gate via absoluteWires (Phase 1 source of truth). */
export function twoQubitGlyphLayoutForGate(
  wireYs: readonly number[],
  gate: Pick<PlacedTwoQubitGate, "baseWire" | "extended">
): { top: number; wireSpan: number } {
  return twoQubitGlyphLayout(wireYs, absoluteWires(gate as PlacedTwoQubitGate));
}
