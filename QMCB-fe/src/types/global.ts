/**
 * Domain-wide TypeScript types.
 */

export enum Gate {
  // 1-qubit gates
  X = "X",
  X_DAG = "X_DAG",
  SQRT_X = "SQRT_X",
  SQRT_X_DAG = "SQRT_X_DAG",
  Y = "Y",
  Y_DAG = "Y_DAG",
  Z = "Z",
  Z_DAG = "Z_DAG",
  S = "S",
  S_DAG = "S_DAG",
  T = "T",
  T_DAG = "T_DAG",
  H = "H",
  H_DAG = "H_DAG",
  RX = "RX",
  RY = "RY",
  RZ = "RZ",
  U = "U",
  // Sentinel for Level 1.6: target is a random unitary generated server-side.
  RANDOM_U = "RANDOM_U",

  // 2-qubit gates
  CNOT = "CNOT",
  CNOT_FLIPPED = "CNOT_FLIPPED",
  CONTROLLED_Z = "CONTROLLED_Z",
  SWAP = "SWAP",
  CONTROLLED_H = "CONTROLLED_H",
  CONTROLLED_U = "CONTROLLED_U",

  // 3-qubit gates
  TOFFOLI = "TOFFOLI",
  FREDKIN = "FREDKIN",
}

/** All single-qubit gates available in the toolbox */
export type SingleQubitGate =
  | Gate.X | Gate.X_DAG
  | Gate.SQRT_X | Gate.SQRT_X_DAG
  | Gate.Y | Gate.Y_DAG
  | Gate.Z | Gate.Z_DAG
  | Gate.S | Gate.S_DAG
  | Gate.T | Gate.T_DAG
  | Gate.H | Gate.H_DAG
  | Gate.RX | Gate.RY | Gate.RZ | Gate.U;

/** All two-qubit gates available in the toolbox */
export type TwoQubitGate =
  | Gate.CNOT
  | Gate.CNOT_FLIPPED
  | Gate.CONTROLLED_Z
  | Gate.SWAP
  | Gate.CONTROLLED_H
  | Gate.CONTROLLED_U;

/**
 * For single-qubit placement: which wire the chip sits on.
 * Capped at 2 for the current roadmap (max 3 qubits per level).
 */
export type SingleWire = 0 | 1 | 2;

/** Order type that can represent any 2-bit pair */
export type AnyQubitOrder = readonly [0 | 1, 0 | 1]; // covers [0,0], [1,1], [0,1], [1,0]

/** Control–target assignment for a 2-qubit gate: [control, target]. */
export type ControlTargetOrder = readonly [0, 1] | readonly [1, 0];

/** A step in a quantum circuit: one gate + qubit order. */
export type GateStep = {
  gate: Gate;
  order: AnyQubitOrder;
  theta?: number;
};

/** Single-qubit chip placed on a specific wire. */
export type PlacedSingleQubitGate = {
  id: string;
  type: SingleQubitGate;
  wire: SingleWire;
  column: number;
  /** Rotation angle in radians (RX, RY, RZ); sent as `{"gate","theta"}` when set. */
  theta?: number;
  /** When true, random-theta grading substitutes sampled θ into this gate. */
  isParameterSlot?: boolean;
};

/** Two-qubit CNOT chip placed on the canvas. */
export type PlacedTwoQubitGate = {
  id: string;
  type: TwoQubitGate;
  order: ControlTargetOrder;
  column: number;
};

/** Any placed gate on the canvas. */
export type PlacedGate = PlacedSingleQubitGate | PlacedTwoQubitGate;
