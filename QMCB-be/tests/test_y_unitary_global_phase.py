"""
Y level grading_mode=unitary_global_phase.

Accepts X→Z / Z→X (global phase ±i vs cirq.Y) and S†→X→S (exact).
Rejects bare X (same Born probs on |0⟩/|1⟩, not phase-equivalent).
"""

from __future__ import annotations

from app.config.target_library import TARGET_LIBRARY
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate, GradingMode, TargetLibraryField
from tests.simulate_helpers import run_simulate


def test_y_library_sets_unitary_global_phase_mode() -> None:
    level = TARGET_LIBRARY[Gate.Y.value]
    assert level.get(TargetLibraryField.GRADING_MODE.value) == (
        GradingMode.UNITARY_GLOBAL_PHASE.value
    )
    # Y shares this mode with Batch 1 levels (H, √X†); all must be opted in explicitly.
    with_mode = {
        name
        for name, entry in TARGET_LIBRARY.items()
        if entry.get(TargetLibraryField.GRADING_MODE.value)
        == GradingMode.UNITARY_GLOBAL_PHASE.value
    }
    assert Gate.Y.value in with_mode
    assert with_mode == {Gate.Y.value, Gate.H.value, Gate.SQRT_X_DAG.value}

def test_x_then_z_passes_y() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.X.value, Gate.Z.value],
        qubit_order=[[0], [0]],
    )
    response, status = run_simulate(trial, Gate.Y.value)
    assert status == 200
    assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
    assert response["all_match"] is True


def test_z_then_x_passes_y() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.Z.value, Gate.X.value],
        qubit_order=[[0], [0]],
    )
    response, status = run_simulate(trial, Gate.Y.value)
    assert status == 200
    assert response["all_match"] is True


def test_bare_x_fails_y_despite_matching_probs() -> None:
    """Critical negative: X and Y share Born probs on computational basis inputs."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.X.value],
        qubit_order=[[0]],
    )
    response, status = run_simulate(trial, Gate.Y.value)
    assert status == 200
    assert response["all_match"] is False
    # Sanity: probabilities still match (same as investigation finding).
    trial_probs = response["trial_truth_table"]["probabilities"]
    target_probs = response["target_truth_table"]["probabilities"]
    assert trial_probs == target_probs


def test_sdag_x_s_still_passes_y() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.S_DAG.value, Gate.X.value, Gate.S.value],
        qubit_order=[[0], [0], [0]],
    )
    response, status = run_simulate(trial, Gate.Y.value)
    assert status == 200
    assert response["all_match"] is True


def test_bare_y_still_passes() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.Y.value],
        qubit_order=[[0]],
    )
    response, status = run_simulate(trial, Gate.Y.value)
    assert status == 200
    assert response["all_match"] is True
