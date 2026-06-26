import type { SingleWire } from "../types/global";

/** Return true when `wire` is a valid index for the active level's canvas. */
export function isValidSingleWire(wire: number, numberOfQubits: number): wire is SingleWire {
  return Number.isInteger(wire) && wire >= 0 && wire < numberOfQubits;
}
