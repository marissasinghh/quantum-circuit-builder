/**
 * GATE CONFIGURATION:
 * Primitive-gate UI metadata.
 * Purpose: tell the UI what options to offer (labels, allowed orders, params),
 * never to simulate or enforce target recipes.
 */

import { Gate, type ControlTargetOrder } from "../types/global";
import { ALLOWED_QUBIT_ORDERS } from "../utils/constants";

/** Legal control–target orders for a given primitive gate (UI dropdown) */
export function allowedOrdersFor(gate: Gate): readonly ControlTargetOrder[] {
  switch (gate) {
    case Gate.CNOT:
      return ALLOWED_QUBIT_ORDERS;
    default:
      return ALLOWED_QUBIT_ORDERS; // future-proofing
  }
}

/** Display label for a gate chip. Extend later (e.g., "Rz(θ)") */
export function labelFor(gate: Gate): string {
  return gate;
}

/**
 * Keeping the functions below for future proofing
 */

export function isValidOrderFor(gate: Gate, order: ControlTargetOrder): boolean {
  return allowedOrdersFor(gate).some((o) => o[0] === order[0] && o[1] === order[1]);
}

// Will help later when we add X, Rz, etc. (single qubit gates)
export function arityFor(gate: Gate): 1 | 2 {
  switch (gate) {
    case Gate.CNOT:
    case Gate.CNOT_FLIPPED:
    case Gate.CONTROLLED_Z:
    case Gate.SWAP:
    case Gate.CONTROLLED_H:
    case Gate.CONTROLLED_U:
      return 2;
    default:
      return 1;
  }
}
