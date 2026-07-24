import type { SingleWire, TwoQubitBaseWire } from "../types/global";

/** Return true when `wire` is a valid index for the active level's canvas. */
export function isValidSingleWire(wire: number, numberOfQubits: number): wire is SingleWire {
  return Number.isInteger(wire) && wire >= 0 && wire < numberOfQubits;
}

/**
 * Map a drop-cell wire index to the top of an adjacent 2-qubit pair.
 * Rule: base = min(droppedWire, numberOfQubits - 2).
 * On a 3-qubit canvas: wire 0 → base 0 (pair 0–1); wires 1 or 2 → base 1 (pair 1–2).
 * Guarantees a valid adjacent pair by construction (never a single wire).
 */
export function baseWireFromDropWire(
  droppedWire: number,
  numberOfQubits: number
): TwoQubitBaseWire {
  if (numberOfQubits < 2) return 0;
  const maxBase = numberOfQubits - 2;
  return Math.max(0, Math.min(Math.trunc(droppedWire), maxBase)) as TwoQubitBaseWire;
}
