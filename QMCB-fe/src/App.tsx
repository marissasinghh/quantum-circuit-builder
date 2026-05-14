import { Routes, Route, Navigate } from "react-router-dom";
import { AppHeader } from "./components/AppHeader";
import LevelsPage from "./pages/LevelsPage";
import SolveLevelPage from "./pages/SolveLevelPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <div className="min-h-screen text-gray-900">
      <AppHeader />
      <Routes>
        <Route path="/"           element={<Navigate to="/levels" replace />} />
        <Route path="/levels"     element={<LevelsPage />} />
        <Route path="/level/:id"  element={<SolveLevelPage />} />
        <Route path="/about"      element={<AboutPage />} />
        <Route path="/settings"   element={<SettingsPage />} />
      </Routes>
    </div>
  );
}
