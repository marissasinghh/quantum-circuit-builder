/**
 * Shared canvas layout constants.
 * Re-exported here so CircuitCanvas, useDragAndDrop, and tests all read from
 * one source of truth instead of duplicating the numbers.
 */

/** Left/right padding before the first gate column (px). */
export const CANVAS_PAD_X = 100;

/** Horizontal distance between adjacent gate columns (px). */
export const CANVAS_COL_W = 90;

/** Vertical pad above the top endpoint of a 2-qubit glyph (matches GateDesign yTop). */
export const TWO_QUBIT_GLYPH_Y_PAD = 12;

/**
 * Absolute top + wire-pair span for a 2-qubit glyph on the canvas.
 * baseWire 0 → wires 0–1; baseWire 1 → wires 1–2 (3-qubit canvases).
 */
export function twoQubitGlyphLayout(
  wireYs: readonly number[],
  baseWire: 0 | 1
): { top: number; wireSpan: number } {
  const maxBase = Math.max(0, wireYs.length - 2);
  const lo = Math.min(baseWire, maxBase);
  const topY = wireYs[lo] ?? 0;
  const botY = wireYs[lo + 1] ?? topY;
  return {
    top: topY - TWO_QUBIT_GLYPH_Y_PAD,
    wireSpan: Math.max(0, botY - topY),
  };
}
