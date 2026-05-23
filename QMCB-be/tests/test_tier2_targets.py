"""
Tier-2 target tests: correct and wrong student circuits for Levels 2.1–2.4.

Level 2.4 (CONTROLLED_H): control=qubit0, target=qubit1.
When control=0 the state passes through unchanged; when control=1, H is applied
to the target qubit.

Truth table (cirq.dirac_notation, decimals=3):
  [0,0] → |00⟩
  [0,1] → |01⟩
  [1,0] → 0.707|10⟩ + 0.707|11⟩   (H|0⟩ on target)
  [1,1] → 0.707|10⟩ - 0.707|11⟩   (H|1⟩ on target)

Decomposition used as the reference / correct student circuit:
  Ry(+π/4)[Q1]  ·  CNOT[C0_T1]  ·  Ry(−π/4)[Q1]

Run from QMCB-be/:
    python -m pytest tests/test_tier2_targets.py -v
"""
from __future__ import annotations

import math
from unittest.mock import patch

import pytest

from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate
from tests.simulate_helpers import run_simulate


# ── Helpers ───────────────────────────────────────────────────────────────────


def _run(trial: UnitaryDTO, target_name: str, *, validate_target: bool = True):
    """Call simulate_unitaries with print suppressed; return (response, status)."""
    return run_simulate(trial, target_name, validate_target=validate_target)


def _two(gates: list, orders: list) -> UnitaryDTO:
    """Build a 2-qubit UnitaryDTO."""
    return UnitaryDTO(number_of_qubits=2, gates=list(gates), qubit_order=list(orders))


# ── Level 2.4 ─────────────────────────────────────────────────────────────────

_CH_THETA = math.pi / 4

# The correct student circuit: Ry(+π/4)[Q1] · CNOT[C0_T1] · Ry(−π/4)[Q1]
_CORRECT_GATES = [
    {"gate": Gate.RY.value, "theta": _CH_THETA},
    Gate.CNOT.value,
    {"gate": Gate.RY.value, "theta": -_CH_THETA},
]
_CORRECT_ORDERS = [
    [1],        # Ry on qubit 1 (target)
    [0, 1],     # CNOT: control=qubit0, target=qubit1
    [1],        # Ry on qubit 1 (target)
]


class TestControlledHTarget:
    """
    Level 2.4 — Controlled-H: control=qubit0, target=qubit1.

    correct circuit:  Ry(+π/4)[Q1] · CNOT[C0_T1] · Ry(−π/4)[Q1]
    wrong circuit:    single X gate on qubit 0 (completely wrong result)
    """

    def test_correct_circuit_all_match(self) -> None:
        """
        Submitting the exact Ry-CNOT-Ry decomposition must yield all_match=True.

        Exercises the full simulate_unitaries path: trial circuit is simulated
        live; target circuit is also simulated live (validate_target=True);
        string equality on all four basis-state rows must hold.
        """
        trial = _two(_CORRECT_GATES, _CORRECT_ORDERS)
        response, status = _run(trial, Gate.CONTROLLED_H.value)
        assert status == 200
        assert response["all_match"] is True

    def test_wrong_circuit_no_match(self) -> None:
        """
        A single X gate on qubit 0 produces a completely different truth table
        and must not match the CONTROLLED_H target.
        """
        trial = _two([Gate.X.value], [[0]])
        response, status = _run(trial, Gate.CONTROLLED_H.value)
        assert status == 200
        assert response["all_match"] is False

    def test_all_four_rows_target_outputs(self) -> None:
        """
        Assert the exact Cirq dirac_notation strings for all four target rows.

        Rows 0–1 are pass-through (control=0); rows 2–3 have H applied to the
        target qubit (control=1).  The strings must match the stored
        expected_outputs in TARGET_LIBRARY exactly, confirming the decomposition
        produces the canonical CH truth table.
        """
        trial = _two(_CORRECT_GATES, _CORRECT_ORDERS)
        response, status = _run(trial, Gate.CONTROLLED_H.value)
        assert status == 200

        target_out = response["target_truth_table"]["output"]
        assert len(target_out) == 4

        assert target_out[0] == "|00⟩",               f"row 0: {target_out[0]!r}"
        assert target_out[1] == "|01⟩",               f"row 1: {target_out[1]!r}"
        assert target_out[2] == "0.707|10⟩ + 0.707|11⟩", f"row 2: {target_out[2]!r}"
        assert target_out[3] == "0.707|10⟩ - 0.707|11⟩", f"row 3: {target_out[3]!r}"

    def test_all_four_rows_trial_outputs_match_target(self) -> None:
        """
        When the student submits the correct decomposition, trial outputs must
        equal target outputs row-for-row (validates the trial simulation path,
        not just all_match).
        """
        trial = _two(_CORRECT_GATES, _CORRECT_ORDERS)
        response, status = _run(trial, Gate.CONTROLLED_H.value)
        assert status == 200

        trial_out = response["trial_truth_table"]["output"]
        target_out = response["target_truth_table"]["output"]
        assert trial_out == target_out, (
            f"trial:  {trial_out}\ntarget: {target_out}"
        )

    def test_stored_expected_outputs_match_live_simulation(self) -> None:
        """
        With validate_target=False the controller reads stored expected_outputs
        rather than simulating the target circuit live.  The stored strings must
        still match what a live simulation produces, confirming target_library.py
        was written correctly.

        This complements test_target_library.py which does the same check via a
        lower-level route (TargetUnitaryBuilder + CircuitSimulator directly).
        """
        trial = _two(_CORRECT_GATES, _CORRECT_ORDERS)
        stored_response, status = _run(
            trial, Gate.CONTROLLED_H.value, validate_target=False
        )
        live_response, _ = _run(
            trial, Gate.CONTROLLED_H.value, validate_target=True
        )
        assert status == 200
        assert stored_response["target_truth_table"]["output"] == \
               live_response["target_truth_table"]["output"]
