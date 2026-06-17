from dataclasses import dataclass, field
from typing import Optional

from app.dto.unitary import UnitaryDTO


@dataclass
class TargetParamsDTO:
    """Runtime parameters for building a target circuit (not part of the trial)."""

    seed: Optional[int] = None
    alpha: Optional[float] = None
    beta: Optional[float] = None
    gamma: Optional[float] = None
    delta: Optional[float] = None
    theta: Optional[float] = None


@dataclass
class SimulateRequestDTO:
    """Full POST /api/simulate request after parsing flat JSON."""

    target_unitary: str
    trial: UnitaryDTO
    target_params: TargetParamsDTO = field(default_factory=TargetParamsDTO)
