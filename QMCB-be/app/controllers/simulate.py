from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.services.target_parameter_resolver import (
    resolve_target_params,
    resolved_for_library_simulation,
)
from app.utils.helpers import (
    generate_basis_states,
    initialize_qubit_sequence,
    build_target_truth_table,
)
from app.dto.simulate_request import SimulateRequestDTO
from app.dto.truth_table import TruthTableDTO
from typing import Any
import logging
import numpy as np


def _match_up_to_global_phase(
    trial_vecs: list,
    target_vecs: list,
    atol: float = 0.02,
) -> bool:
    """
    Returns True if there exists a single unit complex number φ such that
    trial_vecs[i] ≈ φ × target_vecs[i] for every basis-state row i.

    This catches circuits that implement the correct unitary up to global phase
    (e.g. Rz·SQRT_X·Rz producing H with an e^(iπ/4) factor), which are
    physically equivalent but produce different Dirac-notation strings.
    """
    ratios: list[complex] = []
    for tr_sv, tg_sv in zip(trial_vecs, target_vecs):
        for tr_amp, tg_amp in zip(tr_sv.flatten(), tg_sv.flatten()):
            if abs(tg_amp) > 1e-4:
                ratios.append(complex(tr_amp) / complex(tg_amp))

    if not ratios:
        return False

    phi = ratios[0]
    if abs(abs(phi) - 1.0) > atol:
        return False

    for r in ratios[1:]:
        if abs(r - phi) > atol:
            return False

    return True


def simulate_unitaries(
    request: SimulateRequestDTO,
    validate_target: bool = False,
) -> tuple[dict[str, Any], int]:
    """
    Simulate trial circuit and optionally compute target circuit.

    Args:
        request: Typed simulate request (trial circuit + target metadata).
        validate_target: If True, compute target circuit live. If False, fixed
                         targets use stored expected_outputs when available.

    Returns:
        Response dict with trial and target truth tables
    """
    trial_dto = request.trial
    target_name = request.target_unitary

    qubits = initialize_qubit_sequence(trial_dto.number_of_qubits)
    basis_states = generate_basis_states(trial_dto.number_of_qubits)

    trial_truth_table_dto = TruthTableDTO([], [])
    target_truth_table_dto = TruthTableDTO([], [])

    trial_vectors: list[np.ndarray] = []
    target_vectors: list[np.ndarray] = []

    resolved = resolve_target_params(
        target_name,
        trial_dto,
        request.target_params,
        validate_target=validate_target,
    )

    if not resolved.simulate_live:
        logging.info("Skipping target circuit validation - Using stored outputs.")
        build_target_truth_table(target_name, target_truth_table_dto)

    for state in basis_states:
        logging.info(f"Constructing circuit for state: {state}")

        trial_circuit = CircuitBuilder.construct_unitary_circuit(
            state, trial_dto.gates, trial_dto.qubit_order, qubits
        )

        logging.info("Passed circuit construction successfully.")
        print("Trial Circuit:")
        print(trial_circuit)

        trial_sv = CircuitSimulator.simulate_and_update(
            trial_circuit, qubits, state, trial_truth_table_dto, decimals=3
        )
        trial_vectors.append(trial_sv)

        if resolved.simulate_live:
            logging.info("Computing target circuit for validation")

            target_circuit_base = TargetUnitaryBuilder.build(
                target_name, qubits, resolved
            )
            target_circuit = (
                CircuitBuilder.prepare_basis_state(state, qubits) + target_circuit_base
            )

            print("Target Circuit:")
            print(target_circuit)

            target_sv = CircuitSimulator.simulate_and_update(
                target_circuit, qubits, state, target_truth_table_dto, decimals=3
            )
            target_vectors.append(target_sv)

    logging.info("Passed simulation and results of circuit successfully!")

    print("Trial Circuit Results:")
    print(trial_truth_table_dto)
    print("Target Circuit Results:")
    print(target_truth_table_dto)

    trial_dict = trial_truth_table_dto.to_dict()
    target_dict = target_truth_table_dto.to_dict()

    all_match = trial_dict["output"] == target_dict["output"]

    if not all_match and resolved.allow_global_phase:
        if target_vectors:
            all_match = _match_up_to_global_phase(trial_vectors, target_vectors)
        else:
            gp_resolved = resolved_for_library_simulation(target_name)
            gp_target_vecs: list[np.ndarray] = []
            for s in basis_states:
                t_base = TargetUnitaryBuilder.build(target_name, qubits, gp_resolved)
                t_circuit = CircuitBuilder.prepare_basis_state(s, qubits) + t_base
                _, t_sv = CircuitSimulator._simulate(t_circuit, qubits)
                gp_target_vecs.append(t_sv)
            all_match = _match_up_to_global_phase(trial_vectors, gp_target_vecs)

    return {
        "message": "Successfully simulated circuits.",
        "trial_truth_table": trial_dict,
        "target_truth_table": target_dict,
        "all_match": all_match,
        "validation_mode": validate_target,
    }, 200
