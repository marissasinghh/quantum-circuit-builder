"""
Stepwise circuit + measurement checks (formerly ``testing/bug_testing.py``).

**Purpose:** Build small circuits with ``CircuitBuilder``, attach gates via
``CirqGateMapper``, and read bit strings from ``CircuitSimulator.run_and_measure``.
This isolates prep → gate stack → measurement without the simulate controller.

Run from the QMCB-be folder:
    python -m pytest tests/test_bug_testing.py -v
"""

from __future__ import annotations

from unittest.mock import patch

import cirq
import pytest

from app.config.gates import CirqGateMapper
from app.dto.unitary import UnitaryDTO
from app.services.circuit_builder import CircuitBuilder
from app.services.simulator import CircuitSimulator
from app.utils.constants import Gate
from app.utils.helpers import initialize_qubit_sequence


@pytest.fixture
def trial_three_cnots() -> UnitaryDTO:
    """Same gate list / orders as the original ``bug_testing.py`` script."""
    return UnitaryDTO(
        number_of_qubits=2,
        gates=[Gate.CNOT.value, Gate.CNOT.value, Gate.CNOT.value],
        qubit_order=[[0, 1], [1, 0], [0, 1]],
    )


@pytest.fixture
def two_qubits(trial_three_cnots: UnitaryDTO):
    """Line qubits used by mapper + builder (length matches ``number_of_qubits``)."""
    return initialize_qubit_sequence(trial_three_cnots.number_of_qubits)


@pytest.fixture
def basis_10() -> list[int]:
    """
    Computational basis [1, 0] → |10⟩ in this project's prep convention
    (first list entry is qubit 0).
    """
    return [1, 0]


def _measure_bits(num_qubits: int, circuit: cirq.Circuit) -> str:
    """Run sampling simulation once; suppress simulator's debug ``print``."""
    with patch("builtins.print"):
        return CircuitSimulator.run_and_measure(num_qubits, circuit)


def test_basis_state_10_then_measure(trial_three_cnots: UnitaryDTO, two_qubits, basis_10):
    """
    **What it does:** Prepares |10⟩, appends measurement-only tail, checks readout ``10``.

    **What it is for:** Verifies ``prepare_basis_state`` + measurement keys ('a','b')
    before adding any CNOTs.
    """
    c = CircuitBuilder.prepare_basis_state(basis_10, two_qubits)
    c.append(CircuitBuilder.measure_qubits(two_qubits))
    assert _measure_bits(trial_three_cnots.number_of_qubits, c) == "10"


def test_one_cnot_from_basis_10(trial_three_cnots: UnitaryDTO, two_qubits, basis_10):
    """
    **What it does:** First CNOT only (first row of ``qubit_order``).

    **What it is for:** Single-gate regression on ``CirqGateMapper`` + CNOT direction.
    """
    c = CircuitBuilder.prepare_basis_state(basis_10, two_qubits)
    ops = [
        CirqGateMapper.apply(
            trial_three_cnots.gates[0], trial_three_cnots.qubit_order[0], *two_qubits
        )
    ]
    c.append(cirq.Circuit(ops))
    c.append(CircuitBuilder.measure_qubits(two_qubits))
    assert _measure_bits(trial_three_cnots.number_of_qubits, c) == "11"


def test_two_cnots_from_basis_10(trial_three_cnots: UnitaryDTO, two_qubits, basis_10):
    """Stacks the first two CNOT applications; expected readout ``01``."""
    c = CircuitBuilder.prepare_basis_state(basis_10, two_qubits)
    ops = [
        CirqGateMapper.apply(
            trial_three_cnots.gates[0], trial_three_cnots.qubit_order[0], *two_qubits
        ),
        CirqGateMapper.apply(
            trial_three_cnots.gates[1], trial_three_cnots.qubit_order[1], *two_qubits
        ),
    ]
    c.append(cirq.Circuit(ops))
    c.append(CircuitBuilder.measure_qubits(two_qubits))
    assert _measure_bits(trial_three_cnots.number_of_qubits, c) == "01"


def test_three_cnots_from_basis_10(trial_three_cnots: UnitaryDTO, two_qubits, basis_10):
    """Full three-CNOT sequence from the script; expected readout ``01``."""
    c = CircuitBuilder.prepare_basis_state(basis_10, two_qubits)
    ops = [
        CirqGateMapper.apply(
            trial_three_cnots.gates[i], trial_three_cnots.qubit_order[i], *two_qubits
        )
        for i in range(3)
    ]
    c.append(cirq.Circuit(ops))
    c.append(CircuitBuilder.measure_qubits(two_qubits))
    assert _measure_bits(trial_three_cnots.number_of_qubits, c) == "01"
