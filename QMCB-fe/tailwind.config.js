/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: { DEFAULT: "#080c18", light: "#0a0e1a" },
        navy: { DEFAULT: "#0d1226", light: "#111a36" },
        grid: "#1e3a5f",
        cyan: { DEFAULT: "#4fc3f7", muted: "#80deea" },
        slate: { DEFAULT: "#546e7a", muted: "#37474f" },
        "wire-off": "#1e3a5f",

        // Background layers (deepest → most elevated)
        "bg-app": "#0d1526",
        "bg-sidebar": "#0a1220",
        "bg-panel": "#111d35",
        "bg-elevated": "#162840",
        "bg-hover": "#1c2e4a",

        // 3-tier accent hierarchy
        tier1: "rgba(89, 155, 195, 0.14)",
        tier2: "#3d6880",
        tier3: "#7dc4e0",

        // Body text
        "text-body": "#aecce0",
        "text-muted": "#2e5268",

        // Semantic
        "match-bg": "rgba(40, 100, 70, 0.12)",
        "mismatch-bg": "rgba(150, 55, 55, 0.10)",
        "mismatch-text": "#a06868",
        "error-action": "#a05555",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Figtree", "sans-serif"],
      },
      borderRadius: {
        gate: "4px",
        panel: "6px",
      },
      borderWidth: {
        panel: "1px",
      },
      boxShadow: {
        wire: "0 0 6px rgba(79,195,247,0.4)",
        glow: "0 0 10px rgba(79,195,247,0.2)",
      },
    },
  },
  plugins: [],
};
