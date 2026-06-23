/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: { DEFAULT: "#080c18", light: "#0a0e1a" },
        navy: { DEFAULT: "#0d1226", light: "#111a36" },
        grid: "#1e3a5f",
        cyan: { DEFAULT: "#4fc3f7", muted: "#9ec4d8" },
        slate: { DEFAULT: "#6a8494", muted: "#4a6474" },
        "wire-off": "#1e3a5f",

        "bg-app": "#0f1a2e",
        "bg-sidebar": "#0c1828",
        "bg-panel": "#162340",
        "bg-elevated": "#1a2e4a",
        "bg-hover": "#1f3455",

        tier1: "rgba(89, 155, 195, 0.16)",
        tier2: "#8ab4c8",
        tier3: "#9dd4ea",

        "text-body": "#c8dde8",
        "text-muted": "#3a6070",

        "bloch-label": "#8ab4c8",

        "match-bg": "rgba(40, 100, 70, 0.12)",
        "mismatch-bg": "rgba(150, 55, 55, 0.10)",
        "mismatch-text": "#a06868",
        "error-action": "#a05555",
      },
      fontFamily: {
        display: ["Exo 2", "sans-serif"],
        sans: ["Figtree", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
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
