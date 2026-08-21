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
  hint1: "Try placing Sqrt_X on the wire and watch how the state vector moves on the Bloch sphere. Your goal is the south pole.",
  hint2: "Sqrt_X rotates the state 90° around the X-axis. One application gets you a quarter of the way there. What happens if you use it again?",
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
    "$\\sqrt{X^\\dagger}$ is a quarter-turn rotation around the X-axis, in the opposite direction from $\\sqrt{X}$. Build a circuit whose unitary matches it, using only the gates you have so far.",
  hint1: "Watch the path the state vector takes when you apply $\\sqrt{X}$. Where does your target sit along that path?",
  hint2: "The target sits three quarter-turns along that path. You already have a gate that covers two of those turns in one move. Can you combine it with what's left?",
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
    "$X^\\dagger$ is the inverse of the X gate, the operation that undoes it. Synthesize a circuit whose unitary matches $X^\\dagger$ exactly.",
  hint1: "Look at where the target sits on the Bloch sphere compared to Level 1.0's target. What do you notice?",
  hint2: "X flips $|0\\rangle \\leftrightarrow |1\\rangle$. Apply X again and it flips right back. So X is its own inverse: $X^\\dagger$ and X are the same gate.",
  insight:
    "Notice! The target vector for $X^\\dagger$ is identical to the target vector for $X$. That's because Pauli gates are their own inverses ($X^2 = I$), so there's nothing new for $X^\\dagger$ to add, you already built it. This is why $X^\\dagger$ won't appear in your toolbox. The same logic holds for all three Pauli gates ($X$, $Y$, $Z$): whenever you see a dagger on one of them, you already have it, no pauli-daggers needed!",
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
    "The Z gate leaves $|0\\rangle$ unchanged and flips the sign of $|1\\rangle$, a half-turn ($\\pi$) phase rotation around the Z-axis. Synthesize a circuit whose unitary matches Z exactly.",
  hint1: "Place Sqrt_X on the wire first. This moves you onto the equator, where you can actually see Rz rotate. Now add Rz and watch how far the vector travels as you change $\\theta$.",
  hint2: "You're looking for a phase flip on $|1\\rangle$, that's a half rotation, all the way around to the opposite side. How many degrees is a half-turn, and what fraction of $\\pi$ is that?",
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
    "$Z^\\dagger$ is the inverse of Z. Like the other Pauli gates, Z is its own inverse. Applying it twice returns you to where you started.",
  hint1: "You've seen this pattern before with X and $X^\\dagger$. Does the same logic apply here?",
  hint2: "Z applied twice returns the identity: $Z^2 = I$. So $Z^{-1} = Z$, and $Z^\\dagger$ and Z are the same gate.",
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
    "$S^\\dagger$ undoes an S gate, a quarter-turn ($\\pi/2$) phase rotation in the opposite direction. Synthesize a circuit whose unitary matches $S^\\dagger$ exactly.",
  hint1: "You already know S is $Rz(\\pi/2)$. Which direction does $S^\\dagger$ need to rotate?",
  hint2: "$S^\\dagger$ rotates the same distance as S but the opposite way. If S is a positive quarter-turn, what sign and size should $S^\\dagger$'s angle be?",
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
    "$T^\\dagger$ undoes a T gate, an eighth-turn ($\\pi/4$) phase rotation in the opposite direction.",
  hint1: "You already know T is $Rz(\\pi/4)$. Which direction does $T^\\dagger$ need to rotate?",
  hint2: "$T^\\dagger$ is T's rotation, reversed. Same reasoning as $S^\\dagger$: flip the sign, keep the size.",
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
    "$H^\\dagger$ is the inverse of the Hadamard gate. Like the Pauli gates, H is its own inverse. Applying it twice returns you to where you started.",
  hint1:
    "You might expect to invert H the same way you inverted S and T, by flipping the sign of the middle rotation. Try it and see where the state vector actually ends up.",
  hint2:
    "That trick only works for gates built from a single rotation. H is built from two different axes, so reversing just one sign doesn't reverse the whole gate. But $H^2 = I$, so H is its own inverse regardless. You already have the circuit you need.",
  insight:
    "Notice! Unlike $S^\\dagger$ and $T^\\dagger$, you can't invert H by simply negating the middle angle. That shortcut only works for gates built from a single axis of rotation. Truly inverting H means reversing the whole sequence and inverting each gate individually. But H happens to square to identity ($H^2 = I$), so that full inverse simplifies right back down to H itself, no new circuit needed.",
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
    "The Y gate is the third Pauli gate: it sends $|0\\rangle$ to $i|1\\rangle$ and $|1\\rangle$ to $-i|0\\rangle$. Synthesize a circuit whose unitary matches Y exactly.",
  hint1:
    "X and Y both send $|0\\rangle$ to the exact same spot, the south pole. That's because a gate only leaves points untouched if they sit exactly on its rotation axis; $|0\\rangle$ doesn't sit on either the X or Y axis, so both gates swing it all the way down. So $|0\\rangle$'s landing spot alone can't tell you which gate you built. Which of your gates changes both the bit value and the phase at once?",
  hint2:
    "You don't need a sandwich here, just two gates, back to back. X flips the bit. Which gate then adds the phase Y needs?",
  insight:
    "Notice! X and Y both send $|0\\rangle$ to the south pole. Tracing a single basis state can't tell them apart. What makes Y different is the phase it adds, and how it treats other states: X leaves $|+\\rangle$ fixed, Y flips it to $|-\\rangle$. Same lesson as Level 1.9. Matching one point on the sphere doesn't guarantee you've matched the whole gate.",
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
    "$Y^\\dagger$ is the inverse of Y. Like the other Pauli gates, Y is its own inverse.",
  hint1: "You've seen this pattern with $X^\\dagger$ and $Z^\\dagger$. Does the same logic apply to Y?",
  hint2: "Y applied twice returns the identity: $Y^2 = I$. So $Y^{-1} = Y$, and $Y^\\dagger$ and Y are the same gate.",
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
    "The S gate applies a quarter-turn ($\\pi/2$) phase rotation around the Z-axis: $|0\\rangle \\mapsto |0\\rangle$ and $|1\\rangle \\mapsto i|1\\rangle$. Synthesize a circuit whose unitary matches S exactly.",
  hint1: "Place Sqrt_X first so you can see Rz rotate, then add Rz and watch how far it travels as you change $\\theta$.",
  hint2: "S applies a quarter-phase change, a quarter of a full rotation. What angle, as a fraction of $\\pi$, gets you a quarter-turn?",
} as const;

// ========================
// LEVEL 1.7: T GATE
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
    "The T gate applies an eighth-turn ($\\pi/4$) phase rotation around the Z-axis: $|0\\rangle \\mapsto |0\\rangle$ and $|1\\rangle \\mapsto e^{i\\pi/4}|1\\rangle$. Synthesize a circuit whose unitary matches T exactly.",
  hint1: "Same approach as S: place Sqrt_X first, then add Rz and watch how far it travels.",
  hint2: "T is a smaller phase change than S, an eighth-turn instead of a quarter. If S was $\\pi/2$, what's half of that?",
} as const;

// ========================
// LEVEL 1.9: H GATE
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
    "The Hadamard gate creates equal superposition: $|0\\rangle \\mapsto \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$ and $|1\\rangle \\mapsto \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}$. Synthesize a circuit whose unitary matches H, up to global phase.",
  hint1:
    "One gate rotates the state vector off the pole and onto the equator. A second gate then rotates it around to the target point. Which gate handles each job?",
  hint2:
    "Once you're at the target point, both $|0\\rangle$ and $|1\\rangle$ already land in the right spot after two gates, but a single point on the sphere hides its own phase. Two states can each look correct while the phase relationship between them is still off. What gate could adjust that relationship without moving either point any further, one that rotates the state around the axis it's already sitting on?",
  insight:
    "Notice! The outputs show different complex amplitudes but the circuit still passed. This is because the circuits differed by a global phase. Global phase differences are physically unobservable. The circuits will still have identical probability columns and be physically equivalent!",
} as const;

// ========================
// LEVEL 1.13: RX GATE
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
  hint1:
    "You have a gate that rotates around Z, but you need one that rotates around X. Is there a gate that swaps which axis is which? Where to look: Nielsen & Chuang, Section 4.2, Z-Y decomposition (Theorem 4.1) covers the general principle behind this.",
  hint2:
    "Applying that axis-swapping gate once puts you in a swapped view, so the rotation you place next actually happens around X instead of Z. But you're still stuck in that swapped view. What would switch the labeling back to normal, without undoing the rotation you just did?",
  insight:
    "Notice! Conjugating a gate, sandwiching it between another gate and its inverse, doesn't just move a state, it relabels the entire rotation axis. H swaps the Z-axis and X-axis, so wrapping a Z-rotation in H's turns it into an X-rotation at the same angle. This trick is how you'll build $R_x$, $R_y$, and beyond from the phase gates you already have. H happens to work here because it's a full $180^\\circ$ flip that undoes itself; later levels will need a different kind of conjugator, and the sandwich won't always be symmetric like this one.",
} as const;

// ========================
// LEVEL 1.14: RY GATE
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
  hint1:
    "Which gate sweeps the X-axis over to the Y-axis? And since it's a sweep, not a self-inverse flip like H, what belongs on the other side of the sandwich? Where to look: Nielsen & Chuang, Section 4.2, Z-Y decomposition (Theorem 4.1).",
  hint2:
    "Once you've built the full sandwich, you won't be able to tell if the sign is right just by watching $|0\\rangle$ or $|1\\rangle$ alone. The difference is invisible until you check the whole circuit. Move the $\\theta$ slider and compare your circuit's output to the expected output as it changes. If they diverge, flip the sign on your outer gates.",
  insight:
    "Notice! $R_y(\\theta)$ and $R_y(-\\theta)$ produce the exact same measurement probabilities starting from $|0\\rangle$, but they're genuinely different gates. The direction of rotation only shows up once you check the full matrix, not just where a single state lands. Get the sign of your conjugating Rz backwards, and your circuit can look right on the Bloch sphere while still failing the check.",
  preSolveCallout:
    "You built $R_x$ by sandwiching Rz between two H's. H maps the Z-axis onto the X-axis, so wrapping Rz in H turns a Z-rotation into an X-rotation. $R_y$ works the same way: find a gate that maps the X-axis onto the Y-axis, and sandwich your $R_x$ between that gate and its inverse. The difference: H is a full $180^\\circ$ flip that undoes itself, which is why the same H worked on both sides. The gate that maps X onto Y is only a $90^\\circ$ sweep, not a flip. It isn't its own inverse, so you'll need it on one side and its opposite on the other.",
} as const;

// ========================
// LEVEL 1.15: RANDOM UNITARY
// ========================
export const RANDOM_U_LEVEL: LevelDefinition = {
  target_unitary: Gate.RANDOM_U,
  name: "ARBITRARY U",
  number_of_qubits: LEVEL1_QUBITS,
  toolbox: [Gate.RZ, Gate.SQRT_X, Gate.X, Gate.S, Gate.T, Gate.H, Gate.RX, Gate.RY] as const,
  // "Arbitrary U" isn't a discrete, reusable gate — completing this level should not
  // add Gate.U to the student's unlocked toolbox.
  noGatesetUnlock: true,

  canonical: [
    { gate: Gate.RZ, order: Q0 },
    { gate: Gate.RY, order: Q0 },
    { gate: Gate.RZ, order: Q0 },
  ],

  parameterMode: ParameterMode.SEED_ZYZ,

  /** Finer θ grid so a later unitary-GP atol can separate rounding from FPs. */
  thetaSliderStep: 0.001,

  uiMaxGates: MAX_GATES,

  description:
    "A random single-qubit unitary has been generated for you. Synthesize a circuit whose " +
    "truth table matches it exactly. Use any combination of your unlocked gates.",
  hint1:
    "Any single-qubit unitary can be written as a Z-rotation, then a Y-rotation, then another Z-rotation, plus an overall phase. This is the Z-Y decomposition. This isn't something you're meant to derive from scratch on the sphere: look it up. Where to look: Nielsen & Chuang, Section 4.2, Z-Y decomposition (Theorem 4.1).",
  hint2:
    "Once you have the theorem, match your target matrix's entries against the general Z-Y-Z form to solve for the four angles for your specific unitary. Build Rz, then Ry, then Rz with those angles. The overall phase doesn't need its own gate.",
} as const;

// ========================
// LEVEL 2.0: CNOT FLIPPED
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
  hint1:
    "CNOT works like a classical logic gate: it reads the control qubit's value (a Z-axis check) and flips the target's value (an X-axis action) if the control is 1. To swap which wire is control and which is target, you need a gate that swaps the X and Z roles for each qubit, the same trick you used to build Rx from Rz. Which gate does that?",
  hint2:
    "Just like you sandwiched a rotation between that gate and itself to bring the axis labeling back afterward, apply it the same way here, on both wires, before and after the CNOT.",
  insight:
    "A flipped CNOT and a standard CNOT are the same gate in disguise. Wrap both qubits with Hadamards on either side ($H\\otimes H \\cdot \\mathrm{CNOT} \\cdot H\\otimes H$) and the control and target roles effectively swap. This is called H-conjugation. It is your first look at a powerful idea: you can change what a gate does just by choosing what surrounds it. Why does this specific gate work? CNOT is built from two operators: a Z-axis check on the control (is it 0 or 1?) and an X-axis action on the target (flip it or not). H is exactly the gate that swaps the X and Z operators for a single qubit, so applying it to both wires swaps which qubit is being read and which is being acted on, and control and target trade places. This isn't true for just any axis-swapping gate. It works specifically because CNOT itself is built from X and Z.",
} as const;

// ========================
// LEVEL 2.1: CONTROLLED Z
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
    "The CZ gate applies a phase flip only when both qubits are $|1\\rangle$: $|11\\rangle \\mapsto -|11\\rangle$. Synthesize a circuit whose unitary matches CZ exactly.",
  hint1:
    "You already have a gate that conditionally acts on a target based on the control's value (CNOT). Its conditional action happens to be an X-flip. Which single-qubit gate could convert that X-flip into a Z-phase-flip instead?",
  hint2:
    "Unlike the flipped-CNOT circuit, you don't need to swap which qubit is the control here. You're only changing what happens to the target. Apply that gate to just the target wire, before and after the CNOT.",
  insight:
    "The truth table shows $|11\\rangle$ mapping to $|11\\rangle$, but something is hidden: CZ actually applies a phase flip, sending $|11\\rangle$ to $-1|11\\rangle$. You cannot see this in the output label, but the grader enforces it. In a larger circuit, that sign would affect how states interfere with each other. This is relative phase. It is invisible on its own, but physically real the moment other gates get involved.",
} as const;

// =================
// LEVEL 2.2: SWAP
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
  hint1:
    "CNOT's action is what's called an XOR update: it flips the target only when the control is 1, and does nothing otherwise. Because applying CNOT twice in a row cancels itself out completely, you can use it more than once to move information between two qubits without permanently erasing what's there. Can you find a way to apply CNOT several times, changing which qubit is the target each time, so that the two qubits fully trade their values?",
  hint2:
    "Try two CNOTs, swapping which qubit is the target between them. Look closely at what each qubit's value has picked up afterward. Does one more CNOT, using that same pattern, finish the trade?",
  insight:
    "Notice! This construction is a quantum version of the classical trick for swapping two variables using only XOR updates, with no temporary variable needed. CNOT computes target equals target XOR control, so applying it several times, alternating which qubit is the target, is enough to fully trade the two qubits' values. Quantum circuits inherit classical reversible logic tricks like this whenever the gate you're building is really just a classical bit permutation, which SWAP is.",
} as const;

// ========================
// LEVEL 2.3: CONTROLLED-H
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
    "The CH gate applies H to the target qubit (Q1) when the control qubit (Q0) is $|1\\rangle$, and passes through unchanged otherwise. Synthesize a circuit whose unitary matches CH up to global phase.",
  hint1:
    "Just like building CZ from CNOT, you already have a gate that conditionally applies X to the target. This time you want it to conditionally apply H instead. What single-qubit rotation would need to sandwich the CNOT to turn its built-in X action into an H action?",
  hint2:
    "Think back to Tier 1: to move a rotation from one axis to another, you rotated around the third axis, by whatever angle separated the two. H's own rotation axis sits exactly halfway between the X-axis and the Z-axis. What angle, and around which axis, would walk X's axis over to that halfway point? And since that rotation isn't a full $180^\\circ$ flip like H, what belongs on the other side of the sandwich?",
  insight:
    "Notice! This construction reuses the same trick as CZ: CNOT already gives you conditionally applied X to the target. To conditionally apply H instead, you sandwich the target wire with a rotation that walks X's own rotation axis over to H's rotation axis, which sits exactly $45^\\circ$ away, halfway between X and Z. Since a $45^\\circ$ rotation isn't self-inverse like H is, you need opposite angles on each side, not the same gate twice. This same principle explains CZ as well: a $90^\\circ$ version of this exact sandwich, since Z's axis sits a full $90^\\circ$ from X's.",
} as const;

// ========================
// LEVEL 2.4: CONTROLLED-U
// ========================
export const CONTROLLED_U_LEVEL: LevelDefinition = {
  target_unitary: Gate.CONTROLLED_U,
  number_of_qubits: LEVEL2_QUBITS,
  toolbox: [...SINGLE_QUBIT_GATES, Gate.CNOT, Gate.CONTROLLED_Z, Gate.SWAP, Gate.CONTROLLED_H] as const,

  parameterMode: ParameterMode.SEED_ZXZ,
  thetaSliderStep: 0.001,
  // CU needs seeded (α,β,γ) angles; reuse as a bare toolbox chip would crash grading.
  // Same pattern as Tier-1 dagger no-ops — do not unlock into later gatesets.
  noGatesetUnlock: true,

  uiMaxGates: MAX_GATES,

  description:
    "A random Controlled-U gate has been generated. When the control qubit is $|1\\rangle$, an arbitrary single-qubit unitary U is applied to the target. Synthesize a circuit whose truth table matches it exactly.",
  hint1:
    "First extract U from the rows where control is $|1\\rangle$. Then decomposing it for a controlled circuit needs a different theorem than the one you used for Arbitrary U. Where to look: Nielsen & Chuang, Section 4.2, ABC decomposition (Corollary 4.2), right after the Z-Y decomposition theorem.",
  hint2:
    "The ABC decomposition gives you three gates built from the same four angles as before, but combined differently, designed so they cancel out completely when applied back to back with nothing in between. CNOT is your conditional-X gate. Think about what happens to that cancellation when an X gets inserted in the middle, only when the control is 1.",
  insight:
    "Notice! The three gates from the ABC decomposition are built so that applied back to back with nothing between them, they cancel out completely: A, B, C in sequence equals doing nothing. When the control is 0, both CNOTs do nothing, so the target wire only ever sees that cancelling sequence, exactly matching controlled-U's job of doing nothing when the control is 0. When the control is 1, each CNOT inserts a hidden X into that same sequence, turning it into A, X, B, X, C, and that exact pattern is engineered to equal U. The control qubit is really just switching whether those two hidden X's are active, and CNOT is the gate you already had for exactly that job.",
} as const;

// ========================
// LEVEL 3.0: TOFFOLI (CCX)
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
    "A single CNOT can only check one qubit at a time, but Toffoli needs to check two qubits at once, a genuine three-way condition. The trick used here is called phase kickback: small phase rotations placed across all three wires that mostly cancel out, except in the one case where both controls are 1, where they combine into a full flip. This isn't something to derive on the spot. Where to look: Nielsen & Chuang, Section 4.5.4, Figure 4.9.",
  hint2:
    "Once you have the diagram, build it exactly as shown: six CNOTs and nine single-qubit gates, H, T, and $T^\\dagger$, in a specific order. Getting the sign right on each T versus $T^\\dagger$ matters, since a swapped sign anywhere breaks the phase cancellation and the circuit won't pass. This construction is already about as short as it gets with the gates you have. A genuinely shorter version exists in the literature, but it needs a controlled-$\\sqrt{X}$ primitive, which isn't part of your permanent gateset here.",
  insight:
    "Notice! This circuit works by phase kickback. The T and $T^\\dagger$ gates scattered across all three wires apply small phase rotations that, on their own, don't look like they do much. But tracing through all four combinations of the two control qubits, those phases cancel out in three of the four cases, and only fully combine into a genuine $\\pi$ phase when both controls are 1. The surrounding H gates then convert that phase difference into a visible bit-flip. Six CNOTs is the minimum possible for a Toffoli built purely from CNOTs and single-qubit gates. Shorter constructions exist, but only with a controlled-$\\sqrt{X}$ gate as a building block, which isn't part of your permanent gateset here.",
} as const;

// ========================
// LEVEL 3.1: FREDKIN (CSWAP)
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
    "When the control is $|0\\rangle$, all three qubits pass through unchanged. Focus on what happens when the control is $|1\\rangle$ instead.",
  hint2:
    "You already know how to swap two qubits unconditionally, using three CNOTs in a row. You also know how to make a bit-flip conditional on two qubits, using a Toffoli. What happens if you replace just the middle step of your swap sequence with something that only flips when both the original control and the new qubit are 1?",
  insight:
    "Notice! This construction takes the three-CNOT swap trick from Level 2.2 and makes only the middle step conditional, replacing it with a Toffoli using q0 as its extra control. When q0 is 0, that middle step vanishes entirely, since an unmet Toffoli control does nothing, leaving just the two outer CNOTs, which are identical and cancel each other out completely. When q0 is 1, the middle Toffoli behaves exactly like the plain CNOT it replaced, and the full sequence becomes precisely the three-CNOT swap from before. One extra control on one gate is enough to make an entire multi-gate construction conditional.",
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
  // Tier 2 — two-qubit gates (2.0 – 2.4)
  CNOT_FLIPPED_LEVEL,  // 2.0
  CONTROLLED_Z_LEVEL,  // 2.1
  SWAP_LEVEL,          // 2.2
  CONTROLLED_H_LEVEL,  // 2.3
  CONTROLLED_U_LEVEL,  // 2.4
  // Tier 3 — three-qubit gates (3.0 – 3.1)
  TOFFOLI_LEVEL,       // 3.0
  FREDKIN_LEVEL,       // 3.1
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

/** Display label such as "1.0", "2.3", "3.1" (0-based within each tier). */
export function getLevelNumber(index: number): string {
  const level = LEVEL_ORDER[index];
  const sameTier = LEVEL_ORDER.filter((l) => l.number_of_qubits === level.number_of_qubits);
  const withinTier = sameTier.findIndex((l) => l.target_unitary === level.target_unitary);
  return `${level.number_of_qubits}.${withinTier}`;
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
