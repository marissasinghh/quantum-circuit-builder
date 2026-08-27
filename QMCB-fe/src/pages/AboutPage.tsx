export default function AboutPage() {
  return (
    <main className="flex-1 overflow-y-auto canvas-grid p-6 bg-bg-app">
      <div className="max-w-[620px] mx-auto">
        <p className="page-eyebrow mb-3">
          {"// about"}
        </p>
        <h1 className="page-title mb-10">
          About
        </h1>
        <div className="space-y-4">
          <p className="text-body text-text-body leading-relaxed">
            Built by Marissa Singh in collaboration with Dr. Ryan LaRose.
          </p>
          <p className="text-body text-text-body leading-relaxed">
            The CNOT Game (
            <a
              href="https://cnotgame.com"
              className="text-tier2 hover:text-tier3 transition-colors"
            >
              cnotgame.com
            </a>
            ) is the quantum analog of The NAND Game. Just as students there
            build up from relays to NAND to a full CPU, CNOT Game students start
            from a minimal universal gateset, Rz(θ) and √X, and progressively
            construct every other quantum gate from scratch: X, S, T, Hadamard,
            CNOT variants, SWAP, Controlled-U, and eventually three-qubit gates
            like Toffoli and Fredkin. Each gate a student successfully builds
            unlocks as a reusable component for the next level, so the toolbox
            (and the student&apos;s understanding) grows level by level.
          </p>
          <p className="text-body text-text-body leading-relaxed">
            This is a fundamentally different approach from tools like IBM&apos;s
            Quantum Composer or standard Qiskit tutorials, which let students
            drag in pre-built gates and observe results. CNOT Game asks students
            to derive the gate before they&apos;re allowed to use it, so
            understanding is a prerequisite for progress, not an afterthought.
            The game also teaches core quantum concepts directly. For example, it
            demonstrates why verifying a circuit against basis states is
            sufficient to prove it&apos;s correct for all possible inputs
            (linearity), a foundational idea many students learn to cite without
            ever seeing it made concrete.
          </p>
          <p className="text-body text-text-body leading-relaxed">
            It&apos;s live now and has already run with real students at two
            events, a Berkeley Summer Camp alpha and MSU&apos;s Quantum Motor
            City beta. It&apos;s also built to extend in both directions: down
            toward how these same gates compile onto real hardware, and up toward
            quantum algorithms and eventually error correction, the same way The
            NAND Game&apos;s stack ends at a full CPU.
          </p>
          <p className="text-body text-text-body leading-relaxed">
            Right now we&apos;re focused on building better feedback channels and
            usage metrics so we can pinpoint exactly where students get stuck and
            make the tool more effective as a teaching aid. We&apos;d welcome
            feedback, beta testers, or the chance to pilot it in a classroom or
            camp setting.
          </p>
        </div>
      </div>
    </main>
  );
}
