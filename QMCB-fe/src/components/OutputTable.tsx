/**
 * Output Table: displays the circuit output truth table and validation results.
 */

import { useCallback, useState } from "react";
import type { TruthRow } from "../interfaces/truthTable";
import { Tooltip, TooltipIcon, TooltipMath, useTooltip } from "./Tooltip";

interface OutputTableProps {
  rows: TruthRow[] | null;
  isCorrect: boolean;
  error: Error | null;
  showGlobalPhaseNote?: boolean;
}

const CELL_PADDING = "9px 16px";
const EXPECTED_P_TOOLTIP_ID = "expected-p-probability";

function splitAmplitudeTerms(value: string): string[] {
  if (!value.includes(" + ")) return [value];
  return value.split(/\s+\+\s+/);
}

function AmplitudeCell({ value }: { value: string }) {
  const terms = splitAmplitudeTerms(value);
  return (
    <>
      {terms.map((term, i) => (
        <span key={i} style={{ display: "block" }}>
          {term}
        </span>
      ))}
    </>
  );
}

function ProbabilityCell({ probs }: { probs: readonly number[] | undefined }) {
  if (!probs?.length) return <>—</>;
  return (
    <>
      {probs.map((p, i) => (
        <span key={i} style={{ display: "block" }}>
          {p.toFixed(3)}
        </span>
      ))}
    </>
  );
}

function ExpectedPHeaderTooltip() {
  const { openId, setOpenId } = useTooltip();
  const open = openId === EXPECTED_P_TOOLTIP_ID;
  const [hovered, setHovered] = useState(false);

  const toggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setOpenId(open ? null : EXPECTED_P_TOOLTIP_ID);
    },
    [open, setOpenId]
  );

  return (
    <>
      <span
        data-tooltip-root
        style={{
          position: "absolute",
          bottom: 4,
          right: 6,
        }}
      >
        <TooltipIcon
          open={open}
          hovered={hovered}
          onClick={toggle}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenId(open ? null : EXPECTED_P_TOOLTIP_ID);
            }
          }}
          ariaLabel="Measurement probability info"
        />
      </span>
      {open && (
        <div
          data-tooltip-root
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            width: 250,
            whiteSpace: "normal",
            background: "#0d1b30",
            border: "1px solid #2563a8",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#b0bec5",
          }}
        >
          Measurement probabilities: the chance of observing each output state. Calculated as{" "}
          <TooltipMath>P = |amplitude|²</TooltipMath>. A definite state like{" "}
          <TooltipMath>|1⟩</TooltipMath> gives <TooltipMath>P = 1.000</TooltipMath>. A
          superposition splits probability across states. Your trial probabilities must match
          expected for the level to pass.
        </div>
      )}
    </>
  );
}

export function OutputTable({
  rows,
  isCorrect,
  error,
  showGlobalPhaseNote = false,
}: OutputTableProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-mono text-[10px] tracking-[0.12em] text-slate-muted uppercase">
          Circuit Output
        </h2>
        {isCorrect && (
          <span className="font-mono text-[10px] text-cyan">Complete ✓</span>
        )}
      </div>

      {error && (
        <div className="font-sans text-[12px] text-[#ef5350] mb-2">{error.message}</div>
      )}

      {!rows && !error && (
        <div className="font-sans text-[12px] text-slate">
          Submit to see the truth tables.
        </div>
      )}

      {rows && (
        <>
          <div
            style={{
              display: "inline-block",
              position: "relative",
              paddingRight: 14,
              paddingBottom: 20,
            }}
          >
            <table
              className="font-mono text-[11px] border-collapse"
              style={{ tableLayout: "auto", whiteSpace: "nowrap" }}
            >
              <thead>
                <tr className="text-slate-muted border-b border-grid">
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    Input
                  </th>
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    Trial
                  </th>
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    P
                  </th>
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    Expected
                  </th>
                  <th
                    className="text-left"
                    style={{ position: "relative", padding: CELL_PADDING }}
                  >
                    P
                    <ExpectedPHeaderTooltip />
                  </th>
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    Match
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.input}
                    className={
                      r.ok
                        ? "bg-cyan/10 text-cyan"
                        : "bg-[rgba(233,69,96,0.08)] text-[#ef5350]"
                    }
                  >
                    <td className="text-left align-top" style={{ padding: CELL_PADDING }}>
                      {r.input}
                    </td>
                    <td
                      className="text-cyan-muted text-left align-top"
                      style={{ padding: CELL_PADDING }}
                    >
                      <AmplitudeCell value={r.trial} />
                    </td>
                    <td className="text-left align-top" style={{ padding: CELL_PADDING }}>
                      <ProbabilityCell probs={r.trialProbabilities} />
                    </td>
                    <td
                      className="text-cyan-muted text-left align-top"
                      style={{ padding: CELL_PADDING }}
                    >
                      <AmplitudeCell value={r.target} />
                    </td>
                    <td className="text-left align-top" style={{ padding: CELL_PADDING }}>
                      <ProbabilityCell probs={r.targetProbabilities} />
                    </td>
                    <td className="text-left align-top" style={{ padding: CELL_PADDING }}>
                      {r.ok ? "✓" : "✗"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Tooltip id="circuit-output" bottom={4} right={0}>
              Quantum gates are linear operations. This means if your circuit produces the right
              output for every basis state — <TooltipMath>|0⟩</TooltipMath> and{" "}
              <TooltipMath>|1⟩</TooltipMath> — it is guaranteed to work correctly on any
              superposition too. That is why matching all rows here is enough to prove your
              circuit is correct.
            </Tooltip>
          </div>

          {showGlobalPhaseNote && (
            <p className="mt-2 font-sans text-[12px] text-cyan-muted bg-navy-light border border-grid rounded-panel px-2 py-1.5 leading-relaxed">
              Circuits that differ only by a global phase produce identical measurement
              probabilities. Trial and Expected outputs may show different complex amplitudes,
              but matching probability columns mean the circuits are physically equivalent.
            </p>
          )}
        </>
      )}
    </div>
  );
}
