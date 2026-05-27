/**
 * Output Table: displays the circuit output truth table and validation results.
 */

interface OutputRow {
  input: string;
  trial: string;
  target: string;
  ok: boolean;
}

interface OutputTableProps {
  rows: OutputRow[] | null;
  isCorrect: boolean;
  error: Error | null;
}

/** Two-qubit inputs use longer amplitude strings in Trial column */
function isTwoQubitRows(rows: OutputRow[]): boolean {
  return rows.some((r) => r.input.length > 4 || r.trial.length > 12);
}

export function OutputTable({ rows, isCorrect, error }: OutputTableProps) {
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
        <table
          className="w-full font-mono text-[11px] table-fixed border-collapse"
          style={{ tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: twoQubit ? "12%" : "10%" }} />
            <col style={{ width: twoQubit ? "48%" : "52%" }} />
            <col style={{ width: twoQubit ? "30%" : "28%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr className="text-slate-muted border-b border-grid">
              <th className="text-left py-1 pr-1">In</th>
              <th className="text-left py-1 pr-1">Trial</th>
              <th className="text-left py-1 pr-1">Target</th>
              <th className="text-left py-1">✓</th>
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
                <td className="py-0.5 pr-1 text-cyan-muted text-left align-top overflow-hidden text-ellipsis whitespace-nowrap max-w-0">
                  {r.target}
                </td>
                <td className="py-0.5 text-left">{r.ok ? "✓" : "✗"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
