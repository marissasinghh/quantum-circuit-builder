from typing import Dict, Any
from app.utils.constants import Basis, Gate, LEVEL1_QUBITS, LEVEL2_QUBITS, TargetLibraryField
from app.utils.qubit_orders import Q0, Q1, C0_T1, C1_T0


TARGET_LIBRARY: Dict[str, Dict[str, Any]] = {
    # ========================
    # LEVEL 1.0: X GATE
    # ========================
    Gate.X.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL1_QUBITS,
        TargetLibraryField.STEPS.value: [
            {
                TargetLibraryField.GATE.value: Gate.X.value,
                TargetLibraryField.ORDER.value: Q0,
            },
        ],
        TargetLibraryField.EXPECTED_OUTPUTS.value: [
            Basis.STATE_1.value,   # X|0⟩ = |1⟩
            Basis.STATE_0.value,   # X|1⟩ = |0⟩
        ],
    },
    # ========================
    # LEVEL 1.1: S GATE
    # ========================
    Gate.S.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL1_QUBITS,
        TargetLibraryField.STEPS.value: [
            {
                TargetLibraryField.GATE.value: Gate.S.value,
                TargetLibraryField.ORDER.value: Q0,
            },
        ],
        TargetLibraryField.EXPECTED_OUTPUTS.value: [
            Basis.STATE_0.value,     # S|0⟩ = |0⟩
            "1j|1⟩",   # S|1⟩ = i|1⟩
        ],
    },
    # ========================
    # LEVEL 1.2: T GATE
    # ========================
    Gate.T.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL1_QUBITS,
        TargetLibraryField.STEPS.value: [
            {
                TargetLibraryField.GATE.value: Gate.T.value,
                TargetLibraryField.ORDER.value: Q0,
            },
        ],
        TargetLibraryField.EXPECTED_OUTPUTS.value: [
            Basis.STATE_0.value,                   # T|0⟩ = |0⟩
            "(0.707+0.707j)|1⟩",     # T|1⟩ = e^(iπ/4)|1⟩
        ],
    },
    # ========================
    # LEVEL 2.1: CNOT FLIPPED
    # ========================
    Gate.CNOT_FLIPPED.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL2_QUBITS,
        TargetLibraryField.STEPS.value: [
            {
                TargetLibraryField.GATE.value: Gate.H.value,
                TargetLibraryField.ORDER.value: Q0,
            },
            {
                TargetLibraryField.GATE.value: Gate.H.value,
                TargetLibraryField.ORDER.value: Q1,
            },
            {
                TargetLibraryField.GATE.value: Gate.CNOT.value,
                TargetLibraryField.ORDER.value: C1_T0,
            },
            {
                TargetLibraryField.GATE.value: Gate.H.value,
                TargetLibraryField.ORDER.value: Q0,
            },
            {
                TargetLibraryField.GATE.value: Gate.H.value,
                TargetLibraryField.ORDER.value: Q1,
            },
        ],
        TargetLibraryField.EXPECTED_OUTPUTS.value: [
            Basis.STATE_00.value,   # |00⟩ → |00⟩
            Basis.STATE_01.value,   # |01⟩ → |01⟩
            Basis.STATE_11.value,   # |10⟩ → |11⟩
            Basis.STATE_10.value,   # |11⟩ → |10⟩
        ],
    },
    # ========================
    # LEVEL 2.2: CONTROLLED-Z
    # ========================
    Gate.CONTROLLED_Z.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL2_QUBITS,
        TargetLibraryField.STEPS.value: [
            {
                TargetLibraryField.GATE.value: Gate.H.value,
                TargetLibraryField.ORDER.value: Q1,
            },
            {
                TargetLibraryField.GATE.value: Gate.CNOT.value,
                TargetLibraryField.ORDER.value: C0_T1,
            },
            {
                TargetLibraryField.GATE.value: Gate.H.value,
                TargetLibraryField.ORDER.value: Q1,
            },
        ],
        TargetLibraryField.EXPECTED_OUTPUTS.value: [
            Basis.STATE_00.value,    # |00⟩ → |00⟩
            Basis.STATE_01.value,    # |01⟩ → |01⟩
            Basis.STATE_10.value,    # |10⟩ → |10⟩
            "-1|11⟩",  # |11⟩ → -|11⟩  (CZ adds phase -1 to |11⟩)
        ],
    },
    # =================
    # LEVEL 2.3: SWAP
    # =================
    Gate.SWAP.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL2_QUBITS,
        TargetLibraryField.STEPS.value: [
            {
                TargetLibraryField.GATE.value: Gate.CNOT.value,
                TargetLibraryField.ORDER.value: C0_T1,
            },
            {
                TargetLibraryField.GATE.value: Gate.CNOT.value,
                TargetLibraryField.ORDER.value: C1_T0,
            },
            {
                TargetLibraryField.GATE.value: Gate.CNOT.value,
                TargetLibraryField.ORDER.value: C0_T1,
            },
        ],
        TargetLibraryField.EXPECTED_OUTPUTS.value: [
            Basis.STATE_00.value,   # |00⟩ → |00⟩
            Basis.STATE_10.value,   # |01⟩ → |10⟩
            Basis.STATE_01.value,   # |10⟩ → |01⟩
            Basis.STATE_11.value,   # |11⟩ → |11⟩
        ],
    },
}
