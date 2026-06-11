"""
Controller for generating random controlled-U levels (Level 2.5).

Mirrors random_unitary.py exactly but for 2 qubits and Gate.CONTROLLED_U.
Uses the same TARGET_LIBRARY entry and TargetParameterResolver path as grading.
"""

from __future__ import annotations

import numpy as np

from app.dto.simulate_request import SimulateRequestDTO, TargetParamsDTO
from app.dto.unitary import UnitaryDTO
from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.services.target_parameter_resolver import resolve_target_params
from app.dto.truth_table import TruthTableDTO
from app.utils.constants import Gate
from app.utils.helpers import initialize_qubit_sequence, generate_basis_states
import logging

logger = logging.getLogger(__name__)


def generate_controlled_unitary_response(seed: int | None = None) -> dict:
    """
    Generate a random controlled-U and compute its 4-row truth table.

    The inner single-qubit unitary U is derived from three ZXZ Euler angles
    (alpha, beta, gamma) seeded deterministically from ``seed``.  The reference
    circuit is cirq.ControlledGate(MatrixGate(U)) with Q0 as control, Q1 as target.

    Args:
        seed: Integer seed for reproducibility.  A fresh seed is generated
              when None is passed.

    Returns:
        dict with:
          session_id         – the integer seed (store client-side for replay)
          truth_table        – { "input": [...], "output": [...] } — 4 rows
          num_rotation_gates – hint: always 3 (inner U is a ZXZ decomposition)
    """
    if seed is None:
        seed = int(np.random.randint(0, 2**31))

    logger.info(f"Generating controlled unitary with seed={seed}")

    target_name = Gate.CONTROLLED_U.value
    qubits = initialize_qubit_sequence(2)
    basis_states = generate_basis_states(2)

    empty_trial = UnitaryDTO(number_of_qubits=2, gates=[], qubit_order=[])
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

    return {
        "session_id": seed,
        "truth_table": truth_table_dto.to_dict(),
        "num_rotation_gates": 3,
    }
