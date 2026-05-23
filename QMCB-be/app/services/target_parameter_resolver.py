"""Resolve runtime target-circuit parameters from library metadata and request context."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.config.target_library import TARGET_LIBRARY
from app.dto.simulate_request import TargetParamsDTO
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate, TargetLibraryField, TargetParameterMode
from app.utils.euler_angles import angles_from_seed
from app.utils.helpers import extract_theta_from_trial


@dataclass
class ResolvedTargetParams:
    """Per-step thetas and grading flags for building/simulating a target circuit."""

    step_thetas: list[Optional[float]]
    simulate_live: bool
    allow_global_phase: bool


def get_parameter_mode(target_name: str) -> TargetParameterMode:
    """Return the parameter resolution mode declared for a target in TARGET_LIBRARY."""
    if target_name not in TARGET_LIBRARY:
        raise ValueError(f"Target '{target_name}' not found in TARGET_LIBRARY")

    level = TARGET_LIBRARY[target_name]
    raw = level.get(TargetLibraryField.PARAMETER_MODE.value)
    if raw is not None:
        return TargetParameterMode(raw)

    if level.get(TargetLibraryField.PARAMETERIZED.value, False):
        return TargetParameterMode.TRIAL_THETA
    return TargetParameterMode.FIXED


def is_target_parameterized(target_name: str) -> bool:
    """True when the target requires live simulation (non-fixed parameter mode)."""
    return get_parameter_mode(target_name) != TargetParameterMode.FIXED


def _allow_global_phase(level: dict) -> bool:
    return bool(level.get(TargetLibraryField.ALLOW_GLOBAL_PHASE.value, True))


def _step_count(target_name: str) -> int:
    return len(TARGET_LIBRARY[target_name][TargetLibraryField.STEPS.value])


def resolve_target_params(
    target_name: str,
    trial: UnitaryDTO,
    target_params: TargetParamsDTO,
    validate_target: bool,
) -> ResolvedTargetParams:
    """
    Decide how to build the target circuit and whether to simulate it live.

    Args:
        target_name: Key in TARGET_LIBRARY (e.g. Gate.SWAP.value).
        trial: Student circuit — used for TRIAL_THETA / future TRIAL_ZXZ modes.
        target_params: Seed and future multi-angle fields from the request envelope.
        validate_target: When True, fixed targets are simulated live instead of
                         using stored expected_outputs.
    """
    if target_name not in TARGET_LIBRARY:
        raise ValueError(f"Target '{target_name}' not found in TARGET_LIBRARY")

    level = TARGET_LIBRARY[target_name]
    mode = get_parameter_mode(target_name)
    n_steps = _step_count(target_name)
    allow_gp = _allow_global_phase(level)
    has_stored_outputs = TargetLibraryField.EXPECTED_OUTPUTS.value in level

    if mode == TargetParameterMode.FIXED:
        simulate_live = validate_target or not has_stored_outputs
        return ResolvedTargetParams(
            step_thetas=[None] * n_steps,
            simulate_live=simulate_live,
            allow_global_phase=allow_gp,
        )

    if mode == TargetParameterMode.TRIAL_THETA:
        theta = extract_theta_from_trial(trial.gates, target_name)
        return ResolvedTargetParams(
            step_thetas=[theta],
            simulate_live=True,
            allow_global_phase=allow_gp,
        )

    if mode == TargetParameterMode.SEED_ZXZ:
        alpha, beta, gamma = angles_from_seed(target_params.seed or 0)
        return ResolvedTargetParams(
            step_thetas=[alpha, beta, gamma],
            simulate_live=True,
            allow_global_phase=allow_gp,
        )

    if mode == TargetParameterMode.TRIAL_ZXZ:
        raise NotImplementedError(
            f"Target {target_name!r} uses TRIAL_ZXZ parameter mode, which is not "
            "implemented yet (reserved for CONTROLLED_U)."
        )

    raise ValueError(f"Unsupported parameter mode for target {target_name!r}: {mode}")


def resolved_for_library_simulation(target_name: str) -> ResolvedTargetParams:
    """Build params for test_target_library live simulation of fixed targets."""
    level = TARGET_LIBRARY[target_name]
    n_steps = len(level[TargetLibraryField.STEPS.value])
    return ResolvedTargetParams(
        step_thetas=[None] * n_steps,
        simulate_live=True,
        allow_global_phase=_allow_global_phase(level),
    )
