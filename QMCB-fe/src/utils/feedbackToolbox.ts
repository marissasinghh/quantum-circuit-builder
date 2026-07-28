/**
 * Full placeable gateset for the Feedback page.
 * Does NOT use computeAvailableGates or progression unlock state.
 */

import { GATE_UI_CONFIG } from "../config/gateUiConfig";
import { arityFor } from "../config/gates";
import { Gate } from "../types/global";
import { TOOLBOX_GATE_ORDER } from "./computeToolbox";

/** Max qubit count a gate needs to appear in the toolbox (mirrors computeToolbox). */
function gateMaxQubits(gate: Gate): number {
  if (gate === Gate.TOFFOLI || gate === Gate.FREDKIN) return 3;
  return arityFor(gate) === 2 ? 2 : 1;
}

/**
 * Every gate with GATE_UI_CONFIG (and thus existing DnD placement support),
 * filtered by the selected level's qubit count. TOFFOLI/FREDKIN are excluded
 * because they have no GATE_UI_CONFIG entry.
 */
export function feedbackAvailableGates(numberOfQubits: number): Gate[] {
  return TOOLBOX_GATE_ORDER.filter(
    (g) => GATE_UI_CONFIG[g] != null && gateMaxQubits(g) <= numberOfQubits,
  );
}
