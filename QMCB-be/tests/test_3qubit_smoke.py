"""
3-qubit pipeline smoke test.

Verifies that the end-to-end simulation pipeline works correctly for n=3
qubits before Toffoli/Fredkin levels are wired into the UI.

Three independent exercises:

1. X-all circuit  — applies X to each of the three qubits.
   For every basis state |abc⟩ the expected output is |a'b'c'⟩ where each
   bit is flipped.  This uses only existing gate support (Gate.X) and the
   new Q2 wiring constant, exercising the full CircuitBuilder →
   CircuitSimulator path for 3 qubits.

2. Toffoli truth table — simulates the single-Toffoli reference circuit
   from TARGET_LIBRARY against all 8 basis states and asserts the Dirac
   output strings match the stored expected_outputs.  This is the same
   pattern used by test_target_library.py and confirms that the gate mapper,
   qubit-order constants, and library entries are wired correctly together.

3. Fredkin truth table — same pattern as (2), for the CSWAP reference circuit.
   Confirms cirq.CSWAP wiring, C0_T1_T2 qubit-order constant, and FREDKIN
   library entries are consistent.

Run from QMCB-be/:
    python -m pytest tests/test_3qubit_smoke.py -v
"""

from __future__ import annotations

import pytest

from app.config.target_library import TARGET_LIBRARY
from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.services.target_parameter_resolver import resolved_for_library_simulation
from app.utils.constants import Gate, TargetLibraryField
from app.utils.helpers import generate_basis_states, initialize_qubit_sequence
from app.utils.qubit_orders import Q0, Q1, Q2


def _dirac_ket(bits: list[int]) -> str:
    """Return the Cirq-style Dirac ket for a list of bits, e.g. [1,1,1] → '|111⟩'."""
    return "|" + "".join(str(b) for b in bits) + "\u27e9"


# ---------------------------------------------------------------------------
# Smoke test 1: 3-qubit X-all (bit-flip every qubit)
# ---------------------------------------------------------------------------

class TestThreeQubitXAll:
    """
    Bit-flip all three qubits and verify 8 deterministic output rows.

    For input |abc⟩, the expected output is |a'b'c'⟩ (each bit inverted).
    No new gate infrastructure is required — Gate.X and Q0/Q1 already exist;
    only Q2 is new.
    """

    def test_produces_8_rows(self) -> None:
        basis_states = generate_basis_states(3)
        assert len(basis_states) == 8, "3 qubits must yield exactly 8 basis states"

    def test_each_row_bit_flipped(self) -> None:
        qubits = initialize_qubit_sequence(3)
        basis_states = generate_basis_states(3)

        for state in basis_states:
            circuit = CircuitBuilder.construct_unitary_circuit(
                state,
                gates=[Gate.X.value, Gate.X.value, Gate.X.value],
                qubit_order=[Q0, Q1, Q2],
                qubits=qubits,
            )
            actual = CircuitSimulator.simulate_wavefunction(circuit, qubits, decimals=3)
            expected = _dirac_ket([1 - b for b in state])
            assert actual == expected, (
                f"input {state}: expected {expected!r}, got {actual!r}"
            )


# ---------------------------------------------------------------------------
# Smoke test 2: Toffoli truth table matches TARGET_LIBRARY expected_outputs
# ---------------------------------------------------------------------------

class TestToffoliTruthTable:
    """
    Simulate the single-Toffoli reference circuit for all 8 basis-state
    inputs and assert exact Dirac-notation matches against the stored
    expected_outputs in TARGET_LIBRARY.

    Passes when: gate mapper branches (cirq.CCX), qubit-order constants
    (C0_C1_T2), and target library entries are all consistent.
    """

    LEVEL_NAME = Gate.TOFFOLI.value

    def test_expected_outputs_are_present(self) -> None:
        assert self.LEVEL_NAME in TARGET_LIBRARY, (
            f"{self.LEVEL_NAME!r} not found in TARGET_LIBRARY"
        )
        level_def = TARGET_LIBRARY[self.LEVEL_NAME]
        assert TargetLibraryField.EXPECTED_OUTPUTS.value in level_def, (
            f"{self.LEVEL_NAME!r} is missing expected_outputs"
        )
        assert len(level_def[TargetLibraryField.EXPECTED_OUTPUTS.value]) == 8

    @pytest.mark.parametrize("state_idx", range(8))
    def test_row(self, state_idx: int) -> None:
        level_def = TARGET_LIBRARY[self.LEVEL_NAME]
        n_qubits = level_def[TargetLibraryField.NUM_QUBITS.value]
        expected_outputs = level_def[TargetLibraryField.EXPECTED_OUTPUTS.value]

        qubits = initialize_qubit_sequence(n_qubits)
        basis_states = generate_basis_states(n_qubits)
        state = basis_states[state_idx]

        resolved = resolved_for_library_simulation(self.LEVEL_NAME)
        target_circuit_base = TargetUnitaryBuilder.build(self.LEVEL_NAME, qubits, resolved)

        prep = CircuitBuilder.prepare_basis_state(state, qubits)
        full_circuit = prep + target_circuit_base
        actual = CircuitSimulator.simulate_wavefunction(full_circuit, qubits, decimals=3)

        assert actual == expected_outputs[state_idx], (
            f"Toffoli | input {state}:\n"
            f"  expected : {expected_outputs[state_idx]!r}\n"
            f"  actual   : {actual!r}"
        )


# ---------------------------------------------------------------------------
# Smoke test 3: Fredkin truth table matches TARGET_LIBRARY expected_outputs
# ---------------------------------------------------------------------------

class TestFredkinTruthTable:
    """
    Simulate the single-Fredkin reference circuit for all 8 basis-state
    inputs and assert exact Dirac-notation matches against the stored
    expected_outputs in TARGET_LIBRARY.

    Truth table (control=q0, swap-targets=q1/q2):
      |000⟩ → |000⟩  (control=0, pass-through)
      |001⟩ → |001⟩  (control=0, pass-through)
      |010⟩ → |010⟩  (control=0, pass-through)
      |011⟩ → |011⟩  (control=0, pass-through)
      |100⟩ → |100⟩  (control=1, swap 0,0 → unchanged)
      |101⟩ → |110⟩  (control=1, swap q1=0,q2=1 → q1=1,q2=0)
      |110⟩ → |101⟩  (control=1, swap q1=1,q2=0 → q1=0,q2=1)
      |111⟩ → |111⟩  (control=1, swap 1,1 → unchanged)

    Passes when: gate mapper branch (cirq.CSWAP), qubit-order constant
    (C0_T1_T2), and target library entries are all consistent.
    """

    LEVEL_NAME = Gate.FREDKIN.value

    def test_expected_outputs_are_present(self) -> None:
        assert self.LEVEL_NAME in TARGET_LIBRARY, (
            f"{self.LEVEL_NAME!r} not found in TARGET_LIBRARY"
        )
        level_def = TARGET_LIBRARY[self.LEVEL_NAME]
        assert TargetLibraryField.EXPECTED_OUTPUTS.value in level_def, (
            f"{self.LEVEL_NAME!r} is missing expected_outputs"
        )
        assert len(level_def[TargetLibraryField.EXPECTED_OUTPUTS.value]) == 8

    @pytest.mark.parametrize("state_idx", range(8))
    def test_row(self, state_idx: int) -> None:
        level_def = TARGET_LIBRARY[self.LEVEL_NAME]
        n_qubits = level_def[TargetLibraryField.NUM_QUBITS.value]
        expected_outputs = level_def[TargetLibraryField.EXPECTED_OUTPUTS.value]

        qubits = initialize_qubit_sequence(n_qubits)
        basis_states = generate_basis_states(n_qubits)
        state = basis_states[state_idx]

        resolved = resolved_for_library_simulation(self.LEVEL_NAME)
        target_circuit_base = TargetUnitaryBuilder.build(self.LEVEL_NAME, qubits, resolved)

        prep = CircuitBuilder.prepare_basis_state(state, qubits)
        full_circuit = prep + target_circuit_base
        actual = CircuitSimulator.simulate_wavefunction(full_circuit, qubits, decimals=3)

        assert actual == expected_outputs[state_idx], (
            f"Fredkin | input {state}:\n"
            f"  expected : {expected_outputs[state_idx]!r}\n"
            f"  actual   : {actual!r}"
        )
