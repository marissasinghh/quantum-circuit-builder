/**
 * Absolute wire-pair derivation for placed 2-qubit gates.
 * Single source of truth for Phases 2–4 (layout, serialize, preview).
 */

import type { PlacedTwoQubitGate, QubitIndex, TwoQubitBaseWire } from "../types/global";

/** True when the gate occupies the skip-wire pair (0, 2). */
export function isExtended(gate: PlacedTwoQubitGate): boolean {
  return gate.extended === true;
}

/**
 * Absolute wire indices the gate occupies (endpoints only — not control/target).
 * Relative `order` maps control/target onto those endpoints.
 */
export function absoluteWires(gate: PlacedTwoQubitGate): readonly [QubitIndex, QubitIndex] {
  if (isExtended(gate)) {
    return [0, 2];
  }
  return [gate.baseWire, (gate.baseWire + 1) as QubitIndex];
}

/** On-chip extend/retract control derived from placement + qubit count. */
export type TwoQubitSpanControl =
  | { kind: "extend"; direction: "up" | "down" }
  | { kind: "retract"; targetBaseWire: TwoQubitBaseWire; position: "top" | "bottom" };

/**
 * Which extend/retract icons to show. Empty when numberOfQubits < 3 (Tier-2) —
 * never show these controls on 2-qubit levels.
 */
export function twoQubitSpanControls(
  gate: Pick<PlacedTwoQubitGate, "baseWire" | "extended">,
  numberOfQubits: number
): TwoQubitSpanControl[] {
  if (numberOfQubits < 3) return [];

  if (isExtended(gate as PlacedTwoQubitGate)) {
    return [
      { kind: "retract", targetBaseWire: 0, position: "top" },
      { kind: "retract", targetBaseWire: 1, position: "bottom" },
    ];
  }

  const [w0, w1] = absoluteWires(gate as PlacedTwoQubitGate);
  if (w0 === 0 && w1 === 1) {
    return [{ kind: "extend", direction: "down" }];
  }
  if (w0 === 1 && w1 === 2) {
    return [{ kind: "extend", direction: "up" }];
  }
  return [];
}
