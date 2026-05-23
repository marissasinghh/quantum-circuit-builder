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


def _probabilities_match(
    trial_probs: list[list[float]],
    target_probs: list[list[float]],
    atol: float = 0.02,
) -> bool:
    """Return True when every row's probability vector matches within tolerance."""
    if len(trial_probs) != len(target_probs):
        return False

    for trial_row, target_row in zip(trial_probs, target_probs):
        if len(trial_row) != len(target_row):
            return False
        for t_p, g_p in zip(trial_row, target_row):
            if abs(t_p - g_p) > atol:
                return False

    return True


def _match_amplitudes_up_to_global_phase(
    trial_amps: list[list[list[float]]],
    target_amps: list[list[list[float]]],
    atol: float = 0.02,
) -> bool:
    """
    Return True if trial amplitudes equal target amplitudes up to one global phase.

    Uses stored [re, im] pairs from the truth table (no raw state-vector re-simulation).
    """
    ratios: list[complex] = []
    for tr_row, tg_row in zip(trial_amps, target_amps):
        for tr_pair, tg_pair in zip(tr_row, tg_row):
            tr_amp = complex(tr_pair[0], tr_pair[1])
            tg_amp = complex(tg_pair[0], tg_pair[1])
            if abs(tg_amp) > 1e-4:
                ratios.append(tr_amp / tg_amp)

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

    resolved = resolve_target_params(
        target_name,
        trial_dto,
        request.target_params,
        validate_target=validate_target,
    )

    if not resolved.simulate_live:
        logging.info("Skipping target circuit validation - Using stored outputs.")
        build_target_truth_table(target_name, target_truth_table_dto)

    target_resolved = (
        resolved
        if resolved.simulate_live
        else resolved_for_library_simulation(target_name)
    )

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

            CircuitSimulator.simulate_and_update(
                target_circuit, qubits, state, target_truth_table_dto, decimals=3
            )
        else:
            target_circuit_base = TargetUnitaryBuilder.build(
                target_name, qubits, target_resolved
            )
            target_circuit = (
                CircuitBuilder.prepare_basis_state(state, qubits) + target_circuit_base
            )
            _, target_sv = CircuitSimulator._simulate(target_circuit, qubits, decimals=3)
            CircuitSimulator.append_wavefunction_columns(
                target_truth_table_dto, target_sv, decimals=3
            )

    logging.info("Passed simulation and results of circuit successfully!")

    print("Trial Circuit Results:")
    print(trial_truth_table_dto)
    print("Target Circuit Results:")
    print(target_truth_table_dto)

    trial_dict = trial_truth_table_dto.to_dict()
    target_dict = target_truth_table_dto.to_dict()

    all_match = trial_dict["output"] == target_dict["output"]

    if not all_match and resolved.allow_global_phase:
        all_match = _probabilities_match(
            trial_dict["probabilities"], target_dict["probabilities"]
        ) and _match_amplitudes_up_to_global_phase(
            trial_dict["amplitudes"], target_dict["amplitudes"]
        )

    return {
        "message": "Successfully simulated circuits.",
        "trial_truth_table": trial_dict,
        "target_truth_table": target_dict,
        "all_match": all_match,
        "validation_mode": validate_target,
    }, 200
