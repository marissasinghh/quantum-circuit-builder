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

from unittest.mock import patch

import pytest

from app.controllers.simulate import simulate_unitaries
from app.dto.unitary import UnitaryDTO
from app.utils.helpers import get_qubit_order, get_target_gates


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
        response, status = simulate_unitaries(
            swap_three_cnot_trial, target_name, validate_target=False
        )

    assert status == 200
    assert response["validation_mode"] is False
    assert response["message"] == "Successfully simulated circuits."

    trial = response["trial_truth_table"]
    assert set(trial.keys()) == {"input", "output"}
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
        response, status = simulate_unitaries(trial, "SWAP", validate_target=False)
    assert status == 200
    trial_tt = response["trial_truth_table"]
    assert set(trial_tt.keys()) == {"input", "output"}
    assert trial_tt["input"] == ["|00>", "|01>", "|10>", "|11>"]


@pytest.mark.parametrize(
    "gate_name,target_name",
    [
        ("RX", "RX"),
        ("RY", "RY"),
    ],
)
def test_parameterized_target_trial_matches_target_when_theta_identical(
    gate_name: str, target_name: str
) -> None:
    """
    **What it does:** Submits a single parameterized gate (RX or RY) at a fixed theta
    as the student's trial, with the same gate name as the target. Because the student
    submitted the exact target gate at the exact same angle, the controller must build
    the target circuit using that theta (extracted from the trial gates) and the
    resulting wavefunction outputs must be identical row-by-row.

    **What it is for:** End-to-end regression for the parameterized target path in
    ``simulate_unitaries``:
    - ``is_target_parameterized`` returns True → ``simulate_target_live`` is forced True
      even with ``validate_target=False``.
    - ``extract_theta_from_trial`` correctly pulls theta from a dict gate entry.
    - ``TargetUnitaryBuilder.build`` receives and applies the same theta.
    - Trial and target truth tables match when the student is correct.

    **Why validate_target=False:** Tests that the parameterized path overrides the
    stored-output shortcut; if the flag were ignored, target outputs would be empty
    or raise a KeyError (no ``expected_outputs`` in the library entry).
    """
    theta = 1.0  # arbitrary non-trivial angle; neither 0 nor π/2

    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[{"gate": gate_name, "theta": theta}],
        qubit_order=[[0]],
    )

    with patch("builtins.print"):
        response, status = simulate_unitaries(trial, target_name, validate_target=False)

    assert status == 200

    trial_tt = response["trial_truth_table"]
    target_tt = response["target_truth_table"]

    # Both sides must have the same two basis inputs (|0>, |1> for one qubit).
    assert trial_tt["input"] == ["|0>", "|1>"]
    assert target_tt["input"] == ["|0>", "|1>"]

    # Because the student submitted the exact target gate at the same theta,
    # every wavefunction output string must match.
    assert trial_tt["output"] == target_tt["output"], (
        f"{gate_name}(theta={theta}): trial outputs {trial_tt['output']!r} "
        f"do not match target outputs {target_tt['output']!r}"
    )


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
