/**
 * Derives the visible toolbox from persisted progression.
 * Starting primitives + one gate per advanced-past level (unless noGatesetUnlock).
 */

import { LEVEL_ORDER } from "../config/levels";
import { arityFor } from "../config/gates";
import { Gate } from "../types/global";

const STARTING_GATES = [Gate.RZ, Gate.SQRT_X] as const;

/** Canonical chip order in the gateset panel (singles, then two-qubit, then three-qubit). */
export const TOOLBOX_GATE_ORDER: readonly Gate[] = [
  Gate.RZ,
  Gate.SQRT_X,
  Gate.X,
  Gate.Z,
  Gate.S,
  Gate.S_DAG,
  Gate.T,
  Gate.T_DAG,
  Gate.H,
  Gate.Y,
  Gate.RX,
  Gate.RY,
  Gate.CNOT,
  Gate.CNOT_FLIPPED,
  Gate.CONTROLLED_Z,
  Gate.SWAP,
  Gate.CONTROLLED_H,
  Gate.CONTROLLED_U,
  Gate.TOFFOLI,
  Gate.FREDKIN,
];

function gateMaxQubits(gate: Gate): number {
  if (gate === Gate.TOFFOLI || gate === Gate.FREDKIN) return 3;
  return arityFor(gate) === 2 ? 2 : 1;
}

/**
 * Gates available on the solve page for the given qubit count and progression.
 * Source of truth: advancedPastLevels (updated on Next Level / Repeat, not on Check).
 */
export function computeAvailableGates(
  advancedPastLevels: readonly string[],
  numberOfQubits: number,
): Gate[] {
  const unlocked = new Set<Gate>(STARTING_GATES);
  const past = new Set(advancedPastLevels);

  for (const level of LEVEL_ORDER) {
    if (!past.has(level.target_unitary)) continue;
    if (level.noGatesetUnlock) continue;
    if (level.target_unitary === Gate.RANDOM_U) continue;
    unlocked.add(level.target_unitary);
  }

  return TOOLBOX_GATE_ORDER.filter(
    (g) => unlocked.has(g) && gateMaxQubits(g) <= numberOfQubits,
  );
}
