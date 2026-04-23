"""
Verification script: print the exact cirq.dirac_notation output for every
level / basis-state combination, using the same code path as production.

Run from the QMCB-be directory:
    python -m testing.verify_dirac
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.services.target_builder import TargetUnitaryBuilder
from app.utils.helpers import initialize_qubit_sequence, generate_basis_states, format_ket
from app.config.target_library import TARGET_LIBRARY
from app.utils.constants import TargetLibraryField


def verify_level(level_name: str) -> None:
    level_def = TARGET_LIBRARY[level_name]
    n_qubits = level_def[TargetLibraryField.NUM_QUBITS.value]
    qubits = initialize_qubit_sequence(n_qubits)
    basis_states = generate_basis_states(n_qubits)

    print(f"\n{'=' * 50}")
    print(f"  LEVEL: {level_name}  ({n_qubits} qubit(s))")
    print(f"{'=' * 50}")
    print(f"  {'INPUT':<12} {'DIRAC OUTPUT'}")
    print(f"  {'-'*12} {'-'*30}")

    target_circuit_base = TargetUnitaryBuilder.build(level_name, qubits)

    for state in basis_states:
        prep = CircuitBuilder.prepare_basis_state(state, qubits)
        full_circuit = prep + target_circuit_base
        output = CircuitSimulator.simulate_wavefunction(full_circuit, qubits, decimals=3)
        ket_in = format_ket(state)
        print(f"  {ket_in:<12} {repr(output)}")


if __name__ == "__main__":
    import logging
    import io

    logging.disable(logging.CRITICAL)

    # Write to file to avoid Windows cp1252 encoding issues with ⟩ character
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dirac_results.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        # Redirect print to both file and stdout-safe buffer
        original_stdout = sys.stdout
        sys.stdout = f

        for level in TARGET_LIBRARY:
            verify_level(level)

        print(f"\n{'=' * 50}")
        print("  Done. Copy the repr() strings into target_library.py expected_outputs.")
        print(f"{'=' * 50}\n")

        sys.stdout = original_stdout

    print(f"Results written to: {out_path}")
