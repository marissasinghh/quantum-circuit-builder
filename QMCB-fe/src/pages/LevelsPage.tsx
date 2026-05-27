import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLevelProgress } from "../hooks/useLevelProgress";
import { LEVEL_ORDER } from "../config/levels";
import type { LevelDefinition } from "../interfaces/levelDefinition";
import { FirstRunOnboarding, hasLevelProgress } from "../components/FirstRunOnboarding";

type LevelStatus = "locked" | "unlocked" | "completed";

function getLevelStatus(
  index: number,
  level: LevelDefinition,
  completedLevels: string[]
): LevelStatus {
  if (level.locked) return "locked";

  const isCompleted = completedLevels.includes(level.target_unitary);
  const isUnlocked =
    index === 0 || completedLevels.includes(LEVEL_ORDER[index - 1].target_unitary);

  if (isCompleted) return "completed";
  if (isUnlocked) return "unlocked";
  return "locked";
}

function levelNumber(index: number): string {
  if (index < 7) return `1.${index}`;
  return `2.${index - 6}`;
}

function LevelCard({
  level,
  status,
  levelNum,
  onClick,
}: {
  level: LevelDefinition;
  status: LevelStatus;
  levelNum: string;
  onClick: () => void;
}) {
  const isLocked = status === "locked";

  let cardClass =
    "rounded-panel border p-4 flex flex-col gap-2 transition select-none ";
  if (isLocked) {
    cardClass += "bg-navy border-grid text-slate cursor-not-allowed opacity-60";
  } else if (status === "completed") {
    cardClass += "bg-navy border-grid text-cyan-muted cursor-pointer hover:border-cyan-muted";
  } else {
    cardClass += "bg-navy border-grid text-cyan cursor-pointer hover:border-cyan";
  }

  return (
    <div onClick={isLocked ? undefined : onClick} className={cardClass}>
      <div className="flex items-center justify-between font-mono text-[9px] text-slate">
        <span>LEVEL {levelNum}</span>
        {status === "completed" && <span className="text-cyan">✓</span>}
        {status === "locked" && <span className="text-slate-muted">—</span>}
      </div>

      <p className="font-mono text-sm font-bold tracking-wide">{level.target_unitary}</p>

      <span className="font-sans text-[10px] text-slate">
        {level.number_of_qubits === 1 ? "1-qubit" : "2-qubit"}
      </span>
    </div>
  );
}

function TierSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: { level: LevelDefinition; index: number; status: LevelStatus }[];
  onNavigate: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-[9px] tracking-[0.12em] text-slate-muted uppercase">
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(({ level, index, status }) => (
          <LevelCard
            key={level.target_unitary}
            level={level}
            status={status}
            levelNum={levelNumber(index)}
            onClick={() => onNavigate(level.target_unitary)}
          />
        ))}
      </div>
    </section>
  );
}

export default function LevelsPage() {
  const { completedLevels } = useLevelProgress();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(() => !hasLevelProgress());

  if (showOnboarding) {
    return (
      <FirstRunOnboarding
        variant="fullscreen"
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  const allItems = LEVEL_ORDER.map((level, index) => ({
    level,
    index,
    status: getLevelStatus(index, level, completedLevels),
  }));

  const tier1 = allItems.filter((item) => item.level.number_of_qubits === 1);
  const tier2 = allItems.filter((item) => item.level.number_of_qubits === 2);

  return (
    <main className="flex-1 overflow-y-auto canvas-grid p-6 space-y-8">
      <div>
        <p className="font-mono text-[9px] tracking-[0.1em] text-cyan mb-1">// LEVELS</p>
        <h1 className="font-mono text-base font-bold text-cyan">Choose a Level</h1>
        <p className="font-sans text-[11px] text-cyan-muted mt-1">
          Pick a level from the grid, or use the sidebar to jump straight in.
        </p>
      </div>
      <TierSection
        title="Tier 1 — Single Qubit"
        items={tier1}
        onNavigate={(id) => navigate("/level/" + id)}
      />
      <TierSection
        title="Tier 2 — Two Qubit"
        items={tier2}
        onNavigate={(id) => navigate("/level/" + id)}
      />
    </main>
  );
}
