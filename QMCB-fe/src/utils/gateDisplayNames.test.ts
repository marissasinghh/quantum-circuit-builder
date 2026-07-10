import { describe, expect, it } from "vitest";

import { Gate } from "../types/global";
import { formatGateDisplayName } from "./gateDisplayNames";

describe("formatGateDisplayName", () => {
  it("formats all 7 dagger gates with † suffix", () => {
    expect(formatGateDisplayName(Gate.SQRT_X_DAG)).toBe("√X†");
    expect(formatGateDisplayName(Gate.X_DAG)).toBe("X†");
    expect(formatGateDisplayName(Gate.Z_DAG)).toBe("Z†");
    expect(formatGateDisplayName(Gate.S_DAG)).toBe("S†");
    expect(formatGateDisplayName(Gate.T_DAG)).toBe("T†");
    expect(formatGateDisplayName(Gate.H_DAG)).toBe("H†");
    expect(formatGateDisplayName(Gate.Y_DAG)).toBe("Y†");
  });

  it("leaves standard gate labels unchanged", () => {
    expect(formatGateDisplayName(Gate.X)).toBe("X");
    expect(formatGateDisplayName(Gate.Z)).toBe("Z");
    expect(formatGateDisplayName(Gate.SQRT_X)).toBe("√X");
  });
});
