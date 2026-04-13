"""
Controller smoke tests (formerly ``testing/mwe.py``).

**Purpose:** Exercise ``simulate_unitaries`` exactly the way ``app/api/simulate.py``
does after building a ``UnitaryDTO``—without Flask or HTTP. This is the fastest way
to confirm the trial/target truth-table contract still holds when the pipeline changes.

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
    assert target["input"] == ["00", "01", "10", "11"]
    assert target["output"] == ["00", "10", "01", "11"]


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
