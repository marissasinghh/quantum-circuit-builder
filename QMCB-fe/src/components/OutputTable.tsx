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

export function OutputTable({ rows, isCorrect, error }: OutputTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold mb-2">Circuit Output</h2>
        {isCorrect && (
          <span className="text-green-700 text-sm font-semibold">Level Complete ✓</span>
        )}
      </div>

      {error && <div className="text-red-600 text-sm mb-2">{error.message}</div>}

      {!rows && !error && (
        <div className="text-sm text-gray-500">Submit to see the truth tables.</div>
      )}

      {rows && (
        <table className="mt-2 text-sm border w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-1 text-left">Input</th>
              <th className="border px-2 py-1 text-left">Trial Output</th>
              <th className="border px-2 py-1 text-left">Target Output</th>
              <th className="border px-2 py-1 text-left">Match</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.input}>
                <td className="border px-2 py-1">{r.input}</td>
                <td className="border px-2 py-1">{r.trial}</td>
                <td className="border px-2 py-1">{r.target}</td>
                <td className="border px-2 py-1">{r.ok ? "✓" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
