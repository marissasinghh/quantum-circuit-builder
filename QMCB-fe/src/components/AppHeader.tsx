/**
 * App header: contains navigation links.
 */

import { Link } from "react-router-dom";

export function AppHeader() {
  return (
    <header className="bg-navy border-b border-grid h-10 shrink-0">
      <nav className="px-4 py-2.5 flex items-center h-full">
        <Link
          to="/levels"
          className="font-mono text-[13px] font-bold text-cyan tracking-[0.05em] hover:text-cyan-muted"
        >
          ⟨ψ| CNOT GAME |ψ⟩
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link
            to="/levels"
            className="font-sans text-[11px] text-slate hover:text-cyan transition-colors"
          >
            Levels
          </Link>
          <Link
            to="/about"
            className="font-sans text-[11px] text-slate hover:text-cyan transition-colors"
          >
            About
          </Link>
          <Link
            to="/settings"
            className="font-sans text-[11px] text-slate hover:text-cyan transition-colors"
          >
            Settings
          </Link>
        </div>
      </nav>
    </header>
  );
}
