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


def _row_probabilities_match(
    trial_row: list[float],
    target_row: list[float],
    atol: float = 1e-6,
) -> bool:
    """Return True when a single row's probability vectors match within tolerance."""
    if len(trial_row) != len(target_row):
        return False
    return all(abs(t_p - g_p) < atol for t_p, g_p in zip(trial_row, target_row))


def _probabilities_match(
    trial_probs: list[list[float]],
    target_probs: list[list[float]],
    atol: float = 1e-6,
) -> bool:
    """Return True when every row's probability vector matches within tolerance."""
    if len(trial_probs) != len(target_probs):
        return False

    for trial_row, target_row in zip(trial_probs, target_probs):
        if not _row_probabilities_match(trial_row, target_row, atol):
            return False

    return True


def _row_is_superposition(probs: list[float]) -> bool:
    """True when the row has measurable probability on more than one basis state."""
    return sum(1 for p in probs if p > 1e-6) > 1


def _compute_all_match(
    trial_dict: dict[str, Any],
    target_dict: dict[str, Any],
    allow_global_phase: bool,
) -> bool:
    """
    Return True when every truth-table row matches.

    Primary check: Dirac string equality. When allow_global_phase is set and
    strings differ on a superposition row, fall back to per-row probability
    comparison. Definite-state rows (e.g. S/T on |1⟩) still require matching
    strings so phase-distinct gates are not treated as equivalent.
    """
    trial_outputs = trial_dict["output"]
    target_outputs = target_dict["output"]

    if trial_outputs == target_outputs:
        return True

    if not allow_global_phase:
        return False

    trial_probs = trial_dict.get("probabilities") or []
    target_probs = target_dict.get("probabilities") or []

    if not trial_probs or not target_probs:
        return False

    if len(trial_outputs) != len(target_outputs):
        return False

    for i, (trial_out, target_out) in enumerate(zip(trial_outputs, target_outputs)):
        if trial_out == target_out:
            continue
        if i >= len(trial_probs) or i >= len(target_probs):
            return False
        if not _row_is_superposition(trial_probs[i]) or not _row_is_superposition(
            target_probs[i]
        ):
            return False
        if not _row_probabilities_match(trial_probs[i], target_probs[i]):
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

    all_match = _compute_all_match(trial_dict, target_dict, resolved.allow_global_phase)

    return {
        "message": "Successfully simulated circuits.",
        "trial_truth_table": trial_dict,
        "target_truth_table": target_dict,
        "all_match": all_match,
        "validation_mode": validate_target,
    }, 200
