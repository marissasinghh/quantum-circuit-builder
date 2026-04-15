import cirq
from app.config.gates import CirqGateMapper
from app.utils.helpers import index_to_letter
from app.utils.types import Qubit, Circuit, UnitaryGateEntry
from app.utils.constants import Gate


class CircuitBuilder:

    @staticmethod
    def prepare_basis_state(basis_state: list[int], qubits: list[Qubit]) -> Circuit:
        """
        Creates a circuit that prepares the qubits in a specified basis state.

        Args:
            basis_state: List of desired basis state (i.e.[0, 1], [1, 0], etc.)
            qubits: List of Cirq qubits.

        Returns:
            A Cirq Circuit that sets the qubits to the given state.
        """
        operations = []

        if len(basis_state) != len(qubits):
            raise ValueError(
                "Length of desired basis state must match number of qubits."
            )

        for state, qubit in zip(basis_state, qubits):
            if state == 1:
                operations.append(CirqGateMapper.apply(Gate.X.value, None, qubit))

        return cirq.Circuit(operations)

    @staticmethod
    def build_circuit_base(
        gates: list[UnitaryGateEntry],
        qubit_order: list[list[int]],
        qubits: list[Qubit],
    ) -> Circuit:
        """
        Creates a circuit based on the order of gate operations for a specified
        number of qubits.

        Each `gates[i]` is either a gate name string or `{"gate": "…", "theta": …}`.
        Wiring for step `i` is always `qubit_order[i]`. For plain strings,
        `theta` is omitted so `CirqGateMapper` uses `None` (non-rotation gates).
        """
        if len(gates) != len(qubit_order):
            raise ValueError(
                "Gates and qubit_order must have the same length."
                f"({len(gates)} vs {len(qubit_order)})."
            )

        operations = []

        for i, entry in enumerate(gates):
            if isinstance(entry, str):
                gate_name = entry
                theta = None
            else:
                gate_name = entry["gate"]
                theta = entry.get("theta")

            print(f"Applying {gate_name} (theta={theta!r}) for order {qubit_order[i]}")
            operations.append(
                CirqGateMapper.apply(
                    gate_name, qubit_order[i], *qubits, theta=theta
                )
            )

        return cirq.Circuit(operations)

    @staticmethod
    def construct_unitary_circuit(
        basis_state: list[int],
        gates: list[UnitaryGateEntry],
        qubit_order: list[list[int]],
        qubits: list[Qubit],
    ) -> Circuit:
        """
        Prepares the basis state, applies the gate sequence, and returns a circuit.
        """
        circuit = CircuitBuilder.prepare_basis_state(basis_state, qubits)
        print("Prepared basis state...")
        circuit.append(CircuitBuilder.build_circuit_base(gates, qubit_order, qubits))
        print("Built circuit base...")

        return circuit

    # Keeping measurement for future in case we want to implement a measurement feature
    @staticmethod
    def measure_qubits(qubits: list[Qubit]) -> Circuit:
        """
        Creates a circuit to measures each qubit at the end
        of a circuit sequence.
        """
        operations = []

        # Measurement Note:
        #   qubit0  is being assigned key 'a'
        #   qubit1 is being assigned key 'b'

        for i in range(0, len(qubits)):
            key_letter = index_to_letter(i)
            operations.append(cirq.measure(qubits[i], key=key_letter))

        return cirq.Circuit(operations)
