/**
 * Output Table: displays the circuit output truth table and validation results.
 */

import type { TruthRow } from "../interfaces/truthTable";
import { Tooltip, TooltipMath } from "./Tooltip";

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
  return (
    <Tooltip
      id={EXPECTED_P_TOOLTIP_ID}
      bottom={4}
      right={6}
      ariaLabel="Measurement probability info"
    >
      Measurement probabilities: the chance of observing each output state. Calculated as{" "}
      <TooltipMath>P = |amplitude|²</TooltipMath>. A definite state like{" "}
      <TooltipMath>|1⟩</TooltipMath> gives <TooltipMath>P = 1.000</TooltipMath>. A superposition
      splits probability across states. Your trial probabilities must match expected for the level
      to pass.
    </Tooltip>
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
      <div className="mb-2">
        <h2 className="font-mono text-[10px] tracking-[0.12em] text-text-muted uppercase">
          CIRCUIT OUTPUT
        </h2>
      </div>

      {isCorrect && (
        <div className="mb-3 bg-match-bg border border-tier1 rounded-md px-3 py-2 text-sm font-sans text-text-body">
          All rows match — circuit verified ✓
        </div>
      )}

      {error && (
        <div className="font-sans text-[12px] text-error-action mb-2">{error.message}</div>
      )}

      {!rows && !error && (
        <div className="font-sans text-[12px] text-tier2">
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
                <tr className="text-text-muted border-b border-tier1">
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    Input
                  </th>
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    Trial
                  </th>
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    P (trial)
                  </th>
                  <th className="text-left" style={{ padding: CELL_PADDING }}>
                    Expected
                  </th>
                  <th
                    className="text-left"
                    style={{ position: "relative", padding: CELL_PADDING }}
                  >
                    P (exp.)
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
                    className={r.ok ? "bg-match-bg" : "bg-mismatch-bg"}
                  >
                    <td
                      className="font-mono text-tier3 text-left align-top"
                      style={{ padding: CELL_PADDING }}
                    >
                      {r.input}
                    </td>
                    <td
                      className={`font-mono text-left align-top ${
                        r.ok ? "text-tier3" : "text-mismatch-text"
                      }`}
                      style={{ padding: CELL_PADDING }}
                    >
                      <AmplitudeCell value={r.trial} />
                    </td>
                    <td
                      className="font-mono text-text-muted text-left align-top"
                      style={{ padding: CELL_PADDING }}
                    >
                      <ProbabilityCell probs={r.trialProbabilities} />
                    </td>
                    <td
                      className="font-mono text-tier3 text-left align-top"
                      style={{ padding: CELL_PADDING }}
                    >
                      <AmplitudeCell value={r.target} />
                    </td>
                    <td
                      className="font-mono text-text-muted text-left align-top"
                      style={{ padding: CELL_PADDING }}
                    >
                      <ProbabilityCell probs={r.targetProbabilities} />
                    </td>
                    <td
                      className={`text-left align-top ${r.ok ? "text-tier3" : "text-error-action"}`}
                      style={{ padding: CELL_PADDING }}
                    >
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
            <p className="mt-2 font-sans text-[12px] text-text-body bg-bg-panel border border-tier1 rounded-panel px-2 py-1.5 leading-relaxed">
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
