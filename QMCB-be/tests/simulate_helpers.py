"""Shared helpers for controller-path simulate tests."""

from __future__ import annotations

from unittest.mock import patch

from app.controllers.simulate import simulate_unitaries
from app.dto.simulate_request import SimulateRequestDTO, TargetParamsDTO
from app.dto.unitary import UnitaryDTO


def make_simulate_request(
    trial: UnitaryDTO,
    target_name: str,
    *,
    seed: int | None = None,
) -> SimulateRequestDTO:
    return SimulateRequestDTO(
        target_unitary=target_name,
        trial=trial,
        target_params=TargetParamsDTO(seed=seed),
    )


def run_simulate(
    trial: UnitaryDTO,
    target_name: str,
    *,
    validate_target: bool = True,
    seed: int | None = None,
):
    request = make_simulate_request(trial, target_name, seed=seed)
    with patch("builtins.print"):
        return simulate_unitaries(request, validate_target=validate_target)
