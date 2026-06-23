/**
 * React state wrapper around the pure circuit repo.
 * Components use these functions to mutate the circuit.
 */

import { useState, useCallback } from "react";
import {
  Gate,
  type PlacedGate,
  type PlacedSingleQubitGate,
  type PlacedTwoQubitGate,
  type ControlTargetOrder,
  type SingleQubitGate,
  TwoQubitGate,
} from "../types/global";
import { DEFAULT_QUBIT_ORDER } from "../utils/constants";
import {
  append,
  remove,
  setOrder as setOrderInCircuit,
  setWire as setWireInCircuit,
  moveToColumn,
  clear as clearCircuit,
} from "../utils/circuit";

const ROTATION_GATES = new Set<SingleQubitGate>([Gate.RX, Gate.RY, Gate.RZ]);

function isRotationGate(type: SingleQubitGate): boolean {
  return ROTATION_GATES.has(type);
}

export function useCircuit() {
  /** Current circuit, always stored in column order (0..n-1). */
  const [gates, setGates] = useState<PlacedGate[]>([]);

  const addTwoQubitGate = useCallback((gate: TwoQubitGate) => {
    const g: PlacedTwoQubitGate = {
      id: crypto.randomUUID(),
      type: gate,
      order: DEFAULT_QUBIT_ORDER,
      column: 0,
    };
    setGates((prev) => append(prev, g));
  }, []);

  const addSingleQubitGate = useCallback((type: SingleQubitGate, wire: 0 | 1) => {
    const g: PlacedSingleQubitGate = {
      id: crypto.randomUUID(),
      type,
      wire,
      column: 0,
    };
    setGates((prev) => append(prev, g));
  }, []);

  const setGateOrder = useCallback((id: string, order: ControlTargetOrder) => {
    setGates((prev) => setOrderInCircuit(prev, id, order));
  }, []);

  const setGateWire = useCallback((id: string, wire: 0 | 1) => {
    setGates((prev) => setWireInCircuit(prev, id, wire));
  }, []);

  const moveGateToColumn = useCallback((id: string, to: number) => {
    setGates((prev) => moveToColumn(prev, id, to));
  }, []);

  const setGateTheta = useCallback((id: string, theta: number) => {
    setGates((prev) => prev.map((g) => (g.id === id && "wire" in g ? { ...g, theta } : g)));
  }, []);

  const setParameterSlot = useCallback((id: string) => {
    setGates((prev) =>
      prev.map((g) => {
        if (!("wire" in g) || !isRotationGate(g.type)) {
          return "isParameterSlot" in g ? { ...g, isParameterSlot: false } : g;
        }
        return { ...g, isParameterSlot: g.id === id };
      })
    );
  }, []);

  /** Remove a chip by id. */
  const removeGate = useCallback((id: string) => {
    setGates((prev) => remove(prev, id));
  }, []);

  /** Clear the circuit. */
  const clearAll = useCallback(() => setGates(clearCircuit()), []);

  return {
    gates,
    addTwoQubitGate,
    addSingleQubitGate,
    setGateOrder,
    setGateWire,
    moveGateToColumn,
    setGateTheta,
    setParameterSlot,
    removeGate,
    clearAll,
  };
}
