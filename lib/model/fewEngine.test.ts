import { describe, it, expect } from "vitest";
import { runFEWModel, SCENARIO_PRESETS } from "./fewEngine";

describe("runFEWModel", () => {
  it("runs all four presets without throwing", () => {
    for (const key of Object.keys(SCENARIO_PRESETS)) {
      const r = runFEWModel(SCENARIO_PRESETS[key]!);
      expect(r.timeline.length).toBeGreaterThan(0);
      expect(r.waterUseIndex).toBeGreaterThanOrEqual(0);
      expect(r.waterUseIndex).toBeLessThanOrEqual(100);
    }
  });

  it("rejects invalid energy mix sum", () => {
    expect(() =>
      runFEWModel({
        ...SCENARIO_PRESETS.baseline,
        energyMix: { solar: 0.6, wind: 0.6, hydro: 0, fossil: 0 },
      })
    ).toThrow(/Energy mix must sum/);
  });
});
