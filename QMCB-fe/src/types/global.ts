/**
 * Domain-wide TypeScript types.
 */

export enum Gate {
  // 1-qubit gates
  S = "S",
  T = "T",
  H = "H",
  RX = "RX",
  RY = "RY",
  U = "U",

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
export type SingleQubitGate = Gate.H | Gate.T | Gate.S | Gate.RX | Gate.RY | Gate.U;

/** All two-qubit gates available in the toolbox */
export type TwoQubitGate =
  | Gate.CNOT
  | Gate.CNOT_FLIPPED
  | Gate.CONTROLLED_Z
  | Gate.SWAP
  | Gate.CONTROLLED_H
  | Gate.CONTROLLED_U;

/** For single-qubit placement: which wire the chip sits on. */
export type SingleWire = 0 | 1;

/** Order type that can represent any 2-bit pair */
export type AnyQubitOrder = readonly [0 | 1, 0 | 1]; // covers [0,0], [1,1], [0,1], [1,0]

/** Control–target assignment for a 2-qubit gate: [control, target]. */
export type ControlTargetOrder = readonly [0, 1] | readonly [1, 0];

/** A step in a quantum circuit: one gate + qubit order. */
export type GateStep = {
  gate: Gate;
  order: AnyQubitOrder;
};

/** Single-qubit chip placed on a specific wire. */
export type PlacedSingleQubitGate = {
  id: string;
  type: SingleQubitGate;
  wire: SingleWire;
  column: number;
  /** Rotation angle in radians (RX, RY); sent as `{"gate","theta"}` when set. */
  theta?: number;
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
