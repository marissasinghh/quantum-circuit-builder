/**
 * Task Card: displays current level's task description and expected truth table.
 */

import type { LevelDefinition } from "../interfaces/levelDefinition";

interface TaskCardProps {
  level: LevelDefinition;
}

export function TaskCard({ level }: TaskCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-2xl font-semibold mb-2">Task</h2>
      <p className="text-sm">{level.description}</p>

      <div className="mt-3 text-sm">
        <div className="font-medium">Expected Output:</div>
        {level.expectedTruth ? (
          <table className="mt-2 text-xs border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-1">Input</th>
                <th className="border px-2 py-1">Output</th>
              </tr>
            </thead>
            <tbody>
              {level.expectedTruth.input.map((inp, idx) => (
                <tr key={inp}>
                  <td className="border px-2 py-1">{inp}</td>
                  <td className="border px-2 py-1">{level.expectedTruth!.output[idx]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-xs text-gray-500 italic">
            Parameterized gate — output depends on θ. The backend checks your unitary for any angle.
          </p>
        )}
      </div>
    </div>
  );
}
