"""
Batch 1: H and √X† use grading_mode=unitary_global_phase (same path as Y).

Closes Born-probability holes: S→H for H, bare √X for √X†.
Taught canonicals (ZXZ, √X→X) must still pass.
"""

from __future__ import annotations

import math

from app.config.target_library import TARGET_LIBRARY
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate, GradingMode, TargetLibraryField
from tests.simulate_helpers import run_simulate

UNITARY_GP_LEVELS = frozenset(
    {
        Gate.Y.value,
        Gate.H.value,
        Gate.SQRT_X_DAG.value,
        Gate.CONTROLLED_H.value,
    }
)


def _assert_ugp_mode(target_name: str) -> None:
    assert TARGET_LIBRARY[target_name].get(TargetLibraryField.GRADING_MODE.value) == (
        GradingMode.UNITARY_GLOBAL_PHASE.value
    )


def test_batch1_library_sets_unitary_global_phase_on_h_and_sqrt_x_dag() -> None:
    _assert_ugp_mode(Gate.H.value)
    _assert_ugp_mode(Gate.SQRT_X_DAG.value)
    with_mode = {
        name
        for name, entry in TARGET_LIBRARY.items()
        if entry.get(TargetLibraryField.GRADING_MODE.value)
        == GradingMode.UNITARY_GLOBAL_PHASE.value
    }
    assert with_mode == UNITARY_GP_LEVELS


def test_no_h_dag_library_entry_inherits_h() -> None:
    """H† is FE-only; simulate requests use backend target H (same as Y† → Y)."""
    assert "H_DAG" not in TARGET_LIBRARY


# ── H ─────────────────────────────────────────────────────────────────────────


def test_bare_h_passes() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1, gates=[Gate.H.value], qubit_order=[[0]]
    )
    response, status = run_simulate(trial, Gate.H.value)
    assert status == 200
    assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
    assert response["all_match"] is True


def test_zxz_canonical_passes_h() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
            Gate.SQRT_X.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ],
        qubit_order=[[0], [0], [0]],
    )
    response, status = run_simulate(trial, Gate.H.value)
    assert status == 200
    assert response["all_match"] is True


def test_s_then_h_fails_h() -> None:
    """Born probs match H but operations are not phase-equivalent — must fail."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.S.value, Gate.H.value],
        qubit_order=[[0], [0]],
    )
    response, status = run_simulate(trial, Gate.H.value)
    assert status == 200
    assert response["all_match"] is False


def test_h_dag_request_target_h_same_as_h() -> None:
    """FE sends backendTarget H for H† — same grader outcomes."""
    zxz = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
            Gate.SQRT_X.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ],
        qubit_order=[[0], [0], [0]],
    )
    bad = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.S.value, Gate.H.value],
        qubit_order=[[0], [0]],
    )
    ok, _ = run_simulate(zxz, Gate.H.value)
    no, _ = run_simulate(bad, Gate.H.value)
    assert ok["all_match"] is True
    assert no["all_match"] is False


# ── √X† ───────────────────────────────────────────────────────────────────────


def test_bare_sqrt_x_dag_passes() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.SQRT_X_DAG.value],
        qubit_order=[[0]],
    )
    response, status = run_simulate(trial, Gate.SQRT_X_DAG.value)
    assert status == 200
    assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
    assert response["all_match"] is True


def test_sqrt_x_then_x_passes_sqrt_x_dag() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.SQRT_X.value, Gate.X.value],
        qubit_order=[[0], [0]],
    )
    response, status = run_simulate(trial, Gate.SQRT_X_DAG.value)
    assert status == 200
    assert response["all_match"] is True


def test_bare_sqrt_x_fails_sqrt_x_dag() -> None:
    """Confirmed pre-fix hole: same Born probs as √X†, not phase-equivalent."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.SQRT_X.value],
        qubit_order=[[0]],
    )
    response, status = run_simulate(trial, Gate.SQRT_X_DAG.value)
    assert status == 200
    assert response["all_match"] is False


# ── Spot-checks: untouched levels ─────────────────────────────────────────────


def test_y_still_unitary_global_phase() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.X.value, Gate.Z.value],
        qubit_order=[[0], [0]],
    )
    response, status = run_simulate(trial, Gate.Y.value)
    assert status == 200
    assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
    assert response["all_match"] is True


def test_bucket_a_z_s_t_still_exact() -> None:
    """Identity must still fail phase-sensitive pre-H levels (mechanism #1)."""
    identity = UnitaryDTO(number_of_qubits=1, gates=[], qubit_order=[])
    for target in (Gate.Z.value, Gate.S.value, Gate.T.value):
        response, status = run_simulate(identity, target)
        assert status == 200, target
        assert response["grading_mode"] is None, target
        assert response["all_match"] is False, target


def test_controlled_h_grading_mode_is_unitary_global_phase() -> None:
    """Batch 2: CH opted into unitary GP (no longer unset)."""
    assert TARGET_LIBRARY[Gate.CONTROLLED_H.value].get(
        TargetLibraryField.GRADING_MODE.value
    ) == GradingMode.UNITARY_GLOBAL_PHASE.value
