"""Validate JSON bodies for trial unitary simulation (POST /api/simulate)."""

from __future__ import annotations

from typing import Any


def _is_real_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def validate_simulate_unitary_json(data: Any) -> None:
    """
    Ensure Flask/restx JSON matches what ``UnitaryDTO`` expects.

    - ``gates`` and ``qubit_order`` are lists of the same length.
    - Each ``gates[i]`` is either a non-empty string or a dict with at least ``"gate"``.
    - Optional ``theta`` on dict entries must be a JSON number (int/float, not bool).

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
            if "theta" in entry and not _is_real_number(entry["theta"]):
                raise ValueError(
                    f'gates[{i}]."theta" must be a number when present.'
                )
            continue
        raise ValueError(
            f"gates[{i}] must be a string or an object, got {type(entry).__name__}."
        )
