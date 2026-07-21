"""
Composite student-gate expansion: CNOT_FLIPPED and CONTROLLED_H.

Verifies CircuitBuilder expands unlockable composite chips from TARGET_LIBRARY.steps
(with placement-order remapping) and that the resulting unitary matches an
independent Cirq construction — not just that simulation runs without error.
"""

from __future__ import annotations

import cirq
import numpy as np
import pytest

from app.config.target_library import TARGET_LIBRARY
from app.dto.unitary import UnitaryDTO
from app.services.circuit_builder import CircuitBuilder
from app.utils.constants import Gate, TargetLibraryField
from app.utils.helpers import initialize_qubit_sequence, remap_order
from app.utils.qubit_orders import C0_T1, C1_T0
from tests.simulate_helpers import run_simulate


def _unitary_from_student_chip(gate_name: str, placement: list[int]) -> np.ndarray:
    qubits = initialize_qubit_sequence(2)
    circuit = CircuitBuilder.build_circuit_base([gate_name], [placement], qubits)
    return cirq.unitary(circuit)


def _reference_from_library_steps(
    gate_name: str, placement: list[int]
) -> np.ndarray:
    """Independent Cirq circuit: library steps with remapped orders (no CircuitBuilder)."""
    from app.config.gates import CirqGateMapper

    qubits = list(cirq.LineQubit.range(2))
    steps = TARGET_LIBRARY[gate_name][TargetLibraryField.STEPS.value]
    ops = []
    for step in steps:
        remapped = remap_order(step[TargetLibraryField.ORDER.value], placement)
        ops.append(
            CirqGateMapper.apply(
                step[TargetLibraryField.GATE.value],
                remapped,
                *qubits,
                theta=step.get("theta"),
            )
        )
    return cirq.unitary(cirq.Circuit(ops))


def _cnot_flipped_cirq_native(placement: list[int]) -> np.ndarray:
    """
    H⊗H · CNOT(C1_T0) · H⊗H remapped through placement equals CNOT with
    control=placement[0], target=placement[1] after conjugation identity:
    canonical (P=[0,1]) → CNOT(0→1); flipped (P=[1,0]) → CNOT(1→0).
    Cross-check with explicit Cirq CNOT on remapped control/target of the
    *equivalent* standard/flipped CNOT — built from H sandwich manually.
    """
    q0, q1 = cirq.LineQubit.range(2)
    # Manual H-sandwich with inner CNOT on remapped C1_T0
    inner = remap_order(C1_T0, placement)
    ctrl, tgt = q0 if inner[0] == 0 else q1, q0 if inner[1] == 0 else q1
    # Build sandwich on remapped wires for the two H layers
    h0_wire = placement[0]
    h1_wire = placement[1]
    qubits = [q0, q1]
    circuit = cirq.Circuit(
        cirq.H(qubits[h0_wire]),
        cirq.H(qubits[h1_wire]),
        cirq.CNOT(qubits[inner[0]], qubits[inner[1]]),
        cirq.H(qubits[h0_wire]),
        cirq.H(qubits[h1_wire]),
    )
    return cirq.unitary(circuit)


def _controlled_h_cirq_native(placement: list[int]) -> np.ndarray:
    """cirq.H.controlled() with control=placement[0], target=placement[1]."""
    qubits = list(cirq.LineQubit.range(2))
    ctrl, tgt = qubits[placement[0]], qubits[placement[1]]
    return cirq.unitary(cirq.Circuit(cirq.H.controlled().on(ctrl, tgt)))


class TestRemapOrder:
    def test_identity_placement(self) -> None:
        assert remap_order([1, 0], [0, 1]) == [1, 0]

    def test_flipped_placement(self) -> None:
        assert remap_order([1, 0], [1, 0]) == [0, 1]

    def test_single_qubit_encoding(self) -> None:
        # Library Q0 = [0, 0], Q1 = [1, 1]
        assert remap_order([0, 0], [1, 0]) == [1, 1]
        assert remap_order([1, 1], [1, 0]) == [0, 0]


class TestCnotFlippedExpansion:
    @pytest.mark.parametrize("placement", [C0_T1, C1_T0])
    def test_unitary_matches_library_reference(self, placement: list[int]) -> None:
        U = _unitary_from_student_chip(Gate.CNOT_FLIPPED.value, placement)
        U_ref = _reference_from_library_steps(Gate.CNOT_FLIPPED.value, placement)
        assert np.allclose(U, U_ref), (
            f"CNOT_FLIPPED placement {placement}: CircuitBuilder vs library steps diverge"
        )

    @pytest.mark.parametrize("placement", [C0_T1, C1_T0])
    def test_unitary_matches_independent_cirq_sandwich(
        self, placement: list[int]
    ) -> None:
        U = _unitary_from_student_chip(Gate.CNOT_FLIPPED.value, placement)
        U_cirq = _cnot_flipped_cirq_native(placement)
        assert np.allclose(U, U_cirq), (
            f"CNOT_FLIPPED placement {placement}: max |Δ| = "
            f"{np.max(np.abs(U - U_cirq))}"
        )

    def test_default_order_equals_standard_cnot(self) -> None:
        """Canonical library sandwich equals CNOT(0→1)."""
        U = _unitary_from_student_chip(Gate.CNOT_FLIPPED.value, C0_T1)
        q0, q1 = cirq.LineQubit.range(2)
        U_cnot = cirq.unitary(cirq.Circuit(cirq.CNOT(q0, q1)))
        assert np.allclose(U, U_cnot)

    def test_flipped_order_equals_flipped_cnot(self) -> None:
        U = _unitary_from_student_chip(Gate.CNOT_FLIPPED.value, C1_T0)
        q0, q1 = cirq.LineQubit.range(2)
        U_cnot = cirq.unitary(cirq.Circuit(cirq.CNOT(q1, q0)))
        assert np.allclose(U, U_cnot)

    def test_simulate_chip_no_unsupported_gate(self) -> None:
        trial = UnitaryDTO(
            number_of_qubits=2,
            gates=[Gate.CNOT_FLIPPED.value],
            qubit_order=[list(C0_T1)],
        )
        # Grade against CONTROLLED_Z so we are not testing the 2.1 target path —
        # only that the student chip expands without Unsupported gate.
        response, status = run_simulate(
            trial, Gate.CONTROLLED_Z.value, validate_target=False
        )
        assert status == 200
        assert "error" not in response or response.get("all_match") is not None
        assert len(response["trial_truth_table"]["output"]) == 4


class TestControlledHExpansion:
    @pytest.mark.parametrize("placement", [C0_T1, C1_T0])
    def test_unitary_matches_library_reference(self, placement: list[int]) -> None:
        U = _unitary_from_student_chip(Gate.CONTROLLED_H.value, placement)
        U_ref = _reference_from_library_steps(Gate.CONTROLLED_H.value, placement)
        assert np.allclose(U, U_ref)

    @pytest.mark.parametrize("placement", [C0_T1, C1_T0])
    def test_unitary_matches_cirq_controlled_h(self, placement: list[int]) -> None:
        U = _unitary_from_student_chip(Gate.CONTROLLED_H.value, placement)
        U_cirq = _controlled_h_cirq_native(placement)
        # Allow global phase: compare up to a global phase factor
        # (Ry sandwich vs Cirq ControlledGate(H) can differ by global phase).
        # Prefer checking U† U_ref ≈ e^{iφ} I via fidelity of columns.
        assert _unitaries_equal_up_to_global_phase(U, U_cirq), (
            f"CONTROLLED_H placement {placement}: expansion ≠ cirq.H.controlled()"
        )

    def test_simulate_chip_no_unsupported_gate(self) -> None:
        trial = UnitaryDTO(
            number_of_qubits=2,
            gates=[Gate.CONTROLLED_H.value],
            qubit_order=[list(C0_T1)],
        )
        response, status = run_simulate(
            trial, Gate.SWAP.value, validate_target=False
        )
        assert status == 200
        assert len(response["trial_truth_table"]["output"]) == 4


def _unitaries_equal_up_to_global_phase(
    U: np.ndarray, V: np.ndarray, atol: float = 1e-8
) -> bool:
    """True if U ≈ e^{iφ} V for some real φ."""
    # Find a non-zero entry to estimate phase
    flat_u = U.ravel()
    flat_v = V.ravel()
    idx = int(np.argmax(np.abs(flat_v)))
    if abs(flat_v[idx]) < atol:
        return np.allclose(U, V, atol=atol)
    phase = flat_u[idx] / flat_v[idx]
    return np.allclose(U, phase * V, atol=atol)
