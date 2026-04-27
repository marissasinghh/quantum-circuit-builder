from typing import Optional
import cirq
from app.config.target_library import TARGET_LIBRARY
from app.config.gates import CirqGateMapper
from app.utils.types import Qubit, Circuit
from app.utils.constants import Gate


class TargetUnitaryBuilder:

    @staticmethod
    def build(name: str, qubits: list[Qubit], theta: Optional[float] = None) -> Circuit:
        """Build target unitary circuit from TARGET_LIBRARY definition."""

        if name not in TARGET_LIBRARY:
            raise ValueError(f"Unknown target unitary: {name}")

        level_def = TARGET_LIBRARY[name]
        steps = level_def["steps"]

        # Build circuit from gate steps
        operations = []
        for step in steps:
            gate = step["gate"]
            order = step["order"]
            step_theta = theta if theta is not None else step.get("theta")
            operation = CirqGateMapper.apply(gate, order, *qubits, theta=step_theta)
            operations.append(operation)

        return cirq.Circuit(*operations)

    # Old Method
    @staticmethod
    def get_unitary(name: str, qubits: list[Qubit]) -> Circuit:
        """Builds and returns a cirq.Circuit for a given unitary name."""

        # Level 2.1: CNOT with flipped control/target
        if name == Gate.CNOT_FLIPPED.value:
            return cirq.Circuit(
                CirqGateMapper.apply(Gate.H.value, [0], qubits[0]),
                CirqGateMapper.apply(Gate.H.value, [1], qubits[1]),
                CirqGateMapper.apply(Gate.CNOT.value, [1, 0], qubits[0], qubits[1]),
                CirqGateMapper.apply(Gate.H.value, [0], qubits[0]),
                CirqGateMapper.apply(Gate.H.value, [1], qubits[1]),
            )

        # Level 2.2: Controlled-Z
        elif name == Gate.CONTROLLED_Z.value:
            return cirq.Circuit(
                CirqGateMapper.apply(Gate.H.value, [1], qubits[1]),
                CirqGateMapper.apply(Gate.CNOT.value, [0, 1], qubits[0], qubits[1]),
                CirqGateMapper.apply(Gate.H.value, [1], qubits[1]),
            )

        # Level 2.3: SWAP
        elif name == Gate.SWAP.value:
            return cirq.Circuit(
                CirqGateMapper.apply(Gate.CNOT.value, [0, 1], qubits[0], qubits[1]),
                CirqGateMapper.apply(Gate.CNOT.value, [1, 0], qubits[0], qubits[1]),
                CirqGateMapper.apply(Gate.CNOT.value, [0, 1], qubits[0], qubits[1]),
            )

        # Basic CNOT (for testing/reference)
        elif name == Gate.CNOT.value:
            return cirq.Circuit(
                CirqGateMapper.apply(Gate.CNOT.value, [0, 1], qubits[0], qubits[1])
            )

        raise ValueError(f"Unknown unitary name: {name}")
