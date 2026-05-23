from dataclasses import dataclass, asdict, field


@dataclass
class TruthTableDTO:
    input: list[str]
    output: list[str]
    probabilities: list[list[float]] = field(default_factory=list)
    amplitudes: list[list[list[float]]] = field(default_factory=list)

    def to_dict(self):
        return asdict(self)
