/**
 * GATE CONFIGURATION:
 * Primitive-gate UI metadata.
 * Purpose: tell the UI what options to offer (labels, allowed orders, params),
 * never to simulate or enforce target recipes.
 */

import { Gate, type ControlTargetOrder, type TwoQubitGate, type ThreeQubitGate } from "../types/global";
import { ALLOWED_QUBIT_ORDERS } from "../utils/constants";
import { formatGateDisplayName } from "../utils/gateDisplayNames";

/** Legal control–target orders for a given primitive gate (UI dropdown) */
export function allowedOrdersFor(gate: Gate): readonly ControlTargetOrder[] {
  switch (gate) {
    case Gate.CNOT:
      return ALLOWED_QUBIT_ORDERS;
    default:
      return ALLOWED_QUBIT_ORDERS; // future-proofing
  }
}

/** Display label for a gate chip. */
export function labelFor(gate: Gate): string {
  return formatGateDisplayName(gate);
}

/**
 * Keeping the functions below for future proofing
 */

export function isValidOrderFor(gate: Gate, order: ControlTargetOrder): boolean {
  return allowedOrdersFor(gate).some((o) => o[0] === order[0] && o[1] === order[1]);
}

/**
 * Arity for toolbox placement: 3 → addThreeQubitGate path; 2 → addTwoQubitGate
 * path; 1 → single-wire path.
 */
export function arityFor(gate: Gate): 1 | 2 | 3 {
  switch (gate) {
    case Gate.CNOT:
    case Gate.CNOT_FLIPPED:
    case Gate.CONTROLLED_Z:
    case Gate.SWAP:
    case Gate.CONTROLLED_H:
    case Gate.CONTROLLED_U:
      return 2;
    case Gate.TOFFOLI:
      return 3;
    default:
      return 1;
  }
}

/** True when a toolbox chip must be placed via addTwoQubitGate (order + baseWire). */
export function isTwoQubitToolboxGate(gate: Gate): gate is TwoQubitGate {
  return arityFor(gate) === 2;
}

/** True when a toolbox chip must be placed via addThreeQubitGate (fixed 3-wire span). */
export function isThreeQubitToolboxGate(gate: Gate): gate is ThreeQubitGate {
  return arityFor(gate) === 3;
}
