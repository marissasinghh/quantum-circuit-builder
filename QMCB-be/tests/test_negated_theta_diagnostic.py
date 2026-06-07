"""
Diagnostic test — negated-angle grading.

Run with:  python -m pytest tests/test_negated_theta_diagnostic.py -s -v

No assertions are made.  Each test prints:
  - all_match
  - per-row match booleans (string equality + probability fallback)
  - per-row trial vs target amplitude strings
"""

from __future__ import annotations

import math
from unittest.mock import patch

from app.controllers.simulate import simulate_unitaries
from app.dto.simulate_request import SimulateRequestDTO, TargetParamsDTO
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate


def _run(trial: UnitaryDTO, target_name: str, *, validate_target: bool = False):
    request = SimulateRequestDTO(
        target_unitary=target_name,
        trial=trial,
        target_params=TargetParamsDTO(),
    )
    with patch("builtins.print"):
        response, status = simulate_unitaries(request, validate_target=validate_target)
    return response


def _report(label: str, response: dict) -> None:
    trial_tt = response["trial_truth_table"]
    target_tt = response["target_truth_table"]

    trial_outputs = trial_tt["output"]
    target_outputs = target_tt["output"]
    trial_probs = trial_tt.get("probabilities") or []
    target_probs = target_tt.get("probabilities") or []
    trial_amps = trial_tt.get("amplitudes") or []
    target_amps = target_tt.get("amplitudes") or []

    print(f"\n{'='*60}")
    print(f"TEST: {label}")
    print(f"  all_match = {response['all_match']}")

    for i, (t_out, g_out) in enumerate(zip(trial_outputs, target_outputs)):
        string_match = t_out == g_out
        prob_match = None
        if trial_probs and target_probs and i < len(trial_probs) and i < len(target_probs):
            prob_match = all(
                abs(a - b) < 1e-6
                for a, b in zip(trial_probs[i], target_probs[i])
            )
        t_amp = trial_amps[i] if trial_amps and i < len(trial_amps) else "N/A"
        g_amp = target_amps[i] if target_amps and i < len(target_amps) else "N/A"

        print(f"\n  Row {i}:")
        print(f"    string_match  = {string_match}")
        print(f"    prob_match    = {prob_match}")
        print(f"    trial  output = {t_out!r}")
        print(f"    target output = {g_out!r}")
        print(f"    trial  amps   = {t_amp}")
        print(f"    target amps   = {g_amp}")

    print(f"{'='*60}")


# ── Test 1: H level, ZXZ canonical decomposition ─────────────────────────────

def test_1_h_zxz_canonical():
    """Rz(π/2) → √X → Rz(π/2) vs H target.  Expect all_match=True (global-phase fallback)."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
            Gate.SQRT_X.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
        ],
        qubit_order=[[0], [0], [0]],
    )
    response = _run(trial, Gate.H.value, validate_target=False)
    _report("Test 1 — H ZXZ canonical (expect True)", response)


# ── Test 2: Rx level, correct canonical decomposition ────────────────────────

def test_2_rx_canonical_correct():
    """H → Rz(π/2) → H vs Rx(+π/2) target.  Expect all_match=True."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[
            Gate.H.value,
            {"gate": Gate.RZ.value, "theta": math.pi / 2},
            Gate.H.value,
        ],
        qubit_order=[[0], [0], [0]],
    )
    response = _run(trial, Gate.RX.value, validate_target=False)
    _report("Test 2 — Rx canonical H·Rz(π/2)·H (expect True)", response)


# ── Test 3: Rx level, negated angle ──────────────────────────────────────────

def test_3_rx_negated_angle():
    """Single Rx(−π/2) vs Rx(+π/2) target.  Expect all_match=False (BUG: may be True)."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[{"gate": Gate.RX.value, "theta": -math.pi / 2}],
        qubit_order=[[0]],
    )
    response = _run(trial, Gate.RX.value, validate_target=False)
    _report("Test 3 — Rx(−π/2) vs Rx(+π/2) (expect False)", response)


# ── Test 4: Ry level, negated angle ──────────────────────────────────────────

def test_4_ry_negated_angle():
    """Single Ry(−π/2) vs Ry(+π/2) target.  Expect all_match=False (BUG: may be True)."""
    trial = UnitaryDTO(
        number_of_qubits=1,
        gates=[{"gate": Gate.RY.value, "theta": -math.pi / 2}],
        qubit_order=[[0]],
    )
    response = _run(trial, Gate.RY.value, validate_target=False)
    _report("Test 4 — Ry(−π/2) vs Ry(+π/2) (expect False)", response)
