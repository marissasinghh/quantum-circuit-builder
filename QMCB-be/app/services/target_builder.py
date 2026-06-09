import cirq
from app.config.target_library import TARGET_LIBRARY
from app.config.gates import CirqGateMapper
from app.services.target_parameter_resolver import ResolvedTargetParams
from app.utils.types import Qubit, Circuit
from app.utils.constants import Gate, TargetLibraryField


def _build_composite(
    name: str,
    qubits: list[Qubit],
    resolved: ResolvedTargetParams,
) -> Circuit:
    """
    Build a target circuit for gates that have no single Cirq primitive
    (composite_gate: True in TARGET_LIBRARY).

    Each entry here receives the full resolved step_thetas list and decides
    how to interpret those angles.  Currently only CONTROLLED_U is supported;
    add a branch here whenever a new composite-gate level is introduced.

    Args:
        name: Gate name key from TARGET_LIBRARY (e.g. Gate.CONTROLLED_U.value).
        qubits: Ordered qubit list for this circuit.
        resolved: Resolved parameters including step_thetas = [alpha, beta, gamma].
    """
    if name == Gate.CONTROLLED_U.value:
        if len(resolved.step_thetas) != 3:
            raise ValueError(
                f"CONTROLLED_U requires exactly 3 resolved thetas (alpha, beta, gamma); "
                f"got {len(resolved.step_thetas)}."
            )
        alpha, beta, gamma = resolved.step_thetas
        operation = CirqGateMapper.apply(
            Gate.CONTROLLED_U.value,
            [0, 1],
            *qubits,
            angles=(alpha, beta, gamma),
        )
        return cirq.Circuit(operation)

    raise NotImplementedError(
        f"No composite builder registered for target {name!r}. "
        "Add a branch to _build_composite() in target_builder.py."
    )


class TargetUnitaryBuilder:

    @staticmethod
    def build(
        name: str,
        qubits: list[Qubit],
        resolved: ResolvedTargetParams,
    ) -> Circuit:
        """Build target unitary circuit from TARGET_LIBRARY steps and resolved thetas.

        For levels with composite_gate: True the generic step iteration is
        bypassed and _build_composite() handles construction directly.
        """

        if name not in TARGET_LIBRARY:
            raise ValueError(f"Unknown target unitary: {name}")

        level_def = TARGET_LIBRARY[name]

        if level_def.get(TargetLibraryField.COMPOSITE_GATE.value):
            return _build_composite(name, qubits, resolved)

        steps = level_def[TargetLibraryField.STEPS.value]

        if len(resolved.step_thetas) != len(steps):
            raise ValueError(
                f"Resolved theta count ({len(resolved.step_thetas)}) does not match "
                f"step count ({len(steps)}) for target {name!r}."
            )

        operations = []
        for i, step in enumerate(steps):
            gate = step[TargetLibraryField.GATE.value]
            order = step[TargetLibraryField.ORDER.value]
            resolved_theta = resolved.step_thetas[i]
            step_theta = resolved_theta if resolved_theta is not None else step.get("theta")
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
