/**
 * LEVEL DEFINITIONS:
 * Frontend level registry for copy/UX.
 * We keep canonical solutions here for hints/docs only; FE does not enforce them.
 */

import { Gate } from "../types/global";
import {
  MAX_GATES,
  LEVEL1_QUBITS,
  LEVEL2_QUBITS,
  SINGLE_QUBIT_GATES,
  Q0,
  Q1,
  C0_T1,
  C1_T0,
  ONE_QUBIT_INPUTS,
  BASIS_0,
  BASIS_1,
  S_OUT_1,
  T_OUT_1,
  H_OUT_0,
  H_OUT_1,
  TWO_QUBIT_INPUTS,
  BASIS_00,
  BASIS_01,
  BASIS_10,
  BASIS_11,
  CH_OUT_10,
  CH_OUT_11,
  ParameterMode,
} from "../utils/constants";
import type { LevelDefinition } from "../interfaces/levelDefinition";

// ========================
// LEVEL 1.0: X GATE
// ========================
export const X_LEVEL: LevelDefinition = {
  target_unitary: Gate.X,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X] as const,

  canonical: [
    { gate: Gate.SQRT_X, order: Q0 },
    { gate: Gate.SQRT_X, order: Q0 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_1, BASIS_0],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The X gate flips a qubit: $|0\\rangle \\mapsto |1\\rangle$ and $|1\\rangle \\mapsto |0\\rangle$. It is the quantum NOT gate. Synthesize a circuit whose unitary matches X exactly.",
  hint1: "Check how Sqrt_X moves the state on the Bloch sphere.",
  hint2: "How could you use Sqrt_X to move the state further south?",
} as const;

// ========================
// LEVEL 1.1: S GATE
// ========================
export const S_LEVEL: LevelDefinition = {
  target_unitary: Gate.S,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, S_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The S gate applies a $\\frac{\\pi}{2}$ phase rotation: $|0\\rangle \\mapsto |0\\rangle$ and $|1\\rangle \\mapsto i|1\\rangle$. Synthesize a circuit whose unitary matches S exactly.",
  hint1: "S is a pure Z-axis rotation; to better visualize this rotation, place a Sqrt_X gate first to see how Rz(θ) rotates the state.",
  hint2: "What angle do you need to use to make the π/2 phase rotation?",
} as const;

// ========================
// LEVEL 1.2: T GATE
// ========================
export const T_LEVEL: LevelDefinition = {
  target_unitary: Gate.T,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.S] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 4 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, T_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The T gate applies a $\\frac{\\pi}{4}$ phase rotation: $|0\\rangle \\mapsto |0\\rangle$ and $|1\\rangle \\mapsto e^{i\\pi/4}|1\\rangle$. Synthesize a circuit whose unitary matches T exactly.",
  hint1: "The T gate is very similar to the S gate — use the same method for visualizing the Rz rotation.",
  hint2: "T is Rz at precisely half the angle you used for S.",
} as const;

// ========================
// LEVEL 1.3: H GATE
// ========================
export const H_LEVEL: LevelDefinition = {
  target_unitary: Gate.H,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.S, Gate.T] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
    { gate: Gate.SQRT_X, order: Q0},
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [H_OUT_0, H_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The Hadamard gate creates equal superposition: $|0\\rangle \\mapsto \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$ and $|1\\rangle \\mapsto \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}$. Synthesize a circuit whose unitary matches H exactly.",
  hint1: "H requires both rotation axes — combine Rz and Sqrt_X in sequence.",
  hint2: "Conjugating Sqrt_X by Rz rotations changes the effective rotation axis — try sandwiching Sqrt_X between two Rz gates.",
  insight:
    "Notice! The outputs show different complex amplitudes but the circuit still passed. This is because the circuits differed by a global phase. Global phase differences are physically unobservable — the circuits will still have identical probability columns and be physically equivalent!",
} as const;

// ========================
// LEVEL 1.4: RX GATE
// ========================
export const RX_LEVEL: LevelDefinition = {
  target_unitary: Gate.RX,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.S, Gate.T, Gate.H] as const,

  canonical: [
    { gate: Gate.H, order: Q0 },
    { gate: Gate.RZ, order: Q0 },
    { gate: Gate.H, order: Q0 },
  ],

  uiMaxGates: MAX_GATES,

  parameterMode: ParameterMode.RANDOM_THETA,

  description:
    "The $R_x(\\theta)$ gate rotates the Bloch sphere around the X axis by angle $\\theta$. Synthesize a parameterized circuit whose unitary matches $R_x(\\theta)$ for any angle $\\theta$.",
  hint1: "Which gates will translate the state to the proper axis of rotation?",
  hint2: "Conjugating a Z-axis rotation by Hadamards changes the rotation axis to X.",
} as const;

// ========================
// LEVEL 1.5: RY GATE
// ========================
export const RY_LEVEL: LevelDefinition = {
  target_unitary: Gate.RY,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.S, Gate.T, Gate.H, Gate.RX] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: -Math.PI / 2 },
    { gate: Gate.RX, order: Q0 },
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
  ],

  uiMaxGates: MAX_GATES,

  parameterMode: ParameterMode.RANDOM_THETA,

  description:
    "The $R_y(\\theta)$ gate rotates the Bloch sphere around the Y axis by angle $\\theta$. Synthesize a parameterized circuit whose unitary matches $R_y(\\theta)$ for any angle $\\theta$.",
  hint1: "Which gates will translate the state to the proper axis of rotation?",
  hint2: "Conjugating an X-axis rotation by Rz changes the rotation axis to Y.",
} as const;

// ========================
// LEVEL 1.6: RANDOM UNITARY
// ========================
export const RANDOM_U_LEVEL: LevelDefinition = {
  target_unitary: Gate.RANDOM_U,
  name: "Arbitrary U",
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.S, Gate.T, Gate.H, Gate.RX, Gate.RY] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0 },
    { gate: Gate.RY, order: Q0 },
    { gate: Gate.RZ, order: Q0 },
  ],

  parameterMode: ParameterMode.SEED_ZYZ,

  uiMaxGates: MAX_GATES,

  description:
    "A random single-qubit unitary has been generated for you. Synthesize a circuit whose " +
    "truth table matches it exactly. Use any combination of your unlocked gates.",
  hint1:
    "Any single-qubit gate can be expressed as rotations about the X, Y, and Z axes for some angles $\\theta_X$, $\\theta_Y$, and $\\theta_Z$.",
  hint2:
    "The angles $\\theta_X$, $\\theta_Y$, and $\\theta_Z$ can be solved for given the matrix elements.",
} as const;

// ========================
// LEVEL 2.1: CNOT FLIPPED
// ========================
export const CNOT_FLIPPED_LEVEL: LevelDefinition = {
  target_unitary: Gate.CNOT_FLIPPED,
  number_of_qubits: LEVEL2_QUBITS,
  toolbox: [...SINGLE_QUBIT_GATES, Gate.CNOT] as const,

  canonical: [
    { gate: Gate.H, order: Q0 },
    { gate: Gate.H, order: Q1 },
    { gate: Gate.CNOT, order: C1_T0 },
    { gate: Gate.H, order: Q0 },
    { gate: Gate.H, order: Q1 },
  ],

  expectedTruth: {
    input: TWO_QUBIT_INPUTS,
    output: [BASIS_00, BASIS_11, BASIS_10, BASIS_01],
  },

  uiMaxGates: MAX_GATES,

  description:
    "CNOT with flipped control and target: if $|q_1\\rangle = |1\\rangle$, flip $|q_0\\rangle$. Synthesize a circuit whose unitary matches the flipped CNOT exactly.",
  hint1: "Think about how conjugating a gate by single-qubit operations can change which qubit plays which role.",
  hint2: "Hadamards can swap the control and target roles of a CNOT.",
  insight:
    "A flipped CNOT and a standard CNOT are the same gate in disguise. Wrap both qubits with Hadamards on either side (H\u2297H \u00b7 CNOT \u00b7 H\u2297H) and the control and target roles effectively swap. This is called H-conjugation. It is your first look at a powerful idea: you can change what a gate does just by choosing what surrounds it.",
} as const;

// ========================
// LEVEL 2.2: CONTROLLED Z
// ========================
export const CONTROLLED_Z_LEVEL: LevelDefinition = {
  target_unitary: Gate.CONTROLLED_Z,
  number_of_qubits: LEVEL2_QUBITS,
  toolbox: [...SINGLE_QUBIT_GATES, Gate.CNOT] as const,

  canonical: [
    { gate: Gate.H, order: Q1 },
    { gate: Gate.CNOT, order: C0_T1 },
    { gate: Gate.H, order: Q1 },
  ],

  expectedTruth: {
    input: TWO_QUBIT_INPUTS,
    output: [BASIS_00, BASIS_01, BASIS_10, BASIS_11],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The CZ gate applies a $\\pi$ phase flip when both qubits are $|1\\rangle$: $|11\\rangle \\mapsto -|11\\rangle$. Synthesize a circuit whose unitary matches CZ exactly.",
  hint1: "CZ applies a phase flip — think about which single-qubit gate converts between the X and Z bases.",
  hint2: "Wrapping a CNOT with Hadamards on one qubit converts a bit-flip into a phase-flip.",
  insight:
    "The truth table shows |11\u27e9 mapping to |11\u27e9, but something is hidden: CZ actually applies a phase flip, sending |11\u27e9 to \u22121|11\u27e9. You cannot see this in the output label, but the grader enforces it. In a larger circuit, that sign would affect how states interfere with each other. This is relative phase. It is invisible on its own, but physically real the moment other gates get involved.",
} as const;

// =================
// LEVEL 2.3: SWAP
// =================
export const SWAP_LEVEL: LevelDefinition = {
  target_unitary: Gate.SWAP,
  number_of_qubits: LEVEL2_QUBITS,
  toolbox: [...SINGLE_QUBIT_GATES, Gate.CNOT, Gate.CONTROLLED_Z] as const,

  canonical: [
    { gate: Gate.CNOT, order: C0_T1 },
    { gate: Gate.CNOT, order: C1_T0 },
    { gate: Gate.CNOT, order: C0_T1 },
  ],

  expectedTruth: {
    input: TWO_QUBIT_INPUTS,
    output: [BASIS_00, BASIS_10, BASIS_01, BASIS_11],
  },

  uiMaxGates: MAX_GATES,

  description:
    "SWAP exchanges two qubits: $|01\\rangle \\mapsto |10\\rangle$ and $|10\\rangle \\mapsto |01\\rangle$. Synthesize a circuit whose unitary matches SWAP exactly.",
  hint1: "Think about how you can use CNOT to transfer information between qubits in both directions.",
  hint2: "Three CNOTs applied in alternating control/target directions are sufficient.",
} as const;

// ========================
// LEVEL 2.4: CONTROLLED-H
// ========================
export const CONTROLLED_H_LEVEL: LevelDefinition = {
  target_unitary: Gate.CONTROLLED_H,
  number_of_qubits: LEVEL2_QUBITS,
  toolbox: [...SINGLE_QUBIT_GATES, Gate.CNOT, Gate.CONTROLLED_Z, Gate.SWAP] as const,

  canonical: [
    { gate: Gate.RY, order: Q1, theta: Math.PI / 4 },
    { gate: Gate.CNOT, order: C0_T1 },
    { gate: Gate.RY, order: Q1, theta: -(Math.PI / 4) },
  ],

  expectedTruth: {
    input: TWO_QUBIT_INPUTS,
    output: [BASIS_00, BASIS_01, CH_OUT_10, CH_OUT_11],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The CH gate applies H to the target qubit (Q1) when the control qubit (Q0) is $|1\\rangle$, and passes through unchanged otherwise. Synthesize a circuit whose unitary matches CH exactly.",
  hint1: "Controlled gates can often be decomposed using rotation gates sandwiched around a CNOT.",
  hint2: "Ry(π/4) · CNOT · Ry(-π/4) on the target qubit — verify the math for |10⟩ and |11⟩.",
} as const;

// ========================
// LEVEL 2.5: CONTROLLED-U
// ========================
export const CONTROLLED_U_LEVEL: LevelDefinition = {
  target_unitary: Gate.CONTROLLED_U,
  number_of_qubits: LEVEL2_QUBITS,
  toolbox: [...SINGLE_QUBIT_GATES, Gate.CNOT, Gate.CONTROLLED_Z, Gate.SWAP, Gate.CONTROLLED_H] as const,

  parameterMode: ParameterMode.SEED_ZXZ,

  uiMaxGates: MAX_GATES,

  description:
    "A random Controlled-U gate has been generated. " +
    "When the control qubit is $|1\\rangle$, an arbitrary single-qubit unitary U is applied to the target. " +
    "Synthesize a circuit whose truth table matches it exactly.",
  hint1:
    "The rows where the control is $|0\\rangle$ always pass through unchanged. " +
    "Focus on the rows where control is $|1\\rangle$ — those reveal what U does to $|0\\rangle$ and $|1\\rangle$.",
  hint2:
    "Once you know what U is from the truth table, you already know how to decompose it — " +
    "you solved the same problem in Level 1.6. Then wrap that single-qubit decomposition in a controlled structure using the gates in your toolbox.",
} as const;

//---------------------------------------------------------------------------------------
/** Ordered list of levels for progression */
export const LEVEL_ORDER: readonly LevelDefinition[] = [
  // Tier 1 — single-qubit gates
  X_LEVEL,
  S_LEVEL,
  T_LEVEL,
  H_LEVEL,
  RX_LEVEL,
  RY_LEVEL,
  RANDOM_U_LEVEL,
  // Tier 2 — two-qubit gates
  CNOT_FLIPPED_LEVEL,
  CONTROLLED_Z_LEVEL,
  SWAP_LEVEL,
  CONTROLLED_H_LEVEL,
  CONTROLLED_U_LEVEL,
] as const;

/** Get the human-readable level title for UI display. */
export function getLevelDisplayName(level: LevelDefinition): string {
  return level.name ?? level.target_unitary;
}

/** Get the next level in the progression, or null if on the last level */
export function getNextLevel(currentLevel: LevelDefinition): LevelDefinition | null {
  const currentIndex = LEVEL_ORDER.findIndex((level) => level === currentLevel);
  if (currentIndex === -1 || currentIndex === LEVEL_ORDER.length - 1) {
    return null;
  }
  return LEVEL_ORDER[currentIndex + 1];
}
