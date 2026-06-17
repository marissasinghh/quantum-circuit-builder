"""
Tier-1 target tests: correct and wrong student circuits for Levels 1.0–1.5.

Two kinds of checks live here:

1. Controller-path tests (via ``simulate_unitaries``):
   - Correct circuit: student submits the exact target gate → ``all_match`` is True.
   - Wrong circuit: student submits the wrong gate / angle → ``all_match`` is False.
   - Parameterized (RX, RY): tested at two theta values (π/4 and π/2).

2. Unitary equivalence tests (direct Cirq math):
   - S: ``Rz(π/2)`` ≡ S up to global phase.
   - T: ``Rz(π/4)`` ≡ T up to global phase.
   - H: ``Rx(π/2)·Rz(π/2)·Rx(π/2)`` ≡ H up to global phase.
   These use ``equivalent_up_to_global_phase`` because the Cirq string comparison
   cannot account for a global phase difference.

All expected Dirac-notation strings were verified against live Cirq output
(``cirq.dirac_notation(..., decimals=3)``) before being written into assertions.

Run from the QMCB-be folder:
    python -m pytest tests/test_tier1_targets.py -v
"""

from __future__ import annotations

import math
from unittest.mock import patch

import cirq
import numpy as np
import pytest

from app.controllers.random_unitary import generate_random_unitary_response
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate
from app.utils.euler_angles import angles_from_seed_zyz
from tests.simulate_helpers import run_simulate


# ── Helpers (copied from test_parameterized_gates.py pattern) ─────────────────


def unitary_of(gate: cirq.Gate, qubit: cirq.Qid) -> np.ndarray:
    """Return the 2×2 unitary of a one-qubit gate."""
    return cirq.unitary(cirq.Circuit(gate(qubit)))


def equivalent_up_to_global_phase(U1: np.ndarray, U2: np.ndarray, atol: float = 1e-6) -> bool:
    """
    Return True if U1 and U2 differ only by a global phase e^{iφ}.

    P = U1 @ U2†. If U1 = e^{iφ} U2, then P = e^{iφ} I — all diagonal
    entries equal and off-diagonals vanish.
    """
    p = U1 @ U2.conj().T
    off_diag = p - np.diag(np.diag(p))
    if not np.allclose(off_diag, 0, atol=atol):
        return False
    diag_vals = np.diag(p)
    return bool(np.allclose(diag_vals, diag_vals[0], atol=atol))


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture
def q() -> cirq.LineQubit:
    """Single qubit shared by unitary equivalence tests."""
    return cirq.LineQubit(0)


def _run(trial: UnitaryDTO, target_name: str, *, validate_target: bool = True, seed: int | None = None):
    """Call simulate_unitaries with print suppressed; return (response, status)."""
    return run_simulate(trial, target_name, validate_target=validate_target, seed=seed)


def _single(gate_entry, order=None) -> UnitaryDTO:
    """Build a 1-qubit UnitaryDTO with one gate entry."""
    return UnitaryDTO(number_of_qubits=1, gates=[gate_entry], qubit_order=[order or [0]])


# ── Level 1.0: X Gate ─────────────────────────────────────────────────────────


class TestXTarget:
    """
    Target: X (Pauli-X / NOT gate).
    X|0⟩ = |1⟩,  X|1⟩ = |0⟩.
    """

    def test_correct_circuit_matches(self) -> None:
        """Student submits SQRT_X then SQRT_X → all outputs match the X target."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[Gate.SQRT_X.value, Gate.SQRT_X.value],
            qubit_order=[[0], [0]],
        )
        response, status = _run(trial, "X")
        assert status == 200
        assert response["all_match"] is True
        assert response["trial_truth_table"]["output"] == ["|1⟩", "|0⟩"]

    def test_wrong_gate_does_not_match(self) -> None:
        """Student submits H instead of X → outputs differ."""
        response, status = _run(_single(Gate.H.value), "X")
        assert status == 200
        assert response["all_match"] is False


# ── Level 1.1: S Gate ─────────────────────────────────────────────────────────


class TestSTarget:
    """
    Target: S (phase gate).
    S|0⟩ = |0⟩,  S|1⟩ = i|1⟩.
    """

    def test_correct_circuit_matches(self) -> None:
        """Student submits S → all outputs match the S target."""
        response, status = _run(_single(Gate.S.value), "S")
        assert status == 200
        assert response["all_match"] is True
        assert response["trial_truth_table"]["output"] == ["|0⟩", "1j|1⟩"]

    def test_wrong_gate_does_not_match(self) -> None:
        """Student submits T instead of S → outputs differ."""
        response, status = _run(_single(Gate.T.value), "S")
        assert status == 200
        assert response["all_match"] is False

    def test_rz_half_pi_equivalent_to_s_up_to_global_phase(self, q: cirq.LineQubit) -> None:
        """
        ``Rz(π/2)`` ≡ S up to global phase (unitary check).

        Cannot be verified via string comparison — global phase changes the Dirac
        notation string even though the physical action on states is identical.
        Verified analytically: Rz(π/2) = diag(e^{-iπ/4}, e^{iπ/4}); multiplying
        by e^{iπ/4} yields diag(1, i) = S.
        """
        assert equivalent_up_to_global_phase(
            unitary_of(cirq.rz(math.pi / 2), q),
            unitary_of(cirq.S, q),
        )


# ── Level 1.2: T Gate ─────────────────────────────────────────────────────────


class TestTTarget:
    """
    Target: T (π/8 gate).
    T|0⟩ = |0⟩,  T|1⟩ = e^{iπ/4}|1⟩ ≈ (0.707+0.707j)|1⟩.
    """

    def test_correct_circuit_matches(self) -> None:
        """Student submits T → all outputs match the T target."""
        response, status = _run(_single(Gate.T.value), "T")
        assert status == 200
        assert response["all_match"] is True
        assert response["trial_truth_table"]["output"] == ["|0⟩", "(0.707+0.707j)|1⟩"]

    def test_wrong_gate_does_not_match(self) -> None:
        """Student submits S instead of T → outputs differ."""
        response, status = _run(_single(Gate.S.value), "T")
        assert status == 200
        assert response["all_match"] is False

    def test_rz_quarter_pi_equivalent_to_t_up_to_global_phase(self, q: cirq.LineQubit) -> None:
        """
        ``Rz(π/4)`` ≡ T up to global phase (unitary check).

        Rz(π/4) = diag(e^{-iπ/8}, e^{iπ/8}); multiplying by e^{iπ/8} yields
        diag(1, e^{iπ/4}) = T.
        """
        assert equivalent_up_to_global_phase(
            unitary_of(cirq.rz(math.pi / 4), q),
            unitary_of(cirq.T, q),
        )


# ── Level 1.3: H Gate ─────────────────────────────────────────────────────────


class TestHTarget:
    """
    Target: H (Hadamard).
    H|0⟩ = (|0⟩+|1⟩)/√2 ≈ 0.707|0⟩ + 0.707|1⟩
    H|1⟩ = (|0⟩-|1⟩)/√2 ≈ 0.707|0⟩ - 0.707|1⟩
    """

    def test_correct_circuit_matches(self) -> None:
        """Student submits H → all outputs match the H target."""
        response, status = _run(_single(Gate.H.value), "H")
        assert status == 200
        assert response["all_match"] is True
        assert response["trial_truth_table"]["output"] == [
            "0.707|0⟩ + 0.707|1⟩",
            "0.707|0⟩ - 0.707|1⟩",
        ]

    def test_wrong_gate_does_not_match(self) -> None:
        """Student submits X instead of H → outputs differ."""
        response, status = _run(_single(Gate.X.value), "H")
        assert status == 200
        assert response["all_match"] is False

    def test_rx_rz_rx_decomposition_equivalent_to_h_up_to_global_phase(
        self, q: cirq.LineQubit
    ) -> None:
        """
        ``Rx(π/2)·Rz(π/2)·Rx(π/2)`` ≡ H up to global phase (unitary check).

        This is the student-facing decomposition: apply three rotations in
        sequence and produce a gate that is physically identical to Hadamard.
        Cannot be tested via string comparison for the same global-phase reason
        as S/T above.
        """
        decomp = cirq.Circuit(
            cirq.rx(math.pi / 2)(q),
            cirq.rz(math.pi / 2)(q),
            cirq.rx(math.pi / 2)(q),
        )
        assert equivalent_up_to_global_phase(
            cirq.unitary(decomp),
            unitary_of(cirq.H, q),
        )


# ── Level 1.4: RX Gate ────────────────────────────────────────────────────────


class TestRxTarget:
    """
    Target: RX — graded via random angle sampling (RANDOM_THETA mode).

    The backend samples 10 random angles and checks the student's circuit unitary
    against cirq.rx(θ) at each angle.  No truth table is returned; the response
    carries ``grading_mode``, ``samples_checked``, ``samples_passed``, and
    ``all_match``.

    Correct decomposition: H · Rz(θ) · H ≡ Rx(θ) up to global phase.
    Correct decomposition: Rz(−π/2) · Sqrt_X · Rz(π/2) ≡ Rx(π/2) — but this is
    a *fixed* circuit (not parameterised), so with theta substitution it maps to
    Rx(θᵢ) and will still pass when the Rz with the sampled theta is substituted.
    Incorrect: bare Rz(θ) — Rz ≠ Rx in general.
    """

    def test_h_rz_h_decomposition_passes_all_samples(self) -> None:
        """H · Rz(θ) · H is a valid Rx decomposition → all 10 samples pass."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[
                Gate.H.value,
                {"gate": Gate.RZ.value, "theta": math.pi / 4},
                Gate.H.value,
            ],
            qubit_order=[[0], [0], [0]],
        )
        response, status = _run(trial, Gate.RX.value)
        assert status == 200
        assert response["grading_mode"] == "random_theta"
        assert response["samples_checked"] == 10
        assert response["trial_truth_table"] is None
        assert response["target_truth_table"] is None
        assert response["all_match"] is True
        assert response["samples_passed"] == 10

    def test_rz_only_fails_sampling(self) -> None:
        """A bare Rz(θ) circuit is not equivalent to Rx(θ) → sampling fails."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[{"gate": Gate.RZ.value, "theta": math.pi / 4}],
            qubit_order=[[0]],
        )
        response, status = _run(trial, Gate.RX.value)
        assert status == 200
        assert response["grading_mode"] == "random_theta"
        assert response["all_match"] is False
        assert response["samples_passed"] < response["samples_checked"]

    def test_response_shape_for_rx_level(self) -> None:
        """Verify all expected keys exist in an RX grading response."""
        trial = _single({"gate": Gate.RZ.value, "theta": math.pi / 2})
        response, status = _run(trial, Gate.RX.value)
        assert status == 200
        for key in ("grading_mode", "samples_checked", "samples_passed", "all_match"):
            assert key in response, f"Missing key: {key!r}"


# ── Level 1.5: RY Gate ────────────────────────────────────────────────────────


class TestRyTarget:
    """
    Target: RY — graded via random angle sampling (RANDOM_THETA mode).

    Correct decomposition: Rz(−π/2) · Rx(θ) · Rz(π/2) ≡ Ry(θ) up to global phase.
    Incorrect: bare Rx(θ) — Rx ≠ Ry in general.
    """

    def test_rz_rx_rz_decomposition_passes_all_samples(self) -> None:
        """Rz(−π/2) · Rx(θ) · Rz(π/2) is a valid Ry decomposition → all 10 samples pass."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[
                {"gate": Gate.RZ.value, "theta": -(math.pi / 2)},
                {"gate": Gate.RX.value, "theta": math.pi / 4},
                {"gate": Gate.RZ.value, "theta": math.pi / 2},
            ],
            qubit_order=[[0], [0], [0]],
        )
        response, status = _run(trial, Gate.RY.value)
        assert status == 200
        assert response["grading_mode"] == "random_theta"
        assert response["samples_checked"] == 10
        assert response["trial_truth_table"] is None
        assert response["target_truth_table"] is None
        assert response["all_match"] is True
        assert response["samples_passed"] == 10

    def test_rx_only_fails_ry_sampling(self) -> None:
        """A bare Rx(θ) circuit is not equivalent to Ry(θ) → sampling fails."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[{"gate": Gate.RX.value, "theta": math.pi / 4}],
            qubit_order=[[0]],
        )
        response, status = _run(trial, Gate.RY.value)
        assert status == 200
        assert response["grading_mode"] == "random_theta"
        assert response["all_match"] is False
        assert response["samples_passed"] < response["samples_checked"]


# ── Level 1.6: Random Unitary ─────────────────────────────────────────────────


def _run_random_u(trial: UnitaryDTO, seed: int):
    """Call simulate_unitaries for a RANDOM_U target with print suppressed."""
    return run_simulate(trial, Gate.RANDOM_U.value, seed=seed)


class TestRandomUnitaryLevel:
    """
    Level 1.6: random single-qubit unitary challenge.

    Three kinds of checks live here:

    1. Shape / format: truth table has exactly 2 rows; outputs are valid
       Dirac-notation ket strings.
    2. Reproducibility: same seed → identical truth table on repeated calls.
    3. Randomness sanity: two unseeded calls return different truth tables
       (probabilistic — the chance of collision across 2^31 seeds is negligible).
    4. Controller-path integration: ZYZ circuit with seed-derived angles
       passes all_match; an unrelated gate fails.

    We never assert a specific truth-table string because the output is
    random by design.
    """

    # ── Shape and format ──────────────────────────────────────────────────────

    def test_truth_table_has_exactly_two_rows(self) -> None:
        """Generated truth table has one row per single-qubit basis state."""
        with patch("builtins.print"):
            data = generate_random_unitary_response()
        tt = data["truth_table"]
        assert len(tt["input"]) == 2, "Expected 2 input rows (|0⟩ and |1⟩)"
        assert len(tt["output"]) == 2, "Expected 2 output rows"

    def test_output_strings_are_valid_quantum_states(self) -> None:
        """
        Each output is a non-empty Dirac-notation ket string.

        Valid examples: '|0⟩', '0.707|0⟩ + 0.707|1⟩', '0.924|0⟩ - 0.383j|1⟩'.
        We check the necessary conditions: non-empty, contains ket bracket ⟩,
        and references at least one of |0⟩ or |1⟩.
        """
        with patch("builtins.print"):
            data = generate_random_unitary_response()
        for s in data["truth_table"]["output"]:
            assert isinstance(s, str) and len(s) > 0, f"Output must be a non-empty string, got: {s!r}"
            assert "⟩" in s, f"Expected Dirac ket notation (⟩), got: {s!r}"
            assert "|0⟩" in s or "|1⟩" in s, f"Expected |0⟩ or |1⟩ in output, got: {s!r}"

    def test_session_id_is_a_non_negative_integer(self) -> None:
        """Returned session_id is a valid integer seed for client-side storage."""
        with patch("builtins.print"):
            data = generate_random_unitary_response()
        assert isinstance(data["session_id"], int)
        assert data["session_id"] >= 0

    def test_num_rotation_gates_hint_is_three(self) -> None:
        """Hint value always reports 3 (ZYZ decomposition has three rotation gates)."""
        with patch("builtins.print"):
            data = generate_random_unitary_response()
        assert data["num_rotation_gates"] == 3

    # ── Reproducibility ───────────────────────────────────────────────────────

    def test_same_seed_reproduces_identical_truth_table(self) -> None:
        """
        Calling with the same seed twice must return the same truth table.
        This guarantees that a student who refreshes the page sees the same target.
        """
        with patch("builtins.print"):
            data1 = generate_random_unitary_response(seed=42)
            data2 = generate_random_unitary_response(seed=42)
        assert data1["truth_table"]["output"] == data2["truth_table"]["output"]
        assert data1["session_id"] == data2["session_id"] == 42

    def test_different_seeds_produce_different_truth_tables(self) -> None:
        """Distinct seeds produce distinct targets (basic collision check)."""
        with patch("builtins.print"):
            data1 = generate_random_unitary_response(seed=1)
            data2 = generate_random_unitary_response(seed=2)
        assert data1["truth_table"]["output"] != data2["truth_table"]["output"], (
            "Seeds 1 and 2 returned identical truth tables — "
            "seed-to-angle derivation may be broken."
        )

    def test_two_unseeded_calls_produce_different_truth_tables(self) -> None:
        """
        Probabilistic sanity check: two fresh (unseeded) calls must not return
        the same unitary.

        The probability of a collision across 2^31 possible seeds is negligible.
        If this fails, random generation is almost certainly broken (e.g. fixed
        seed or constant angles).
        """
        with patch("builtins.print"):
            data1 = generate_random_unitary_response()
            data2 = generate_random_unitary_response()
        assert data1["truth_table"]["output"] != data2["truth_table"]["output"], (
            "Two unseeded calls returned identical truth tables — "
            "random generation appears broken."
        )

    # ── Controller-path integration ───────────────────────────────────────────

    def test_zyz_circuit_with_seed_angles_matches_random_u_target(self) -> None:
        """
        ZYZ circuit built from seed-derived angles → all_match True.

        This is the canonical solution path: angles_from_seed_zyz gives the exact
        gamma/beta/delta used to build the target, so the identical Rz·Ry·Rz
        circuit should produce a perfectly matching truth table.
        """
        seed = 12345
        gamma, beta, delta = angles_from_seed_zyz(seed)
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[
                {"gate": Gate.RZ.value, "theta": delta},
                {"gate": Gate.RY.value, "theta": gamma},
                {"gate": Gate.RZ.value, "theta": beta},
            ],
            qubit_order=[[0], [0], [0]],
        )
        response, status = _run_random_u(trial, seed=seed)
        assert status == 200
        assert response["all_match"] is True

    def test_wrong_circuit_does_not_match_random_u_target(self) -> None:
        """
        H gate submitted against a RANDOM_U target → all_match False.

        H is the identity-adjacent gate least likely to accidentally match a
        generic random unitary. We use a fixed seed for determinism.
        """
        seed = 99999
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[Gate.H.value],
            qubit_order=[[0]],
        )
        response, status = _run_random_u(trial, seed=seed)
        assert status == 200
        assert response["all_match"] is False
