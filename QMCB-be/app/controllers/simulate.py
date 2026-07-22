from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.services.target_parameter_resolver import (
    ResolvedTargetParams,
    resolve_target_params,
    resolved_for_library_simulation,
)
from app.config.gates import CirqGateMapper
from app.config.target_library import TARGET_LIBRARY
from app.utils.helpers import (
    generate_basis_states,
    initialize_qubit_sequence,
    build_target_truth_table,
)
from app.utils.constants import Gate, GradingMode, TargetLibraryField
from app.dto.simulate_request import SimulateRequestDTO
from app.dto.truth_table import TruthTableDTO
from app.utils.types import UnitaryGateEntry
from typing import Any
import copy
import logging
import math

import cirq
import numpy as np


def _level_grading_mode(target_name: str) -> str | None:
    """Return the optional per-level grading_mode from TARGET_LIBRARY, or None."""
    level = TARGET_LIBRARY.get(target_name)
    if level is None:
        return None
    return level.get(TargetLibraryField.GRADING_MODE.value)


def _unitaries_match_up_to_global_phase(
    trial_gates: list[UnitaryGateEntry],
    trial_qubit_order: list[list[int]],
    target_name: str,
    qubits: list,
    resolved: ResolvedTargetParams,
    atol: float | None = None,
) -> bool:
    """
    Compare trial and target as full unitaries (cirq.allclose_up_to_global_phase).

    Used when a level sets grading_mode=unitary_global_phase.
    Rejects same-Born / not-phase-equivalent pairs (e.g. bare X vs Y).

    atol: when None, Cirq's default (1e-8) is used — Y / H / √X† / CH.
    When set (e.g. RANDOM_U grading_atol=1e-3), that absolute tolerance is used.
    """
    trial_base = CircuitBuilder.build_circuit_base(trial_gates, trial_qubit_order, qubits)
    target_base = TargetUnitaryBuilder.build(target_name, qubits, resolved)
    trial_U = cirq.unitary(trial_base)
    target_U = cirq.unitary(target_base)
    if atol is None:
        return bool(cirq.allclose_up_to_global_phase(trial_U, target_U))
    return bool(cirq.allclose_up_to_global_phase(trial_U, target_U, atol=atol))


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
    atol: float = 1e-6,
) -> bool:
    """
    Return True when every truth-table row matches.

    Primary check: Dirac string equality. When allow_global_phase is set and
    strings differ on a superposition row, fall back to per-row probability
    comparison using atol. Definite-state rows (e.g. S/T on |1⟩) still require
    matching strings so phase-distinct gates are not treated as equivalent.

    atol is sourced from ResolvedTargetParams.grading_atol (1e-6 for most levels;
    RANDOM_U's grading_atol is used on the unitary-GP path instead — see
    _unitaries_match_up_to_global_phase).
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
        if not _row_probabilities_match(trial_probs[i], target_probs[i], atol):
            return False

    return True


def _substitute_theta_in_gates(
    gates: list[UnitaryGateEntry],
    target_name: str,
    theta: float,
    parameter_gate_index: int | None = None,
) -> list[UnitaryGateEntry]:
    """
    Return a deep copy of ``gates`` with exactly one gate's theta replaced by
    ``theta`` — the gate that carries the free parameter for this level.

    When ``parameter_gate_index`` is set, substitute only at that index (client
    marks the student's parameter slot). Otherwise search order mirrors
    ``extract_theta_from_trial``:
      1. First dict-gate whose ``"gate"`` key matches ``target_name`` (canonical gate).
      2. Fallback for RX: first Rz gate.
      3. Fallback for RY: first Rx gate; then Rz gate(s) — single Rz dict, or
         middle gate of a three-Rz ``Rz·H·Rz·H·Rz`` decomposition, else first Rz.

    If no suitable gate is found the copy is returned unmodified (the sampling
    comparison will then fail naturally, which is the correct result).
    """
    new_gates: list[UnitaryGateEntry] = copy.deepcopy(gates)

    if parameter_gate_index is not None:
        if 0 <= parameter_gate_index < len(new_gates):
            entry = new_gates[parameter_gate_index]
            if isinstance(entry, dict):
                new_gates[parameter_gate_index] = {**entry, "theta": theta}
                return new_gates
        return new_gates

    for i, entry in enumerate(new_gates):
        if isinstance(entry, dict) and entry.get("gate") == target_name:
            new_gates[i] = {**entry, "theta": theta}
            return new_gates

    if target_name == Gate.RX.value:
        for i, entry in enumerate(new_gates):
            if isinstance(entry, dict) and entry.get("gate") == Gate.RZ.value:
                new_gates[i] = {**entry, "theta": theta}
                return new_gates

    if target_name == Gate.RY.value:
        for i, entry in enumerate(new_gates):
            if isinstance(entry, dict) and entry.get("gate") == Gate.RX.value:
                new_gates[i] = {**entry, "theta": theta}
                return new_gates

        rz_indices = [
            i
            for i, entry in enumerate(new_gates)
            if isinstance(entry, dict) and entry.get("gate") == Gate.RZ.value
        ]
        if len(rz_indices) == 1:
            i = rz_indices[0]
            new_gates[i] = {**new_gates[i], "theta": theta}
            return new_gates
        if len(rz_indices) == 3:
            i = rz_indices[1]
            new_gates[i] = {**new_gates[i], "theta": theta}
            return new_gates
        if rz_indices:
            i = rz_indices[0]
            new_gates[i] = {**new_gates[i], "theta": theta}
            return new_gates

    return new_gates


def _grade_random_theta(
    request: SimulateRequestDTO,
    resolved: ResolvedTargetParams,
    n_samples: int = 10,
) -> tuple[dict[str, Any], int]:
    """
    Grade a parameterized level by sampling ``n_samples`` random angles.

    For each sampled angle θᵢ:
      - Substitute θᵢ into the student's circuit (replacing the free-parameter gate).
      - Compare the resulting unitary to cirq.rx(θᵢ) / cirq.ry(θᵢ) using
        ``cirq.allclose_up_to_global_phase`` (allow_global_phase is True for RX/RY).

    Returns a simplified response without truth tables so the frontend can
    render a summary message instead of a row-by-row table.
    """
    trial_dto = request.trial
    target_name = request.target_unitary

    level = TARGET_LIBRARY[target_name]
    canonical_gate: str = level["canonical_gate"]

    qubits = initialize_qubit_sequence(trial_dto.number_of_qubits)

    samples_passed = 0
    for _ in range(n_samples):
        theta_i = np.random.uniform(0, 2 * math.pi)

        modified_gates = _substitute_theta_in_gates(
            trial_dto.gates,
            target_name,
            theta_i,
            parameter_gate_index=trial_dto.parameter_gate_index,
        )

        trial_base = CircuitBuilder.build_circuit_base(
            modified_gates, trial_dto.qubit_order, qubits
        )

        target_op = CirqGateMapper.apply(canonical_gate, [0], *qubits, theta=theta_i)
        target_base = cirq.Circuit(target_op)

        trial_U = cirq.unitary(trial_base)
        target_U = cirq.unitary(target_base)

        if resolved.allow_global_phase:
            match = cirq.allclose_up_to_global_phase(trial_U, target_U)
        else:
            match = bool(np.allclose(trial_U, target_U))

        if match:
            samples_passed += 1

    return {
        "message": "Successfully simulated circuits.",
        "grading_mode": "random_theta",
        "samples_checked": n_samples,
        "samples_passed": samples_passed,
        "all_match": samples_passed == n_samples,
        "trial_truth_table": None,
        "target_truth_table": None,
        "validation_mode": False,
    }, 200


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

    if resolved.is_sampling:
        return _grade_random_theta(request, resolved)

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

    grading_mode = _level_grading_mode(target_name)
    if grading_mode == GradingMode.UNITARY_GLOBAL_PHASE.value:
        # Additive path: does not enter _compute_all_match. Truth tables are still
        # computed above for the FE; pass/fail uses full unitary comparison.
        # Only pass grading_atol when the library entry sets it explicitly so
        # Y/H/√X†/CH keep Cirq's default atol=1e-8.
        level_cfg = TARGET_LIBRARY.get(target_name) or {}
        ugp_atol = (
            float(level_cfg[TargetLibraryField.GRADING_ATOL.value])
            if TargetLibraryField.GRADING_ATOL.value in level_cfg
            else None
        )
        all_match = _unitaries_match_up_to_global_phase(
            trial_dto.gates,
            trial_dto.qubit_order,
            target_name,
            qubits,
            target_resolved,
            atol=ugp_atol,
        )
    else:
        all_match = _compute_all_match(
            trial_dict,
            target_dict,
            resolved.allow_global_phase,
            atol=resolved.grading_atol,
        )

    return {
        "message": "Successfully simulated circuits.",
        "grading_mode": grading_mode,
        "samples_checked": None,
        "samples_passed": None,
        "trial_truth_table": trial_dict,
        "target_truth_table": target_dict,
        "all_match": all_match,
        "validation_mode": validate_target,
    }, 200
