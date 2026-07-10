import cirq
import math
import numpy as np
from app.utils.types import Operation, Qubit
from app.utils.constants import Gate
from typing import Optional


def _zxz_matrix(alpha: float, beta: float, gamma: float) -> np.ndarray:
    """
    Compute the 2x2 unitary for U = Rz(gamma) · Rx(beta) · Rz(alpha).

    Uses the same phase-consistent Rz convention as the rest of the mapper:
    Rz(θ) = [[1, 0], [0, e^(iθ)]]  (no global-phase offset).
    Rx(θ) uses cirq.rx which applies e^(-iθX/2), consistent with circuit steps.
    """
    def rz(t: float) -> np.ndarray:
        return np.array([[1, 0], [0, np.exp(1j * t)]], dtype=complex)

    rx_mat = cirq.unitary(cirq.rx(beta))
    return rz(gamma) @ rx_mat @ rz(alpha)


class CirqGateMapper:

    @staticmethod
    def apply(
        gate: str,
        qubit_order: Optional[list[int]] = None,
        *qubits: Qubit,
        theta: Optional[float] = None,
        angles: Optional[tuple[float, float, float]] = None,
    ) -> Operation:
        """
        Apply the desired quantum gate to the provided qubit(s).

        Args:
            gate: Gate name string (matches Gate enum values).
            qubit_order: Index list selecting and ordering from *qubits.
            *qubits: All available qubits for this circuit.
            theta: Single rotation angle for parameterised single-qubit gates
                   (RX, RY, RZ).
            angles: Three ZXZ Euler angles (alpha, beta, gamma) for gates that
                    require a full single-qubit unitary (U, CONTROLLED_U).
        """

        if qubit_order is None:
            qubit_order = list(range(len(qubits)))

        selected_qubits = [qubits[i] for i in qubit_order]

        print(
            f"[DEBUG] Gate: {gate}, theta: {theta!r}, angles: {angles!r}, "
            f"Qubit Order: {qubit_order}, "
            f"Selected Qubits: {[str(q) for q in selected_qubits]}"
        )

        if gate == Gate.X.value:
            return cirq.X(selected_qubits[0])

        elif gate == Gate.SQRT_X.value:
            return cirq.X(selected_qubits[0])**0.5

        elif gate == Gate.SQRT_X_DAG.value:
            return cirq.XPowGate(exponent=-0.5)(selected_qubits[0])

        elif gate == Gate.Y.value:
            return cirq.Y(selected_qubits[0])

        elif gate == Gate.Z.value:
            return cirq.Z(selected_qubits[0])

        elif gate == Gate.S_DAG.value:
            return cirq.ZPowGate(exponent=-0.5)(selected_qubits[0])

        elif gate == Gate.T_DAG.value:
            return cirq.ZPowGate(exponent=-0.25)(selected_qubits[0])

        elif gate == Gate.H.value:
            return cirq.H(selected_qubits[0])

        elif gate == Gate.S.value:
            return cirq.S(selected_qubits[0])

        elif gate == Gate.T.value:
            return cirq.T(selected_qubits[0])

        elif gate == Gate.RX.value:
            if theta is None:
                raise ValueError("Theta is required for RX gate")
            return cirq.rx(theta)(selected_qubits[0])

        elif gate == Gate.RY.value:
            if theta is None:
                raise ValueError("Theta is required for RY gate")
            return cirq.ry(theta)(selected_qubits[0])

        elif gate == Gate.RZ.value:
            if theta is None:
                raise ValueError("Theta is required for RZ gate")
            # Use the phase gate convention [[1,0],[0,e^(iθ)]] so that
            # Rz(π/2) = S exactly, Rz(π/4) = T exactly, with no global phase offset.
            # cirq.rz() uses the symmetric convention (global phase e^(-iθ/2)) which
            # causes truth-table string mismatches against cirq.S and cirq.T.
            return (cirq.Z ** (theta / math.pi))(selected_qubits[0])

        elif gate == Gate.U.value:
            if angles is None:
                raise ValueError("angles=(alpha, beta, gamma) is required for U gate")
            alpha, beta, gamma = angles
            matrix = _zxz_matrix(alpha, beta, gamma)
            return cirq.MatrixGate(matrix)(selected_qubits[0])

        elif gate == Gate.CONTROLLED_U.value:
            if angles is None:
                raise ValueError("angles=(alpha, beta, gamma) is required for CONTROLLED_U gate")
            alpha, beta, gamma = angles
            u_matrix = _zxz_matrix(alpha, beta, gamma)
            u_gate = cirq.MatrixGate(u_matrix)
            ctrl, tgt = selected_qubits[0], selected_qubits[1]
            return cirq.ControlledGate(u_gate)(ctrl, tgt)

        elif gate == Gate.CNOT.value:
            return cirq.CNOT(selected_qubits[0], selected_qubits[1])

        elif gate == Gate.CONTROLLED_Z.value:
            return cirq.CZ(selected_qubits[0], selected_qubits[1])

        elif gate == Gate.SWAP.value:
            return cirq.SWAP(selected_qubits[0], selected_qubits[1])

        elif gate == Gate.TOFFOLI.value:
            return cirq.CCX(selected_qubits[0], selected_qubits[1], selected_qubits[2])

        elif gate == Gate.FREDKIN.value:
            return cirq.CSWAP(selected_qubits[0], selected_qubits[1], selected_qubits[2])

        else:
            raise ValueError(f"Unsupported gate: {gate}")
