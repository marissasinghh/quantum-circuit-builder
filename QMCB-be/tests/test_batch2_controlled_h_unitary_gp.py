"""
Batch 2: CONTROLLED_H uses grading_mode=unitary_global_phase.

Closes Born-probability holes: swapped Ry sandwich; canonical then CZ.
Taught Ry(π/4)·CNOT·Ry(-π/4) must still pass.
"""

from __future__ import annotations

import math

from app.config.target_library import TARGET_LIBRARY
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate, GradingMode, TargetLibraryField
from app.utils.qubit_orders import C0_T1, C1_T0, Q1
from tests.simulate_helpers import run_simulate

UNITARY_GP_LEVELS = frozenset(
    {
        Gate.Y.value,
        Gate.H.value,
        Gate.SQRT_X_DAG.value,
        Gate.CONTROLLED_H.value,
        Gate.RANDOM_U.value,
    }
)

_CH_CANONICAL_GATES = [
    {"gate": Gate.RY.value, "theta": math.pi / 4},
    Gate.CNOT.value,
    {"gate": Gate.RY.value, "theta": -math.pi / 4},
]
_CH_CANONICAL_ORDER = [Q1, C0_T1, Q1]


def test_controlled_h_library_sets_unitary_global_phase() -> None:
    assert TARGET_LIBRARY[Gate.CONTROLLED_H.value].get(
        TargetLibraryField.GRADING_MODE.value
    ) == GradingMode.UNITARY_GLOBAL_PHASE.value
    with_mode = {
        name
        for name, entry in TARGET_LIBRARY.items()
        if entry.get(TargetLibraryField.GRADING_MODE.value)
        == GradingMode.UNITARY_GLOBAL_PHASE.value
    }
    assert with_mode == UNITARY_GP_LEVELS


def test_ch_canonical_passes() -> None:
    trial = UnitaryDTO(
        number_of_qubits=2,
        gates=list(_CH_CANONICAL_GATES),
        qubit_order=list(_CH_CANONICAL_ORDER),
    )
    response, status = run_simulate(trial, Gate.CONTROLLED_H.value)
    assert status == 200
    assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
    assert response["all_match"] is True


def test_ch_swapped_ry_angles_fail() -> None:
    """Confirmed pre-fix hole: same Born probs, not phase-equivalent."""
    trial = UnitaryDTO(
        number_of_qubits=2,
        gates=[
            {"gate": Gate.RY.value, "theta": -math.pi / 4},
            Gate.CNOT.value,
            {"gate": Gate.RY.value, "theta": math.pi / 4},
        ],
        qubit_order=list(_CH_CANONICAL_ORDER),
    )
    response, status = run_simulate(trial, Gate.CONTROLLED_H.value)
    assert status == 200
    assert response["all_match"] is False


def test_ch_canonical_then_cz_fails() -> None:
    """Relative phase on control=1 subspace — not a global phase."""
    trial = UnitaryDTO(
        number_of_qubits=2,
        gates=[
            *_CH_CANONICAL_GATES,
            Gate.CONTROLLED_Z.value,
        ],
        qubit_order=[*_CH_CANONICAL_ORDER, C0_T1],
    )
    response, status = run_simulate(trial, Gate.CONTROLLED_H.value)
    assert status == 200
    assert response["all_match"] is False


def test_ch_flipped_cnot_still_fails() -> None:
    trial = UnitaryDTO(
        number_of_qubits=2,
        gates=list(_CH_CANONICAL_GATES),
        qubit_order=[Q1, C1_T0, Q1],
    )
    response, status = run_simulate(trial, Gate.CONTROLLED_H.value)
    assert status == 200
    assert response["all_match"] is False


def test_ch_then_s_on_target_still_fails() -> None:
    trial = UnitaryDTO(
        number_of_qubits=2,
        gates=[*_CH_CANONICAL_GATES, Gate.S.value],
        qubit_order=[*_CH_CANONICAL_ORDER, Q1],
    )
    response, status = run_simulate(trial, Gate.CONTROLLED_H.value)
    assert status == 200
    assert response["all_match"] is False


def test_cz_library_untouched_no_grading_mode() -> None:
    """CZ stays exact / out of Batch 2 scope."""
    assert (
        TARGET_LIBRARY[Gate.CONTROLLED_Z.value].get(
            TargetLibraryField.GRADING_MODE.value
        )
        is None
    )


def test_prior_unitary_gp_levels_still_ok() -> None:
    y = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.X.value, Gate.Z.value],
        qubit_order=[[0], [0]],
    )
    h = UnitaryDTO(number_of_qubits=1, gates=[Gate.H.value], qubit_order=[[0]])
    sx = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.SQRT_X.value, Gate.X.value],
        qubit_order=[[0], [0]],
    )
    for trial, target in (
        (y, Gate.Y.value),
        (h, Gate.H.value),
        (sx, Gate.SQRT_X_DAG.value),
    ):
        response, status = run_simulate(trial, target)
        assert status == 200, target
        assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
        assert response["all_match"] is True, target


def test_bucket_a_still_exact() -> None:
    identity = UnitaryDTO(number_of_qubits=1, gates=[], qubit_order=[])
    for target in (Gate.Z.value, Gate.S.value, Gate.T.value):
        response, status = run_simulate(identity, target)
        assert status == 200, target
        assert response["grading_mode"] is None, target
        assert response["all_match"] is False, target


def test_random_u_now_unitary_gp_mode() -> None:
    """RANDOM_U opted into unitary_global_phase with explicit grading_atol=1e-3."""
    level = TARGET_LIBRARY[Gate.RANDOM_U.value]
    assert level.get(TargetLibraryField.GRADING_MODE.value) == (
        GradingMode.UNITARY_GLOBAL_PHASE.value
    )
    assert level.get(TargetLibraryField.GRADING_ATOL.value) == 1e-3
