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
  type SingleWire,
  TwoQubitGate,
} from "../types/global";
import { DEFAULT_QUBIT_ORDER } from "../utils/constants";
import {
  append,
  remove,
  setOrder as setOrderInCircuit,
  moveGate as moveGateInCircuit,
  insertAt,
  clear as clearCircuit,
} from "../utils/circuit";
import { isValidSingleWire } from "../utils/wireValidation";

const ROTATION_GATES = new Set<SingleQubitGate>([Gate.RX, Gate.RY, Gate.RZ]);

function isRotationGate(type: SingleQubitGate): boolean {
  return ROTATION_GATES.has(type);
}

export function useCircuit(numberOfQubits: number) {
  /** Current circuit, always stored in column order (0..n-1). */
  const [gates, setGates] = useState<PlacedGate[]>([]);

  const addTwoQubitGate = useCallback((gate: TwoQubitGate, column?: number) => {
    const g: PlacedTwoQubitGate = {
      id: crypto.randomUUID(),
      type: gate,
      order: DEFAULT_QUBIT_ORDER,
      column: 0,
    };
    setGates((prev) => column !== undefined ? insertAt(prev, g, column) : append(prev, g));
  }, []);

  const addSingleQubitGate = useCallback(
    (type: SingleQubitGate, wire: SingleWire, column?: number) => {
      if (!isValidSingleWire(wire, numberOfQubits)) return;

      const g: PlacedSingleQubitGate = {
        id: crypto.randomUUID(),
        type,
        wire,
        column: 0,
      };
      setGates((prev) => column !== undefined ? insertAt(prev, g, column) : append(prev, g));
    },
    [numberOfQubits]
  );

  const setGateOrder = useCallback((id: string, order: ControlTargetOrder) => {
    setGates((prev) => setOrderInCircuit(prev, id, order));
  }, []);

  const moveGate = useCallback(
    (id: string, to: number, wire?: SingleWire) => {
      if (wire !== undefined && !isValidSingleWire(wire, numberOfQubits)) return;
      setGates((prev) => moveGateInCircuit(prev, id, to, wire));
    },
    [numberOfQubits]
  );

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

  /** Replace the full gate array (e.g. restore from localStorage). */
  const loadGates = useCallback((next: PlacedGate[]) => setGates(next), []);

  return {
    gates,
    addTwoQubitGate,
    addSingleQubitGate,
    setGateOrder,
    moveGate,
    setGateTheta,
    setParameterSlot,
    removeGate,
    clearAll,
    loadGates,
  };
}
