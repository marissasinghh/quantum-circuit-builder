/**
 * Handles circuit validation against the backend.
 * Submits student's circuit and compares against target.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { simulateUnitary } from "../services/simulate";
import { buildRequestFromLevel, toTruthRows } from "../controllers/simulate";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { PlacedGate } from "../types/global";
import { Gate } from "../types/global";

/** Gates that require a theta angle before the backend can apply them. */
const REQUIRES_THETA = new Set<Gate>([Gate.RX, Gate.RY, Gate.U]);

export function useCircuitValidation(currentLevel: LevelDefinition, gates: PlacedGate[]) {
  const mutation = useMutation({ mutationFn: simulateUnitary });
  const [validationError, setValidationError] = useState<Error | null>(null);

  const rows = mutation.data ? toTruthRows(mutation.data) : null;
  const allCorrect = rows?.every((r) => r.ok) ?? false;

  const handleCheck = () => {
    if (gates.length === 0) return;

    // Block parameterized gates that are missing a rotation angle.
    // (Theta input UI is not yet implemented; sending without theta causes a 500.)
    const missingTheta = gates.filter(
      (g) =>
        REQUIRES_THETA.has(g.type as Gate) &&
        !("theta" in g && typeof g.theta === "number")
    );
    if (missingTheta.length > 0) {
      const names = [...new Set(missingTheta.map((g) => g.type))].join(", ");
      setValidationError(
        new Error(`${names} requires a rotation angle (θ). Angle input not yet available — remove it to check the circuit.`)
      );
      return;
    }

    setValidationError(null);
    const body = buildRequestFromLevel(currentLevel, gates);
    mutation.mutate(body);
  };

  return {
    mutation,
    rows,
    allCorrect,
    handleCheck,
    validationError,
  };
}
