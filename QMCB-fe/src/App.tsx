import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { FirstRunOnboarding, isOnboardingComplete } from "./components/FirstRunOnboarding";
import { AppHeader } from "./components/AppHeader";
import LevelsPage from "./pages/LevelsPage";
import SolveLevelPage from "./pages/SolveLevelPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import { LevelProgressProvider, useLevelProgress } from "./hooks/useLevelProgress";
import { LEVEL_ORDER } from "./config/levels";
import type { LevelDefinition } from "./interfaces/levelDefinition";

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

function LevelSidebar() {
  const { completedLevels } = useLevelProgress();
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = location.pathname.startsWith("/level/")
    ? location.pathname.replace("/level/", "")
    : null;

  const allItems = LEVEL_ORDER.map((level, index) => ({
    level,
    index,
    status: getLevelStatus(index, level, completedLevels),
  }));

  const tier1 = allItems.filter((item) => item.level.number_of_qubits === 1);
  const tier2 = allItems.filter((item) => item.level.number_of_qubits === 2);

  function renderTier(title: string, items: typeof tier1) {
    return (
      <div>
        <div className="pt-2 pb-1 font-mono text-[8px] tracking-[0.09em] text-text-muted uppercase whitespace-nowrap">
          {title}
        </div>
        {items.map(({ level, index, status }) => {
          const isLocked = status === "locked";
          const isActive = activeId === level.target_unitary;

          return (
            <div
              key={level.target_unitary}
              onClick={isLocked ? undefined : () => navigate("/level/" + level.target_unitary)}
              className={[
                "py-1 font-mono text-[11px] cursor-pointer select-none whitespace-nowrap",
                isActive ? "text-text-body bg-bg-elevated border-l-2 border-tier3 pl-[10px]" : "text-text-muted pl-3",
                isLocked ? "cursor-not-allowed opacity-60" : !isActive ? "hover:bg-bg-hover" : "",
              ].join(" ")}
            >
              {levelNumber(index)} {level.target_unitary}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <aside
      className="hidden sm:block sm:shrink sm:basis-[180px] sm:min-w-[120px] bg-bg-sidebar border-r border-tier1 overflow-y-auto h-full px-3"
    >
      {renderTier("TIER 1 — SINGLE QUBIT", tier1)}
      {renderTier("TIER 2 — TWO QUBIT", tier2)}
    </aside>
  );
}

function AppShell() {
  const location = useLocation();
  const showSidebar = location.pathname !== "/levels";

  return (
    <div className="h-screen flex flex-col bg-bg-app text-text-body">
      <AppHeader />
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col sm:flex-row">
        {showSidebar && <LevelSidebar />}
        <div className="flex flex-1 min-w-0 min-h-0 w-full flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/levels" replace />} />
            <Route path="/levels" element={<LevelsPage />} />
            <Route
              path="/level/:id"
              element={
                <div className="flex flex-1 min-h-0 w-full min-w-0">
                  <SolveLevelPage />
                </div>
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(isOnboardingComplete);

  if (!onboardingDone) {
    return <FirstRunOnboarding onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <LevelProgressProvider>
      <AppShell />
    </LevelProgressProvider>
  );
}
