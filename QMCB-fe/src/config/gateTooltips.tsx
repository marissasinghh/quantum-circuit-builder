/**
 * Toolbox gate insight tooltips ("i" icons).
 * Each entry reveals when completedLevels includes revealWhenCompleted
 * (set on Check Solution pass for that level).
 */

import type { ReactNode } from "react";
import { Gate } from "../types/global";
import { TooltipMath } from "../components/Tooltip";

export interface GateTooltipConfig {
  content: ReactNode;
  revealWhenCompleted: Gate;
}

export const GATE_TOOLTIPS: Partial<Record<Gate, GateTooltipConfig>> = {
  [Gate.X]: {
    revealWhenCompleted: Gate.X,
    content: (
      <>
        Sends <TooltipMath>|0⟩</TooltipMath> to <TooltipMath>|1⟩</TooltipMath> and{" "}
        <TooltipMath>|1⟩</TooltipMath> to <TooltipMath>|0⟩</TooltipMath>. A half-turn rotation
        around the X-axis of the Bloch sphere — the quantum NOT gate.
      </>
    ),
  },
  [Gate.SQRT_X]: {
    revealWhenCompleted: Gate.X,
    content: (
      <>
        Sends <TooltipMath>|0⟩</TooltipMath> to <TooltipMath>|−i⟩</TooltipMath> and{" "}
        <TooltipMath>|1⟩</TooltipMath> to <TooltipMath>|+i⟩</TooltipMath>. A quarter-turn rotation
        around the X-axis of the Bloch sphere — apply it twice and you get a full X flip.
      </>
    ),
  },
  [Gate.Z]: {
    revealWhenCompleted: Gate.Z,
    content: (
      <>
        Leaves <TooltipMath>|0⟩</TooltipMath> unchanged and sends <TooltipMath>|1⟩</TooltipMath> to{" "}
        <TooltipMath>−|1⟩</TooltipMath>. A half-turn rotation around the Z-axis — flips relative
        phase without changing measurement probabilities.
      </>
    ),
  },
  [Gate.RZ]: {
    revealWhenCompleted: Gate.S_DAG,
    content: (
      <>
        A tunable rotation around the Z-axis of the Bloch sphere by angle{" "}
        <TooltipMath>θ</TooltipMath>. Every phase gate you&apos;ve built so far — S, S-dag — is a
        special case of this one gate.
      </>
    ),
  },
  [Gate.S]: {
    revealWhenCompleted: Gate.S,
    content: (
      <>
        Rotates the state vector around the Z axis by 90° (<TooltipMath>π/2</TooltipMath>). A
        quarter turn of phase — useful for fine-tuning where on the equator your state ends up.
      </>
    ),
  },
  [Gate.S_DAG]: {
    revealWhenCompleted: Gate.S_DAG,
    content: (
      <>
        Leaves <TooltipMath>|0⟩</TooltipMath> unchanged and sends <TooltipMath>|1⟩</TooltipMath> to{" "}
        <TooltipMath>−i|1⟩</TooltipMath>. A quarter-turn rotation around the Z-axis, in the
        opposite direction from S.
      </>
    ),
  },
  [Gate.T]: {
    revealWhenCompleted: Gate.T,
    content: (
      <>
        Rotates the state vector around the Z axis by 45° (<TooltipMath>π/4</TooltipMath>). Half of
        what the S gate does — handy for precision phase adjustments.
      </>
    ),
  },
  [Gate.T_DAG]: {
    revealWhenCompleted: Gate.T_DAG,
    content: (
      <>
        Leaves <TooltipMath>|0⟩</TooltipMath> unchanged and sends <TooltipMath>|1⟩</TooltipMath> to{" "}
        <TooltipMath>e<sup>−iπ/4</sup>|1⟩</TooltipMath>. An eighth-turn rotation around the Z-axis,
        in the opposite direction from T.
      </>
    ),
  },
  [Gate.H]: {
    revealWhenCompleted: Gate.H,
    content: (
      <>
        Sends <TooltipMath>|0⟩</TooltipMath> to <TooltipMath>|+⟩</TooltipMath> and{" "}
        <TooltipMath>|1⟩</TooltipMath> to <TooltipMath>|−⟩</TooltipMath>. It is a combination of
        rotations that lands you exactly on the equator of the Bloch sphere.
      </>
    ),
  },
  [Gate.Y]: {
    revealWhenCompleted: Gate.Y,
    content: (
      <>
        Sends <TooltipMath>|0⟩</TooltipMath> to <TooltipMath>i|1⟩</TooltipMath> and{" "}
        <TooltipMath>|1⟩</TooltipMath> to <TooltipMath>−i|0⟩</TooltipMath>. A half-turn rotation
        around the Y-axis of the Bloch sphere — combines a bit flip with a phase flip.
      </>
    ),
  },
  [Gate.RX]: {
    revealWhenCompleted: Gate.RX,
    content: (
      <>
        Rotates the state vector around the X axis by angle <TooltipMath>θ</TooltipMath>. Adjust{" "}
        <TooltipMath>θ</TooltipMath> using the slider after placing it on the wire.
      </>
    ),
  },
  [Gate.RY]: {
    revealWhenCompleted: Gate.RY,
    content: (
      <>
        Rotates the state vector around the Y axis by angle <TooltipMath>θ</TooltipMath>. Adjust{" "}
        <TooltipMath>θ</TooltipMath> using the slider after placing it on the wire.
      </>
    ),
  },
  [Gate.U]: {
    revealWhenCompleted: Gate.RANDOM_U,
    content: (
      <>
        The most general single-qubit gate — any combination of rotations around the Bloch sphere
        can be expressed as a U gate with the right parameters.
      </>
    ),
  },
  [Gate.CNOT]: {
    revealWhenCompleted: Gate.RANDOM_U,
    content: (
      <>
        A two-qubit gate. If the control qubit is <TooltipMath>|1⟩</TooltipMath>, it flips the
        target qubit. The Bloch sphere only visualizes single-qubit states, so watch the truth
        table for this one.
      </>
    ),
  },
  [Gate.CONTROLLED_Z]: {
    revealWhenCompleted: Gate.CONTROLLED_Z,
    content: (
      <>
        A two-qubit gate. Applies a phase flip to the target qubit when both qubits are{" "}
        <TooltipMath>|1⟩</TooltipMath>. Check the truth table to see its effect.
      </>
    ),
  },
  [Gate.SWAP]: {
    revealWhenCompleted: Gate.SWAP,
    content: (
      <>
        Exchanges the states of two qubits. Whatever qubit 0 was holding, qubit 1 now has, and vice
        versa.
      </>
    ),
  },
};

/** Gate → level id that unlocks its toolbox "i" icon (for tests). */
export const GATE_TOOLTIP_REVEAL: Partial<Record<Gate, Gate>> = Object.fromEntries(
  Object.entries(GATE_TOOLTIPS).map(([gate, cfg]) => [gate, cfg.revealWhenCompleted]),
) as Partial<Record<Gate, Gate>>;

function levelGrantsTooltipReveal(
  levelId: Gate,
  completedLevels: readonly string[],
  skippedLevels: readonly string[],
): boolean {
  return completedLevels.includes(levelId) || skippedLevels.includes(levelId);
}

export function shouldShowGateTooltip(
  gate: Gate,
  completedLevels: readonly string[],
  skippedLevels: readonly string[] = [],
): boolean {
  const cfg = GATE_TOOLTIPS[gate];
  if (!cfg) return false;
  return levelGrantsTooltipReveal(cfg.revealWhenCompleted, completedLevels, skippedLevels);
}

/** All gates whose "i" icon should be visible for the given completion state. */
export function visibleTooltipGates(
  completedLevels: readonly string[],
  skippedLevels: readonly string[] = [],
): Gate[] {
  return (Object.keys(GATE_TOOLTIPS) as Gate[]).filter((gate) =>
    shouldShowGateTooltip(gate, completedLevels, skippedLevels),
  );
}
