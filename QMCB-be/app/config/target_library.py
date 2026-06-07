import math
from typing import Dict, Any
from app.utils.constants import (
    Basis,
    Gate,
    LEVEL1_QUBITS,
    LEVEL2_QUBITS,
    TargetLibraryField,
    TargetParameterMode,
)
from app.utils.qubit_orders import Q0, Q1, C0_T1, C1_T0


def _fixed_level(
    num_qubits: int,
    steps: list[dict],
    expected_outputs: list[str],
    allow_global_phase: bool = True,
) -> Dict[str, Any]:
    return {
        TargetLibraryField.NUM_QUBITS.value: num_qubits,
        TargetLibraryField.PARAMETERIZED.value: False,
        TargetLibraryField.PARAMETER_MODE.value: TargetParameterMode.FIXED.value,
        TargetLibraryField.ALLOW_GLOBAL_PHASE.value: allow_global_phase,
        TargetLibraryField.STEPS.value: steps,
        TargetLibraryField.EXPECTED_OUTPUTS.value: expected_outputs,
    }


TARGET_LIBRARY: Dict[str, Dict[str, Any]] = {
    # ========================
    # LEVEL 1.0: X GATE
    # ========================
    Gate.X.value: _fixed_level(
        LEVEL1_QUBITS,
        [{TargetLibraryField.GATE.value: Gate.X.value, TargetLibraryField.ORDER.value: Q0}],
        [Basis.STATE_1.value, Basis.STATE_0.value],
    ),
    # ========================
    # LEVEL 1.1: S GATE
    # ========================
    Gate.S.value: _fixed_level(
        LEVEL1_QUBITS,
        [{TargetLibraryField.GATE.value: Gate.S.value, TargetLibraryField.ORDER.value: Q0}],
        [Basis.STATE_0.value, "1j|1⟩"],
    ),
    # ========================
    # LEVEL 1.2: T GATE
    # ========================
    Gate.T.value: _fixed_level(
        LEVEL1_QUBITS,
        [{TargetLibraryField.GATE.value: Gate.T.value, TargetLibraryField.ORDER.value: Q0}],
        [Basis.STATE_0.value, "(0.707+0.707j)|1⟩"],
    ),
    # ========================
    # LEVEL 1.3: H GATE
    # ========================
    Gate.H.value: _fixed_level(
        LEVEL1_QUBITS,
        [{TargetLibraryField.GATE.value: Gate.H.value, TargetLibraryField.ORDER.value: Q0}],
        ["0.707|0⟩ + 0.707|1⟩", "0.707|0⟩ - 0.707|1⟩"],
    ),
    # ========================
    # LEVEL 1.4: RX GATE
    # ========================
    Gate.RX.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL1_QUBITS,
        TargetLibraryField.PARAMETERIZED.value: True,
        TargetLibraryField.PARAMETER_MODE.value: TargetParameterMode.RANDOM_THETA.value,
        TargetLibraryField.ALLOW_GLOBAL_PHASE.value: True,
        "canonical_gate": Gate.RX.value,
        # No steps — target is cirq.rx(theta_i) built directly inside the sampling loop.
    },
    # ========================
    # LEVEL 1.5: RY GATE
    # ========================
    Gate.RY.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL1_QUBITS,
        TargetLibraryField.PARAMETERIZED.value: True,
        TargetLibraryField.PARAMETER_MODE.value: TargetParameterMode.RANDOM_THETA.value,
        TargetLibraryField.ALLOW_GLOBAL_PHASE.value: True,
        "canonical_gate": Gate.RY.value,
        # No steps — target is cirq.ry(theta_i) built directly inside the sampling loop.
    },
    # ========================
    # LEVEL 1.6: RANDOM UNITARY
    # ========================
    Gate.RANDOM_U.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL1_QUBITS,
        TargetLibraryField.PARAMETERIZED.value: True,
        TargetLibraryField.PARAMETER_MODE.value: TargetParameterMode.SEED_ZXZ.value,
        TargetLibraryField.ALLOW_GLOBAL_PHASE.value: False,
        TargetLibraryField.STEPS.value: [
            {TargetLibraryField.GATE.value: Gate.RZ.value, TargetLibraryField.ORDER.value: Q0},
            {TargetLibraryField.GATE.value: Gate.RX.value, TargetLibraryField.ORDER.value: Q0},
            {TargetLibraryField.GATE.value: Gate.RZ.value, TargetLibraryField.ORDER.value: Q0},
        ],
    },
    # ========================
    # LEVEL 2.1: CNOT FLIPPED
    # ========================
    Gate.CNOT_FLIPPED.value: _fixed_level(
        LEVEL2_QUBITS,
        [
            {TargetLibraryField.GATE.value: Gate.H.value, TargetLibraryField.ORDER.value: Q0},
            {TargetLibraryField.GATE.value: Gate.H.value, TargetLibraryField.ORDER.value: Q1},
            {TargetLibraryField.GATE.value: Gate.CNOT.value, TargetLibraryField.ORDER.value: C1_T0},
            {TargetLibraryField.GATE.value: Gate.H.value, TargetLibraryField.ORDER.value: Q0},
            {TargetLibraryField.GATE.value: Gate.H.value, TargetLibraryField.ORDER.value: Q1},
        ],
        [
            Basis.STATE_00.value,
            Basis.STATE_01.value,
            Basis.STATE_11.value,
            Basis.STATE_10.value,
        ],
    ),
    # ========================
    # LEVEL 2.2: CONTROLLED-Z
    # ========================
    Gate.CONTROLLED_Z.value: _fixed_level(
        LEVEL2_QUBITS,
        [
            {TargetLibraryField.GATE.value: Gate.H.value, TargetLibraryField.ORDER.value: Q1},
            {TargetLibraryField.GATE.value: Gate.CNOT.value, TargetLibraryField.ORDER.value: C0_T1},
            {TargetLibraryField.GATE.value: Gate.H.value, TargetLibraryField.ORDER.value: Q1},
        ],
        [
            Basis.STATE_00.value,
            Basis.STATE_01.value,
            Basis.STATE_10.value,
            "-1|11⟩",
        ],
    ),
    # =================
    # LEVEL 2.3: SWAP
    # =================
    Gate.SWAP.value: _fixed_level(
        LEVEL2_QUBITS,
        [
            {TargetLibraryField.GATE.value: Gate.CNOT.value, TargetLibraryField.ORDER.value: C0_T1},
            {TargetLibraryField.GATE.value: Gate.CNOT.value, TargetLibraryField.ORDER.value: C1_T0},
            {TargetLibraryField.GATE.value: Gate.CNOT.value, TargetLibraryField.ORDER.value: C0_T1},
        ],
        [
            Basis.STATE_00.value,
            Basis.STATE_10.value,
            Basis.STATE_01.value,
            Basis.STATE_11.value,
        ],
    ),
    # ========================
    # LEVEL 2.4: CONTROLLED-H
    # ========================
    Gate.CONTROLLED_H.value: _fixed_level(
        LEVEL2_QUBITS,
        [
            {
                TargetLibraryField.GATE.value: Gate.RY.value,
                TargetLibraryField.ORDER.value: Q1,
                "theta": math.pi / 4,
            },
            {
                TargetLibraryField.GATE.value: Gate.CNOT.value,
                TargetLibraryField.ORDER.value: C0_T1,
            },
            {
                TargetLibraryField.GATE.value: Gate.RY.value,
                TargetLibraryField.ORDER.value: Q1,
                "theta": -(math.pi / 4),
            },
        ],
        [
            Basis.STATE_00.value,
            Basis.STATE_01.value,
            "0.707|10⟩ + 0.707|11⟩",
            "0.707|10⟩ - 0.707|11⟩",
        ],
    ),
    # ========================
    # FUTURE: CONTROLLED-U (backend hook only — not shipped in UI)
    # ========================
    Gate.CONTROLLED_U.value: {
        TargetLibraryField.NUM_QUBITS.value: LEVEL2_QUBITS,
        TargetLibraryField.PARAMETERIZED.value: True,
        TargetLibraryField.PARAMETER_MODE.value: TargetParameterMode.TRIAL_ZXZ.value,
        TargetLibraryField.ALLOW_GLOBAL_PHASE.value: True,
        TargetLibraryField.STEPS.value: [
            {
                TargetLibraryField.GATE.value: Gate.CONTROLLED_U.value,
                TargetLibraryField.ORDER.value: C0_T1,
            },
        ],
    },
}
