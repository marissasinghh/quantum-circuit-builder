/**
 * App header: contains navigation links.
 */

import { Link } from "react-router-dom";

export function AppHeader() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex gap-6 text-sm font-medium items-center">
        <Link to="/levels" className="text-gray-900 font-semibold">
          Quantum Circuit Builder
        </Link>
        <Link className="text-gray-500 hover:text-gray-900 ml-auto" to="/settings">
          Settings
        </Link>
        <Link className="text-gray-500 hover:text-gray-900" to="/about">
          About
        </Link>
      </nav>
    </header>
  );
}
