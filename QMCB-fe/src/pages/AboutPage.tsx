import { FirstRunOnboarding } from "../components/FirstRunOnboarding";

export default function AboutPage() {
  return (
    <main className="flex-1 overflow-y-auto canvas-grid p-6 bg-bg-app">
      <div className="max-w-[620px] mx-auto">
        <p className="page-eyebrow mb-3">
          {"// about"}
        </p>
        <h1 className="page-title mb-2">
          About
        </h1>
        <p className="font-sans text-[14px] text-secondary italic mb-10">
          A quick intro to how this app thinks about qubits.
        </p>
        <FirstRunOnboarding variant="inline" />
      </div>
    </main>
  );
}
