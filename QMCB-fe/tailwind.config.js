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
      },
      fontFamily: {
        mono: ["Space Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
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
