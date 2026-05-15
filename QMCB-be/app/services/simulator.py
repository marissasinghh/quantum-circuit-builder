import cirq
import numpy as np
from app.dto.truth_table import TruthTableDTO
from app.utils.helpers import extract_results, format_ket, list_to_joint_string
from app.utils.types import Circuit, Qubit


class CircuitSimulator:

    # ---------- wavefunction path (no measurement) ----------

    @staticmethod
    def _simulate(
        circuit: Circuit, qubits: list[Qubit], decimals: int = 3
    ) -> tuple[str, np.ndarray]:
        """
        Single simulation call. Returns (dirac_string, state_vector).
        Internal helper so the public methods don't duplicate simulator overhead.
        """
        sim = cirq.Simulator()
        result = sim.simulate(circuit, qubit_order=qubits)
        sv = result.final_state_vector.copy()
        return cirq.dirac_notation(sv, decimals=decimals), sv

    @staticmethod
    def simulate_wavefunction(
        circuit: Circuit, qubits: list[Qubit], *, decimals: int = 3
    ) -> str:
        """
        Deterministically simulate and return the final state as a Dirac-notation string.
        Public interface — returns string only for backward compatibility with tests.
        """
        return CircuitSimulator._simulate(circuit, qubits, decimals)[0]

    @staticmethod
    def wavefunction_truth_table(
        state: list[int],
        truth_table: TruthTableDTO,
        output: str,
        *,
        input_as_ket: bool = True,
    ) -> None:
        """
        Append a single row to the truth table.
        - Input column stored as '|01>' when input_as_ket=True (default), else '01'.
        - Output column stored as the Dirac-notation string produced by Cirq.
        """
        inp = format_ket(state) if input_as_ket else list_to_joint_string(state)
        truth_table.input.append(inp)
        truth_table.output.append(output)

        return None

    # ---------- sampling path (with measurement) ----------
    @staticmethod
    def run_and_measure(number_of_qubits: int, circuit: Circuit):
        """
        Runs a circuit through the cirq simulator, executes a measurement
        at the end of the circuit, and returns the extracted results.
        """
        simulator = cirq.Simulator()
        result = simulator.run(circuit, repetitions=1)  
        print(f"Result test: {result}")
        output = extract_results(number_of_qubits, result)

        return output

    @staticmethod
    def measurement_truth_table(
        state: list[int], truth_table: TruthTableDTO, output: list[int]
    ) -> None:
        """
        Updates a circuit's truth table with correct input and output results.
        """
        state_str = list_to_joint_string(state)
        truth_table.input.append(state_str)
        truth_table.output.append(str(output))

        return

    #  ---------- full wrapper ----------
    @staticmethod
    def simulate_and_update(
        circuit: Circuit,
        qubits: list[Qubit],
        state: list[int],
        truth_table: TruthTableDTO,
        *,
        decimals: int = 3,
        input_as_ket: bool = True,
    ) -> np.ndarray:
        """
        Single-call wrapper: simulate the wavefunction, record a truth-table row,
        and return the raw state vector for global-phase comparison in the controller.
        """
        output, sv = CircuitSimulator._simulate(circuit, qubits, decimals)
        print("Circuit successully ran...")
        CircuitSimulator.wavefunction_truth_table(
            state, truth_table, output, input_as_ket=input_as_ket
        )
        print("Truth table updated...")

        return sv
