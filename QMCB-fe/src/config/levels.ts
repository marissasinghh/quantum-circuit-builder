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

  description: "The X gate flips |0⟩ to |1⟩ and |1⟩ to |0⟩ — the quantum equivalent of a classical NOT. Synthesize a circuit whose unitary matches X exactly.",
  hint1: "Check how sqrt_x moves the state on the Bloch sphere.",
  hint2: "How could you use sqrt_x to move the state further south?",
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

  description: "The S gate leaves |0⟩ unchanged and multiplies |1⟩ by i — a π/2 phase rotation around the Z-axis. Synthesize a circuit whose unitary matches S exactly.",
  hint1: "S is a pure Z-axis rotation; to better visualize this rotation, place a sqrt_x gate first to see how Rz(θ) rotates the state.",
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

  description: "The T gate leaves |0⟩ unchanged and applies a phase of e^(iπ/4) to |1⟩ — a π/4 phase rotation around the Z-axis. Synthesize a circuit whose unitary matches T exactly.",
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

  description: "The Hadamard gate creates equal superposition: |0⟩ maps to (|0⟩+|1⟩)/√2 and |1⟩ maps to (|0⟩−|1⟩)/√2. Synthesize a circuit whose unitary matches H exactly.",
  hint1: "H requires both rotation axes — combine Rz and SQRT_X in sequence.",
  hint2: "Conjugating sqrt_x by Rz rotations changes the effective rotation axis — try sandwiching sqrt_x between two Rz gates.",
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

  parameterMode: ParameterMode.TRIAL_THETA,

  description: "Rx(θ) rotates a qubit by angle θ around the X-axis of the Bloch sphere. Synthesize a parameterized circuit whose unitary matches Rx(θ) for any angle θ.",
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

  parameterMode: ParameterMode.TRIAL_THETA,

  description: "Ry(θ) rotates a qubit by angle θ around the Y-axis; unlike Rx, its matrix entries are entirely real with no complex phases. Synthesize a parameterized circuit whose unitary matches Ry(θ) for any angle θ.",
  hint1: "Which gates will translate the state to the proper axis of rotation?",
  hint2: "Conjugating an X-axis rotation by Rz changes the rotation axis to Y.",
} as const;

// ========================
// LEVEL 1.6: RANDOM UNITARY
// ========================
export const RANDOM_U_LEVEL: LevelDefinition = {
  target_unitary: Gate.RANDOM_U,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.S, Gate.T, Gate.H, Gate.RX, Gate.RY] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0 },
    { gate: Gate.RX, order: Q0 },
    { gate: Gate.RZ, order: Q0 },
  ],

  parameterMode: ParameterMode.SEED_ZXZ,

  uiMaxGates: MAX_GATES,

  description:
    "A random single-qubit unitary has been generated for you. Synthesize a circuit whose " +
    "truth table matches it exactly. Use any combination of your unlocked gates.",
  hint1: "Any single-qubit unitary can be decomposed into at most three rotation gates (ZXZ decomposition).",
  hint2: "Try Rz(α) · Rx(β) · Rz(γ) — adjust the three angles until the outputs match.",
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

  description: "CNOT_FLIPPED is a CNOT gate with its control and target reversed: qubit 1 controls qubit 0 instead of the usual direction. Synthesize a circuit whose unitary matches the flipped CNOT exactly.",
  hint1: "Think about how conjugating a gate by single-qubit operations can change which qubit plays which role.",
  hint2: "Hadamards can swap the control and target roles of a CNOT.",
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

  description: "The CZ gate applies a phase flip of −1 to the |11⟩ state and leaves all other basis states unchanged — unlike CNOT, it is fully symmetric between its two qubits. Synthesize a circuit whose unitary matches CZ exactly.",
  hint1: "CZ applies a phase flip — think about which single-qubit gate converts between the X and Z bases.",
  hint2: "Wrapping a CNOT with Hadamards on one qubit converts a bit-flip into a phase-flip.",
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

  description: "The SWAP gate exchanges the states of two qubits: |a,b⟩ maps to |b,a⟩ for all inputs. Synthesize a circuit whose unitary matches SWAP exactly.",
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
    "The CH gate applies H to the target qubit (Q1) when the control qubit (Q0) is |1⟩, and passes through unchanged otherwise. Synthesize a circuit whose unitary matches CH exactly.",
  hint1: "Controlled gates can often be decomposed using rotation gates sandwiched around a CNOT.",
  hint2: "Ry(π/4) · CNOT · Ry(-π/4) on the target qubit — verify the math for |10⟩ and |11⟩.",
} as const;

// ========================
// LEVEL 2.5: CONTROLLED-U (placeholder)
// ========================
export const CONTROLLED_U_LEVEL: LevelDefinition = {
  target_unitary: Gate.CONTROLLED_U,
  number_of_qubits: LEVEL2_QUBITS,
  toolbox: [...SINGLE_QUBIT_GATES, Gate.CNOT, Gate.CONTROLLED_Z, Gate.SWAP, Gate.CONTROLLED_H] as const,

  parameterMode: ParameterMode.TRIAL_ZXZ,
  locked: true,

  uiMaxGates: MAX_GATES,

  description:
    "Controlled-U applies an arbitrary single-qubit unitary to the target when the control is |1⟩. This optional level is coming soon.",
  hint1: "Coming soon.",
  hint2: "Coming soon.",
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

/** Get the next level in the progression, or null if on the last level */
export function getNextLevel(currentLevel: LevelDefinition): LevelDefinition | null {
  const currentIndex = LEVEL_ORDER.findIndex((level) => level === currentLevel);
  if (currentIndex === -1 || currentIndex === LEVEL_ORDER.length - 1) {
    return null;
  }
  return LEVEL_ORDER[currentIndex + 1];
}
