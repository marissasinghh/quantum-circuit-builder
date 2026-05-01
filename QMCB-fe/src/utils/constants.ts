/**
 * Runtime constants shared across the app.
 */

import type { ControlTargetOrder, AnyQubitOrder } from "../types/global";
import { Gate } from "../types/global";

export const MAX_GATES = 10;

export const LEVEL1_QUBITS = 1 as const;
export const LEVEL2_QUBITS = 2 as const;

// =====================
// QUBIT ORDER PATTERNS
// =====================

/** Single-qubit gates */
export const Q0: AnyQubitOrder = [0, 0] as const;
export const Q1: AnyQubitOrder = [1, 1] as const;

/** 2-qubit gates */
export const C0_T1: ControlTargetOrder = [0, 1] as const;
export const C1_T0: ControlTargetOrder = [1, 0] as const;

/** 3-qubit gates */
export const CC0_C1_T2: readonly [0, 1, 2] = [0, 1, 2] as const;
export const CC0_C2_T1: readonly [0, 2, 1] = [0, 2, 1] as const;

/** Legal control–target orders to offer for 2-qubit primitives */
export const ALLOWED_QUBIT_ORDERS: readonly ControlTargetOrder[] = [C0_T1, C1_T0] as const;

/** Default order when a chip is dropped onto the canvas */
export const DEFAULT_QUBIT_ORDER: ControlTargetOrder = C0_T1;

// ========================
// BASIS STATES - 1 QUBITS
// ========================`

export const BASIS_0 = "|0⟩" as const;
export const BASIS_1 = "|1⟩" as const;

export const ONE_QUBIT_INPUTS = [BASIS_0, BASIS_1] as const;

// ====================================
// SIMULATOR OUTPUT STRINGS - 1 QUBIT
// ====================================

export const S_OUT_1  = "1j|1⟩" as const;
export const T_OUT_1  = "(0.707+0.707j)|1⟩" as const;
export const H_OUT_0  = "0.707|0⟩ + 0.707|1⟩" as const;
export const H_OUT_1  = "0.707|0⟩ - 0.707|1⟩" as const;

// ========================
// BASIS STATES - 2 QUBITS
// ========================

export const BASIS_00 = "|00⟩" as const;
export const BASIS_01 = "|01⟩" as const;
export const BASIS_10 = "|10⟩" as const;
export const BASIS_11 = "|11⟩" as const;

export const TWO_QUBIT_INPUTS = [BASIS_00, BASIS_01, BASIS_10, BASIS_11] as const;

// ===============
// GATE CONSTANTS
// ===============

export const SINGLE_QUBIT_GATES = [Gate.S, Gate.T, Gate.H, Gate.RX, Gate.RY, Gate.U] as const;

/** Type helper: extract the union type from the array */
export type SingleQubitGate = (typeof SINGLE_QUBIT_GATES)[number]; // Gate.S | Gate.T | ...
