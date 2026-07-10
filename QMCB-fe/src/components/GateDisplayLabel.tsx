import type { Gate } from "../types/global";
import {
  getGateDisplayParts,
  parseDisplayLabel,
} from "../utils/gateDisplayNames";

type GateDisplayLabelProps = {
  className?: string;
  prefix?: string;
} & (
  | { gate: Gate; label?: never }
  | { gate?: never; label: string }
);

/** Renders a gate label with † as a small superscript (matches GateDesign glyph convention). */
export function GateDisplayLabel({ gate, label, prefix = "", className }: GateDisplayLabelProps) {
  const { base, dagger } = gate != null ? getGateDisplayParts(gate) : parseDisplayLabel(label);

  return (
    <span className={className}>
      {prefix}
      {base}
      {dagger && <sup className="gate-dagger">†</sup>}
    </span>
  );
}
