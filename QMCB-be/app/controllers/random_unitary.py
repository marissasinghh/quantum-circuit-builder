"""
Controller for generating random single-qubit unitary levels (Level 1.6).

Uses ZYZ decomposition via the same resolver + TargetUnitaryBuilder path as grading.
"""

from __future__ import annotations

import logging

import cirq
import numpy as np

from app.dto.simulate_request import SimulateRequestDTO, TargetParamsDTO
from app.dto.truth_table import TruthTableDTO
from app.dto.unitary import UnitaryDTO
from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.services.target_parameter_resolver import resolve_target_params
from app.utils.constants import Gate
from app.utils.euler_angles import angles_from_seed_zyz  # re-export for tests/docs
from app.utils.helpers import initialize_qubit_sequence, generate_basis_states

logger = logging.getLogger(__name__)


def _simulate_bloch(circuit: cirq.Circuit, simulator: cirq.Simulator, initial_state: int) -> dict:
    result = simulator.simulate(circuit, initial_state=initial_state)
    a, b = result.final_state_vector[0], result.final_state_vector[1]
    theta = float(2 * np.arccos(np.clip(abs(a), 0.0, 1.0)))
    phi = float(np.angle(b) - np.angle(a))
    phi = float((phi + np.pi) % (2 * np.pi) - np.pi)
    return {"theta": theta, "phi": phi}


def _build_truth_table(
    circuit: cirq.Circuit,
    qubits: list[cirq.Qid],
    simulator: cirq.Simulator,
) -> dict:
    basis_states = generate_basis_states(len(qubits))
    truth_table_dto = TruthTableDTO([], [])
    for state in basis_states:
        full_circuit = CircuitBuilder.prepare_basis_state(state, qubits) + circuit
        CircuitSimulator.simulate_and_update(
            full_circuit, qubits, state, truth_table_dto, decimals=3
        )
    return truth_table_dto.to_dict()


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
          num_rotation_gates – hint count (always 3 for ZYZ decomposition)
          angles           – {gamma, beta, delta}
          target_bloch     – Bloch coords for |0⟩ and |1⟩ inputs
    """
    if seed is None:
        seed = int(np.random.randint(0, 2**31))

    logger.info(f"Generating random unitary with seed={seed}")

    gamma, beta, delta = angles_from_seed_zyz(seed)

    target_name = Gate.RANDOM_U.value
    qubits = initialize_qubit_sequence(1)
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
    circuit = TargetUnitaryBuilder.build(target_name, qubits, resolved)

    simulator = cirq.Simulator()
    truth_table = _build_truth_table(circuit, qubits, simulator)

    target_bloch = {
        "0": _simulate_bloch(circuit, simulator, initial_state=0),
        "1": _simulate_bloch(circuit, simulator, initial_state=1),
    }

    return {
        "session_id": seed,
        "truth_table": truth_table,
        "num_rotation_gates": 3,
        "angles": {
            "gamma": gamma,
            "beta": beta,
            "delta": delta,
        },
        "target_bloch": target_bloch,
    }
