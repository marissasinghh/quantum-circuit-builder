/**
 * Task Card: displays current level's task description and expected truth table.
 */

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
  // Prefer dynamicTruth (Level 1.6) over the static expectedTruth.
  const truth = dynamicTruth ?? level.expectedTruth;

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
    </div>
  );
}
