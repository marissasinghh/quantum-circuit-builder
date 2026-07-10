/**
 * Human-readable gate labels for UI display (level picker, sidebar, task headings).
 * Logic keys (Gate enum values, URLs, grading) stay as SQRT_X_DAG etc.
 * Dagger convention matches GateDesign.tsx glyphs and gateUiConfig toolbox labels.
 */

import { Gate } from "../types/global";

export const GATE_DISPLAY_NAME: Record<Gate, string> = {
  // Single-qubit primitives
  [Gate.X]: "X",
  [Gate.X_DAG]: "X†",
  [Gate.SQRT_X]: "√X",
  [Gate.SQRT_X_DAG]: "√X†",
  [Gate.Y]: "Y",
  [Gate.Y_DAG]: "Y†",
  [Gate.Z]: "Z",
  [Gate.Z_DAG]: "Z†",
  [Gate.S]: "S",
  [Gate.S_DAG]: "S†",
  [Gate.T]: "T",
  [Gate.T_DAG]: "T†",
  [Gate.H]: "H",
  [Gate.H_DAG]: "H†",
  [Gate.RX]: "Rx(θ)",
  [Gate.RY]: "Ry(θ)",
  [Gate.RZ]: "Rz(θ)",
  [Gate.U]: "U",
  [Gate.RANDOM_U]: "ARBITRARY U",

  // Two-qubit gates
  [Gate.CNOT]: "CNOT",
  [Gate.CNOT_FLIPPED]: "CNOT↕",
  [Gate.CONTROLLED_Z]: "CZ",
  [Gate.SWAP]: "SWAP",
  [Gate.CONTROLLED_H]: "CH",
  [Gate.CONTROLLED_U]: "CU",

  // Three-qubit gates
  [Gate.TOFFOLI]: "TOFFOLI",
  [Gate.FREDKIN]: "FREDKIN",
};

/** Format a Gate enum value for visible UI text (plain string; use GateDisplayLabel for superscript †). */
export function formatGateDisplayName(gate: Gate): string {
  return GATE_DISPLAY_NAME[gate] ?? gate;
}

const DAGGER_SUFFIX = "†";

/** Split a display label into base text and optional trailing dagger. */
export function getGateDisplayParts(gate: Gate): { base: string; dagger: boolean } {
  const full = formatGateDisplayName(gate);
  if (full.endsWith(DAGGER_SUFFIX)) {
    return { base: full.slice(0, -DAGGER_SUFFIX.length), dagger: true };
  }
  return { base: full, dagger: false };
}

/** Parse an arbitrary display string that may end with † (e.g. level.name overrides). */
export function parseDisplayLabel(label: string): { base: string; dagger: boolean } {
  if (label.endsWith(DAGGER_SUFFIX)) {
    return { base: label.slice(0, -DAGGER_SUFFIX.length), dagger: true };
  }
  return { base: label, dagger: false };
}
