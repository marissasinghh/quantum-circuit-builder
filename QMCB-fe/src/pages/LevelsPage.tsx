import { useNavigate } from "react-router-dom";
import { useLevelProgress } from "../hooks/useLevelProgress";
import {
  LEVEL_ORDER,
  getLevelStatus,
  getLevelNumber,
  type LevelStatus,
} from "../config/levels";
import { GateDisplayLabel } from "../components/GateDisplayLabel";
import type { LevelDefinition } from "../interfaces/levelDefinition";

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
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
    cardClass +=
      "bg-navy border-tier1 text-slate cursor-not-allowed opacity-60 saturate-50";
  } else if (status === "completed") {
    cardClass += "bg-navy border-grid text-cyan-muted cursor-pointer hover:border-cyan-muted";
  } else if (status === "skipped") {
    cardClass +=
      "bg-navy border-grid text-slate opacity-80 cursor-pointer hover:border-grid hover:text-text-secondary";
  } else {
    cardClass += "bg-navy border-grid text-cyan cursor-pointer hover:border-cyan";
  }

  return (
    <div onClick={isLocked ? undefined : onClick} className={cardClass}>
      <div className="flex items-center justify-between level-label">
        <span>LEVEL {levelNum}</span>
        {status === "completed" && <span className="text-text-emphasis">✓</span>}
        {status === "skipped" && <span className="text-text-faint">⏭</span>}
        {status === "locked" && <LockIcon className="text-text-faint shrink-0" />}
      </div>

      <p className="nav-level-name">
        <GateDisplayLabel gate={level.target_unitary} />
      </p>
    </div>
  );
}

function LevelStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 level-label text-text-faint">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-sm border border-cyan bg-navy" aria-hidden />
        Available
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-text-emphasis">✓</span> Completed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span>⏭</span> Skipped
      </span>
      <span className="inline-flex items-center gap-1.5">
        <LockIcon className="text-text-faint" />
        Locked
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
      <h2 className="tier-section-title">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(({ level, index, status }) => (
          <LevelCard
            key={level.target_unitary}
            level={level}
            status={status}
            levelNum={getLevelNumber(index)}
            onClick={() => onNavigate(level.target_unitary)}
          />
        ))}
      </div>
    </section>
  );
}

export default function LevelsPage() {
  const { completedLevels, skippedLevels, advancedPastLevels } = useLevelProgress();
  const navigate = useNavigate();

  const allItems = LEVEL_ORDER.map((level, index) => ({
    level,
    index,
    status: getLevelStatus(index, level, completedLevels, skippedLevels, advancedPastLevels),
  }));

  const tier1 = allItems.filter((item) => item.level.number_of_qubits === 1);
  const tier2 = allItems.filter((item) => item.level.number_of_qubits === 2);
  const tier3 = allItems.filter((item) => item.level.number_of_qubits === 3);

  return (
    <main className="flex-1 overflow-y-auto panel-scroll canvas-grid p-6 space-y-8">
      <div>
        <p className="page-eyebrow mb-3">{"// levels"}</p>
        <h1 className="page-title mb-2">Choose a Level</h1>
        <p className="text-body text-text-secondary italic mb-4">
          Pick a level from the grid to start building.
        </p>
        <LevelStatusLegend />
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
      <TierSection
        title="Tier 3 — Three Qubit"
        items={tier3}
        onNavigate={(id) => navigate("/level/" + id)}
      />
    </main>
  );
}
