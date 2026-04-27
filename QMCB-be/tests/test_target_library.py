"""
Truth-table tests for all TARGET_LIBRARY entries (app/config/target_library.py).

Strategy: for each level, build the reference circuit from `steps` via
TargetUnitaryBuilder (the same path used when VALIDATE_TARGET_CIRCUITS=True),
simulate every 2^n basis-state input with CircuitSimulator.simulate_wavefunction,
and assert the Cirq Dirac-notation output matches the string stored in
expected_outputs exactly.

This is the bridge test between the two halves of the level system:
- If expected_outputs drifts from what the circuit actually produces, this catches it.
- If a gate is mis-wired in CirqGateMapper (wrong gate, swapped qubits), this catches it
  here at the level granularity, not just in the lower-level unitarity tests.
- New levels added to TARGET_LIBRARY are automatically picked up — no edits needed here.

Cross-reference (Nielsen & Chuang):
  Single-qubit gates tested: X, H, S, T (§1.3.1 p.17–18)
  Two-qubit gates tested:    CNOT (§1.3.6 p.21), CZ (§1.3.6), SWAP (§1.3.6)

Run from the QMCB-be folder:
    python -m pytest tests/test_target_library.py -v
"""

from __future__ import annotations

import pytest

from app.config.target_library import TARGET_LIBRARY
from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.utils.constants import TargetLibraryField
from app.utils.helpers import generate_basis_states, initialize_qubit_sequence


@pytest.mark.parametrize("level_name", list(TARGET_LIBRARY.keys()))
class TestTargetLibraryOutputs:
    """
    For every level in TARGET_LIBRARY, simulate the reference circuit against
    each basis-state input and assert the Dirac-notation wavefunction output
    matches the stored expected_outputs string exactly.

    Parametrized over level names so each level gets its own named test case,
    e.g. test_expected_outputs_match_live_simulation[X],
         test_expected_outputs_match_live_simulation[CNOT_FLIPPED], etc.
    """

    def test_expected_outputs_match_live_simulation(self, level_name: str) -> None:
        """
        **What it does:** For each basis-state input |i⟩ in order (|0⟩, |1⟩ for
        single-qubit; |00⟩…|11⟩ for two-qubit), builds the full circuit:

            [basis-state prep] + [reference circuit from steps]

        Simulates the wavefunction with decimals=3 (matching the stored format),
        and asserts the Cirq Dirac-notation string equals expected_outputs[i].

        **What it catches:**
        - Stale expected_outputs that no longer match what the circuit produces.
        - Gate mis-wiring in CirqGateMapper (e.g. S applied where T was intended).
        - Qubit-ordering bugs that produce the right gate on the wrong wire.
        - Phase errors: S|1⟩ must produce '1j|1⟩', not '|1⟩'.

        **Extending:** just add an entry to TARGET_LIBRARY — this test picks it up
        automatically on the next run.
        """

        level_def = TARGET_LIBRARY[level_name]
        n_qubits = level_def[TargetLibraryField.NUM_QUBITS.value]
        expected_outputs = level_def[TargetLibraryField.EXPECTED_OUTPUTS.value]
        qubits = initialize_qubit_sequence(n_qubits)
        basis_states = generate_basis_states(n_qubits)

        # Build the reference circuit once; basis-state prep is prepended per row.
        target_circuit_base = TargetUnitaryBuilder.build(level_name, qubits)

        for state, expected in zip(basis_states, expected_outputs):
            prep = CircuitBuilder.prepare_basis_state(state, qubits)
            full_circuit = prep + target_circuit_base
            actual = CircuitSimulator.simulate_wavefunction(
                full_circuit, qubits, decimals=3
            )

            assert actual == expected, (
                f"\nLevel '{level_name}' | input {state}:\n"
                f"  expected : {expected!r}\n"
                f"  actual   : {actual!r}"
            )
