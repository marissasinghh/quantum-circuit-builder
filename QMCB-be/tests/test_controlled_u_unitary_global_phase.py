"""
CONTROLLED_U (2.4): grading_mode=unitary_global_phase with grading_atol=1e-3
PLACEHOLDER (not yet calibrated).

Paired with FE slider step 0.001. Calibration of atol vs the 7–8 gate
ABC-decomposition student path is left for Mari — see the stub below.
"""

from __future__ import annotations

import math

from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate
from tests.simulate_helpers import run_simulate

SLIDER_STEP = 0.001
SLIDER_LO = -2 * math.pi


def _snap(x: float, step: float = SLIDER_STEP) -> float:
    return SLIDER_LO + round((x - SLIDER_LO) / step) * step


def _run(trial: UnitaryDTO, seed: int):
    return run_simulate(trial, Gate.CONTROLLED_U.value, seed=seed)


def test_slider_0_001_snapped_controlled_u_passes() -> None:
    # TODO (Mari): mirror test_slider_0_001_snapped_zyz_passes for
    # CONTROLLED_U's 7-8 gate ABC-decomposition student path.
    # Needs: seed selection, angle derivation (alpha/beta/gamma/delta ->
    # A/B/C gate angles), snapping to 0.001 step, building the full
    # circuit (2 CNOTs + 5 rotations + control-phase Rz), asserting
    # all_match=True. Also add a calibration check: does the CURRENT
    # grading_atol placeholder (1e-3) actually pass at this slider step,
    # or does it need to be loosened given the extra gates?
    pass
