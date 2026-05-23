"""Deterministic ZXZ Euler angles for seed-driven unitary levels."""

from __future__ import annotations

import numpy as np


def angles_from_seed(seed: int) -> tuple[float, float, float]:
    """
    Deterministically derive ZXZ Euler angles from an integer seed.

    Returns:
        (alpha, beta, gamma) in [0, 2π) for Rz(alpha)·Rx(beta)·Rz(gamma).
    """
    rng = np.random.default_rng(seed)
    alpha = float(rng.uniform(0, 2 * np.pi))
    beta = float(rng.uniform(0, 2 * np.pi))
    gamma = float(rng.uniform(0, 2 * np.pi))
    return alpha, beta, gamma
