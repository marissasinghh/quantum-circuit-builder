from dataclasses import dataclass
from typing import Optional

from app.utils.types import UnitaryGateEntry


@dataclass
class UnitaryDTO:
    """
    Trial circuit from the client.

    Each ``gates[i]`` is either a legacy string (``"CNOT"``) or a small dict
    ``{"gate": "…", "theta": …}`` for parameterized gates; wiring for index
    ``i`` is always ``qubit_order[i]`` (see ``UnitaryGateDict`` in ``types``).

    ``parameter_gate_index`` — when set, random-theta grading substitutes the
    sampled angle into ``gates[parameter_gate_index]`` instead of using heuristics.
    """

    number_of_qubits: int
    gates: list[UnitaryGateEntry]
    qubit_order: list[list[int]]
    parameter_gate_index: Optional[int] = None
