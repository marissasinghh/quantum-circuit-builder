"""
Tests for CirqGateMapper: each supported gate should be a valid unitary (U†U = I).

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
    Two qubits on a line: index 0 and index 1.

    Single-qubit tests only use the first one; two-qubit tests use both.
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
    Build one gate via CirqGateMapper, turn it into a unitary U, then check U†U = I.

    - U† (U dagger) means: transpose the matrix, then take complex conjugate of
      every entry. For a unitary, multiplying U† on the left of U gives identity.
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
    Textbook Hadamard:

        H = (1/√2) * [[1,  1],
                      [1, -1]]

    This is a *stronger* check than unitarity alone: it pins down the actual numbers,
    so we know we are not accidentally passing some other 2×2 unitary.
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
