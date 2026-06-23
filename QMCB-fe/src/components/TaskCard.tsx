/**
 * Task Card: displays current level's task description and expected truth table.
 */

import { useState } from "react";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import type { TruthTableDTO } from "../interfaces/truthTable";
import { LEVEL_ORDER, getGateHeadingLabel, getLevelDisplayName, getLevelNumber } from "../config/levels";
import { MathText } from "./MathText";

interface TaskCardProps {
  level: LevelDefinition;
  dynamicTruth?: TruthTableDTO;
  onNewUnitary?: () => void;
}

export function TaskCard({ level, dynamicTruth, onNewUnitary }: TaskCardProps) {
  const truth = dynamicTruth ?? level.expectedTruth;
  const [shownHint, setShownHint] = useState<1 | 2 | null>(null);
  const [hint1Viewed, setHint1Viewed] = useState(false);

  const levelIndex = LEVEL_ORDER.findIndex(
    (l) => l.target_unitary === level.target_unitary
  );
  const levelLabel = levelIndex >= 0 ? getLevelNumber(levelIndex) : getLevelDisplayName(level);

  function toggleHint(n: 1 | 2) {
    if (n === 2 && !hint1Viewed) return;
    setShownHint((prev) => (prev === n ? null : n));
  }

  function handleHint1Click() {
    setHint1Viewed(true);
    toggleHint(1);
  }

  const hintText = shownHint === 1 ? level.hint1 : shownHint === 2 ? level.hint2 : null;

  const hintBtnBase =
    "font-mono text-[11px] px-2 py-0.5 rounded-gate border transition-colors";
  const hintBtnActive = "border-tier2 text-tier2";
  const hintBtnIdle = "border-tier2 text-tier2 hover:bg-bg-hover";
  const hint2Locked =
    "border-tier1 text-text-muted opacity-50 cursor-not-allowed";

  return (
    <div className="bg-bg-panel border border-tier1 rounded-panel px-2.5 py-2 shrink-0">
      <p className="level-label mb-0.5">
        {`// LEVEL ${levelLabel}`}
      </p>
      <p className="gate-name-heading mb-1">{getGateHeadingLabel(level)}</p>
      <MathText
        text={level.description ?? ""}
        className="task-description text-caption text-text-body leading-relaxed"
      />

      <div className="mt-2">
        <div className="level-label mb-1">
          EXPECTED OUTPUT
        </div>
        {truth ? (
          <>
            <table className="inline-table font-mono text-[11px] border-collapse [&_th]:text-left [&_td]:text-left">
              <thead>
                <tr className="text-text-muted border-b border-tier1">
                  <th className="py-0.5 pr-6 max-w-[60px]">In</th>
                  <th className="py-0.5">Out</th>
                </tr>
              </thead>
              <tbody className="text-tier2">
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
                className="mt-2 font-mono text-[11px] text-tier3 hover:text-tier3/80 underline"
              >
                Try a different unitary
              </button>
            )}
          </>
        ) : (
          <p className="font-sans text-[12px] text-tier2 italic">
            Parameterized gate — output depends on θ. The backend checks your unitary for any angle.
          </p>
        )}
      </div>

      {(level.hint1 || level.hint2) && (
        <div className="mt-3 border-t border-tier1 pt-2">
          <div className="flex gap-2">
            {level.hint1 && (
              <button
                onClick={handleHint1Click}
                className={`${hintBtnBase} ${shownHint === 1 ? hintBtnActive : hintBtnIdle}`}
              >
                Hint 1
              </button>
            )}
            {level.hint2 && (
              <button
                onClick={() => toggleHint(2)}
                disabled={!hint1Viewed}
                className={`${hintBtnBase} ${
                  !hint1Viewed
                    ? hint2Locked
                    : shownHint === 2
                      ? hintBtnActive
                      : hintBtnIdle
                }`}
              >
                Hint 2
              </button>
            )}
          </div>

          {hintText && (
            <MathText
              text={hintText}
              className="mt-2 font-sans text-[12px] text-text-body bg-bg-elevated border border-tier1 rounded-panel px-2 py-1.5 leading-relaxed block"
            />
          )}
        </div>
      )}
    </div>
  );
}
