"""
Tier-3 target tests: correct and wrong student circuits for Levels 3.1–3.2.

Level 3.1 (TOFFOLI / CCX):
  3-qubit gate. control0=qubit0, control1=qubit1, target=qubit2.
  Flips the target qubit when both controls are |1⟩.

  Truth table (cirq.dirac_notation, decimals=3):
    [0,0,0] → |000⟩
    [0,0,1] → |001⟩
    [0,1,0] → |010⟩
    [0,1,1] → |011⟩
    [1,0,0] → |100⟩
    [1,0,1] → |101⟩
    [1,1,0] → |111⟩   (both controls 1, target 0→1)
    [1,1,1] → |110⟩   (both controls 1, target 1→0)

  Correct student circuit: single TOFFOLI gate, qubit_order=[0,1,2]

Level 3.2 (FREDKIN / CSWAP):
  3-qubit gate. control=qubit0, swap-target0=qubit1, swap-target1=qubit2.
  Swaps qubit1 and qubit2 when the control qubit is |1⟩.

  Truth table (cirq.dirac_notation, decimals=3):
    [0,0,0] → |000⟩
    [0,0,1] → |001⟩
    [0,1,0] → |010⟩
    [0,1,1] → |011⟩
    [1,0,0] → |100⟩
    [1,0,1] → |110⟩   (control 1, swap q1=0,q2=1 → q1=1,q2=0)
    [1,1,0] → |101⟩   (control 1, swap q1=1,q2=0 → q1=0,q2=1)
    [1,1,1] → |111⟩

  Correct student circuit: single FREDKIN gate, qubit_order=[0,1,2]

Run from QMCB-be/:
    python -m pytest tests/test_tier3_targets.py -v
    python -m pytest -v -k "toffoli or fredkin"
"""

from __future__ import annotations

from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate
from app.utils.qubit_orders import C0_C1_T2, C0_T1_T2
from tests.simulate_helpers import run_simulate


# ── Helpers ───────────────────────────────────────────────────────────────────


def _run(trial: UnitaryDTO, target_name: str, *, validate_target: bool = True):
    return run_simulate(trial, target_name, validate_target=validate_target)


def _three(gates: list, orders: list) -> UnitaryDTO:
    return UnitaryDTO(number_of_qubits=3, gates=list(gates), qubit_order=list(orders))


# ── Level 3.1 — Toffoli (CCX) ─────────────────────────────────────────────────


class TestToffoliTarget:
    """
    Level 3.1 — Toffoli gate: control0=Q0, control1=Q1, target=Q2.

    Correct circuit:  single TOFFOLI gate with qubit_order [0,1,2]
    Wrong circuit:    single X gate on qubit 0
    """

    def test_correct_circuit_all_match(self) -> None:
        """
        Submitting a single TOFFOLI gate must yield all_match=True.

        Exercises the full simulate_unitaries path for a 3-qubit target:
        trial circuit simulated live; target circuit simulated live
        (validate_target=True); all 8 basis-state rows must match.
        """
        trial = _three([Gate.TOFFOLI.value], [C0_C1_T2])
        response, status = _run(trial, Gate.TOFFOLI.value)
        assert status == 200
        assert response["all_match"] is True

    def test_wrong_circuit_no_match(self) -> None:
        """
        A single X gate on qubit 0 produces a completely different truth
        table and must not match the TOFFOLI target.
        """
        trial = _three([Gate.X.value], [[0]])
        response, status = _run(trial, Gate.TOFFOLI.value)
        assert status == 200
        assert response["all_match"] is False

    def test_stored_expected_outputs_match_live_simulation(self) -> None:
        """
        With validate_target=False the controller reads stored expected_outputs
        rather than simulating the target circuit live. The stored strings must
        still match what a live simulation produces, confirming target_library.py
        was written correctly for the Toffoli gate.
        """
        trial = _three([Gate.TOFFOLI.value], [C0_C1_T2])
        stored_response, status = _run(
            trial, Gate.TOFFOLI.value, validate_target=False
        )
        live_response, _ = _run(
            trial, Gate.TOFFOLI.value, validate_target=True
        )
        assert status == 200
        assert stored_response["target_truth_table"]["output"] == \
               live_response["target_truth_table"]["output"]

    def test_all_eight_rows_target_outputs(self) -> None:
        """
        Assert the exact Cirq dirac_notation strings for all 8 target rows.

        Rows 0–5 are pass-through (both controls not simultaneously 1);
        rows 6–7 have the target qubit flipped (both controls = 1).
        """
        trial = _three([Gate.TOFFOLI.value], [C0_C1_T2])
        response, status = _run(trial, Gate.TOFFOLI.value)
        assert status == 200

        out = response["target_truth_table"]["output"]
        assert len(out) == 8

        assert out[0] == "|000⟩", f"row 0: {out[0]!r}"
        assert out[1] == "|001⟩", f"row 1: {out[1]!r}"
        assert out[2] == "|010⟩", f"row 2: {out[2]!r}"
        assert out[3] == "|011⟩", f"row 3: {out[3]!r}"
        assert out[4] == "|100⟩", f"row 4: {out[4]!r}"
        assert out[5] == "|101⟩", f"row 5: {out[5]!r}"
        assert out[6] == "|111⟩", f"row 6 (|110⟩ input): {out[6]!r}"
        assert out[7] == "|110⟩", f"row 7 (|111⟩ input): {out[7]!r}"


# ── Level 3.2 — Fredkin (CSWAP) ───────────────────────────────────────────────


class TestFredkinTarget:
    """
    Level 3.2 — Fredkin gate: control=Q0, swap-targets=Q1/Q2.

    Correct circuit:  single FREDKIN gate with qubit_order [0,1,2]
    Wrong circuit:    single X gate on qubit 0
    """

    def test_correct_circuit_all_match(self) -> None:
        """
        Submitting a single FREDKIN gate must yield all_match=True.

        Exercises the full simulate_unitaries path for a 3-qubit target:
        trial circuit simulated live; target circuit simulated live
        (validate_target=True); all 8 basis-state rows must match.
        """
        trial = _three([Gate.FREDKIN.value], [C0_T1_T2])
        response, status = _run(trial, Gate.FREDKIN.value)
        assert status == 200
        assert response["all_match"] is True

    def test_wrong_circuit_no_match(self) -> None:
        """
        A single X gate on qubit 0 produces a completely different truth
        table and must not match the FREDKIN target.
        """
        trial = _three([Gate.X.value], [[0]])
        response, status = _run(trial, Gate.FREDKIN.value)
        assert status == 200
        assert response["all_match"] is False

    def test_stored_expected_outputs_match_live_simulation(self) -> None:
        """
        With validate_target=False the controller reads stored expected_outputs
        rather than simulating the target circuit live. The stored strings must
        still match what a live simulation produces, confirming target_library.py
        was written correctly for the Fredkin gate.
        """
        trial = _three([Gate.FREDKIN.value], [C0_T1_T2])
        stored_response, status = _run(
            trial, Gate.FREDKIN.value, validate_target=False
        )
        live_response, _ = _run(
            trial, Gate.FREDKIN.value, validate_target=True
        )
        assert status == 200
        assert stored_response["target_truth_table"]["output"] == \
               live_response["target_truth_table"]["output"]

    def test_all_eight_rows_target_outputs(self) -> None:
        """
        Assert the exact Cirq dirac_notation strings for all 8 target rows.

        Rows 0–3 are pass-through (control=0); row 4 is pass-through
        (control=1 but both swap targets equal); rows 5–6 have q1 and q2
        swapped; row 7 is pass-through (control=1, both targets equal).
        """
        trial = _three([Gate.FREDKIN.value], [C0_T1_T2])
        response, status = _run(trial, Gate.FREDKIN.value)
        assert status == 200

        out = response["target_truth_table"]["output"]
        assert len(out) == 8

        assert out[0] == "|000⟩", f"row 0: {out[0]!r}"
        assert out[1] == "|001⟩", f"row 1: {out[1]!r}"
        assert out[2] == "|010⟩", f"row 2: {out[2]!r}"
        assert out[3] == "|011⟩", f"row 3: {out[3]!r}"
        assert out[4] == "|100⟩", f"row 4: {out[4]!r}"
        assert out[5] == "|110⟩", f"row 5 (|101⟩ input): {out[5]!r}"
        assert out[6] == "|101⟩", f"row 6 (|110⟩ input): {out[6]!r}"
        assert out[7] == "|111⟩", f"row 7: {out[7]!r}"
