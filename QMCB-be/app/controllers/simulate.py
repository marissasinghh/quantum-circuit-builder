from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.controllers.random_unitary import angles_from_seed, build_random_target_circuit
from app.utils.helpers import (
    generate_basis_states,
    initialize_qubit_sequence,
    build_target_truth_table,
    is_target_parameterized,
    extract_theta_from_trial,
)
from app.dto.unitary import UnitaryDTO
from app.dto.truth_table import TruthTableDTO
from typing import Any, Optional
import logging

# Sentinel value used by Level 1.6 — target is generated from seed, not TARGET_LIBRARY.
_RANDOM_U_TARGET = "RANDOM_U"


def simulate_unitaries(
    trial_dto: UnitaryDTO,
    target_name: str,
    validate_target: bool = False,
    seed: Optional[int] = None,
) -> tuple[dict[str, Any], int]:
    """
    Simulate trial circuit and optionally compute target circuit.

    Args:
        trial_dto: Student's circuit definition
        target_name: Target unitary identifier (e.g., "SWAP") or "RANDOM_U"
                     for Level 1.6 random-unitary challenges.
        validate_target: If True, compute target circuit live. If False, use
                         stored expected_outputs (ignored for RANDOM_U — always live).
        seed: Integer seed used to reproduce the random unitary for Level 1.6.
              Ignored for all other target names.

    Returns:
        Response dict with trial and target truth tables
    """

    # Initializing qubits and starting basis states
    qubits = initialize_qubit_sequence(trial_dto.number_of_qubits)
    basis_states = generate_basis_states(trial_dto.number_of_qubits)

    # Preparing truth tables
    trial_truth_table_dto = TruthTableDTO([], [])
    target_truth_table_dto = TruthTableDTO([], [])

    # Level 1.6: random unitary — always simulate live from seed-derived angles.
    # This branch must come first to avoid TARGET_LIBRARY lookups on "RANDOM_U".
    is_random_u = target_name == _RANDOM_U_TARGET
    if is_random_u:
        simulate_target_live = True
        parameterized = False
        theta = None
        r_alpha, r_beta, r_gamma = angles_from_seed(seed or 0)
    else:
        # Parameterized targets (RX, RY) have no pre-stored expected_outputs —
        # their output depends on the student's theta, so we must always simulate live.
        # Fixed targets (SWAP, H, …) use stored outputs unless the caller forces validation.
        parameterized = is_target_parameterized(target_name)
        simulate_target_live = validate_target or parameterized

        # For parameterized targets, pull the angle the student submitted.
        theta = extract_theta_from_trial(trial_dto.gates, target_name) if parameterized else None

        # Fixed targets with no live validation: read expected_outputs straight from the library.
        if not simulate_target_live:
            logging.info("Skipping target circuit validation - Using stored outputs.")
            build_target_truth_table(target_name, target_truth_table_dto)

    # Running simulations for each basis state
    for state in basis_states:

        logging.info(f"Constructing circuit for state: {state}")

        trial_circuit = CircuitBuilder.construct_unitary_circuit(
            state, trial_dto.gates, trial_dto.qubit_order, qubits
        )

        logging.info("Passed circuit construction successfully.")
        print("Trial Circuit:")
        print(trial_circuit)

        CircuitSimulator.simulate_and_update(
            trial_circuit, qubits, state, trial_truth_table_dto, decimals=3
        )

        if simulate_target_live:
            logging.info("Computing target circuit for validation")

            if is_random_u:
                # Rebuild the same random unitary from the seed-derived angles.
                target_circuit_base = build_random_target_circuit(
                    r_alpha, r_beta, r_gamma, qubits
                )
            else:
                # Pass theta so parameterized targets (RX, RY) use the student's angle.
                # Fixed targets ignore theta (it stays None and target_builder skips it).
                target_circuit_base = TargetUnitaryBuilder.build(target_name, qubits, theta=theta)

            target_circuit = (
                CircuitBuilder.prepare_basis_state(state, qubits) + target_circuit_base
            )

            print("Target Circuit:")
            print(target_circuit)

            CircuitSimulator.simulate_and_update(
                target_circuit, qubits, state, target_truth_table_dto, decimals=3
            )

    logging.info("Passed simulation and results of circuit successfully!")

    # Printing results
    print("Trial Circuit Results:")
    print(trial_truth_table_dto)
    print("Target Circuit Results:")
    print(target_truth_table_dto)

    trial_dict = trial_truth_table_dto.to_dict()
    target_dict = target_truth_table_dto.to_dict()

    # True when every output row of the student's circuit matches the target.
    all_match = trial_dict["output"] == target_dict["output"]

    return {
        "message": "Successfully simulated circuits.",
        "trial_truth_table": trial_dict,
        "target_truth_table": target_dict,
        "all_match": all_match,
        "validation_mode": validate_target,
    }, 200
