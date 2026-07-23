/**
 * Derives the visible toolbox from persisted progression.
 * Starting primitives + one gate per level advanced past or skipped (unless noGatesetUnlock).
 * Special cases: RANDOM_U grants U; clearing Tier 1 finale (RANDOM_U) also grants CNOT
 * until CNOT_FLIPPED is unlocked (then CNOT↕ replaces plain CNOT).
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
  Gate.U,
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
 * A level grants its gate when the student advanced past it (Next/Repeat) or skipped it.
 */
export function computeAvailableGates(
  advancedPastLevels: readonly string[],
  skippedLevels: readonly string[],
  numberOfQubits: number,
): Gate[] {
  const unlocked = new Set<Gate>(STARTING_GATES);
  const grantingLevels = new Set([...advancedPastLevels, ...skippedLevels]);

  for (const level of LEVEL_ORDER) {
    if (!grantingLevels.has(level.target_unitary)) continue;
    if (level.noGatesetUnlock) continue;
    if (level.target_unitary === Gate.RANDOM_U) {
      unlocked.add(Gate.U);
      continue;
    }
    unlocked.add(level.target_unitary);
  }

  // Tier-2 starting primitive: CNOT is not itself a level target, so grant it
  // once the student has advanced past / skipped Tier 1 finale (RANDOM_U).
  // Drop it once CNOT_FLIPPED is unlocked — the flipped chip + order toggle replace it.
  if (grantingLevels.has(Gate.RANDOM_U) && !unlocked.has(Gate.CNOT_FLIPPED)) {
    unlocked.add(Gate.CNOT);
  }

  return TOOLBOX_GATE_ORDER.filter(
    (g) => unlocked.has(g) && gateMaxQubits(g) <= numberOfQubits,
  );
}
