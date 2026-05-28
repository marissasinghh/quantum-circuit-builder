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

const GRID_COLS = "34px 60px 34px 40px 34px 20px";
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
        <span key={i} className="block truncate">
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
        <span key={i} className="block">
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
      right={0}
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
    <div className="min-w-0 overflow-hidden">
      <div className="mb-2">
        <h2 className="font-mono text-[8px] tracking-[0.12em] text-text-muted uppercase">
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
          <div className="relative min-w-0 pb-5">
            <div
              className="font-mono text-[10px] w-full min-w-0"
              style={{ display: "grid" }}
            >
              <div
                className="text-text-muted border-b border-tier1"
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID_COLS,
                  columnGap: "2px",
                }}
              >
                <span className="py-1 truncate">Input</span>
                <span className="py-1 truncate">Trial</span>
                <span className="py-1 truncate">P(t)</span>
                <span className="py-1 truncate">Expected</span>
                <span className="py-1 truncate relative pr-3">
                  P(e)
                  <ExpectedPHeaderTooltip />
                </span>
                <span className="py-1 truncate">Match</span>
              </div>

              {rows.map((r) => (
                <div
                  key={r.input}
                  className={r.ok ? "bg-match-bg" : "bg-mismatch-bg"}
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID_COLS,
                    columnGap: "2px",
                  }}
                >
                  <span className="py-1 text-tier3 truncate">{r.input}</span>
                  <span
                    className={`py-1 truncate ${r.ok ? "text-tier3" : "text-mismatch-text"}`}
                  >
                    <AmplitudeCell value={r.trial} />
                  </span>
                  <span className="py-1 text-text-muted">
                    <ProbabilityCell probs={r.trialProbabilities} />
                  </span>
                  <span className="py-1 text-tier3 truncate">
                    <AmplitudeCell value={r.target} />
                  </span>
                  <span className="py-1 text-text-muted">
                    <ProbabilityCell probs={r.targetProbabilities} />
                  </span>
                  <span className={`py-1 ${r.ok ? "text-tier3" : "text-error-action"}`}>
                    {r.ok ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>

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
