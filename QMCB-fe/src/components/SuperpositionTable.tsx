import type { ReactNode } from "react";

interface SuperpositionTableProps {
  compact?: boolean;
}

function Ket({ children }: { children: ReactNode }) {
  return <span className="font-mono text-tier3">{children}</span>;
}

function Frac() {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        verticalAlign: "middle",
        fontFamily: "Georgia, serif",
        fontSize: "0.85em",
        lineHeight: 1,
        margin: "0 2px",
      }}
    >
      <span style={{ borderBottom: "1px solid currentColor", paddingBottom: 1, lineHeight: 1.25 }}>
        1
      </span>
      <span style={{ lineHeight: 1.25 }}>√2</span>
    </span>
  );
}

function AxisBadge({ axis }: { axis: "X" | "Y" }) {
  const cls =
    axis === "X"
      ? "text-tier3 bg-bg-hover border border-tier3/30 rounded px-1 font-mono text-[10px]"
      : "text-cyan-muted bg-cyan-muted/10 border border-cyan-muted/30 rounded px-1 font-mono text-[10px]";
  return <span className={cls}>{axis}</span>;
}

const ROWS = [
  { state: "|+⟩", op: "+",  imag: false, direction: "+X direction", axis: "X" as const },
  { state: "|−⟩", op: "−",  imag: false, direction: "−X direction", axis: "X" as const },
  { state: "|i⟩", op: "+",  imag: true,  direction: "+Y direction", axis: "Y" as const },
  { state: "|−i⟩", op: "−", imag: true,  direction: "−Y direction", axis: "Y" as const },
] as const;

export default function SuperpositionTable({ compact = false }: SuperpositionTableProps) {
  return (
    <table className="w-full border-collapse font-mono text-[11px] mt-3">
      <thead>
        <tr className="text-text-muted border-b border-tier1">
          <th className="text-left font-normal py-1 pr-3">State</th>
          {!compact && (
            <th className="text-left font-normal py-1 pr-3">Superposition</th>
          )}
          <th className="text-left font-normal py-1 pr-3">Bloch direction</th>
          <th className="text-left font-normal py-1">Axis</th>
        </tr>
      </thead>
      <tbody className="text-text-body">
        {ROWS.map(({ state, op, imag, direction, axis }) => (
          <tr key={state} className="border-b border-tier1/40">
            <td className="py-1 pr-3">
              <Ket>{state}</Ket>
            </td>
            {!compact && (
              <td className="py-1 pr-3" style={{ whiteSpace: "nowrap" }}>
                <Frac />
                <span style={{ fontFamily: "Georgia, serif" }}>
                  {" ("}
                  <Ket>|0⟩</Ket>
                  {" "}
                  {op}
                  {imag ? " i" : " "}
                  <Ket>|1⟩</Ket>
                  {")"}
                </span>
              </td>
            )}
            <td className="py-1 pr-3">{direction}</td>
            <td className="py-1">
              <AxisBadge axis={axis} />
            </td>
          </tr>
        ))}
        {!compact && (
          <tr>
            <td colSpan={4} className="pt-2 pb-0.5 figure-caption">
              <Ket>|0⟩</Ket>
              {" = +Z (north pole) · "}
              <Ket>|1⟩</Ket>
              {" = −Z (south pole)"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
