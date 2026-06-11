"""
Tests verifying Level 2.5 (CONTROLLED_U) truth table correctness and grading.

Three test classes:

1. TestControlledURowsAtThreeSeeds   — numerical cross-check of all 4 truth-table
   rows at 3 independent angle triplets, using raw Cirq as an independent oracle.

2. TestControlledUGradingEndToEnd    — full simulate_unitaries grading path returns
   all_match=True for a correctly-wired CONTROLLED_U student circuit across 10 seeds.
   allow_global_phase=False is enforced: exact string match is required.

3. TestExistingFixedLevelsUnaffected — CNOT_FLIPPED (2.1) and CONTROLLED_Z (2.2)
   canonical circuits still pass after the Level 2.5 addition.

Run from QMCB-be/:
    python -m pytest tests/test_controlled_u_truth_table.py -v
"""
from __future__ import annotations

from unittest.mock import patch

import cirq
import pytest

from app.config.gates import _zxz_matrix
from app.controllers.controlled_unitary import generate_controlled_unitary_response
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate
from app.utils.euler_angles import angles_from_seed
from tests.simulate_helpers import run_simulate


# ── Shared helpers ─────────────────────────────────────────────────────────────


def _two(gates: list, orders: list) -> UnitaryDTO:
    """Build a 2-qubit UnitaryDTO."""
    return UnitaryDTO(number_of_qubits=2, gates=list(gates), qubit_order=list(orders))


def _run_cu(trial: UnitaryDTO, seed: int):
    """Run simulate_unitaries for a CONTROLLED_U target with print suppressed."""
    return run_simulate(trial, Gate.CONTROLLED_U.value, seed=seed)


def _cirq_cu_output(alpha: float, beta: float, gamma: float, basis_state: list[int]) -> str:
    """
    Compute CU|basis_state⟩ using raw Cirq as an independent oracle.

    Builds cirq.ControlledGate(MatrixGate(_zxz_matrix(α,β,γ))) with Q0=control
    (LineQubit(0)) and Q1=target (LineQubit(1)), simulates with the same
    qubit_order=[Q0,Q1] and decimals=3 as the backend generator, and returns
    the Dirac-notation string.
    """
    q0, q1 = cirq.LineQubit.range(2)
    u_matrix = _zxz_matrix(alpha, beta, gamma)
    cu_gate = cirq.ControlledGate(cirq.MatrixGate(u_matrix))

    circuit = cirq.Circuit()
    if basis_state[0] == 1:
        circuit.append(cirq.X(q0))
    if basis_state[1] == 1:
        circuit.append(cirq.X(q1))
    circuit.append(cu_gate(q0, q1))

    sim = cirq.Simulator()
    result = sim.simulate(circuit, qubit_order=[q0, q1])
    sv = result.final_state_vector.copy()
    return cirq.dirac_notation(sv, decimals=3)


# ── Class 1: row-level numerical correctness at 3 seed-derived angle triplets ──


@pytest.mark.parametrize("seed", [100, 200, 300])
class TestControlledURowsAtThreeSeeds:
    """
    Verify all 4 basis-state rows of the CONTROLLED_U truth table at 3 distinct
    angle triplets, cross-checking the backend generator against independent Cirq math.

    Seeds 100, 200, 300 each produce a different (α,β,γ) from angles_from_seed,
    covering different regions of the ZXZ parameter space:
      seed=100 → distinct angles away from zero and π
      seed=200 → different combination
      seed=300 → different combination
    """

    def test_control_zero_rows_are_always_pass_through(self, seed: int) -> None:
        """
        Rows 0 (|00⟩ input) and 1 (|01⟩ input) always output the same state —
        control qubit is 0, so U is never applied to the target.
        This invariant must hold for every possible inner unitary.
        """
        with patch("builtins.print"):
            data = generate_controlled_unitary_response(seed)
        outputs = data["truth_table"]["output"]
        assert outputs[0] == "|00⟩", f"seed={seed} row 0: expected |00⟩, got {outputs[0]!r}"
        assert outputs[1] == "|01⟩", f"seed={seed} row 1: expected |01⟩, got {outputs[1]!r}"

    def test_control_one_rows_match_independent_cirq_computation(self, seed: int) -> None:
        """
        Rows 2 (|10⟩ input) and 3 (|11⟩ input) match an independent Cirq oracle
        that constructs CU directly from the seed-derived ZXZ angles.

        This cross-checks the full _build_composite → CircuitSimulator pipeline
        against cirq.ControlledGate(MatrixGate(_zxz_matrix(α,β,γ))) at three
        distinct angle values.
        """
        alpha, beta, gamma = angles_from_seed(seed)

        with patch("builtins.print"):
            data = generate_controlled_unitary_response(seed)
        outputs = data["truth_table"]["output"]

        expected_row2 = _cirq_cu_output(alpha, beta, gamma, [1, 0])
        expected_row3 = _cirq_cu_output(alpha, beta, gamma, [1, 1])

        assert outputs[2] == expected_row2, (
            f"seed={seed} row 2 (|10⟩ input): "
            f"backend={outputs[2]!r}, oracle={expected_row2!r}"
        )
        assert outputs[3] == expected_row3, (
            f"seed={seed} row 3 (|11⟩ input): "
            f"backend={outputs[3]!r}, oracle={expected_row3!r}"
        )

    def test_all_four_rows_are_valid_ket_strings(self, seed: int) -> None:
        """Each output row is a non-empty Dirac-notation ket string."""
        with patch("builtins.print"):
            data = generate_controlled_unitary_response(seed)
        for i, s in enumerate(data["truth_table"]["output"]):
            assert isinstance(s, str) and len(s) > 0, (
                f"seed={seed} row {i}: output must be non-empty string, got {s!r}"
            )
            assert "⟩" in s, f"seed={seed} row {i}: not a ket string: {s!r}"


# ── Class 2: end-to-end grading path across 10 seeds ─────────────────────────


@pytest.mark.parametrize("seed", [1, 2, 3, 4, 5, 10, 100, 200, 500, 999])
class TestControlledUGradingEndToEnd:
    """
    Full simulate_unitaries grading path for CONTROLLED_U across 10 seeds.

    The student circuit is a single gate dict:
        {"gate": "CONTROLLED_U", "alpha": α, "beta": β, "gamma": γ}

    CircuitBuilder.build_circuit_base extracts (α,β,γ) and passes them as
    angles=(α,β,γ) to CirqGateMapper.apply, which builds:
        cirq.ControlledGate(MatrixGate(_zxz_matrix(α,β,γ)))(Q0, Q1)

    This is identical to the reference target, so all 4 truth-table rows must
    match exactly (allow_global_phase=False is enforced for this level).

    A companion wrong-circuit test confirms grading is not trivially always-true.
    """

    def test_exact_cu_gate_matches_target(self, seed: int) -> None:
        """
        Student submits the exact CU gate expression → all_match=True.
        Proves the full grading round-trip works for this seed.
        """
        alpha, beta, gamma = angles_from_seed(seed)
        trial = _two(
            [{"gate": Gate.CONTROLLED_U.value, "alpha": alpha, "beta": beta, "gamma": gamma}],
            [[0, 1]],
        )
        response, status = _run_cu(trial, seed=seed)
        assert status == 200, f"seed={seed}: unexpected HTTP status {status}"
        assert response["all_match"] is True, (
            f"seed={seed}: exact CU gate should match target. "
            f"trial={response.get('trial_truth_table', {}).get('output')}, "
            f"target={response.get('target_truth_table', {}).get('output')}"
        )

    def test_wrong_circuit_fails_for_same_seed(self, seed: int) -> None:
        """
        Bare X on Q0 against the same seed's target → all_match=False.
        Guards against the grading path being trivially always-true.
        """
        trial = _two([Gate.X.value], [[0]])
        response, status = _run_cu(trial, seed=seed)
        assert status == 200
        assert response["all_match"] is False, (
            f"seed={seed}: X gate must not match CU target"
        )


# ── Class 3: existing fixed levels are unaffected ────────────────────────────


class TestExistingFixedLevelsUnaffected:
    """
    Regression guard: Levels 2.1 (CNOT_FLIPPED) and 2.2 (CONTROLLED_Z) must
    grade correctly after the Level 2.5 addition.

    These tests confirm the fixed-level code path (stored expected_outputs,
    deterministic truth-table comparison) is not broken by any Level 2.5 changes.
    """

    # ── Level 2.1: CNOT_FLIPPED ───────────────────────────────────────────────

    def test_cnot_flipped_canonical_all_match(self) -> None:
        """
        Canonical CNOT_FLIPPED circuit: H[Q0]·H[Q1]·CNOT[C1→T0]·H[Q0]·H[Q1].
        Submitting this exact decomposition must yield all_match=True.
        """
        trial = _two(
            [Gate.H.value, Gate.H.value, Gate.CNOT.value, Gate.H.value, Gate.H.value],
            [[0], [1], [1, 0], [0], [1]],
        )
        response, status = run_simulate(trial, Gate.CNOT_FLIPPED.value)
        assert status == 200
        assert response["all_match"] is True

    def test_cnot_flipped_has_four_rows(self) -> None:
        """Target truth table has exactly 4 rows for the 2-qubit level."""
        trial = _two(
            [Gate.H.value, Gate.H.value, Gate.CNOT.value, Gate.H.value, Gate.H.value],
            [[0], [1], [1, 0], [0], [1]],
        )
        response, status = run_simulate(trial, Gate.CNOT_FLIPPED.value)
        assert status == 200
        assert len(response["target_truth_table"]["output"]) == 4

    def test_cnot_flipped_first_row_is_pass_through(self) -> None:
        """Row 0 (both qubits 0) must be |00⟩ regardless of gate configuration."""
        trial = _two(
            [Gate.H.value, Gate.H.value, Gate.CNOT.value, Gate.H.value, Gate.H.value],
            [[0], [1], [1, 0], [0], [1]],
        )
        response, status = run_simulate(trial, Gate.CNOT_FLIPPED.value)
        assert status == 200
        assert response["target_truth_table"]["output"][0] == "|00⟩"

    # ── Level 2.2: CONTROLLED_Z ───────────────────────────────────────────────

    def test_controlled_z_canonical_all_match(self) -> None:
        """
        Canonical CONTROLLED_Z circuit: H[Q1]·CNOT[C0→T1]·H[Q1].
        Submitting this decomposition must yield all_match=True.
        """
        trial = _two(
            [Gate.H.value, Gate.CNOT.value, Gate.H.value],
            [[1], [0, 1], [1]],
        )
        response, status = run_simulate(trial, Gate.CONTROLLED_Z.value)
        assert status == 200
        assert response["all_match"] is True

    def test_controlled_z_all_four_rows_exact_strings(self) -> None:
        """
        Assert all 4 exact Cirq dirac_notation strings for CONTROLLED_Z.

        CZ applies a phase flip only when both qubits are |1⟩:
          |00⟩ → |00⟩
          |01⟩ → |01⟩
          |10⟩ → |10⟩
          |11⟩ → -1|11⟩  (phase kick, not a bit flip)

        The -1 coefficient is the relative phase that makes CZ distinct from
        the identity; it appears in Cirq's dirac_notation as the literal prefix "-1".
        """
        trial = _two(
            [Gate.H.value, Gate.CNOT.value, Gate.H.value],
            [[1], [0, 1], [1]],
        )
        response, status = run_simulate(trial, Gate.CONTROLLED_Z.value)
        assert status == 200
        out = response["target_truth_table"]["output"]
        assert out[0] == "|00⟩",   f"row 0: {out[0]!r}"
        assert out[1] == "|01⟩",   f"row 1: {out[1]!r}"
        assert out[2] == "|10⟩",   f"row 2: {out[2]!r}"
        assert out[3] == "-1|11⟩", f"row 3: {out[3]!r}"
