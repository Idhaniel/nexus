import type { ScenarioParameters } from "@/lib/model/fewEngine";

export function validateScenarioParameters(
  raw: unknown
): { ok: true; params: ScenarioParameters } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "parameters must be an object" };
  }
  const p = raw as Record<string, unknown>;
  const num = (k: string, min: number, max: number) => {
    const v = p[k];
    if (typeof v !== "number" || Number.isNaN(v)) return `${k} must be a number`;
    if (v < min || v > max) return `${k} must be between ${min} and ${max}`;
    return null;
  };

  const e = num("irrigationEfficiency", 0, 1);
  if (e) return { ok: false, error: e };
  const e2 = num("cropIntensity", 0, 1);
  if (e2) return { ok: false, error: e2 };
  const e3 = num("waterRecyclingRate", 0, 1);
  if (e3) return { ok: false, error: e3 };
  const e4 = num("populationGrowthRate", -0.05, 0.1);
  if (e4) return { ok: false, error: e4 };
  const e5 = num("subsidyLevel", 0, 1);
  if (e5) return { ok: false, error: e5 };
  const e6 = num("technologyAdoptionRate", 0, 1);
  if (e6) return { ok: false, error: e6 };
  const th = p.timeHorizonYears;
  if (
    typeof th !== "number" ||
    !Number.isInteger(th) ||
    th < 1 ||
    th > 20
  ) {
    return { ok: false, error: "timeHorizonYears must be integer 1–20" };
  }

  const mix = p.energyMix;
  if (!mix || typeof mix !== "object") {
    return { ok: false, error: "energyMix required" };
  }
  const m = mix as Record<string, unknown>;
  for (const k of ["solar", "wind", "hydro", "fossil"] as const) {
    const v = m[k];
    if (typeof v !== "number" || v < 0 || v > 1) {
      return { ok: false, error: `energyMix.${k} must be 0–1` };
    }
  }
  const sum =
    (m.solar as number) +
    (m.wind as number) +
    (m.hydro as number) +
    (m.fossil as number);
  if (Math.abs(sum - 1) > 0.01) {
    return { ok: false, error: `energy mix must sum to 1, got ${sum}` };
  }

  return {
    ok: true,
    params: {
      irrigationEfficiency: p.irrigationEfficiency as number,
      energyMix: {
        solar: m.solar as number,
        wind: m.wind as number,
        hydro: m.hydro as number,
        fossil: m.fossil as number,
      },
      cropIntensity: p.cropIntensity as number,
      waterRecyclingRate: p.waterRecyclingRate as number,
      populationGrowthRate: p.populationGrowthRate as number,
      subsidyLevel: p.subsidyLevel as number,
      technologyAdoptionRate: p.technologyAdoptionRate as number,
      timeHorizonYears: th,
    },
  };
}
