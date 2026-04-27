from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.utils.helpers import (
    generate_basis_states,
    initialize_qubit_sequence,
    build_target_truth_table,
    is_target_parameterized,
    extract_theta_from_trial,
)
from app.dto.unitary import UnitaryDTO
from app.dto.truth_table import TruthTableDTO
from typing import Any
import logging


def simulate_unitaries(
    trial_dto: UnitaryDTO, target_name: str, validate_target: bool = False
) -> tuple[dict[str, Any], int]:
    """
    Simulate trial circuit and optionally compute target circuit.

    Args:
        trial_dto: Student's circuit definition
        target_name: Target unitary identifier (e.g., "SWAP")
        validate_target: If True, compute target circuit. If False, use stored values.

    Returns:
        Response dict with trial and target truth tables
    """

    # Initializing qubits and starting basis states
    qubits = initialize_qubit_sequence(trial_dto.number_of_qubits)
    basis_states = generate_basis_states(trial_dto.number_of_qubits)

    # Preparing truth tables
    trial_truth_table_dto = TruthTableDTO([], [])
    target_truth_table_dto = TruthTableDTO([], [])

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

    return {
        "message": "Successfully simulated circuits.",
        "trial_truth_table": trial_truth_table_dto.to_dict(),
        "target_truth_table": target_truth_table_dto.to_dict(),
        "validation_mode": validate_target,
    }, 200
