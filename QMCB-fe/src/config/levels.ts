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
  LEVEL3_QUBITS,
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
  SQRT_X_DAG_OUT_0,
  SQRT_X_DAG_OUT_1,
  Z_OUT_1,
  S_DAG_OUT_1,
  T_DAG_OUT_1,
  Y_OUT_0,
  Y_OUT_1,
  TWO_QUBIT_INPUTS,
  BASIS_00,
  BASIS_01,
  BASIS_10,
  BASIS_11,
  THREE_QUBIT_INPUTS,
  BASIS_000,
  BASIS_001,
  BASIS_010,
  BASIS_011,
  BASIS_100,
  BASIS_101,
  BASIS_110,
  BASIS_111,
  CH_OUT_10,
  CH_OUT_11,
  ParameterMode,
} from "../utils/constants";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { formatGateDisplayName } from "../utils/gateDisplayNames";

/** Full Tier 2 toolbox — singles plus all two-qubit primitives unlocked by end of Tier 2. */
const TIER3_TOOLBOX = [
  ...SINGLE_QUBIT_GATES,
  Gate.CNOT,
  Gate.CONTROLLED_Z,
  Gate.SWAP,
  Gate.CONTROLLED_H,
] as const;

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
// LEVEL 1.1: SQRT(X-DAG) GATE
// ========================
export const SQRT_X_DAG_LEVEL: LevelDefinition = {
  target_unitary: Gate.SQRT_X_DAG,
  noGatesetUnlock: true,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X] as const,

  canonical: [
    { gate: Gate.SQRT_X, order: Q0 },
    { gate: Gate.X, order: Q0 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [SQRT_X_DAG_OUT_0, SQRT_X_DAG_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "$\\sqrt{X^\\dagger}$ is the inverse of the square-root-of-X gate — apply it twice and you undo a half-X rotation. Build it using only the gates you have so far.",
  hint1: "$Rx(\\pi/2)$ is already a square root of X. What happens if you follow it with a full X flip?",
  hint2: "Try $Rx(\\pi/2)$, then X, in that order.",
} as const;

// ========================
// LEVEL 1.2: X-DAG (config only — X†= X)
// ========================
export const X_DAG_LEVEL: LevelDefinition = {
  target_unitary: Gate.X_DAG,
  backendTarget: Gate.X,
  noGatesetUnlock: true,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG] as const,

  canonical: [
    { gate: Gate.X, order: Q0 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_1, BASIS_0],
  },

  uiMaxGates: MAX_GATES,

  description:
    "X-dag is the inverse of the X gate. But X is its own inverse — applying it twice gets you back to where you started. So X-dag and X are the exact same operation.",
  hint1: "What is the inverse of a bit-flip?",
  hint2: "X flips $|0\\rangle \\leftrightarrow |1\\rangle$. Applying X again flips it back. So $X^{-1} = X$.",
  insight:
    "Notice! The target vector for $X^\\dagger$ is identical to the target vector for $X$. That's because Pauli gates are their own inverses ($X^2 = I$), so there's nothing new for $X^\\dagger$ to add — you already built it. This is why $X^\\dagger$ won't appear in your toolbox. The same logic holds for all three Pauli gates ($X$, $Y$, $Z$): whenever you see a dagger on one of them, you already have it — no pauli-daggers needed!",
} as const;

// ========================
// LEVEL 1.3: Z GATE
// ========================
export const Z_LEVEL: LevelDefinition = {
  target_unitary: Gate.Z,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: Math.PI },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, Z_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The Z gate flips the phase of $|1\\rangle$ and leaves $|0\\rangle$ untouched. You already have a general Z-axis rotation — dial it to the right angle.",
  hint1: "Z doesn't change measurement probabilities on its own — it's a pure phase flip. Which of your gates rotates around the Z-axis?",
  hint2: "$Rz(\\theta)$ at $\\theta = \\pi$ gives you a Z-axis half-turn.",
} as const;

// ========================
// LEVEL 1.4: Z-DAG (config only — Z†= Z)
// ========================
export const Z_DAG_LEVEL: LevelDefinition = {
  target_unitary: Gate.Z_DAG,
  backendTarget: Gate.Z,
  noGatesetUnlock: true,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.Z_DAG] as const,

  canonical: [
    { gate: Gate.Z_DAG, order: Q0 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, Z_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "Z-dag is the inverse of Z. Since Z applies a phase of $-1$, applying it again cancels that phase — Z is its own inverse too.",
  hint1: "Z multiplies $|1\\rangle$ by $-1$. What do you get if you apply $-1$ twice?",
  hint2: "$Z^2 = I$, so $Z^{-1} = Z$.",
} as const;

// ========================
// LEVEL 1.6: S-DAG GATE
// ========================
export const S_DAG_LEVEL: LevelDefinition = {
  target_unitary: Gate.S_DAG,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.S] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: -Math.PI / 2 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, S_DAG_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "S-dag undoes an S gate — a quarter-turn phase rotation in the opposite direction. Use your general Z-rotation to dial in the exact angle.",
  hint1: "S rotates by $+90°$ around the Z-axis. S-dag rotates the other way.",
  hint2: "Set $Rz$ to $-\\pi/2$ ($-90°$).",
} as const;

// ========================
// LEVEL 1.8: T-DAG GATE
// ========================
export const T_DAG_LEVEL: LevelDefinition = {
  target_unitary: Gate.T_DAG,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.S, Gate.S_DAG, Gate.T] as const,

  canonical: [
    { gate: Gate.RZ, order: Q0, theta: -Math.PI / 4 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [BASIS_0, T_DAG_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "T-dag undoes a T gate — an eighth-turn phase rotation in reverse.",
  hint1: "T rotates by $+45°$ around the Z-axis. T-dag is the reverse of that.",
  hint2: "Set $Rz$ to $-\\pi/4$ ($-45°$).",
} as const;

// ========================
// LEVEL 1.10: H-DAG (config only — H†= H)
// ========================
export const H_DAG_LEVEL: LevelDefinition = {
  target_unitary: Gate.H_DAG,
  backendTarget: Gate.H,
  noGatesetUnlock: true,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H, Gate.H_DAG] as const,

  canonical: [
    { gate: Gate.H_DAG, order: Q0 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [H_OUT_0, H_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "H-dag is the inverse of the Hadamard gate. H is its own inverse — apply it twice and you are back where you started.",
  hint1: "H creates an even superposition. What happens if you apply H to that superposition again?",
  hint2: "$H^2 = I$, so $H^{-1} = H$.",
} as const;

// ========================
// LEVEL 1.11: Y GATE
// ========================
export const Y_LEVEL: LevelDefinition = {
  target_unitary: Gate.Y,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H] as const,

  canonical: [
    { gate: Gate.X, order: Q0 },
    { gate: Gate.Z, order: Q0 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [Y_OUT_0, Y_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "Y is the third Pauli gate — a full-turn rotation around the Y-axis of the Bloch sphere. You can build it by combining two gates you already have.",
  hint1: "Y is closely related to X and Z — think about what happens if you flip the bit, then flip the phase.",
  hint2: "Try applying X, then Z, in that order.",
} as const;

// ========================
// LEVEL 1.12: Y-DAG (config only — Y†= Y)
// ========================
export const Y_DAG_LEVEL: LevelDefinition = {
  target_unitary: Gate.Y_DAG,
  backendTarget: Gate.Y,
  noGatesetUnlock: true,
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.SQRT_X_DAG, Gate.Z, Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG, Gate.H, Gate.Y, Gate.Y_DAG] as const,

  canonical: [
    { gate: Gate.Y_DAG, order: Q0 },
  ],

  expectedTruth: {
    input: ONE_QUBIT_INPUTS,
    output: [Y_OUT_0, Y_OUT_1],
  },

  uiMaxGates: MAX_GATES,

  description:
    "Y-dag is the inverse of Y. Like the other Pauli gates, Y is its own inverse.",
  hint1: "Pauli gates square to identity. What does that tell you about Y's inverse?",
  hint2: "$Y^2 = I$, so $Y^{-1} = Y$.",
} as const;

// ========================
// LEVEL 1.5: S GATE  (was 1.1 — renumbered by LEVEL_ORDER position)
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
  name: "ARBITRARY U",
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
    { gate: Gate.CNOT, order: C0_T1 },
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
    "you solved the same problem in Level 1.6. Then wrap that single-qubit decomposition in a controlled structure using the gates in your gateset.",
} as const;

// ========================
// LEVEL 3.1: TOFFOLI (CCX)
// ========================
export const TOFFOLI_LEVEL: LevelDefinition = {
  target_unitary: Gate.TOFFOLI,
  number_of_qubits: LEVEL3_QUBITS,
  toolbox: TIER3_TOOLBOX,

  expectedTruth: {
    input: THREE_QUBIT_INPUTS,
    output: [
      BASIS_000,
      BASIS_001,
      BASIS_010,
      BASIS_011,
      BASIS_100,
      BASIS_101,
      BASIS_111, // |110⟩ → |111⟩
      BASIS_110, // |111⟩ → |110⟩
    ],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The Toffoli gate applies X to the target qubit (Q2) only when both control qubits (Q0 and Q1) are $|1\\rangle$. Synthesize a circuit whose unitary matches the Toffoli (CCX) gate exactly.",
  hint1:
    "The Toffoli is universal for classical reversible computation. Think about how you can build a doubly-controlled NOT from CNOTs and single-qubit gates.",
  hint2:
    "The canonical Nielsen & Chuang decomposition uses H, CNOT, T, and T† gates — fifteen gates in total. Can you find a shorter construction with your gateset?",
} as const;

// ========================
// LEVEL 3.2: FREDKIN (CSWAP)
// ========================
export const FREDKIN_LEVEL: LevelDefinition = {
  target_unitary: Gate.FREDKIN,
  number_of_qubits: LEVEL3_QUBITS,
  toolbox: TIER3_TOOLBOX,

  expectedTruth: {
    input: THREE_QUBIT_INPUTS,
    output: [
      BASIS_000,
      BASIS_001,
      BASIS_010,
      BASIS_011,
      BASIS_100,
      BASIS_110, // |101⟩ → |110⟩
      BASIS_101, // |110⟩ → |101⟩
      BASIS_111,
    ],
  },

  uiMaxGates: MAX_GATES,

  description:
    "The Fredkin gate swaps qubits Q1 and Q2 only when the control qubit Q0 is $|1\\rangle$. Synthesize a circuit whose unitary matches the Fredkin (CSWAP) gate exactly.",
  hint1:
    "When the control is $|0\\rangle$, all three qubits pass through unchanged. Focus on what happens when Q0 is $|1\\rangle$.",
  hint2:
    "A Fredkin gate can be built from a Toffoli sandwiched between two CNOTs on the swap wires.",
} as const;

//---------------------------------------------------------------------------------------
/** Ordered list of levels for progression */
export const LEVEL_ORDER: readonly LevelDefinition[] = [
  // Tier 1 — single-qubit gates (1.0 – 1.15, 16 levels total)
  X_LEVEL,           // 1.0
  SQRT_X_DAG_LEVEL,  // 1.1  new build
  X_DAG_LEVEL,       // 1.2  config-only (X† = X)
  Z_LEVEL,           // 1.3  new build
  Z_DAG_LEVEL,       // 1.4  config-only (Z† = Z)
  S_LEVEL,           // 1.5  (was 1.1)
  S_DAG_LEVEL,       // 1.6  new build
  T_LEVEL,           // 1.7  (was 1.2)
  T_DAG_LEVEL,       // 1.8  new build
  H_LEVEL,           // 1.9  (was 1.3)
  H_DAG_LEVEL,       // 1.10 config-only (H† = H)
  Y_LEVEL,           // 1.11 new build
  Y_DAG_LEVEL,       // 1.12 config-only (Y† = Y)
  RX_LEVEL,          // 1.13 (was 1.4)
  RY_LEVEL,          // 1.14 (was 1.5)
  RANDOM_U_LEVEL,    // 1.15 (was 1.6)
  // Tier 2 — two-qubit gates
  CNOT_FLIPPED_LEVEL,
  CONTROLLED_Z_LEVEL,
  SWAP_LEVEL,
  CONTROLLED_H_LEVEL,
  CONTROLLED_U_LEVEL,
  // Tier 3 — three-qubit gates
  TOFFOLI_LEVEL,
  FREDKIN_LEVEL,
] as const;

/** All Tier 2 level definitions (for unlock gating). */
export const TIER2_LEVELS = LEVEL_ORDER.filter((l) => l.number_of_qubits === 2);

/** True when a level has been completed or skipped. */
export function isLevelCleared(
  levelId: string,
  completedLevels: string[],
  skippedLevels: string[],
): boolean {
  return completedLevels.includes(levelId) || skippedLevels.includes(levelId);
}

/** True when every Tier 2 level has been completed or skipped. */
export function allTier2Complete(
  completedLevels: string[],
  skippedLevels: string[] = [],
): boolean {
  return TIER2_LEVELS.every((l) =>
    isLevelCleared(l.target_unitary, completedLevels, skippedLevels),
  );
}

/** True when every Tier 2 level was skipped or the player clicked Next past it. */
export function allTier2AdvancedPast(
  skippedLevels: string[] = [],
  advancedPastLevels: string[] = [],
): boolean {
  return TIER2_LEVELS.every(
    (l) =>
      skippedLevels.includes(l.target_unitary) ||
      advancedPastLevels.includes(l.target_unitary),
  );
}

/** Backfill for saves before advancedPastLevels existed. */
export function deriveAdvancedPastLevels(
  completedLevels: string[],
  skippedLevels: string[] = [],
): string[] {
  const advanced = new Set(skippedLevels);
  let maxCompletedIndex = -1;
  for (let i = 0; i < LEVEL_ORDER.length; i++) {
    if (completedLevels.includes(LEVEL_ORDER[i].target_unitary)) {
      maxCompletedIndex = i;
    }
  }
  for (let i = 0; i < maxCompletedIndex; i++) {
    advanced.add(LEVEL_ORDER[i].target_unitary);
  }
  return [...advanced];
}

/** Whether the previous level in the chain grants access (skip or explicit Next). */
function previousLevelGrantsAccess(
  index: number,
  skippedLevels: string[],
  advancedPastLevels: string[],
): boolean {
  const previousId = LEVEL_ORDER[index - 1].target_unitary;
  return (
    skippedLevels.includes(previousId) || advancedPastLevels.includes(previousId)
  );
}

/** Whether a level is playable (not considering completion status). */
export function isLevelUnlocked(
  index: number,
  level: LevelDefinition,
  _completedLevels: string[],
  skippedLevels: string[] = [],
  advancedPastLevels: string[] = [],
): boolean {
  if (level.locked) return false;
  if (index === 0) return true;

  if (level.number_of_qubits === 3) {
    const firstTier3Index = LEVEL_ORDER.findIndex((l) => l.number_of_qubits === 3);
    if (index === firstTier3Index) {
      return allTier2AdvancedPast(skippedLevels, advancedPastLevels);
    }
  }

  return previousLevelGrantsAccess(index, skippedLevels, advancedPastLevels);
}

export type LevelStatus = "locked" | "unlocked" | "completed" | "skipped";

export function getLevelStatus(
  index: number,
  level: LevelDefinition,
  completedLevels: string[],
  skippedLevels: string[] = [],
  advancedPastLevels: string[] = [],
): LevelStatus {
  if (level.locked) return "locked";

  const isCompleted = completedLevels.includes(level.target_unitary);
  if (isCompleted) return "completed";

  const isSkipped = skippedLevels.includes(level.target_unitary);
  if (isSkipped) return "skipped";

  if (
    isLevelUnlocked(
      index,
      level,
      completedLevels,
      skippedLevels,
      advancedPastLevels,
    )
  ) {
    return "unlocked";
  }
  return "locked";
}

/** Display label such as "1.0", "2.3", "3.1". */
export function getLevelNumber(index: number): string {
  const level = LEVEL_ORDER[index];
  const sameTier = LEVEL_ORDER.filter((l) => l.number_of_qubits === level.number_of_qubits);
  const withinTier = sameTier.findIndex((l) => l.target_unitary === level.target_unitary);
  if (level.number_of_qubits === 1) return `1.${withinTier}`;
  return `${level.number_of_qubits}.${withinTier + 1}`;
}

/** Get the human-readable level title for UI display. */
export function getLevelDisplayName(level: LevelDefinition): string {
  return level.name ?? formatGateDisplayName(level.target_unitary);
}

/**
 * Solve-page task panel heading (e.g. "Gate X").
 * Tier-1 single-qubit levels get a "Gate " prefix; two-qubit level names are
 * left as-is because "Gate CNOT_FLIPPED" etc. read awkwardly.
 */
export function getGateHeadingLabel(level: LevelDefinition): string {
  const name = getLevelDisplayName(level);
  if (level.number_of_qubits === 1) {
    return `Gate ${name}`;
  }
  return name;
}

/** Get the next level in the progression, or null if on the last level */
export function getNextLevel(currentLevel: LevelDefinition): LevelDefinition | null {
  const currentIndex = LEVEL_ORDER.findIndex((level) => level === currentLevel);
  if (currentIndex === -1 || currentIndex === LEVEL_ORDER.length - 1) {
    return null;
  }
  return LEVEL_ORDER[currentIndex + 1];
}
