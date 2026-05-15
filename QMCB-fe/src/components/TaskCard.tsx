/**
 * Task Card: displays current level's task description and expected truth table.
 */

import { useState } from "react";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { TruthTableDTO } from "../interfaces/truthTable";

interface TaskCardProps {
  level: LevelDefinition;
  /**
   * Dynamic truth table for Level 1.6 (random unitary). When provided,
   * this takes precedence over level.expectedTruth.
   */
  dynamicTruth?: TruthTableDTO;
  /**
   * When provided, a "Try a different unitary" button is rendered below
   * the truth table. Intended for Level 1.6 only.
   */
  onNewUnitary?: () => void;
}

export function TaskCard({ level, dynamicTruth, onNewUnitary }: TaskCardProps) {
  const truth = dynamicTruth ?? level.expectedTruth;
  const [shownHint, setShownHint] = useState<1 | 2 | null>(null);

  function toggleHint(n: 1 | 2) {
    setShownHint((prev) => (prev === n ? null : n));
  }

  const hintText = shownHint === 1 ? level.hint1 : shownHint === 2 ? level.hint2 : null;

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-2xl font-semibold mb-2">Task</h2>
      <p className="text-sm">{level.description}</p>

      <div className="mt-3 text-sm">
        <div className="font-medium">Expected Output:</div>
        {truth ? (
          <>
            <table className="mt-2 text-xs border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-2 py-1">Input</th>
                  <th className="border px-2 py-1">Output</th>
                </tr>
              </thead>
              <tbody>
                {truth.input.map((inp, idx) => (
                  <tr key={inp}>
                    <td className="border px-2 py-1">{inp}</td>
                    <td className="border px-2 py-1">{truth.output[idx]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {onNewUnitary && (
              <button
                onClick={onNewUnitary}
                className="mt-3 text-xs text-blue-600 underline hover:text-blue-800"
              >
                Try a different unitary
              </button>
            )}
          </>
        ) : (
          <p className="mt-2 text-xs text-gray-500 italic">
            Parameterized gate — output depends on θ. The backend checks your unitary for any angle.
          </p>
        )}
      </div>

      {/* ── Hints ─────────────────────────────────────────────────────────── */}
      {(level.hint1 || level.hint2) && (
        <div className="mt-4 border-t pt-3">
          <div className="flex gap-2">
            {level.hint1 && (
              <button
                onClick={() => toggleHint(1)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  shownHint === 1
                    ? "bg-amber-100 border-amber-400 text-amber-800"
                    : "border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-700"
                }`}
              >
                💡 Hint 1
              </button>
            )}
            {level.hint2 && (
              <button
                onClick={() => toggleHint(2)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  shownHint === 2
                    ? "bg-amber-100 border-amber-400 text-amber-800"
                    : "border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-700"
                }`}
              >
                💡 Hint 2
              </button>
            )}
          </div>

          {hintText && (
            <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
              {hintText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
