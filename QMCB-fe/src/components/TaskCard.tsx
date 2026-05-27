/**
 * Task Card: displays current level's task description and expected truth table.
 */

import { useState } from "react";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { TruthTableDTO } from "../interfaces/truthTable";
import { LEVEL_ORDER } from "../config/levels";
import { MathText } from "./MathText";

interface TaskCardProps {
  level: LevelDefinition;
  dynamicTruth?: TruthTableDTO;
  onNewUnitary?: () => void;
}

function levelNumber(index: number): string {
  if (index < 7) return `1.${index}`;
  return `2.${index - 6}`;
}

export function TaskCard({ level, dynamicTruth, onNewUnitary }: TaskCardProps) {
  const truth = dynamicTruth ?? level.expectedTruth;
  const [shownHint, setShownHint] = useState<1 | 2 | null>(null);

  const levelIndex = LEVEL_ORDER.findIndex(
    (l) => l.target_unitary === level.target_unitary
  );
  const levelLabel = levelIndex >= 0 ? levelNumber(levelIndex) : level.target_unitary;

  function toggleHint(n: 1 | 2) {
    setShownHint((prev) => (prev === n ? null : n));
  }

  const hintText = shownHint === 1 ? level.hint1 : shownHint === 2 ? level.hint2 : null;

  const hintBtnBase =
    "font-mono text-[11px] px-2 py-0.5 rounded-gate border transition-colors";
  const hintBtnActive = "bg-grid border-cyan text-cyan";
  const hintBtnIdle =
    "border-grid text-slate hover:border-cyan-muted hover:text-cyan-muted";

  return (
    <div className="bg-navy border border-grid rounded-panel px-2.5 py-2 shrink-0">
      <p className="font-mono text-[11px] tracking-[0.1em] text-cyan mb-1">
        {`// LEVEL ${levelLabel}`}
      </p>
      <MathText
        text={level.description}
        className="font-sans text-[13px] text-cyan-muted leading-relaxed"
      />

      <div className="mt-2">
        <div className="font-mono text-[10px] text-slate-muted uppercase tracking-wide mb-1">
          Expected Output
        </div>
        {truth ? (
          <>
            <table className="inline-table font-mono text-[11px] border-collapse [&_th]:text-left [&_td]:text-left">
              <thead>
                <tr className="text-slate-muted border-b border-grid">
                  <th className="py-0.5 pr-6 max-w-[60px]">In</th>
                  <th className="py-0.5">Out</th>
                </tr>
              </thead>
              <tbody className="text-cyan-muted">
                {truth.input.map((inp, idx) => (
                  <tr key={inp}>
                    <td className="py-0.5 pr-6 max-w-[60px]">{inp}</td>
                    <td className="py-0.5">{truth.output[idx]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {onNewUnitary && (
              <button
                onClick={onNewUnitary}
                className="mt-2 font-mono text-[11px] text-cyan hover:text-cyan-muted underline"
              >
                Try a different unitary
              </button>
            )}
          </>
        ) : (
          <p className="font-sans text-[12px] text-slate italic">
            Parameterized gate — output depends on θ. The backend checks your unitary for any angle.
          </p>
        )}
      </div>

      {(level.hint1 || level.hint2) && (
        <div className="mt-3 border-t border-grid pt-2">
          <div className="flex gap-2">
            {level.hint1 && (
              <button
                onClick={() => toggleHint(1)}
                className={`${hintBtnBase} ${shownHint === 1 ? hintBtnActive : hintBtnIdle}`}
              >
                Hint 1
              </button>
            )}
            {level.hint2 && (
              <button
                onClick={() => toggleHint(2)}
                className={`${hintBtnBase} ${shownHint === 2 ? hintBtnActive : hintBtnIdle}`}
              >
                Hint 2
              </button>
            )}
          </div>

          {hintText && (
            <p className="mt-2 font-sans text-[12px] text-cyan-muted bg-navy-light border border-grid rounded-panel px-2 py-1.5 leading-relaxed">
              {hintText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
