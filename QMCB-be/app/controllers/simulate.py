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
    # A global phase must be a unit complex number
    if abs(abs(phi) - 1.0) > atol:
        return False

    # Every ratio must equal the same φ
    for r in ratios[1:]:
        if abs(r - phi) > atol:
            return False

    return True


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

    # Raw state vectors collected during simulation — used for global-phase fallback
    trial_vectors: list[np.ndarray] = []
    target_vectors: list[np.ndarray] = []

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

        trial_sv = CircuitSimulator.simulate_and_update(
            trial_circuit, qubits, state, trial_truth_table_dto, decimals=3
        )
        trial_vectors.append(trial_sv)

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

            target_sv = CircuitSimulator.simulate_and_update(
                target_circuit, qubits, state, target_truth_table_dto, decimals=3
            )
            target_vectors.append(target_sv)

    logging.info("Passed simulation and results of circuit successfully!")

    # Printing results
    print("Trial Circuit Results:")
    print(trial_truth_table_dto)
    print("Target Circuit Results:")
    print(target_truth_table_dto)

    trial_dict = trial_truth_table_dto.to_dict()
    target_dict = target_truth_table_dto.to_dict()

    # Primary comparison: exact string match.
    all_match = trial_dict["output"] == target_dict["output"]

    # Fallback: if strings differ for a fixed non-parameterized target, check whether
    # the trial circuit implements the same unitary up to a global phase (e.g. the H
    # canonical Rz·SQRT_X·Rz produces e^(iπ/4)·H — physically correct but strings differ).
    if not all_match and not is_random_u and not parameterized:
        if target_vectors:
            # Live-simulated target vectors already collected above.
            all_match = _match_up_to_global_phase(trial_vectors, target_vectors)
        else:
            # Fixed target: build the canonical circuit live just for this comparison.
            gp_target_vecs: list[np.ndarray] = []
            for s in basis_states:
                t_base = TargetUnitaryBuilder.build(target_name, qubits)
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
