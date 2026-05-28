/**
 * Output Table: displays the circuit output truth table and validation results.
 */

import type { TruthRow } from "../interfaces/truthTable";

interface OutputTableProps {
  rows: TruthRow[] | null;
  isCorrect: boolean;
  error: Error | null;
  showGlobalPhaseNote?: boolean;
}

function formatProbabilities(probs: readonly number[] | undefined): string {
  if (!probs?.length) return "—";
  return probs.map((p) => p.toFixed(3)).join(", ");
}

/** Two-qubit inputs use longer amplitude strings in output columns */
function isTwoQubitRows(rows: TruthRow[]): boolean {
  return rows.some((r) => r.input.length > 4 || r.trial.length > 12);
}

export function OutputTable({
  rows,
  isCorrect,
  error,
  showGlobalPhaseNote = false,
}: OutputTableProps) {
  const twoQubit = rows ? isTwoQubitRows(rows) : false;

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
          <table
            className="w-full font-mono text-[11px] table-fixed border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: twoQubit ? "10%" : "10%" }} />
              <col style={{ width: twoQubit ? "26%" : "28%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: twoQubit ? "26%" : "28%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr className="text-slate-muted border-b border-grid">
                <th className="text-left py-1 pr-1">Input</th>
                <th className="text-left py-1 pr-1">Trial</th>
                <th className="text-left py-1 pr-1">P</th>
                <th className="text-left py-1 pr-1">Expected</th>
                <th className="text-left py-1 pr-1">P</th>
                <th className="text-left py-1">Match</th>
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
                  <td className="py-0.5 pr-1 text-left align-top">{r.input}</td>
                  <td className="py-0.5 pr-1 text-cyan-muted text-left align-top overflow-hidden text-ellipsis whitespace-nowrap max-w-0">
                    {r.trial}
                  </td>
                  <td className="py-0.5 pr-1 text-left align-top">
                    {formatProbabilities(r.trialProbabilities)}
                  </td>
                  <td className="py-0.5 pr-1 text-cyan-muted text-left align-top overflow-hidden text-ellipsis whitespace-nowrap max-w-0">
                    {r.target}
                  </td>
                  <td className="py-0.5 pr-1 text-left align-top">
                    {formatProbabilities(r.targetProbabilities)}
                  </td>
                  <td className="py-0.5 text-left">{r.ok ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
