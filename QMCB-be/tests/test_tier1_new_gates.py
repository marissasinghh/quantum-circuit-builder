"""
Amplitude-verified tests for the 5 new Tier-1 backend gates (Task #4):
sqrt-X-dag, Z, S-dag, T-dag, Y.

Each gate gets one test covering both |0⟩ and |1⟩ basis inputs. Assertions use
the raw state vector (up to global phase) and cross-check stored expected_outputs.

Z, S-dag, and T-dag additionally document that probability-only comparison on
|1⟩ would not distinguish the gate from identity — the live grader requires
amplitude (Dirac string) equality on definite-state rows.

Invocation: TargetUnitaryBuilder + CircuitSimulator._simulate (no Flask/HTTP).
Controller-path smoke: run_simulate() with the target gate as the student circuit.

Run from QMCB-be/:
    python -m pytest tests/test_tier1_new_gates.py -v
"""

from __future__ import annotations

import cirq
import numpy as np
import pytest

from app.config.target_library import TARGET_LIBRARY
from app.controllers.simulate import _compute_all_match
from app.dto.unitary import UnitaryDTO
from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.services.target_parameter_resolver import resolved_for_library_simulation
from app.utils.constants import Gate, TargetLibraryField
from app.utils.helpers import initialize_qubit_sequence
from tests.simulate_helpers import run_simulate

# Verified reference amplitudes (Cirq convention, |0⟩ index first).
# Each value maps basis input [0] or [1] to the expected output state vector.
GATE_REFERENCE: dict[str, dict[tuple[int, ...], np.ndarray]] = {
    Gate.SQRT_X_DAG.value: {
        (0,): np.array([0.5 - 0.5j, 0.5 + 0.5j], dtype=np.complex128),
        (1,): np.array([0.5 + 0.5j, 0.5 - 0.5j], dtype=np.complex128),
    },
    Gate.Z.value: {
        (0,): np.array([1.0, 0.0], dtype=np.complex128),
        (1,): np.array([0.0, -1.0], dtype=np.complex128),
    },
    Gate.S_DAG.value: {
        (0,): np.array([1.0, 0.0], dtype=np.complex128),
        (1,): np.array([0.0, -1.0j], dtype=np.complex128),
    },
    Gate.T_DAG.value: {
        (0,): np.array([1.0, 0.0], dtype=np.complex128),
        (1,): np.array([0.0, 0.707107 - 0.707107j], dtype=np.complex128),
    },
    Gate.Y.value: {
        (0,): np.array([0.0, 1.0j], dtype=np.complex128),
        (1,): np.array([-1.0j, 0.0], dtype=np.complex128),
    },
}

PHASE_ONLY_GATES = (Gate.Z.value, Gate.S_DAG.value, Gate.T_DAG.value)

ATOL = 1e-3  # matches CircuitSimulator decimals=3 rounding


def simulate_reference_state(
    gate_name: str, basis: list[int]
) -> tuple[str, np.ndarray]:
    """Build library reference circuit, prep basis state, return (dirac, state_vector)."""
    qubits = initialize_qubit_sequence(1)
    resolved = resolved_for_library_simulation(gate_name)
    gate_circuit = TargetUnitaryBuilder.build(gate_name, qubits, resolved)
    prep = CircuitBuilder.prepare_basis_state(basis, qubits)
    return CircuitSimulator._simulate(prep + gate_circuit, qubits, decimals=3)


def simulate_identity_state(basis: list[int]) -> tuple[str, np.ndarray]:
    """Prep basis state only — identity gate (no operation applied)."""
    qubits = initialize_qubit_sequence(1)
    prep = CircuitBuilder.prepare_basis_state(basis, qubits)
    return CircuitSimulator._simulate(prep, qubits, decimals=3)


def _single_gate_trial(gate_name: str) -> UnitaryDTO:
    return UnitaryDTO(
        number_of_qubits=1,
        gates=[gate_name],
        qubit_order=[[0]],
    )


def _assert_amplitudes_match_reference(gate_name: str) -> None:
    """Assert both |0⟩ and |1⟩ outputs match verified reference up to global phase."""
    level_def = TARGET_LIBRARY[gate_name]
    stored_outputs = level_def[TargetLibraryField.EXPECTED_OUTPUTS.value]
    reference = GATE_REFERENCE[gate_name]

    for i, basis in enumerate([[0], [1]]):
        basis_key = tuple(basis)
        dirac, sv = simulate_reference_state(gate_name, basis)
        expected_sv = reference[basis_key]

        assert cirq.allclose_up_to_global_phase(sv, expected_sv, atol=ATOL), (
            f"\n{gate_name} | input {basis}:\n"
            f"  expected sv: {expected_sv}\n"
            f"  actual sv  : {sv}"
        )
        assert dirac == stored_outputs[i], (
            f"\n{gate_name} | input {basis}:\n"
            f"  stored expected_outputs: {stored_outputs[i]!r}\n"
            f"  live dirac            : {dirac!r}"
        )


def _assert_controller_path_passes(gate_name: str) -> None:
    """Student places the target gate → simulate_unitaries reports all_match."""
    response, status = run_simulate(_single_gate_trial(gate_name), gate_name)
    assert status == 200, f"{gate_name}: expected HTTP 200, got {status}"
    assert response["all_match"] is True, (
        f"{gate_name}: canonical submission should pass; "
        f"trial={response['trial_truth_table']['output']}, "
        f"target={response['target_truth_table']['output']}"
    )


# ── One test per new gate (both basis inputs) ─────────────────────────────────


def test_sqrt_x_dag_amplitudes_on_basis_states() -> None:
    """sqrt-X-dag: |0⟩ and |1⟩ amplitudes match verified reference."""
    _assert_amplitudes_match_reference(Gate.SQRT_X_DAG.value)
    _assert_controller_path_passes(Gate.SQRT_X_DAG.value)


def test_z_amplitudes_on_basis_states() -> None:
    """Z: |0⟩ and |1⟩ amplitudes match verified reference."""
    _assert_amplitudes_match_reference(Gate.Z.value)
    _assert_controller_path_passes(Gate.Z.value)


def test_s_dag_amplitudes_on_basis_states() -> None:
    """S-dag: |0⟩ and |1⟩ amplitudes match verified reference."""
    _assert_amplitudes_match_reference(Gate.S_DAG.value)
    _assert_controller_path_passes(Gate.S_DAG.value)


def test_t_dag_amplitudes_on_basis_states() -> None:
    """T-dag: |0⟩ and |1⟩ amplitudes match verified reference."""
    _assert_amplitudes_match_reference(Gate.T_DAG.value)
    _assert_controller_path_passes(Gate.T_DAG.value)


def test_y_amplitudes_on_basis_states() -> None:
    """Y: |0⟩ and |1⟩ amplitudes match verified reference."""
    _assert_amplitudes_match_reference(Gate.Y.value)
    _assert_controller_path_passes(Gate.Y.value)


# ── Phase-only regression: Z, S-dag, T-dag on |1⟩ ────────────────────────────


@pytest.mark.parametrize("gate_name", PHASE_ONLY_GATES)
def test_phase_gate_probability_matches_identity_but_amplitude_differs(
    gate_name: str,
) -> None:
    """
    On |1⟩ input, Z / S-dag / T-dag produce the same measurement probabilities
    as identity but different Dirac amplitudes. The live grader must reject
    identity-as-trial when the target is the phase gate.
    """
    basis = [1]
    gate_dirac, gate_sv = simulate_reference_state(gate_name, basis)
    id_dirac, id_sv = simulate_identity_state(basis)

    gate_probs, _ = CircuitSimulator._wavefunction_row_data(gate_sv, decimals=3)
    id_probs, _ = CircuitSimulator._wavefunction_row_data(id_sv, decimals=3)

    assert gate_probs == id_probs, (
        f"\n{gate_name} on |1⟩: probabilities should match identity for doc test\n"
        f"  gate probs: {gate_probs}\n"
        f"  id probs  : {id_probs}"
    )
    assert gate_dirac != id_dirac, (
        f"\n{gate_name} on |1⟩: Dirac strings must differ (phase-only gate)\n"
        f"  gate: {gate_dirac!r}\n"
        f"  id  : {id_dirac!r}"
    )

    # Single-row truth tables: trial = identity output, target = phase gate output.
    trial_dict = {
        "output": [id_dirac],
        "probabilities": [id_probs],
    }
    target_dict = {
        "output": [gate_dirac],
        "probabilities": [gate_probs],
    }
    assert _compute_all_match(
        trial_dict, target_dict, allow_global_phase=True, atol=ATOL
    ) is False, (
        f"{gate_name}: grader must NOT accept identity when target is phase gate "
        f"on definite-state |1⟩ row (probability-only would wrongly pass)"
    )
