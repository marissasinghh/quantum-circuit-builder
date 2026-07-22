"""Unit tests for TargetParameterResolver."""

from __future__ import annotations

import pytest

from app.dto.simulate_request import TargetParamsDTO
from app.dto.unitary import UnitaryDTO
from app.services.target_parameter_resolver import (
    get_parameter_mode,
    is_target_parameterized,
    resolve_target_params,
)
from app.utils.constants import Gate, TargetParameterMode
from app.utils.euler_angles import angles_from_seed, angles_from_seed_zyz


def _trial(*gates) -> UnitaryDTO:
    return UnitaryDTO(number_of_qubits=1, gates=list(gates), qubit_order=[[0]] * len(gates))


class TestGetParameterMode:
    def test_swap_is_fixed(self) -> None:
        assert get_parameter_mode(Gate.SWAP.value) == TargetParameterMode.FIXED

    def test_rx_is_random_theta(self) -> None:
        assert get_parameter_mode(Gate.RX.value) == TargetParameterMode.RANDOM_THETA

    def test_random_u_is_seed_zyz(self) -> None:
        assert get_parameter_mode(Gate.RANDOM_U.value) == TargetParameterMode.SEED_ZYZ

    def test_controlled_u_is_seed_zxz(self) -> None:
        assert get_parameter_mode(Gate.CONTROLLED_U.value) == TargetParameterMode.SEED_ZXZ


class TestIsTargetParameterized:
    def test_fixed_target_is_not_parameterized(self) -> None:
        assert is_target_parameterized(Gate.H.value) is False

    def test_rx_is_parameterized(self) -> None:
        assert is_target_parameterized(Gate.RX.value) is True


class TestResolveTargetParams:
    def test_fixed_uses_stored_outputs_when_not_validating(self) -> None:
        resolved = resolve_target_params(
            Gate.SWAP.value,
            _trial("H"),
            TargetParamsDTO(),
            validate_target=False,
        )
        assert resolved.simulate_live is False
        assert resolved.allow_global_phase is True
        assert resolved.step_thetas == [None, None, None]

    def test_fixed_simulates_live_when_validating(self) -> None:
        resolved = resolve_target_params(
            Gate.SWAP.value,
            _trial("H"),
            TargetParamsDTO(),
            validate_target=True,
        )
        assert resolved.simulate_live is True

    def test_random_theta_returns_sampling_resolved(self) -> None:
        """RANDOM_THETA mode: resolver sets is_sampling=True, step_thetas=[]."""
        resolved = resolve_target_params(
            Gate.RX.value,
            _trial({"gate": Gate.RX.value, "theta": 1.23}),
            TargetParamsDTO(),
            validate_target=False,
        )
        assert resolved.simulate_live is True
        assert resolved.is_sampling is True
        assert resolved.step_thetas == []

    def test_seed_zyz_matches_angles_from_seed_zyz(self) -> None:
        seed = 42
        gamma, beta, delta = angles_from_seed_zyz(seed)
        resolved = resolve_target_params(
            Gate.RANDOM_U.value,
            UnitaryDTO(1, [], []),
            TargetParamsDTO(seed=seed),
            validate_target=False,
        )
        assert resolved.simulate_live is True
        assert resolved.allow_global_phase is True
        assert resolved.grading_atol == 1e-3
        assert resolved.step_thetas == [delta, gamma, beta]

    def test_controlled_u_seed_zxz_matches_angles_from_seed(self) -> None:
        """CONTROLLED_U now uses SEED_ZXZ — resolver returns step_thetas=[α,β,γ] from seed."""
        seed = 42
        alpha, beta, gamma = angles_from_seed(seed)
        resolved = resolve_target_params(
            Gate.CONTROLLED_U.value,
            UnitaryDTO(2, [], []),
            TargetParamsDTO(seed=seed),
            validate_target=False,
        )
        assert resolved.simulate_live is True
        assert resolved.allow_global_phase is False
        assert resolved.step_thetas == [alpha, beta, gamma]
