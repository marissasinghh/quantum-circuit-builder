"""
Gate tests for `CirqGateMapper` (app/config/gates.py).

There are two kinds of checks:

1. **test_gate_unitary_is_unitary** (parametrized) — For X, H, S, T, CNOT, CONTROLLED_Z
   (CZ), and SWAP: the matrix U Cirq builds for that gate must satisfy U†U = I. That is
   the minimum math property a “reversible” quantum gate must have.

2. **test_hadamard_matrix_matches_paper_derived_form** — Only for H: we also compare U
   entry-by-entry to the textbook Hadamard. That catches wiring mistakes that could
   still pass unitarity with the wrong gate.

Run from the QMCB-be folder:
    python -m pytest tests/test_gates.py -v
"""

from __future__ import annotations

import math

import cirq
import numpy as np
import pytest

from app.config.gates import CirqGateMapper
from app.utils.constants import Gate


@pytest.fixture
def line_qubits() -> tuple[cirq.LineQubit, ...]:
    """
    Shared `cirq.LineQubit` pair for mapper tests.

    **Why:** `CirqGateMapper.apply` needs real qubit objects. One fixture avoids repeating
    `LineQubit.range(2)` in every test and keeps qubit ordering consistent.
    """

    return tuple(cirq.LineQubit.range(2))


@pytest.mark.parametrize(
    "gate_name,qubit_order",
    [
        (Gate.X.value, [0]),
        (Gate.H.value, [0]),
        (Gate.S.value, [0]),
        (Gate.T.value, [0]),
        (Gate.CNOT.value, [0, 1]),
        (Gate.CONTROLLED_Z.value, [0, 1]),
        (Gate.SWAP.value, [0, 1]),
    ],
)

def test_gate_unitary_is_unitary(
    gate_name: str, qubit_order: list[int], line_qubits: tuple[cirq.LineQubit, ...]
) -> None:
    """
    **What it does:** For one gate name at a time, builds the operation the app uses in
    production (`CirqGateMapper.apply` → `cirq.Circuit` → `cirq.unitary`), forms U†U with
    NumPy, and checks the result is the identity matrix (same size as U: 2×2 for one
    qubit, 4×4 for two).

    **What it is good for:** Regression checks on `gates.py`—wrong `cirq.X` vs `cirq.H`,
    swapped control/target on CNOT, or a broken branch often shows up as a non-unitary
    matrix. It does *not* prove global phase or that you picked the *right* gate among
    all unitaries (that is why H has a second, stricter test below).

    **Parametrize rows:** Each row is one pytest case: same test function, different
    `gate_name` / `qubit_order`. `CONTROLLED_Z` is the string your `Gate` enum uses for CZ.
    """

    # qubit_order uses indices like [0] or [0, 1]. We must supply at least
    # max_index + 1 real qubit objects (LineQubit(0), LineQubit(1), ...).
    needed = max(qubit_order) + 1
    qubit_slice = line_qubits[:needed]

    # (1) Build the same Cirq operation your app uses in production code.
    op = CirqGateMapper.apply(gate_name, qubit_order, *qubit_slice)
    circuit = cirq.Circuit(op)

    # (2) Ask Cirq for the big square matrix U that represents the whole circuit.
    U = cirq.unitary(circuit)
    n = U.shape[0]
    identity = np.eye(n, dtype=np.complex128)

    # (3) U† = conjugate(transpose(U)); @ is NumPy matrix multiply.
    udagger = np.conjugate(U.T)
    product = udagger @ U

    assert np.allclose(product, identity), (
        f"{gate_name}: expected U†U ≈ I; max |entry error| = "
        f"{np.max(np.abs(product - identity))}"
    )


def test_hadamard_matrix_matches_paper_derived_form() -> None:
    """
    **What it does:** Builds H through `CirqGateMapper`, reads its 2×2 unitary U, and
    checks every entry matches the standard Hadamard
    (1/√2)[[1, 1], [1, −1]] (with `np.allclose` for float noise).

    **What it is good for:** Confirms you are really testing *the* Hadamard used in
    courses and textbooks—not some other unitary that still satisfies U†U = I. Use this
    pattern when a gate has a well-known matrix you want to lock to spec.

    **Why not only this test for every gate:** Many gates have standard matrices but
    global phase choices differ; unitarity + one “golden” matrix for H is a practical
    split for this project.
    """

    q0 = cirq.LineQubit(0)
    op = CirqGateMapper.apply(Gate.H.value, [0], q0)
    U = cirq.unitary(cirq.Circuit(op))

    inv_sqrt2 = 1.0 / math.sqrt(2.0)
    expected = inv_sqrt2 * np.array(
        [[1, 1], [1, -1]], dtype=np.complex128
    )

    assert U.shape == (2, 2)
    assert np.allclose(U, expected)
