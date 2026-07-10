import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { FirstRunOnboarding, isOnboardingComplete } from "./components/FirstRunOnboarding";
import { AppHeader } from "./components/AppHeader";
import LevelsPage from "./pages/LevelsPage";
import MySolutionsPage from "./pages/MySolutionsPage";
import SolveLevelPage from "./pages/SolveLevelPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import { LevelProgressProvider, useLevelProgress } from "./hooks/useLevelProgress";
import { LEVEL_ORDER, getLevelStatus, getLevelNumber } from "./config/levels";
import { GateDisplayLabel } from "./components/GateDisplayLabel";

function LevelSidebar() {
  const { completedLevels, skippedLevels, advancedPastLevels } = useLevelProgress();
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = location.pathname.startsWith("/level/")
    ? location.pathname.replace("/level/", "")
    : null;

  const allItems = LEVEL_ORDER.map((level, index) => ({
    level,
    index,
    status: getLevelStatus(index, level, completedLevels, skippedLevels, advancedPastLevels),
  }));

  const tier1 = allItems.filter((item) => item.level.number_of_qubits === 1);
  const tier2 = allItems.filter((item) => item.level.number_of_qubits === 2);
  const tier3 = allItems.filter((item) => item.level.number_of_qubits === 3);

  function renderTier(title: string, items: typeof tier1) {
    return (
      <div>
        <div className="pt-2 pb-1 section-heading whitespace-nowrap">
          {title}
        </div>
        {items.map(({ level, index, status }) => {
          const isLocked = status === "locked";
          const isActive = activeId === level.target_unitary;

          let rowClass =
            "nav-level-row py-1 select-none whitespace-nowrap ";
          if (isActive) {
            rowClass +=
              "text-text-emphasis bg-bg-elevated border-l-2 border-tier3 pl-[10px] cursor-pointer";
          } else if (isLocked) {
            rowClass += "text-text-faint pl-3 cursor-not-allowed opacity-60";
          } else {
            // reachable: completed, skipped, or unlocked-not-started
            rowClass +=
              "text-text-secondary pl-3 cursor-pointer hover:bg-bg-hover hover:text-text-body";
          }

          return (
            <div
              key={level.target_unitary}
              onClick={isLocked ? undefined : () => navigate("/level/" + level.target_unitary)}
              className={`${rowClass} flex items-center`}
            >
              <span>
                {getLevelNumber(index)}{" "}
                {level.name != null ? (
                  <GateDisplayLabel label={level.name} />
                ) : (
                  <GateDisplayLabel gate={level.target_unitary} />
                )}
              </span>
              {status === "skipped" && <span className="text-text-faint ml-auto pr-1">⏭</span>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <aside
      className="hidden sm:block sm:shrink sm:basis-[180px] sm:min-w-[120px] bg-bg-sidebar border-r border-tier1 overflow-y-auto panel-scroll h-full px-3"
    >
      {renderTier("TIER 1 — SINGLE QUBIT", tier1)}
      {renderTier("TIER 2 — TWO QUBIT", tier2)}
      {renderTier("TIER 3 — THREE QUBIT", tier3)}
    </aside>
  );
}

function AppShell() {
  const location = useLocation();
  const fullWidthRoutes = ["/levels", "/solutions"];
  const showSidebar = !fullWidthRoutes.includes(location.pathname);

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
            <Route path="/solutions" element={<MySolutionsPage />} />
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
