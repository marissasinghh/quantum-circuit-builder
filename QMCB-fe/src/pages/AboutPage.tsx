import { FirstRunOnboarding } from "../components/FirstRunOnboarding";

export default function AboutPage() {
  return (
    <main className="flex-1 overflow-y-auto canvas-grid p-6 bg-bg-app">
      <div className="max-w-[620px] mx-auto">
        <p className="font-mono text-[11px] tracking-[0.12em] text-cyan uppercase mb-3">
          {"// about"}
        </p>
        <h1
          className="page-heading text-[28px] text-tier3 leading-[1.2] mb-2"
          style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600 }}
        >
          About
        </h1>
        <p className="font-sans text-[14px] text-slate italic mb-10">
          A quick intro to how this app thinks about qubits.
        </p>
        <FirstRunOnboarding variant="inline" />
      </div>
    </main>
  );
}
