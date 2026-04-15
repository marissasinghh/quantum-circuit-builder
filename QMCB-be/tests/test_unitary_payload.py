"""Tests for ``validate_simulate_unitary_json`` (POST /api/simulate payload)."""

from __future__ import annotations

import pytest

from app.utils.unitary_payload import validate_simulate_unitary_json


def test_valid_minimal_payload() -> None:
    validate_simulate_unitary_json(
        {
            "number_of_qubits": 2,
            "gates": ["CNOT", "H"],
            "qubit_order": [[0, 1], [0]],
            "target_unitary": "SWAP",
        }
    )


def test_valid_dict_gate_with_theta() -> None:
    validate_simulate_unitary_json(
        {
            "number_of_qubits": 2,
            "gates": [{"gate": "RX", "theta": 0.5}],
            "qubit_order": [[0]],
            "target_unitary": "SWAP",
        }
    )


def test_mismatched_lengths() -> None:
    with pytest.raises(ValueError, match="same length"):
        validate_simulate_unitary_json(
            {
                "number_of_qubits": 2,
                "gates": ["CNOT"],
                "qubit_order": [[0, 1], [0]],
                "target_unitary": "SWAP",
            }
        )


def test_dict_missing_gate_key() -> None:
    with pytest.raises(ValueError, match='"gate"'):
        validate_simulate_unitary_json(
            {
                "number_of_qubits": 2,
                "gates": [{"name": "RX", "theta": 1.0}],
                "qubit_order": [[0]],
                "target_unitary": "SWAP",
            }
        )


def test_theta_must_be_number() -> None:
    with pytest.raises(ValueError, match="theta"):
        validate_simulate_unitary_json(
            {
                "number_of_qubits": 2,
                "gates": [{"gate": "RX", "theta": "pi"}],
                "qubit_order": [[0]],
                "target_unitary": "SWAP",
            }
        )
