/**
 * Output Table: displays the circuit output truth table and validation results.
 */

import type { ReactNode } from "react";
import type { TruthRow } from "../interfaces/truthTable";
import { Tooltip, TooltipMath } from "./Tooltip";

interface OutputTableProps {
  rows: TruthRow[] | null;
  isCorrect: boolean;
  error: Error | null;
  levelInsight?: ReactNode;
}

const CELL_CLASS = "px-3 py-1.5";

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
        <span key={i} className="block whitespace-nowrap">
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
  levelInsight,
}: OutputTableProps) {
  return (
    <div className="w-full box-border overflow-visible">
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

      {levelInsight}

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
          <div className="relative w-full box-border pb-8 overflow-visible">
            <table
              className="font-mono text-[10px] w-full box-border overflow-visible"
              style={{ tableLayout: "auto" }}
            >
              <thead>
                <tr className="text-text-muted border-b border-tier1">
                  <th className={`${CELL_CLASS} text-left font-normal`}>Input</th>
                  <th className={`${CELL_CLASS} text-left font-normal`}>Trial</th>
                  <th className={`${CELL_CLASS} text-left font-normal`}>P(t)</th>
                  <th className={`${CELL_CLASS} text-left font-normal`}>Expected</th>
                  <th className={`${CELL_CLASS} text-left font-normal relative`}>
                    P(e)
                    <ExpectedPHeaderTooltip />
                  </th>
                  <th className={`${CELL_CLASS} text-left font-normal`}>Match</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.input} className={r.ok ? "bg-match-bg" : "bg-mismatch-bg"}>
                    <td className={`${CELL_CLASS} text-tier3`}>{r.input}</td>
                    <td className={`${CELL_CLASS} ${r.ok ? "text-tier3" : "text-mismatch-text"}`}>
                      <AmplitudeCell value={r.trial} />
                    </td>
                    <td className={`${CELL_CLASS} text-text-muted`}>
                      <ProbabilityCell probs={r.trialProbabilities} />
                    </td>
                    <td className={`${CELL_CLASS} text-tier3`}>
                      <AmplitudeCell value={r.target} />
                    </td>
                    <td className={`${CELL_CLASS} text-text-muted`}>
                      <ProbabilityCell probs={r.targetProbabilities} />
                    </td>
                    <td className={`${CELL_CLASS} ${r.ok ? "text-tier3" : "text-error-action"}`}>
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
        </>
      )}
    </div>
  );
}
