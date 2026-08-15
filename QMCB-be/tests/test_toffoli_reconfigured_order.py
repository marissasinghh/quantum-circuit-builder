"""
Cross-stack positional-convention confirmation for the Toffoli reconfiguration
feature (frontend Phase 4 target-wire picker, built on top of this).

This test exists because three frontend files (constants.ts's
`threeQubitOrderForTarget`, circuit.ts's `setThreeQubitOrder`/`serializeOrders`,
and GateDesign.tsx's `ToffoliGlyph`) all independently assume the SAME
positional convention as this backend's `CirqGateMapper.apply()`:
`qubit_order[0]` and `qubit_order[1]` are controls, `qubit_order[2]` is target
— BY POSITION in the array, not by the numeric wire value stored there.

The frontend calls `threeQubitOrderForTarget(1)` (i.e. "make wire Q1 the
target") and gets back `[0, 2, 1]`. This is exactly `C0_C2_T1` below. This
test feeds that literal array into the real `CirqGateMapper.apply()` and
asserts the resulting `cirq.CCX` has controls on wires 0 & 2 and target on
wire 1 — matching what the frontend glyph renders and what the student asked
for. See `QMCB-fe/src/components/GateDesign.test.tsx`'s
"threeQubitOrderForTarget → setThreeQubitOrder → glyph → serializeOrders agree
positionally" test for the frontend half of this same chain, keyed off the
identical `[0, 2, 1]` value.

Run from QMCB-be/:
    python -m pytest tests/test_toffoli_reconfigured_order.py -v
"""

from __future__ import annotations

import cirq

from app.config.gates import CirqGateMapper
from app.utils.constants import Gate
from app.utils.qubit_orders import C0_C1_T2, C0_C2_T1


def test_c0_c1_t2_default_order_matches_hardcoded_pre_reconfig_appearance():
    """Sanity anchor: the pre-existing default order still means controls=[0,1], target=2."""
    qubits = cirq.LineQubit.range(3)
    op = CirqGateMapper.apply(Gate.TOFFOLI.value, C0_C1_T2, *qubits)

    assert isinstance(op.gate, cirq.CCXPowGate)
    assert set(op.qubits[:2]) == {qubits[0], qubits[1]}  # controls, by position
    assert op.qubits[2] == qubits[2]  # target, by position


def test_c0_c2_t1_matches_frontend_threequbitorderfortarget_of_q1():
    """
    C0_C2_T1 = [0, 2, 1] is exactly what the frontend's
    `threeQubitOrderForTarget(1)` returns when the student picks Q1 as target.
    Confirms the backend interprets it identically: controls on wires 0 & 2
    (array positions 0 & 1), target on wire 1 (array position 2) — regardless
    of the fact that "1" is numerically in the middle of "0, 2, 1".
    """
    assert list(C0_C2_T1) == [0, 2, 1]

    qubits = cirq.LineQubit.range(3)
    op = CirqGateMapper.apply(Gate.TOFFOLI.value, C0_C2_T1, *qubits)

    assert isinstance(op.gate, cirq.CCXPowGate)
    # Controls are array positions 0 & 1 → values 0 & 2 → wires 0 & 2.
    assert set(op.qubits[:2]) == {qubits[0], qubits[2]}
    # Target is array position 2 → value 1 → wire 1.
    assert op.qubits[2] == qubits[1]

    # Not a coincidence of sorted/ascending order: if the convention were
    # "sort ascending" this would equal C0_C1_T2's controls {0,1}, not {0,2}.
    assert set(op.qubits[:2]) != {qubits[0], qubits[1]}


def test_reconfigured_toffoli_still_implements_ccx_semantics():
    """
    Behavioral check, not just qubit-label bookkeeping: simulate C0_C2_T1 and
    confirm it's a genuine Toffoli with controls on wires 0 & 2 — i.e. wire 1
    flips iff wires 0 AND 2 are both |1>, and is otherwise a no-op.
    """
    q0, q1, q2 = cirq.LineQubit.range(3)
    op = CirqGateMapper.apply(Gate.TOFFOLI.value, C0_C2_T1, q0, q1, q2)
    circuit = cirq.Circuit([op])

    for c0 in (0, 1):
        for t1 in (0, 1):
            for c2 in (0, 1):
                sim = cirq.Simulator()
                initial = cirq.Circuit(
                    [cirq.X(q0) ** c0, cirq.X(q1) ** t1, cirq.X(q2) ** c2]
                )
                result = sim.simulate(initial + circuit)
                bits = result.dirac_notation(decimals=0)
                expected_t1 = t1 ^ (c0 & c2)
                expected = f"|{c0}{expected_t1}{c2}⟩"
                assert bits == expected, (
                    f"c0={c0}, t1={t1}, c2={c2}: expected {expected}, got {bits}"
                )
