"""Validate and parse JSON bodies for trial unitary simulation (POST /api/simulate)."""

from __future__ import annotations

from typing import Any

from app.dto.simulate_request import SimulateRequestDTO, TargetParamsDTO
from app.dto.unitary import UnitaryDTO
from app.utils.constants import Gate

_ROTATION_GATE_NAMES = frozenset({Gate.RX.value, Gate.RY.value, Gate.RZ.value})

_OPTIONAL_GATE_ANGLE_KEYS = ("theta", "alpha", "beta", "gamma")
_OPTIONAL_TARGET_PARAM_KEYS = ("seed", "alpha", "beta", "gamma", "delta")


def _is_real_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _validate_optional_numbers(data: dict, prefix: str, keys: tuple[str, ...]) -> None:
    for key in keys:
        if key in data and not _is_real_number(data[key]):
            raise ValueError(f'{prefix}."{key}" must be a number when present.')


def validate_simulate_unitary_json(data: Any) -> None:
    """
    Ensure Flask/restx JSON matches what ``SimulateRequestDTO`` expects.

    - ``gates`` and ``qubit_order`` are lists of the same length.
    - Each ``gates[i]`` is either a non-empty string or a dict with at least ``"gate"``.
    - Optional numeric fields on dict entries must be JSON numbers (int/float, not bool).
    - Optional ``seed`` on the request root must be a non-negative integer when present.

    Raises:
        ValueError: with a short, client-safe message.
    """
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")

    required = ("number_of_qubits", "gates", "qubit_order", "target_unitary")
    for key in required:
        if key not in data:
            raise ValueError(f"Missing required field: {key!r}.")

    n = data["number_of_qubits"]
    if not isinstance(n, int) or isinstance(n, bool) or n < 1:
        raise ValueError("number_of_qubits must be a positive integer.")

    target_unitary = data["target_unitary"]
    if not isinstance(target_unitary, str) or not target_unitary:
        raise ValueError("target_unitary must be a non-empty string.")

    gates = data["gates"]
    qubit_order = data["qubit_order"]
    if not isinstance(gates, list):
        raise ValueError("gates must be a JSON array.")
    if not isinstance(qubit_order, list):
        raise ValueError("qubit_order must be a JSON array.")
    if len(gates) != len(qubit_order):
        raise ValueError(
            "gates and qubit_order must have the same length "
            f"({len(gates)} vs {len(qubit_order)})."
        )

    if "seed" in data:
        seed = data["seed"]
        if not isinstance(seed, int) or isinstance(seed, bool) or seed < 0:
            raise ValueError("seed must be a non-negative integer when present.")

    _validate_optional_numbers(data, "request", _OPTIONAL_TARGET_PARAM_KEYS)

    if "parameter_gate_index" in data:
        idx = data["parameter_gate_index"]
        if not isinstance(idx, int) or isinstance(idx, bool):
            raise ValueError("parameter_gate_index must be an integer when present.")
        if idx < 0 or idx >= len(gates):
            raise ValueError(
                f"parameter_gate_index {idx} is out of range for gates (length {len(gates)})."
            )
        entry = gates[idx]
        if not isinstance(entry, dict):
            raise ValueError(
                f"gates[{idx}] must be a parameterized gate object when parameter_gate_index is set."
            )
        gname = entry.get("gate")
        if gname not in _ROTATION_GATE_NAMES:
            raise ValueError(
                f"gates[{idx}].gate must be RX, RY, or RZ when parameter_gate_index is set."
            )

    for i, entry in enumerate(gates):
        if isinstance(entry, str):
            if not entry:
                raise ValueError(f"gates[{i}] must be a non-empty string if a string.")
            continue
        if isinstance(entry, dict):
            if "gate" not in entry:
                raise ValueError(
                    f'gates[{i}] object must include a string field "gate" '
                    '(use "gate", not "name", to match the backend).'
                )
            gname = entry["gate"]
            if not isinstance(gname, str) or not gname:
                raise ValueError(f'gates[{i}]."gate" must be a non-empty string.')
            _validate_optional_numbers(entry, f"gates[{i}]", _OPTIONAL_GATE_ANGLE_KEYS)
            continue
        raise ValueError(
            f"gates[{i}] must be a string or an object, got {type(entry).__name__}."
        )


def parse_simulate_request_json(data: dict) -> SimulateRequestDTO:
    """Validate flat POST JSON and return a typed ``SimulateRequestDTO``."""
    validate_simulate_unitary_json(data)

    target_params = TargetParamsDTO(
        seed=data.get("seed"),
        alpha=data.get("alpha"),
        beta=data.get("beta"),
        gamma=data.get("gamma"),
        delta=data.get("delta"),
    )
    trial = UnitaryDTO(
        data["number_of_qubits"],
        data["gates"],
        data["qubit_order"],
        parameter_gate_index=data.get("parameter_gate_index"),
    )
    return SimulateRequestDTO(
        target_unitary=data["target_unitary"],
        trial=trial,
        target_params=target_params,
    )
