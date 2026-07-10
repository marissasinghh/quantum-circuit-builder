/**
 * App header: contains navigation links.
 */

import { Link } from "react-router-dom";

export function AppHeader() {
  return (
    <header className="bg-[#090f1d] border-b border-tier1 h-10 shrink-0">
      <nav className="px-4 py-2.5 flex items-center h-full">
        <Link
          to="/levels"
          className="font-mono text-[14px] text-tier3 tracking-[0.05em] hover:text-tier3/80"
        >
          ⟨ψ| CNOT GAME |ψ⟩
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link
            to="/levels"
            className="font-sans text-[13px] text-tier2 hover:text-tier3 transition-colors"
          >
            Levels
          </Link>
          <Link
            to="/about"
            className="font-sans text-[13px] text-tier2 hover:text-tier3 transition-colors"
          >
            About
          </Link>
          <Link
            to="/solutions"
            className="font-sans text-[13px] text-tier2 hover:text-tier3 transition-colors"
          >
            My Solutions
          </Link>
          <Link
            to="/settings"
            className="font-sans text-[13px] text-tier2 hover:text-tier3 transition-colors"
          >
            Settings
          </Link>
        </div>
      </nav>
    </header>
  );
}
