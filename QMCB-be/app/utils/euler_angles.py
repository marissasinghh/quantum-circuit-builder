"""Deterministic ZXZ Euler angles for seed-driven unitary levels."""

from __future__ import annotations

import numpy as np


def angles_from_seed(seed: int) -> tuple[float, float, float]:
    """
    Deterministically derive ZXZ Euler angles from an integer seed.

    Circuit application order (left to right): Rz(alpha) → Rx(beta) → Rz(gamma)
    Equivalent matrix product (right to left):  Rz(gamma) · Rx(beta) · Rz(alpha)

    Returns:
        (alpha, beta, gamma) where alpha is applied first, gamma last.
        alpha, gamma drawn from [0, 2π); beta drawn from [0, π) (polar angle).
    """
    rng = np.random.default_rng(seed)
    alpha = float(rng.uniform(0, 2 * np.pi))
    beta = float(rng.uniform(0, np.pi))       # polar angle: clamp to [0, π)
    gamma = float(rng.uniform(0, 2 * np.pi))
    return alpha, beta, gamma


def angles_from_seed_zyz(seed: int) -> tuple[float, float, float]:
    """
    Returns (gamma, beta, delta) for Rz(delta) -> Ry(gamma) -> Rz(beta).

    gamma in [0, π], beta and delta in [0, 2π).
    """
    rng = np.random.default_rng(seed)
    gamma = float(rng.uniform(0, np.pi))
    beta = float(rng.uniform(0, 2 * np.pi))
    delta = float(rng.uniform(0, 2 * np.pi))
    return gamma, beta, delta
