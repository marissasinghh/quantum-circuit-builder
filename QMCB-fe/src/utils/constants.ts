/**
 * Runtime constants shared across the app.
 */

import type { ControlTargetOrder, AnyQubitOrder } from "../types/global";
import { Gate } from "../types/global";

export const MAX_GATES = 10;

export const LEVEL1_QUBITS = 1 as const;
export const LEVEL2_QUBITS = 2 as const;
export const LEVEL3_QUBITS = 3 as const;

// =====================
// QUBIT ORDER PATTERNS
// =====================

/** Single-qubit gates */
export const Q0: AnyQubitOrder = [0, 0] as const;
export const Q1: AnyQubitOrder = [1, 1] as const;

/** 2-qubit gates */
export const C0_T1: ControlTargetOrder = [0, 1] as const;
export const C1_T0: ControlTargetOrder = [1, 0] as const;

/** 3-qubit gates (aliases match backend qubit_orders.py naming) */
export const C0_C1_T2: readonly [0, 1, 2] = [0, 1, 2] as const;
export const C0_T1_T2: readonly [0, 1, 2] = [0, 1, 2] as const;
export const CC0_C1_T2: readonly [0, 1, 2] = C0_C1_T2;
export const CC0_C2_T1: readonly [0, 2, 1] = [0, 2, 1] as const;

/** Legal control–target orders to offer for 2-qubit primitives */
export const ALLOWED_QUBIT_ORDERS: readonly ControlTargetOrder[] = [C0_T1, C1_T0] as const;

/** Default order when a chip is dropped onto the canvas */
export const DEFAULT_QUBIT_ORDER: ControlTargetOrder = C0_T1;

/** Mirrors backend TargetParameterMode — how target circuit angles are resolved. */
export enum ParameterMode {
  FIXED = "fixed",
  TRIAL_THETA = "trial_theta",
  RANDOM_THETA = "random_theta",
  SEED_ZXZ = "seed_zxz",
  SEED_ZYZ = "seed_zyz",
  TRIAL_ZXZ = "trial_zxz",
}

/** sessionStorage key for Level 1.6 random-unitary seed persistence. */
export const RANDOM_UNITARY_SEED_KEY = "qmcb-random-unitary-seed";

/** sessionStorage key for Level 2.5 controlled-unitary seed persistence. */
export const CONTROLLED_UNITARY_SEED_KEY = "qmcb-controlled-unitary-seed";

/** localStorage key for gate-unlock progression. */
export const LEVEL_PROGRESS_KEY = "cnot_progress";

/** localStorage key for first-run onboarding dismissal. */
export const ONBOARDING_COMPLETE_KEY = "cnot_onboarding_complete";

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

// New Tier 1 gate outputs — full amplitude strings (not probability-only).
// Z, S_DAG, T_DAG are pure phase gates: identical measurement probabilities to
// the identity on basis inputs. Using amplitude strings is required so the
// grader can distinguish them from doing nothing.
export const SQRT_X_DAG_OUT_0 = "(0.5-0.5j)|0\u27e9 + (0.5+0.5j)|1\u27e9" as const;
export const SQRT_X_DAG_OUT_1 = "(0.5+0.5j)|0\u27e9 + (0.5-0.5j)|1\u27e9" as const;
export const Z_OUT_1           = "-1|1\u27e9" as const;
export const S_DAG_OUT_1       = "-1j|1\u27e9" as const;
export const T_DAG_OUT_1       = "(0.707-0.707j)|1\u27e9" as const;
export const Y_OUT_0           = "1j|1\u27e9" as const;
export const Y_OUT_1           = "-1j|0\u27e9" as const;

// ========================
// BASIS STATES - 2 QUBITS
// ========================

export const BASIS_00 = "|00⟩" as const;
export const BASIS_01 = "|01⟩" as const;
export const BASIS_10 = "|10⟩" as const;
export const BASIS_11 = "|11⟩" as const;

export const TWO_QUBIT_INPUTS = [BASIS_00, BASIS_01, BASIS_10, BASIS_11] as const;

// ====================================
// SIMULATOR OUTPUT STRINGS - 2 QUBIT
// ====================================

export const CH_OUT_10 = "0.707|10⟩ + 0.707|11⟩" as const;
export const CH_OUT_11 = "0.707|10⟩ - 0.707|11⟩" as const;

// ========================
// BASIS STATES - 3 QUBITS
// ========================

export const BASIS_000 = "|000⟩" as const;
export const BASIS_001 = "|001⟩" as const;
export const BASIS_010 = "|010⟩" as const;
export const BASIS_011 = "|011⟩" as const;
export const BASIS_100 = "|100⟩" as const;
export const BASIS_101 = "|101⟩" as const;
export const BASIS_110 = "|110⟩" as const;
export const BASIS_111 = "|111⟩" as const;

export const THREE_QUBIT_INPUTS = [
  BASIS_000,
  BASIS_001,
  BASIS_010,
  BASIS_011,
  BASIS_100,
  BASIS_101,
  BASIS_110,
  BASIS_111,
] as const;

// ===============
// GATE CONSTANTS
// ===============

export const SINGLE_QUBIT_GATES = [
  Gate.RZ, Gate.SQRT_X, Gate.X,
  Gate.SQRT_X_DAG, Gate.Z, Gate.Y,
  Gate.S, Gate.S_DAG, Gate.T, Gate.T_DAG,
  Gate.H, Gate.H_DAG,
  Gate.X_DAG, Gate.Z_DAG, Gate.Y_DAG,
  Gate.RX, Gate.RY, Gate.U,
] as const;

/** Type helper: extract the union type from the array */
export type SingleQubitGate = (typeof SINGLE_QUBIT_GATES)[number]; // Gate.S | Gate.T | ...
