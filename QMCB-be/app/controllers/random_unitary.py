"""
Controller for generating random single-qubit unitary levels (Level 1.6).

Provides two helpers shared by both the GET /api/levels/random-unitary
endpoint and the RANDOM_U branch inside simulate_unitaries:

  - angles_from_seed      : deterministic ZXZ Euler angles from an integer seed
  - build_random_target_circuit : Rz(alpha)·Rx(beta)·Rz(gamma) cirq.Circuit
  - generate_random_unitary_response : full truth-table response for the GET endpoint
"""

from __future__ import annotations

import math

import numpy as np
import cirq

from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.dto.truth_table import TruthTableDTO
from app.utils.helpers import initialize_qubit_sequence, generate_basis_states
from app.utils.types import Qubit
import logging

logger = logging.getLogger(__name__)


def angles_from_seed(seed: int) -> tuple[float, float, float]:
    """
    Deterministically derive ZXZ Euler angles from an integer seed.

    Returns:
        (alpha, beta, gamma) in [0, 2π) — the three rotation angles for
        the decomposition Rz(alpha)·Rx(beta)·Rz(gamma).
    """
    rng = np.random.default_rng(seed)
    alpha = float(rng.uniform(0, 2 * np.pi))
    beta  = float(rng.uniform(0, 2 * np.pi))
    gamma = float(rng.uniform(0, 2 * np.pi))
    return alpha, beta, gamma


def build_random_target_circuit(
    alpha: float, beta: float, gamma: float, qubits: list[Qubit]
) -> cirq.Circuit:
    """
    Build Rz(alpha)·Rx(beta)·Rz(gamma) acting on qubits[0].

    RZ uses the phase-gate convention  [[1, 0], [0, e^{iθ}]]  via
    ``cirq.Z ** (θ/π)``, matching the convention CirqGateMapper applies
    for the student's trial RZ gates.  Using ``cirq.rz(θ)`` here instead
    would introduce a per-gate global phase that compounds across the
    three-gate chain, producing a different state-vector output than the
    trial circuit and causing all_match to be False for a correct solution.

    Circuit is returned without basis-state preparation so it can be
    prepended to a state-prep circuit inside the simulation loop.
    """
    q = qubits[0]
    return cirq.Circuit(
        (cirq.Z ** (alpha / math.pi))(q),
        cirq.rx(beta)(q),
        (cirq.Z ** (gamma / math.pi))(q),
    )


def generate_random_unitary_response(seed: int | None = None) -> dict:
    """
    Generate a random single-qubit unitary and compute its truth table.

    Simulates Rz(alpha)·Rx(beta)·Rz(gamma) for each single-qubit basis
    state using the existing CircuitBuilder/CircuitSimulator pipeline,
    ensuring output strings are formatted identically to every other level.

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

    alpha, beta, gamma = angles_from_seed(seed)
    qubits = initialize_qubit_sequence(1)
    basis_states = generate_basis_states(1)

    truth_table_dto = TruthTableDTO([], [])
    target_base = build_random_target_circuit(alpha, beta, gamma, qubits)

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
