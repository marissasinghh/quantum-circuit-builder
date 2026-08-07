import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Gate } from "../types/global";
import { ToolboxDraggableChip } from "./ToolboxDraggableChip";

/**
 * Phase 6 regression: confirms the shared "3-qubit chip" plumbing added for Toffoli
 * (taller chip variant, glyph-vs-label branching) doesn't leak onto Fredkin just
 * because both are three-qubit gates in the `Gate` enum. Real app code never reaches
 * this component for FREDKIN (Gateset.tsx / MobileSolveLayout.tsx gate on
 * GATE_UI_CONFIG[gate] first — see toffoliUnlockToSubmit.test.ts) — this test forces
 * the component to render it directly to prove the internal branching is also safe
 * in isolation, not just safe because of the upstream guard.
 */
describe("ToolboxDraggableChip — 3-qubit plumbing does not leak from TOFFOLI to FREDKIN", () => {
  it("renders TOFFOLI with the 3-wire Toffoli glyph and the taller chip height", () => {
    const markup = renderToStaticMarkup(
      <ToolboxDraggableChip
        gate={Gate.TOFFOLI}
        toolId="tool-toffoli"
        completedLevels={[]}
        skippedLevels={[]}
      />
    );
    expect(markup).toContain('aria-label="Toffoli"');
    expect(markup).toContain("h-[72px]");
  });

  it("renders FREDKIN as a plain text-label chip (no Toffoli glyph, no taller chip height)", () => {
    const markup = renderToStaticMarkup(
      <ToolboxDraggableChip
        gate={Gate.FREDKIN}
        toolId="tool-fredkin-hypothetical"
        completedLevels={[]}
        skippedLevels={[]}
      />
    );
    expect(markup).not.toContain('aria-label="Toffoli"');
    expect(markup).not.toContain('aria-label="Fredkin"');
    expect(markup).not.toContain("h-[72px]");
    // Falls through to the default text-label branch, same as any unconfigured gate.
    expect(markup).toContain("FREDKIN");
  });
});
