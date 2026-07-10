/**
 * GATE UI CONFIG:
 * Single source of truth for toolbox label, toolId, and description per gate.
 * Consumed by Gateset.tsx, MobileSolveLayout.tsx, and useDragAndDrop.ts.
 *
 * X_DAG is intentionally absent — level 1.2 (X-dag) uses the plain X chip
 * because X† = X exactly, so no separate dagger chip is offered.
 */

import { Gate } from "../types/global";

export const GATE_UI_CONFIG: Partial<Record<Gate, { label: string; toolId: string; description: string }>> = {
  // ── Original single-qubit gates ──────────────────────────────────────────────
  [Gate.X]: {
    label: "X",
    description: "Pauli bit flip",
    toolId: "tool-x",
  },
  [Gate.SQRT_X]: {
    label: "√X",
    description: "Sqrt_X gate",
    toolId: "tool-sqrt-x",
  },
  [Gate.S]: {
    label: "S",
    description: "π/2 phase on |1⟩",
    toolId: "tool-s",
  },
  [Gate.T]: {
    label: "T",
    description: "π/4 phase on |1⟩",
    toolId: "tool-t",
  },
  [Gate.H]: {
    label: "H",
    description: "Hadamard superposition",
    toolId: "tool-h",
  },
  [Gate.RX]: {
    label: "Rx(θ)",
    description: "Rotate around X axis",
    toolId: "tool-rx",
  },
  [Gate.RY]: {
    label: "Ry(θ)",
    description: "Rotate around Y axis",
    toolId: "tool-ry",
  },
  [Gate.RZ]: {
    label: "Rz(θ)",
    description: "Rotate around Z axis",
    toolId: "tool-rz",
  },
  [Gate.U]: {
    label: "U",
    description: "General single-qubit unitary",
    toolId: "tool-u",
  },
  // ── New Tier 1 single-qubit gates ─────────────────────────────────────────────
  [Gate.SQRT_X_DAG]: {
    label: "√X†",
    description: "Inverse square-root-of-X",
    toolId: "tool-sqrt-x-dag",
  },
  [Gate.Z]: {
    label: "Z",
    description: "Pauli Z phase flip",
    toolId: "tool-z",
  },
  [Gate.Z_DAG]: {
    label: "Z†",
    description: "Z-dag (equals Z)",
    toolId: "tool-z-dag",
  },
  [Gate.S_DAG]: {
    label: "S†",
    description: "−π/2 phase on |1⟩",
    toolId: "tool-s-dag",
  },
  [Gate.T_DAG]: {
    label: "T†",
    description: "−π/4 phase on |1⟩",
    toolId: "tool-t-dag",
  },
  [Gate.H_DAG]: {
    label: "H†",
    description: "H-dag (equals H)",
    toolId: "tool-h-dag",
  },
  [Gate.Y]: {
    label: "Y",
    description: "Pauli Y rotation",
    toolId: "tool-y",
  },
  [Gate.Y_DAG]: {
    label: "Y†",
    description: "Y-dag (equals Y)",
    toolId: "tool-y-dag",
  },
  // ── Two-qubit gates ───────────────────────────────────────────────────────────
  [Gate.CNOT]: {
    label: "CNOT",
    description: "Controlled NOT gate",
    toolId: "tool-cnot",
  },
  [Gate.CNOT_FLIPPED]: {
    label: "CNOT↕",
    description: "Flipped control & target",
    toolId: "tool-cnot-flipped",
  },
  [Gate.CONTROLLED_Z]: {
    label: "CZ",
    description: "Controlled phase on |11⟩",
    toolId: "tool-cz",
  },
  [Gate.SWAP]: {
    label: "SWAP",
    description: "Exchange two qubits",
    toolId: "tool-swap",
  },
  [Gate.CONTROLLED_H]: {
    label: "CH",
    description: "Controlled Hadamard",
    toolId: "tool-ch",
  },
  [Gate.CONTROLLED_U]: {
    label: "CU",
    description: "Controlled unitary",
    toolId: "tool-cu",
  },
};

/** Maps every drag toolId string to its Gate enum value. */
export const TOOL_TO_GATE: Record<string, Gate> = {
  "tool-x": Gate.X,
  "tool-sqrt-x": Gate.SQRT_X,
  "tool-sqrt-x-dag": Gate.SQRT_X_DAG,
  "tool-z": Gate.Z,
  "tool-z-dag": Gate.Z_DAG,
  "tool-s": Gate.S,
  "tool-s-dag": Gate.S_DAG,
  "tool-t": Gate.T,
  "tool-t-dag": Gate.T_DAG,
  "tool-h": Gate.H,
  "tool-h-dag": Gate.H_DAG,
  "tool-y": Gate.Y,
  "tool-y-dag": Gate.Y_DAG,
  "tool-rx": Gate.RX,
  "tool-ry": Gate.RY,
  "tool-rz": Gate.RZ,
  "tool-u": Gate.U,
  "tool-cnot": Gate.CNOT,
  "tool-cnot-flipped": Gate.CNOT_FLIPPED,
  "tool-cz": Gate.CONTROLLED_Z,
  "tool-swap": Gate.SWAP,
  "tool-ch": Gate.CONTROLLED_H,
  "tool-cu": Gate.CONTROLLED_U,
};
