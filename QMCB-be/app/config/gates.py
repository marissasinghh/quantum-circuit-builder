import cirq
import math
from app.utils.types import Operation, Qubit
from app.utils.constants import Gate
from typing import Optional


class CirqGateMapper:

    @staticmethod
    def apply(
        gate: str,
        qubit_order: Optional[list[int]] = None,
        *qubits: Qubit,
        theta: Optional[float] = None,
    ) -> Operation:
        """
        Apply the desired quantum gate to the provided qubit(s).
        """

        # To handle cases where qubit order is not necessary
        if qubit_order is None:
            qubit_order = list(range(len(qubits)))

        selected_qubits = [qubits[i] for i in qubit_order]

        print(
            f"[DEBUG] Gate: {gate}, theta: {theta!r}, Qubit Order: {qubit_order}, "
            f"Selected Qubits: {[str(q) for q in selected_qubits]}"
        )

        if gate == Gate.X.value:
            return cirq.X(selected_qubits[0])

        elif gate == Gate.H.value:
            return cirq.H(selected_qubits[0])

        elif gate == Gate.S.value:
            return cirq.S(selected_qubits[0])

        elif gate == Gate.T.value:
            return cirq.T(selected_qubits[0])

        elif gate == Gate.RX.value:
            if theta is None:
                raise ValueError("theta is required for RX gate")
            return cirq.rx(theta)(selected_qubits[0]) 

        elif gate == Gate.RY.value:
            if theta is None:
                raise ValueError("theta is required for RY gate")
            return cirq.ry(theta)(selected_qubits[0])

        elif gate == Gate.RZ.value:
            if theta is None:
                raise ValueError("theta is required for RZ gate")
            return cirq.rz(theta)(selected_qubits[0])

        elif gate == Gate.U.value:
            # Generic single-qubit gate (placeholder - needs parameters)
            return cirq.H(selected_qubits[0])  # Temporary: just use H

        elif gate == Gate.CNOT.value:
            return cirq.CNOT(selected_qubits[0], selected_qubits[1])

        elif gate == Gate.CONTROLLED_Z.value:
            return cirq.CZ(selected_qubits[0], selected_qubits[1])

        elif gate == Gate.SWAP.value:
            return cirq.SWAP(selected_qubits[0], selected_qubits[1])

        else:
            raise ValueError(f"Unsupported gate: {gate}")
