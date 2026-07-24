"""Cirq grading coverage for 2-qubit gates on the skip-wire pair (0,2)/(2,0)."""

from __future__ import annotations

import cirq
import numpy as np
import pytest

from app.config.gates import CirqGateMapper
from app.utils.constants import Gate
from app.utils.qubit_orders import C0_T2, C2_T0


@pytest.fixture
def three_qubits() -> tuple[cirq.LineQubit, ...]:
    return tuple(cirq.LineQubit.range(3))


def _unitary_from_mapper(
    gate_name: str, qubit_order: list[int], qubits: tuple[cirq.LineQubit, ...]
) -> np.ndarray:
    op = CirqGateMapper.apply(gate_name, qubit_order, *qubits)
    circuit = cirq.Circuit(op)
    for q in qubits:
        if q not in circuit.all_qubits():
            circuit.append(cirq.I(q))
    return circuit.unitary(qubit_order=qubits)


def _cirq_reference(ops: list, qubits: tuple[cirq.LineQubit, ...]) -> np.ndarray:
    circuit = cirq.Circuit(ops)
    for q in qubits:
        if q not in circuit.all_qubits():
            circuit.append(cirq.I(q))
    return circuit.unitary(qubit_order=qubits)


@pytest.mark.parametrize(
    "gate_name,order,ref_ops",
    [
        (Gate.CNOT.value, C0_T2, lambda qs: [cirq.CNOT(qs[0], qs[2])]),
        (Gate.CNOT.value, C2_T0, lambda qs: [cirq.CNOT(qs[2], qs[0])]),
        (Gate.CONTROLLED_Z.value, C0_T2, lambda qs: [cirq.CZ(qs[0], qs[2])]),
        (Gate.SWAP.value, C0_T2, lambda qs: [cirq.SWAP(qs[0], qs[2])]),
    ],
)
def test_two_qubit_gate_on_skip_pair_matches_cirq(
    three_qubits: tuple[cirq.LineQubit, ...],
    gate_name: str,
    order: list[int],
    ref_ops,
) -> None:
    got = _unitary_from_mapper(gate_name, order, three_qubits)
    expected = _cirq_reference(ref_ops(three_qubits), three_qubits)
    np.testing.assert_allclose(got, expected, atol=1e-10)


def test_c0_t2_and_c2_t0_constants() -> None:
    assert C0_T2 == [0, 2]
    assert C2_T0 == [2, 0]
