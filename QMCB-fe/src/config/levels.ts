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
} from "../utils/constants";
import type { LevelDefinition } from "../interfaces/levelDefinition";

// ========================
// LEVEL 1.0: X GATE
// ========================
export const X_LEVEL: LevelDefinition = {
  target_unitary: Gate.X,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.RX] as const,

  canonical: [
    { gate: Gate.RX, order: Q0, theta: Math.PI },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_1, BASIS_0],
  },

  uiMaxGates: MAX_GATES,

  description: "The X gate flips |0⟩ to |1⟩ and |1⟩ to |0⟩ — the quantum equivalent of a classical NOT. Using Rz and Rx, synthesize a circuit whose unitary matches X exactly. Hint: a single Rx rotation at the right angle is all you need.",
} as const;

// ========================
// LEVEL 1.1: S GATE
// ========================
export const S_LEVEL: LevelDefinition = {
  target_unitary: Gate.S,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.RX] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, S_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description: "The S gate leaves |0⟩ unchanged and multiplies |1⟩ by i — a π/2 phase rotation around the Z-axis. Using Rz and Rx, synthesize a circuit whose unitary matches S exactly. Hint: S is a pure Z-axis rotation; a single Rz at the right fraction of π solves it in one step.",
} as const;

// ========================
// LEVEL 1.2: T GATE
// ========================
export const T_LEVEL: LevelDefinition = {
  target_unitary: Gate.T,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.RX] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 4 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, T_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description: "The T gate leaves |0⟩ unchanged and applies a phase of e^(iπ/4) to |1⟩ — exactly half the phase shift of S. Using Rz and Rx, synthesize a circuit whose unitary matches T exactly. Hint: T is Rz at precisely half the angle you used for S.",
} as const;

// ========================
// LEVEL 1.3: H GATE
// ========================
export const H_LEVEL: LevelDefinition = {
  target_unitary: Gate.H,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.RX] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
    { gate: Gate.RX, order: Q0, theta: Math.PI / 2 },
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [H_OUT_0, H_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description: "The Hadamard gate creates equal superposition: |0⟩ maps to (|0⟩+|1⟩)/√2 and |1⟩ maps to (|0⟩−|1⟩)/√2. Using Rz and Rx, synthesize a circuit whose unitary matches H exactly. Hint: H requires both rotation axes — try combining Rz and Rx in sequence.",
} as const;

// ========================
// LEVEL 1.4: RX GATE
// ========================
export const RX_LEVEL: LevelDefinition = {
  target_unitary: Gate.RX,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.RX] as const,

  canonical: [
    { gate: Gate.RX, order: Q0 },
  ],

  uiMaxGates: MAX_GATES,

  description: "Rx(θ) rotates a qubit by angle θ around the X-axis of the Bloch sphere, and is one of your two fundamental single-qubit primitives. Using Rz and Rx, synthesize a parameterized circuit whose unitary matches Rx(θ) for any angle θ. Hint: the target is the primitive itself — a single Rx placed directly is the solution.",
} as const;

// ========================
// LEVEL 1.5: RY GATE
// ========================
export const RY_LEVEL: LevelDefinition = {
  target_unitary: Gate.RY,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.RX] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: -Math.PI / 2 },
    { gate: Gate.RX, order: Q0 },
    { gate: Gate.RZ, order: Q0, theta: Math.PI / 2 },
  ],

  uiMaxGates: MAX_GATES,

  description: "Ry(θ) rotates a qubit by angle θ around the Y-axis; unlike Rx, its matrix entries are entirely real with no complex phases. Using Rz and Rx, synthesize a parameterized circuit whose unitary matches Ry(θ) for any angle θ. Hint: Ry can be built by conjugating Rx between two Rz rotations.",
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

  description: "CNOT_FLIPPED is a CNOT gate with its control and target reversed: qubit 1 controls qubit 0 instead of the usual direction. Using single-qubit gates and a standard CNOT, synthesize a circuit whose unitary matches the flipped CNOT exactly. Hint: H gates can swap the control and target roles of a CNOT.",
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

  description: "The CZ gate applies a phase flip of −1 to the |11⟩ state and leaves all other basis states unchanged — unlike CNOT, it is fully symmetric between its two qubits. Using single-qubit gates and a CNOT, synthesize a circuit whose unitary matches CZ exactly. Hint: wrapping a CNOT with H gates on one qubit converts a bit-flip into a phase-flip.",
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

  description: "The SWAP gate exchanges the states of two qubits: |a,b⟩ maps to |b,a⟩ for all inputs. Using CNOT and CZ gates, synthesize a circuit whose unitary matches SWAP exactly. Hint: three CNOTs applied in alternating control/target directions are sufficient.",
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
  // Tier 2 — two-qubit gates
  CNOT_FLIPPED_LEVEL,
  CONTROLLED_Z_LEVEL,
  SWAP_LEVEL,
] as const;

/** Get the next level in the progression, or null if on the last level */
export function getNextLevel(currentLevel: LevelDefinition): LevelDefinition | null {
  const currentIndex = LEVEL_ORDER.findIndex((level) => level === currentLevel);
  if (currentIndex === -1 || currentIndex === LEVEL_ORDER.length - 1) {
    return null;
  }
  return LEVEL_ORDER[currentIndex + 1];
}
