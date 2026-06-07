"""
Controller smoke tests (formerly ``testing/mwe.py``).

**Purpose:** Exercise ``simulate_unitaries`` exactly the way ``app/api/simulate.py``
does after building a ``UnitaryDTO``—without Flask or HTTP. This is the fastest way
to confirm the trial/target truth-table contract still holds when the pipeline changes.

Two categories of test live here:

1. **Fixed targets (e.g. SWAP)** — target has pre-stored ``expected_outputs``; the
   controller reads those directly when ``validate_target=False``.

2. **Parameterized targets (e.g. RX, RY)** — no pre-stored outputs; the controller
   always simulates the target circuit live using the student's submitted theta.
   When the student submits the exact target gate at the same angle, trial outputs
   must equal target outputs exactly.

Run from the QMCB-be folder:
    python -m pytest tests/test_mwe.py -v
"""

from __future__ import annotations

import math
from unittest.mock import patch

import pytest

from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate
from app.utils.helpers import get_qubit_order, get_target_gates
from tests.simulate_helpers import run_simulate

TRUTH_TABLE_KEYS = {"input", "output", "probabilities", "amplitudes"}


@pytest.fixture
def swap_three_cnot_trial() -> UnitaryDTO:
    """
    Trial circuit matching the old scratch script: 2 qubits, three CNOTs, SWAP-style
    qubit-order pattern (control/target wiring exercise).
    """
    return UnitaryDTO(
        number_of_qubits=2,
        gates=["CNOT", "CNOT", "CNOT"],
        qubit_order=[[0, 1], [1, 0], [0, 1]],
    )


@pytest.fixture
def target_swap_dto() -> UnitaryDTO:
    """Canonical reference circuit metadata for target name ``SWAP`` (library-driven)."""
    json_gate = "SWAP"
    return UnitaryDTO(
        number_of_qubits=2,
        gates=get_target_gates(json_gate),
        qubit_order=get_qubit_order(json_gate),
    )


def test_simulate_unitaries_api_shape_and_baseline(
    swap_three_cnot_trial: UnitaryDTO,
) -> None:
    """
    **What it does:** Calls ``simulate_unitaries(trial_dto, target_name, False)`` and
    checks HTTP status, response keys, and stable truth-table rows for this fixture.

    **What it is for:** Regressions in ``simulate_unitaries``, ``CircuitBuilder``,
    ``CircuitSimulator``, or target-library wiring. Patches ``print`` only for the
    controller call so pytest output stays readable (Cirq diagrams and debug lines are
    still available if you remove the patch temporarily).
    """
    target_name = "SWAP"

    # Production code prints circuits and gate debug lines; silence for test logs.
    with patch("builtins.print"):
        response, status = run_simulate(
            swap_three_cnot_trial, target_name, validate_target=False
        )

    assert status == 200
    assert response["validation_mode"] is False
    assert response["message"] == "Successfully simulated circuits."

    trial = response["trial_truth_table"]
    assert set(trial.keys()) == TRUTH_TABLE_KEYS
    assert trial["input"] == ["|00>", "|01>", "|10>", "|11>"]
    # Wavefunction column uses Cirq ket Unicode; values come from current Cirq pipeline.
    assert trial["output"] == ["|00⟩", "|10⟩", "|01⟩", "|11⟩"]

    target = response["target_truth_table"]
    # Inputs are ket-formatted by build_target_truth_table to match the trial side.
    assert target["input"] == ["|00>", "|01>", "|10>", "|11>"]
    # Outputs are Dirac-notation strings stored in TARGET_LIBRARY expected_outputs.
    assert target["output"] == ["|00⟩", "|10⟩", "|01⟩", "|11⟩"]


def test_simulate_unitaries_mixed_string_and_dict_gates() -> None:
    """
    End-to-end: ``gates`` may mix legacy strings and ``{"gate": ..., "theta"?}`` dicts;
    wiring stays on ``qubit_order[i]`` for every index.
    """
    trial = UnitaryDTO(
        number_of_qubits=2,
        gates=["CNOT", {"gate": "H"}],
        qubit_order=[[0, 1], [0]],
    )
    with patch("builtins.print"):
        response, status = run_simulate(trial, "SWAP", validate_target=False)
    assert status == 200
    trial_tt = response["trial_truth_table"]
    assert set(trial_tt.keys()) == TRUTH_TABLE_KEYS
    assert trial_tt["input"] == ["|00>", "|01>", "|10>", "|11>"]


@pytest.mark.parametrize(
    "gate_name,target_name",
    [
        ("RX", "RX"),
        ("RY", "RY"),
    ],
)
def test_parameterized_target_random_theta_response_shape(
    gate_name: str, target_name: str
) -> None:
    """
    **What it does:** Submits a single parameterized gate (RX or RY) and verifies
    that the RANDOM_THETA grading path returns the correct response shape (no truth
    tables, sampling fields present, all_match True).

    **What it is for:** End-to-end regression for the RANDOM_THETA grading path:
    - Resolver returns ``is_sampling=True`` → ``_grade_random_theta`` is invoked.
    - ``trial_truth_table`` and ``target_truth_table`` are ``None``.
    - ``grading_mode``, ``samples_checked``, ``samples_passed`` are present.
    - Submitting the bare canonical gate passes all samples (substitution makes it
      identical to the target at each sampled angle).
    """
    theta = 1.0  # arbitrary non-trivial angle

    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[{"gate": gate_name, "theta": theta}],
        qubit_order=[[0]],
    )

    response, status = run_simulate(trial, target_name, validate_target=False)

    assert status == 200
    assert response["grading_mode"] == "random_theta"
    assert response["trial_truth_table"] is None
    assert response["target_truth_table"] is None
    assert response["samples_checked"] == 10
    assert isinstance(response["samples_passed"], int)
    assert response["all_match"] is True


def test_hadamard_probabilities() -> None:
    """
    H on |0⟩ and |1⟩: each output basis state has probability ≈ 0.5.
    Manual check: |0.707 + 0j|² = 0.5, |0 + 0.707j|² = 0.5 (with 3-decimal rounding).
    """
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.H.value],
        qubit_order=[[0]],
    )

    with patch("builtins.print"):
        response, status = run_simulate(trial, Gate.H.value, validate_target=False)

    assert status == 200
    trial_tt = response["trial_truth_table"]
    assert set(trial_tt.keys()) == TRUTH_TABLE_KEYS

    probs = trial_tt["probabilities"]
    assert len(probs) == 2
    for row in probs:
        assert len(row) == 2
        assert abs(row[0] - 0.5) <= 0.02
        assert abs(row[1] - 0.5) <= 0.02

    amps = trial_tt["amplitudes"]
    assert amps[0] == [[0.707, 0.0], [0.707, 0.0]]
    assert amps[1] == [[0.707, 0.0], [-0.707, 0.0]]


def test_h_canonical_circuit_matches_via_probability_fallback() -> None:
    """Rz(π/2)·SQRT_X·Rz(π/2) differs in Dirac strings but matches H via probabilities."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
            Gate.SQRT_X.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ],
        qubit_order=[[0], [0], [0]],
    )

    with patch("builtins.print"):
        response, status = run_simulate(trial, Gate.H.value, validate_target=False)

    assert status == 200
    trial_tt = response["trial_truth_table"]
    target_tt = response["target_truth_table"]
    assert trial_tt["output"] != target_tt["output"]
    assert response["all_match"] is True


def test_target_dto_matches_swap_library_metadata(target_swap_dto: UnitaryDTO) -> None:
    """
    **What it does:** Asserts helper-derived target ``UnitaryDTO`` matches the SWAP
    entry (same checks the old script printed manually).

    **What it is for:** Catches accidental changes to ``get_target_gates`` /
    ``get_qubit_order`` for SWAP without running the full simulator.
    """
    assert target_swap_dto.qubit_order == [[0, 1], [1, 0], [0, 1]]
    assert len(target_swap_dto.gates) == 3
    assert all(g == "CNOT" for g in target_swap_dto.gates)
