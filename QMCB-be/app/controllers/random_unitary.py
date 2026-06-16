"""
Controller for generating random single-qubit unitary levels (Level 1.6).

Uses the same TARGET_LIBRARY entry and TargetParameterResolver path as grading.
"""

from __future__ import annotations

import logging

import cirq
import numpy as np

from app.dto.simulate_request import SimulateRequestDTO, TargetParamsDTO
from app.dto.unitary import UnitaryDTO
from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.services.target_parameter_resolver import resolve_target_params
from app.dto.truth_table import TruthTableDTO
from app.utils.constants import Gate
from app.utils.euler_angles import angles_from_seed  # re-export for tests/docs
from app.utils.helpers import initialize_qubit_sequence, generate_basis_states

logger = logging.getLogger(__name__)


def state_vector_to_bloch(state: np.ndarray) -> dict:
    """Convert a single-qubit state vector to Bloch sphere angles."""
    a, b = state[0], state[1]
    theta = float(2 * np.arccos(np.clip(abs(a), 0, 1)))
    phi = float(np.angle(b) - np.angle(a))
    phi = (phi + np.pi) % (2 * np.pi) - np.pi
    return {"theta": theta, "phi": phi}


def generate_random_unitary_response(seed: int | None = None) -> dict:
    """
    Generate a random single-qubit unitary and compute its truth table.

    Args:
        seed: Integer seed for reproducibility. A fresh seed is generated
              when None is passed.

    Returns:
        dict with:
          session_id       – the integer seed (store client-side for replay)
          truth_table      – { "input": [...], "output": [...] }
          num_rotation_gates – hint count (always 3 for ZXZ decomposition)
    """
    if seed is None:
        seed = int(np.random.randint(0, 2**31))

    logger.info(f"Generating random unitary with seed={seed}")

    target_name = Gate.RANDOM_U.value
    qubits = initialize_qubit_sequence(1)
    basis_states = generate_basis_states(1)

    empty_trial = UnitaryDTO(number_of_qubits=1, gates=[], qubit_order=[])
    request = SimulateRequestDTO(
        target_unitary=target_name,
        trial=empty_trial,
        target_params=TargetParamsDTO(seed=seed),
    )
    resolved = resolve_target_params(
        target_name,
        empty_trial,
        request.target_params,
        validate_target=True,
    )
    target_base = TargetUnitaryBuilder.build(target_name, qubits, resolved)

    truth_table_dto = TruthTableDTO([], [])
    for state in basis_states:
        full_circuit = CircuitBuilder.prepare_basis_state(state, qubits) + target_base
        CircuitSimulator.simulate_and_update(
            full_circuit, qubits, state, truth_table_dto, decimals=3
        )

    alpha, beta, gamma = angles_from_seed(seed)

    # Simulate target circuit on |0⟩ — same Cirq path as grading, no formula assumptions.
    qubit = cirq.LineQubit.range(1)[0]
    circuit = cirq.Circuit([
        cirq.rz(alpha)(qubit),
        cirq.rx(beta)(qubit),
        cirq.rz(gamma)(qubit),
    ])
    simulator = cirq.Simulator()
    result = simulator.simulate(circuit, initial_state=0)
    state = result.final_state_vector
    target_bloch = state_vector_to_bloch(state)

    return {
        "session_id": seed,
        "truth_table": truth_table_dto.to_dict(),
        "num_rotation_gates": 3,
        "target_bloch": target_bloch,
        "angles": {
            "alpha": alpha,
            "beta": beta,
            "gamma": gamma,
        },
    }
