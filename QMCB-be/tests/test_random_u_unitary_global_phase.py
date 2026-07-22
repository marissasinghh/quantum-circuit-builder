"""
RANDOM_U (1.15): grading_mode=unitary_global_phase with grading_atol=1e-3.

Paired with FE slider step 0.001. Accepts exact / 0.001-snapped / typed ZYZ;
rejects Born-ambiguous false positives including near-degenerate γ seeds 34/82.
"""

from __future__ import annotations

import math

import pytest

from app.config.target_library import TARGET_LIBRARY
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate, GradingMode, TargetLibraryField
from app.utils.euler_angles import angles_from_seed_zyz
from tests.simulate_helpers import run_simulate

SEEDS = (42, 0, 1, 99, 12345, 34, 82)
SLIDER_STEP = 0.001
SLIDER_LO = -2 * math.pi

UNITARY_GP_LEVELS = frozenset(
    {
        Gate.Y.value,
        Gate.H.value,
        Gate.SQRT_X_DAG.value,
        Gate.CONTROLLED_H.value,
        Gate.RANDOM_U.value,
    }
)


def _snap(x: float, step: float = SLIDER_STEP) -> float:
    return SLIDER_LO + round((x - SLIDER_LO) / step) * step


def _zyz(delta: float, gamma: float, beta: float) -> UnitaryDTO:
    return UnitaryDTO(
        number_of_qubits=1,
        gates=[
            {"gate": Gate.RZ.value, "theta": delta},
            {"gate": Gate.RY.value, "theta": gamma},
            {"gate": Gate.RZ.value, "theta": beta},
        ],
        qubit_order=[[0], [0], [0]],
    )


def _run(trial: UnitaryDTO, seed: int):
    return run_simulate(trial, Gate.RANDOM_U.value, seed=seed)


def test_random_u_library_sets_unitary_gp_and_atol() -> None:
    level = TARGET_LIBRARY[Gate.RANDOM_U.value]
    assert level.get(TargetLibraryField.GRADING_MODE.value) == (
        GradingMode.UNITARY_GLOBAL_PHASE.value
    )
    assert level.get(TargetLibraryField.GRADING_ATOL.value) == 1e-3
    with_mode = {
        name
        for name, entry in TARGET_LIBRARY.items()
        if entry.get(TargetLibraryField.GRADING_MODE.value)
        == GradingMode.UNITARY_GLOBAL_PHASE.value
    }
    assert with_mode == UNITARY_GP_LEVELS
    # Y / H / √X† / CH must not pick up an explicit grading_atol (Cirq 1e-8).
    for name in (
        Gate.Y.value,
        Gate.H.value,
        Gate.SQRT_X_DAG.value,
        Gate.CONTROLLED_H.value,
    ):
        assert TargetLibraryField.GRADING_ATOL.value not in TARGET_LIBRARY[name]


@pytest.mark.parametrize("seed", SEEDS)
def test_exact_zyz_passes(seed: int) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    response, status = _run(_zyz(delta, gamma, beta), seed)
    assert status == 200
    assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
    assert response["all_match"] is True


@pytest.mark.parametrize("seed", SEEDS)
def test_slider_0_001_snapped_zyz_passes(seed: int) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    trial = _zyz(_snap(delta), _snap(gamma), _snap(beta))
    response, status = _run(trial, seed)
    assert status == 200
    assert response["all_match"] is True


@pytest.mark.parametrize("seed", SEEDS)
def test_typed_round6_zyz_passes(seed: int) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    trial = _zyz(round(delta, 6), round(gamma, 6), round(beta, 6))
    response, status = _run(trial, seed)
    assert status == 200
    assert response["all_match"] is True


@pytest.mark.parametrize("seed", SEEDS)
def test_neg_mid_fails(seed: int) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    response, status = _run(_zyz(delta, -gamma, beta), seed)
    assert status == 200
    assert response["all_match"] is False


@pytest.mark.parametrize("seed", SEEDS)
def test_rx_mid_fails(seed: int) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            {"gate": Gate.RZ.value, "theta": delta},
            {"gate": Gate.RX.value, "theta": gamma},
            {"gate": Gate.RZ.value, "theta": beta},
        ],
        qubit_order=[[0], [0], [0]],
    )
    response, status = _run(trial, seed)
    assert status == 200
    assert response["all_match"] is False


@pytest.mark.parametrize("seed", SEEDS)
@pytest.mark.parametrize(
    "flip",
    ("delta", "beta", "all"),
    ids=("neg_delta", "neg_beta", "neg_all"),
)
def test_negated_outers_fail(seed: int, flip: str) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    if flip == "delta":
        trial = _zyz(-delta, gamma, beta)
    elif flip == "beta":
        trial = _zyz(delta, gamma, -beta)
    else:
        trial = _zyz(-delta, -gamma, -beta)
    response, status = _run(trial, seed)
    assert status == 200
    assert response["all_match"] is False


@pytest.mark.parametrize("seed", SEEDS)
def test_rev_outer_fails(seed: int) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    response, status = _run(_zyz(beta, gamma, delta), seed)
    assert status == 200
    assert response["all_match"] is False


@pytest.mark.parametrize("seed", SEEDS)
def test_ry_only_fails(seed: int) -> None:
    gamma, _beta, _delta = angles_from_seed_zyz(seed)
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[{"gate": Gate.RY.value, "theta": gamma}],
        qubit_order=[[0]],
    )
    response, status = _run(trial, seed)
    assert status == 200
    assert response["all_match"] is False


@pytest.mark.parametrize("seed", SEEDS)
@pytest.mark.parametrize("err", (0.01, 0.05), ids=("err_0.01", "err_0.05"))
def test_small_angle_typo_fails(seed: int, err: float) -> None:
    gamma, beta, delta = angles_from_seed_zyz(seed)
    response, status = _run(_zyz(delta + err, gamma, beta), seed)
    assert status == 200
    assert response["all_match"] is False


# ── Spot-check: other levels unchanged ───────────────────────────────────────


def test_y_still_unitary_gp_default_atol() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.X.value, Gate.Z.value],
        qubit_order=[[0], [0]],
    )
    response, status = run_simulate(trial, Gate.Y.value)
    assert status == 200
    assert response["grading_mode"] == GradingMode.UNITARY_GLOBAL_PHASE.value
    assert response["all_match"] is True


def test_h_still_rejects_s_then_h() -> None:
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[Gate.S.value, Gate.H.value],
        qubit_order=[[0], [0]],
    )
    response, status = run_simulate(trial, Gate.H.value)
    assert status == 200
    assert response["all_match"] is False


def test_bucket_a_still_exact() -> None:
    identity = UnitaryDTO(number_of_qubits=1, gates=[], qubit_order=[])
    for target in (Gate.Z.value, Gate.S.value, Gate.T.value):
        response, status = run_simulate(identity, target)
        assert status == 200, target
        assert response["grading_mode"] is None, target
        assert response["all_match"] is False, target
