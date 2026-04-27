from typing import Optional
import cirq
from app.config.gates import CirqGateMapper
from app.config.target_library import TARGET_LIBRARY
from app.utils.types import Qubit, Operation, Result, UnitaryGateEntry, WavefunctionResult
from app.utils.constants import Gate, TargetLibraryField
from app.dto.truth_table import TruthTableDTO


def initialize_qubit_sequence(number_of_qubits: int) -> list[Qubit]:
    """
    Creates a linear sequence of n qubits and returns list of callable
    qubits in sequential order.
    """
    qubit_sequence: list[Qubit] = []

    for n in range(number_of_qubits):
        qubit_sequence.append(cirq.LineQubit(n))

    return qubit_sequence


def generate_basis_states(n_qubits: int) -> list[list[int]]:
    """
    Generates list of all possible basis states for a given number of qubits.
    Example format: [[0, 0], [0, 1], [1, 0], [1, 1]]
    """
    return [list(map(int, format(i, f"0{n_qubits}b"))) for i in range(2**n_qubits)]


def set_qubit_to_1(qubit: Qubit) -> Operation:
    """
    Prepares the |1> basis state for a qubit.
    """
    return CirqGateMapper.apply(Gate.X.value, None, qubit)


def is_target_parameterized(target_name: str) -> bool:
    """
    Return True if the TARGET_LIBRARY entry requires a runtime theta.
    """
    info = TARGET_LIBRARY.get(target_name, {})
    return bool(info.get(TargetLibraryField.PARAMETERIZED.value, False))


def extract_theta_from_trial(
    gates: list[UnitaryGateEntry], gate_name: str) -> Optional[float]:
    """
    Return the theta from the first dict gate in the student's list
    that matches gate_name (e.g. "RX").  Returns None if not found.
    """
    for entry in gates:
        if isinstance(entry, dict) and entry.get("gate") == gate_name:
            return entry.get("theta")
    return None


def get_target_gates(target_name: str) -> list[str]:
    """
    Retrieves list of quantum gates needed to construct a target unitary.
    """
    if target_name not in TARGET_LIBRARY:
        raise ValueError(f"Target gate {target_name} not found in library.")

    target_info = TARGET_LIBRARY[target_name]
    steps = target_info[TargetLibraryField.STEPS.value] 
    
    gate_list = [step[TargetLibraryField.GATE.value] for step in steps]

    return gate_list


def get_qubit_order(target_name: str) -> list[list[int]]:
    """
    Retrieves list of qubit order needed to properly apply quantum gates.
    """
    if target_name not in TARGET_LIBRARY:
        raise ValueError(f"Target gate {target_name} not found in library.")

    target_info = TARGET_LIBRARY[target_name]
    steps = target_info[TargetLibraryField.STEPS.value] 
    
    qubit_order = [step[TargetLibraryField.ORDER.value] for step in steps]

    return qubit_order


def index_to_letter(index: int) -> str:
    """
    Returns the corresponding letter for a given number. Ex. 1 --> a.
    """
    if 0 <= index < 26:
        return chr(ord("a") + index)
    raise ValueError("Index must be between 0 and 25.")


def list_to_joint_string(arbitrary_list: list[int]) -> str:
    """
    Turns arbitrary list of ints into a joint string.
    """
    return "".join(str(i) for i in arbitrary_list)


def format_ket(bits: list[int]) -> str:
    """
    Takes list of bits in the form [0, 0] and returns a string of
    the corresponding basis ket.
    """
    return "|" + list_to_joint_string(bits) + ">"
    

def extract_wavefunction(number_of_qubits: int, result: WavefunctionResult) -> str:
    """
    Extracts the wavefunction from the state vector and returns it as a
    linear combination of basis states with amplitudes and phases.
    """
    output_bits = []

    for i in range(number_of_qubits):
        key = chr(ord("a") + i)  # Assumes keys are 'a', 'b', ...
        bit = result.final_state_vector[key][0][0]
        output_bits.append(str(bit))

    return "".join(output_bits)


def build_target_truth_table(
    target_name: str, target_truth_table: TruthTableDTO
) -> None:
    """
    Builds the truth table for a target circuit using stored expected output values.
    Inputs are formatted as ket notation (e.g. '|0>', '|01>') to match the trial side.
    Outputs are the pre-computed Dirac notation strings stored in TARGET_LIBRARY.
    """
    if target_name not in TARGET_LIBRARY:
        raise ValueError(f"Target '{target_name}' not found in TARGET_LIBRARY")

    target_info = TARGET_LIBRARY[target_name]
    n_qubits = target_info[TargetLibraryField.NUM_QUBITS.value]
    basis_states = generate_basis_states(n_qubits)
    outputs = target_info[TargetLibraryField.EXPECTED_OUTPUTS.value]

    for state, out in zip(basis_states, outputs):
        target_truth_table.input.append(format_ket(state))
        target_truth_table.output.append(out)

    return None


# Might not need this anymore but keeping for now
def extract_results(number_of_qubits: int, result: Result) -> str:
    """
    Extracts the measurement results for each qubit and returns them
    in a joint string format.
    """
    output_bits = []

    for i in range(number_of_qubits):
        key = chr(ord("a") + i)  # Assumes keys are 'a', 'b', ...
        bit = result.measurements[key][0][0]
        output_bits.append(str(bit))

    return "".join(output_bits)
