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

const ROTATION_GATES = new Set<SingleQubitGate>([Gate.RX, Gate.RY, Gate.RZ]);

function isRotationGate(type: SingleQubitGate): boolean {
  return ROTATION_GATES.has(type);
}

export function useCircuit() {
  /** Current circuit, as an ordered list of placed gate chips. */
  const [gates, setGates] = useState<PlacedGate[]>([]);

  const addTwoQubitGate = useCallback(
    (gate: TwoQubitGate) => {
      const g: PlacedTwoQubitGate = {
        id: crypto.randomUUID(),
        type: gate,
        order: DEFAULT_QUBIT_ORDER,
        column: gates.length,
      };
      setGates((prev) => [...prev, g]);
    },
    [gates.length]
  );

  const addSingleQubitGate = useCallback(
    (type: SingleQubitGate, wire: 0 | 1) => {
      setGates((prev) => {
        const g: PlacedSingleQubitGate = {
          id: crypto.randomUUID(),
          type,
          wire,
          column: prev.length,
        };
        return [...prev, g];
      });
    },
    []
  );

  const setGateOrder = useCallback((id: string, order: ControlTargetOrder) => {
    setGates((prev) => prev.map((g) => (g.id === id && "order" in g ? { ...g, order } : g)));
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
    setGates((prev) =>
      prev.filter((g) => g.id !== id).map((g, i) => ({ ...g, column: i }))
    );
  }, []);

  /** Clear the circuit. */
  const clearAll = useCallback(() => setGates([]), []);

  return {
    gates,
    addTwoQubitGate,
    addSingleQubitGate,
    setGateOrder,
    setGateTheta,
    setParameterSlot,
    removeGate,
    clearAll,
  };
}
