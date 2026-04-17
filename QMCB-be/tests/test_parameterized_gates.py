"""
Parameterized rotation gates (Rx, Rz) vs fixed Clifford gates (S, T, X) in Cirq.

This file checks **equivalence up to global phase**, which is the right notion when
comparing textbook or Nielsen & Chuang conventions to a library’s concrete matrices:
global phase is unobservable on state vectors.

**Cases verified (each cross-checked against Cirq’s own unitaries and standard
closed forms; see docstrings on each test):**

1. ``Rz(π/2)`` vs ``S`` — same unitary up to global phase (S is phase gate on |1⟩).
2. ``Rz(π/4)`` vs ``T`` — same unitary up to global phase (T = π/8 phase on |1⟩).
3. ``Rx(π)`` vs ``X`` — same unitary up to global phase (Pauli X).

A small **unitarity regression** block repeats U†U = I for the rotations used above
(and a couple of related angles).

Run from the QMCB-be folder:

    python -m pytest tests/test_parameterized_gates.py -v
"""

from __future__ import annotations

import cirq
import numpy as np
import pytest


# ── Helpers ───────────────────────────────────────────────────────────────────


def unitary_of(gate: cirq.Gate, qubit: cirq.Qid) -> np.ndarray:
    """Build a one-qubit Cirq circuit and return its 2×2 unitary (``complex128``)."""

    circuit = cirq.Circuit(gate(qubit))
    return cirq.unitary(circuit)


def equivalent_up_to_global_phase(U1: np.ndarray, U2: np.ndarray, atol: float = 1e-6) -> bool:
    """
    Return True if ``U1`` and ``U2`` differ only by a global phase ``e^{iφ}``.

    Strategy: ``P = U1 @ U2†``. If ``U1 = e^{iφ} U2``, then ``P = e^{iφ} I``, so all
    diagonal entries match and off-diagonals vanish.
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
    """Single named qubit shared by tests."""

    return cirq.LineQubit(0)


# ── Tests ─────────────────────────────────────────────────────────────────────


class TestRzEquivalences:
    """
    **Rz(θ)** (common convention): diagonal ``[e^{-iθ/2}, e^{iθ/2}]``.

    **S** is ``[[1,0],[0,i]]``; **T** is ``[[1,0],[0,e^{iπ/4}]]`` (Nielsen & Chuang
    / standard circuit notation). Cirq’s ``S`` and ``T`` match those matrices up to the
    library’s global phase choice; this test only asserts equivalence to ``Rz`` up to
    global phase.
    """

    def test_rz_half_pi_equals_s_gate(self, q: cirq.LineQubit) -> None:
        """
        ``Rz(π/2)`` ≡ ``S`` up to global phase.

        **By hand:** ``Rz(π/2) = diag(e^{-iπ/4}, e^{iπ/4})``. Multiplying by ``e^{iπ/4}``
        gives ``diag(1, e^{iπ/2}) = diag(1, i)``, i.e. the S matrix up to phase.
        """

        u_rz = unitary_of(cirq.rz(np.pi / 2), q)
        u_s = unitary_of(cirq.S, q)
        assert equivalent_up_to_global_phase(u_rz, u_s), (
            f"Rz(π/2) unitary:\n{u_rz}\n\nS gate unitary:\n{u_s}\n"
            "Expected them to be equal up to global phase."
        )

    def test_rz_quarter_pi_equals_t_gate(self, q: cirq.LineQubit) -> None:
        """
        ``Rz(π/4)`` ≡ ``T`` up to global phase.

        **By hand:** ``Rz(π/4) = diag(e^{-iπ/8}, e^{iπ/8})``. Multiplying by ``e^{iπ/8}``
        gives ``diag(1, e^{iπ/4})``, i.e. the T matrix up to phase.
        """

        u_rz = unitary_of(cirq.rz(np.pi / 4), q)
        u_t = unitary_of(cirq.T, q)
        assert equivalent_up_to_global_phase(u_rz, u_t), (
            f"Rz(π/4) unitary:\n{u_rz}\n\nT gate unitary:\n{u_t}\n"
            "Expected them to be equal up to global phase."
        )


class TestRxEquivalences:
    """
    **Rx(θ)** (standard Pauli rotation): cos/sin form with ``-i sin`` off-diagonals.

    **X** is ``[[0,1],[1,0]]``; ``Rx(π)`` matches X up to global phase (often ``-i``).
    """

    def test_rx_pi_equals_x_gate(self, q: cirq.LineQubit) -> None:
        """
        ``Rx(π)`` ≡ ``X`` up to global phase.

        **By hand:** ``Rx(π) = [[0, -i], [-i, 0]]``. Multiplying by ``-i`` yields X.
        """

        u_rx = unitary_of(cirq.rx(np.pi), q)
        u_x = unitary_of(cirq.X, q)
        assert equivalent_up_to_global_phase(u_rx, u_x), (
            f"Rx(π) unitary:\n{u_rx}\n\nX gate unitary:\n{u_x}\n"
            "Expected them to be equal up to global phase."
        )


class TestUnitaryIsUnitary:
    """
    Sanity: every gate used above must satisfy **U†U = I** (Week 1 style regression).
    """

    @pytest.mark.parametrize(
        "gate",
        [
            cirq.rz(np.pi / 2),
            cirq.rz(np.pi / 4),
            cirq.rx(np.pi),
            cirq.rx(np.pi / 2),
            cirq.rz(np.pi),
        ],
        ids=["rz_pi_over_2", "rz_pi_over_4", "rx_pi", "rx_pi_over_2", "rz_pi"],
    )
    def test_gate_is_unitary(self, gate: cirq.Gate, q: cirq.LineQubit) -> None:
        """``U†U = I`` for each parameterized gate in the list."""

        u = unitary_of(gate, q)
        product = u.conj().T @ u
        assert np.allclose(product, np.eye(2), atol=1e-6), (
            f"Gate {gate} is not unitary.\nU†U =\n{product}"
        )
