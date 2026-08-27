/**
 * App header: contains navigation links.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { to: "/levels", label: "Levels" },
  { to: "/solutions", label: "My Solutions" },
  { to: "/help", label: "Help" },
  { to: "/settings", label: "Settings" },
  { to: "/about", label: "About" },
  { to: "/feedback", label: "Feedback" },
] as const;

const NAV_LINK_CLASS =
  "font-sans text-[13px] text-tier2 hover:text-tier3 transition-colors";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M3 4.5h12M3 9h12M3 13.5h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    function handleChange() {
      if (media.matches) setMenuOpen(false);
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <header className="relative z-modal bg-[#090f1d] border-b border-tier1 h-10 shrink-0">
      <nav className="px-4 py-2.5 flex items-center h-full">
        <Link
          to="/levels"
          className="font-mono text-[14px] text-tier3 tracking-[0.05em] hover:text-tier3/80 whitespace-nowrap shrink-0"
        >
          ⟨ψ| CNOT GAME |ψ⟩
        </Link>
        <div className="ml-auto hidden sm:flex items-center gap-4">
          {NAV_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className={NAV_LINK_CLASS}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto sm:hidden relative" ref={menuRef}>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center justify-center text-tier2 hover:text-tier3 transition-colors p-1 -mr-1"
          >
            <MenuIcon />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-modal min-w-[180px] bg-bg-panel border border-tier1 rounded-panel py-1"
              role="menu"
            >
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={`${NAV_LINK_CLASS} block px-4 py-2 hover:bg-bg-hover`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
