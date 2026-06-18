"""
RY grader diagnostic and regression tests.

Run from QMCB-be:
    pytest testing/test_ry_grader.py -v
"""

from __future__ import annotations

import math
import os
import sys

import cirq
import numpy as np
import pytest

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.controllers.simulate import _substitute_theta_in_gates, simulate_unitaries
from app.dto.simulate_request import SimulateRequestDTO, TargetParamsDTO
from app.dto.unitary import UnitaryDTO
from app.services.circuit_builder import CircuitBuilder
from app.utils.constants import Gate
from app.utils.helpers import initialize_qubit_sequence


def _run(trial: UnitaryDTO, target_name: str):
    request = SimulateRequestDTO(
        target_unitary=target_name,
        trial=trial,
        target_params=TargetParamsDTO(),
    )
    return simulate_unitaries(request, validate_target=False)


@pytest.fixture
def hs_rz_h_sss_trial() -> UnitaryDTO:
    """Student submission H · S · Rz(θ) · H · S · S · S (not a Ry decomposition)."""
    return UnitaryDTO(
        number_of_qubits=1,
        gates=[
            Gate.H.value,
            Gate.S.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 4},
            Gate.H.value,
            Gate.S.value,
            Gate.S.value,
            Gate.S.value,
        ],
        qubit_order=[[0]] * 7,
    )


def _trial_unitary(gates, qubit_order, qubits) -> np.ndarray:
    circuit = CircuitBuilder.build_circuit_base(gates, qubit_order, qubits)
    return cirq.unitary(circuit)


def test_hs_rz_h_sss_substitutes_theta_but_is_not_ry(hs_rz_h_sss_trial: UnitaryDTO) -> None:
    """
    H · S · Rz · H · S · S · S is NOT unitarily equivalent to Ry(θ).

    After the Rz-substitution fix, θᵢ is written into the lone Rz gate, but the
    circuit still fails grading because it does not implement Ry.
    """
    sample_theta = 1.234
    modified = _substitute_theta_in_gates(
        hs_rz_h_sss_trial.gates, Gate.RY.value, sample_theta
    )
    rz_entry = next(e for e in modified if isinstance(e, dict) and e.get("gate") == Gate.RZ.value)
    assert rz_entry["theta"] == sample_theta

    response, status = _run(hs_rz_h_sss_trial, Gate.RY.value)
    assert status == 200
    assert response["grading_mode"] == "random_theta"
    assert response["all_match"] is False
    assert response["samples_passed"] < response["samples_checked"]


def test_rz_h_rz_h_rz_decomposition_passes_ry_random_theta() -> None:
    """Rz(-π/2) · H · Rz(θ) · H · Rz(π/2) ≡ Ry(θ) — substitutes into middle Rz."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            {"gate": Gate.RZ.value, "theta": -math.pi / 2},
            Gate.H.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 4},
            Gate.H.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ],
        qubit_order=[[0], [0], [0], [0], [0]],
    )
    response, status = _run(trial, Gate.RY.value)
    assert status == 200
    assert response["grading_mode"] == "random_theta"
    assert response["all_match"] is True
    assert response["samples_passed"] == 10


def test_sss_h_rz_h_s_professor_order_passes_ry_random_theta() -> None:
    """
    S³ · H · Rz(θ) · H · S ≡ Ry(θ) using only H, S, Rz (professor / textbook order).

    Gate-order pitfall: H · S · Rz · H · S · S · S uses the same gate multiset but
    applies them in the wrong left-to-right order and is NOT Ry (see
    test_hs_rz_h_sss_is_not_ry).
    """
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            Gate.S.value,
            Gate.S.value,
            Gate.S.value,
            Gate.H.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 4},
            Gate.H.value,
            Gate.S.value,
        ],
        qubit_order=[[0]] * 7,
    )
    response, status = _run(trial, Gate.RY.value)
    assert status == 200
    assert response["grading_mode"] == "random_theta"
    assert response["all_match"] is True
    assert response["samples_passed"] == 10


class TestRyUnitaryEquivalence:
    """Direct Cirq unitary checks via production CircuitBuilder path."""

    @pytest.fixture
    def qubits(self):
        return initialize_qubit_sequence(1)

    def test_hs_rz_h_sss_is_not_ry(self, qubits) -> None:
        """H · S · Rz(θ) · H · S³ ≠ Ry(θ) for any θ (verified numerically)."""
        for theta in (0.0, math.pi / 4, math.pi / 2):
            gates = [
                Gate.H.value,
                Gate.S.value,
                {"gate": Gate.RZ.value, "theta": theta},
                Gate.H.value,
                Gate.S.value,
                Gate.S.value,
                Gate.S.value,
            ]
            u_trial = _trial_unitary(gates, [[0]] * 7, qubits)
            u_ry = cirq.unitary(cirq.Circuit(cirq.ry(theta)(qubits[0])))
            assert not cirq.allclose_up_to_global_phase(u_trial, u_ry)

    def test_rz_h_rz_h_rz_equals_ry_positive_theta(self, qubits) -> None:
        theta = math.pi / 4
        gates = [
            {"gate": Gate.RZ.value, "theta": -math.pi / 2},
            Gate.H.value,
            {"gate": Gate.RZ.value, "theta": theta},
            Gate.H.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ]
        u = _trial_unitary(gates, [[0]] * 5, qubits)
        u_ry = cirq.unitary(cirq.Circuit(cirq.ry(theta)(qubits[0])))
        assert cirq.allclose_up_to_global_phase(u, u_ry)

    def test_canonical_rz_rx_rz_equals_ry_positive_theta(self, qubits) -> None:
        theta = math.pi / 4
        gates = [
            {"gate": Gate.RZ.value, "theta": -math.pi / 2},
            {"gate": Gate.RX.value, "theta": theta},
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ]
        u = _trial_unitary(gates, [[0]] * 3, qubits)
        u_ry = cirq.unitary(cirq.Circuit(cirq.ry(theta)(qubits[0])))
        assert cirq.allclose_up_to_global_phase(u, u_ry)

    def test_wrong_sign_rz_conjugation_is_not_ry_not_global_phase(
        self, qubits
    ) -> None:
        """
        Rz(+π/2)·Rx(θ)·Rz(π/2) uses the wrong outer conjugation.

        With this project's Rz convention it implements Ry(-θ)·Z (equivalently Z·Ry(θ)),
        not Ry(+θ) or Ry(-θ) alone — so random-theta grading correctly rejects it.
        """
        theta = math.pi / 4
        gates = [
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
            {"gate": Gate.RX.value, "theta": theta},
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ]
        u_wrong = _trial_unitary(gates, [[0]] * 3, qubits)
        u_ry_pos = cirq.unitary(cirq.Circuit(cirq.ry(theta)(qubits[0])))
        u_ry_neg = cirq.unitary(cirq.Circuit(cirq.ry(-theta)(qubits[0])))
        u_z_ry_neg = cirq.unitary(
            cirq.Circuit(cirq.ry(-theta)(qubits[0]), cirq.Z(qubits[0]))
        )
        assert not cirq.allclose_up_to_global_phase(u_wrong, u_ry_pos)
        assert not cirq.allclose_up_to_global_phase(u_wrong, u_ry_neg)
        assert cirq.allclose_up_to_global_phase(u_wrong, u_z_ry_neg)

    def test_wrong_sign_decomposition_fails_ry_grading(self) -> None:
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[
                {"gate": Gate.RZ.value, "theta": math.pi / 2},
                {"gate": Gate.RX.value, "theta": math.pi / 4},
                {"gate": Gate.RZ.value, "theta": math.pi / 2},
            ],
            qubit_order=[[0], [0], [0]],
        )
        response, status = _run(trial, Gate.RY.value)
        assert status == 200
        assert response["grading_mode"] == "random_theta"
        assert response["all_match"] is False
        assert response["samples_passed"] < response["samples_checked"]

    def test_bare_rz_still_fails_ry_grading(self) -> None:
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[{"gate": Gate.RZ.value, "theta": math.pi / 4}],
            qubit_order=[[0]],
        )
        response, status = _run(trial, Gate.RY.value)
        assert status == 200
        assert response["all_match"] is False


class TestParameterGateIndex:
    """Explicit parameter_gate_index overrides substitution heuristics."""

    def test_sss_h_rz_h_s_with_index_on_rz_passes(self) -> None:
        """Professor order: θ substituted at index 4 (middle Rz)."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[
                Gate.S.value,
                Gate.S.value,
                Gate.S.value,
                Gate.H.value,
                {"gate": Gate.RZ.value, "theta": math.pi / 4},
                Gate.H.value,
                Gate.S.value,
            ],
            qubit_order=[[0]] * 7,
            parameter_gate_index=4,
        )
        response, status = _run(trial, Gate.RY.value)
        assert status == 200
        assert response["all_match"] is True
        assert response["samples_passed"] == 10

    def test_wrong_parameter_index_fails_grading(self) -> None:
        """parameter_gate_index=0 is S (string); substitution no-ops, grading fails."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[
                Gate.S.value,
                Gate.S.value,
                Gate.S.value,
                Gate.H.value,
                {"gate": Gate.RZ.value, "theta": math.pi / 4},
                Gate.H.value,
                Gate.S.value,
            ],
            qubit_order=[[0]] * 7,
            parameter_gate_index=0,
        )
        modified = _substitute_theta_in_gates(
            trial.gates, Gate.RY.value, 1.5, parameter_gate_index=0
        )
        assert modified[0] == Gate.S.value
        assert modified[4]["theta"] == math.pi / 4
        response, status = _run(trial, Gate.RY.value)
        assert response["all_match"] is False

    def test_three_rz_heuristic_without_index_still_passes(self) -> None:
        """Legacy path: no parameter_gate_index — middle Rz of three-Rz decomposition."""
        trial = UnitaryDTO(
            number_of_qubits=1,
            gates=[
                {"gate": Gate.RZ.value, "theta": -math.pi / 2},
                Gate.H.value,
                {"gate": Gate.RZ.value, "theta": math.pi / 4},
                Gate.H.value,
                {"gate": Gate.RZ.value, "theta": math.pi / 2},
            ],
            qubit_order=[[0], [0], [0], [0], [0]],
        )
        response, status = _run(trial, Gate.RY.value)
        assert response["all_match"] is True
