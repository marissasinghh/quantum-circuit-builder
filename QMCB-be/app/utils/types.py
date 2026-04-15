import cirq
from typing import TypedDict, List, Union, NotRequired

Qubit = Union[cirq.Qid, cirq.LineQubit, cirq.GridQubit]
Circuit = cirq.Circuit
Operation = cirq.Operation
Result = cirq.Result
WavefunctionResult = cirq.StateVectorTrialResult

# --- Gate JSON shapes (public field is always ``gate``, not ``name``) ---
#
# We use ``gate`` everywhere so payloads match ``TargetLibraryField.GATE`` /
# ``step["gate"]`` and are not confused with a level's or target's human name.
#
# Two shapes on purpose — do **not** merge ``UnitaryDTO`` with ``LevelDefinition``:
#
# 1) ``UnitaryGateDict`` — one element of ``UnitaryDTO.gates``. Wiring is **not**
#    inside the dict; it comes from the parallel row ``UnitaryDTO.qubit_order[i]``.
#    Dict form is only for parameterized gates: ``{"gate": "RX", "theta": 0.5}``.
#
# 2) ``GateStep`` — one element of ``LevelDefinition["steps"]`` / target library.
#    Each step embeds its own ``order`` list because that JSON is self-contained
#    (no parallel ``qubit_order`` array at the level root).


class TargetLibraryEntry(TypedDict):
    num_qubits: int
    gates: list[str]
    qubit_order: list[list[int]]


class UnitaryGateDict(TypedDict):
    """Inline gate in ``UnitaryDTO.gates``; qubit wiring is ``qubit_order[i]``."""

    gate: str
    theta: NotRequired[float]


UnitaryGateEntry = Union[str, UnitaryGateDict]


class GateStep(TypedDict):
    """One row in ``TARGET_LIBRARY`` … ``steps``: gate + wiring + optional angle."""

    gate: str
    order: List[int]
    theta: NotRequired[float]


class LevelDefinition(dict):
    """Level configuration with canonical solution"""

    num_qubits: int
    steps: List[GateStep]
    expected_outputs: List[str]
