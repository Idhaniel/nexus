/**
 * FEW Nexus Modeling Engine
 * Implements system dynamics approximations for Food–Energy–Water interactions.
 * Based on methodology from: Cai et al. (2018), Bazilian et al. (2011), Howells et al. (2013)
 *
 * All outputs are normalized indices (0–100) PLUS real-world estimates for Nigeria context.
 */

export interface ScenarioParameters {
  irrigationEfficiency: number;
  energyMix: {
    solar: number;
    wind: number;
    hydro: number;
    fossil: number;
  };
  cropIntensity: number;
  waterRecyclingRate: number;
  populationGrowthRate: number;
  subsidyLevel: number;
  technologyAdoptionRate: number;
  timeHorizonYears: number;
}

export interface FEWOutputYear {
  year: number;
  waterUse: number;
  energyUse: number;
  foodOutput: number;
  waterUseAbsolute: number;
  energyUseAbsolute: number;
  foodOutputAbsolute: number;
}

export interface SensitivityResult {
  parameterName: string;
  impactOnWater: number;
  impactOnEnergy: number;
  impactOnFood: number;
  overallSensitivity: number;
}

export interface FEWModelResult {
  waterUseIndex: number;
  energyUseIndex: number;
  foodOutputIndex: number;
  waterUseAbsolute: number;
  energyUseAbsolute: number;
  foodOutputAbsolute: number;
  waterUseLower: number;
  waterUseUpper: number;
  energyUseLower: number;
  energyUseUpper: number;
  foodOutputLower: number;
  foodOutputUpper: number;
  timeline: FEWOutputYear[];
  sensitivityAnalysis: SensitivityResult[];
  modelVersion: string;
  executionTimeMs: number;
}

type ScalarScenarioParameterKey = Exclude<
  keyof ScenarioParameters,
  "energyMix" | "timeHorizonYears"
>;

type EnergyMixSensitivityKey = `energyMix.${keyof ScenarioParameters["energyMix"]}`;

type SensitivityParameterName = ScalarScenarioParameterKey | EnergyMixSensitivityKey;

const NIGERIA_BASELINE = {
  waterUse: 14.5,
  energyUse: 28.4,
  foodOutput: 180,
  population: 230,
};

function computeYearFEW(
  params: ScenarioParameters,
  year: number,
  baseYear: number = 0
): { water: number; energy: number; food: number } {
  const t = year - baseYear;
  const popFactor = Math.pow(1 + params.populationGrowthRate, t);

  const waterDemand = popFactor * params.cropIntensity;
  const waterSaved =
    params.irrigationEfficiency * 0.6 + params.waterRecyclingRate * 0.3;
  const hydroWaterPenalty = params.energyMix.hydro * 0.15;
  const bioenergyWaterPenalty = params.technologyAdoptionRate * 0.05;
  let water =
    waterDemand * (1 - waterSaved) + hydroWaterPenalty + bioenergyWaterPenalty;

  const energyDemandBase = popFactor * (0.5 + params.cropIntensity * 0.4);
  const renewableFraction = params.energyMix.solar + params.energyMix.wind;
  const energySaving =
    renewableFraction * 0.25 + params.technologyAdoptionRate * 0.1;
  const irrigationEnergy = (1 - params.irrigationEfficiency) * 0.2;
  let energy = energyDemandBase * (1 - energySaving) + irrigationEnergy;
  if (params.subsidyLevel > 0.5) energy *= 1.05;

  const waterScarcityPenalty = Math.max(0, water - 0.7) * 0.3;
  const techBoost = params.technologyAdoptionRate * 0.2;
  const subsidyBoost = params.subsidyLevel * 0.1;
  let food =
    popFactor *
    params.cropIntensity *
    (1 + techBoost + subsidyBoost - waterScarcityPenalty);
  food *= 0.4 + params.irrigationEfficiency * 0.6;

  return { water, energy, food };
}

function normalize(value: number, min: number, max: number): number {
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(((clamped - min) / (max - min)) * 100);
}

export function runFEWModel(params: ScenarioParameters): FEWModelResult {
  const start = performance.now();

  const mixSum =
    params.energyMix.solar +
    params.energyMix.wind +
    params.energyMix.hydro +
    params.energyMix.fossil;
  if (Math.abs(mixSum - 1) > 0.01) {
    throw new Error(`Energy mix must sum to 1.0, got ${mixSum}`);
  }

  const timeline: FEWOutputYear[] = [];
  for (let y = 0; y <= params.timeHorizonYears; y++) {
    const raw = computeYearFEW(params, y);
    const waterAbs = NIGERIA_BASELINE.waterUse * raw.water;
    const energyAbs = NIGERIA_BASELINE.energyUse * raw.energy;
    const foodAbs = NIGERIA_BASELINE.foodOutput * raw.food;
    timeline.push({
      year: 2024 + y,
      waterUse: normalize(raw.water, 0.2, 2.0),
      energyUse: normalize(raw.energy, 0.3, 2.5),
      foodOutput: normalize(raw.food, 0.1, 2.0),
      waterUseAbsolute: Math.round(waterAbs * 10) / 10,
      energyUseAbsolute: Math.round(energyAbs * 10) / 10,
      foodOutputAbsolute: Math.round(foodAbs * 10) / 10,
    });
  }

  const finalYear = timeline[timeline.length - 1];

  const UNCERTAINTY = 0.08;
  const waterUseLower = Math.max(0, finalYear.waterUse * (1 - UNCERTAINTY));
  const waterUseUpper = Math.min(100, finalYear.waterUse * (1 + UNCERTAINTY));
  const energyUseLower = Math.max(0, finalYear.energyUse * (1 - UNCERTAINTY));
  const energyUseUpper = Math.min(100, finalYear.energyUse * (1 + UNCERTAINTY));
  const foodOutputLower = Math.max(0, finalYear.foodOutput * (1 - UNCERTAINTY));
  const foodOutputUpper = Math.min(100, finalYear.foodOutput * (1 + UNCERTAINTY));

  const DELTA = 0.05;
  const paramNames: SensitivityParameterName[] = [
    "irrigationEfficiency",
    "cropIntensity",
    "waterRecyclingRate",
    "populationGrowthRate",
    "subsidyLevel",
    "technologyAdoptionRate",
    "energyMix.solar",
    "energyMix.fossil",
  ];

  const isScalarParameter = (
    name: SensitivityParameterName
  ): name is ScalarScenarioParameterKey => !name.startsWith("energyMix.");

  const sensitivityAnalysis: SensitivityResult[] = paramNames.map((name) => {
    const pPlus = structuredClone(params) as ScenarioParameters;
    const pMinus = structuredClone(params) as ScenarioParameters;

    if (isScalarParameter(name)) {
      pPlus[name] = Math.min(1, params[name] + DELTA);
      pMinus[name] = Math.max(0, params[name] - DELTA);
    } else {
      const key = name.split(".")[1] as keyof typeof params.energyMix;
      pPlus.energyMix[key] = Math.min(1, params.energyMix[key] + DELTA);
      pMinus.energyMix[key] = Math.max(0, params.energyMix[key] - DELTA);
    }

    const rPlus = computeYearFEW(pPlus, params.timeHorizonYears);
    const rMinus = computeYearFEW(pMinus, params.timeHorizonYears);
    const base = computeYearFEW(params, params.timeHorizonYears);

    const dWater =
      Math.abs(rPlus.water - rMinus.water) / (2 * DELTA * base.water + 0.001);
    const dEnergy =
      Math.abs(rPlus.energy - rMinus.energy) /
      (2 * DELTA * base.energy + 0.001);
    const dFood =
      Math.abs(rPlus.food - rMinus.food) / (2 * DELTA * base.food + 0.001);
    const overall = (dWater + dEnergy + dFood) / 3;

    return {
      parameterName: name,
      impactOnWater: Math.round(dWater * 100) / 100,
      impactOnEnergy: Math.round(dEnergy * 100) / 100,
      impactOnFood: Math.round(dFood * 100) / 100,
      overallSensitivity: Math.round(overall * 100) / 100,
    };
  });

  const executionTimeMs = Math.round(performance.now() - start);

  return {
    waterUseIndex: finalYear.waterUse,
    energyUseIndex: finalYear.energyUse,
    foodOutputIndex: finalYear.foodOutput,
    waterUseAbsolute: finalYear.waterUseAbsolute,
    energyUseAbsolute: finalYear.energyUseAbsolute,
    foodOutputAbsolute: finalYear.foodOutputAbsolute,
    waterUseLower,
    waterUseUpper,
    energyUseLower,
    energyUseUpper,
    foodOutputLower,
    foodOutputUpper,
    timeline,
    sensitivityAnalysis,
    modelVersion: "1.0.0",
    executionTimeMs,
  };
}

export const SCENARIO_PRESETS: Record<string, ScenarioParameters> = {
  baseline: {
    irrigationEfficiency: 0.45,
    energyMix: { solar: 0.05, wind: 0.03, hydro: 0.12, fossil: 0.8 },
    cropIntensity: 0.55,
    waterRecyclingRate: 0.1,
    populationGrowthRate: 0.025,
    subsidyLevel: 0.4,
    technologyAdoptionRate: 0.2,
    timeHorizonYears: 10,
  },
  efficiency: {
    irrigationEfficiency: 0.8,
    energyMix: { solar: 0.15, wind: 0.1, hydro: 0.15, fossil: 0.6 },
    cropIntensity: 0.55,
    waterRecyclingRate: 0.4,
    populationGrowthRate: 0.025,
    subsidyLevel: 0.3,
    technologyAdoptionRate: 0.55,
    timeHorizonYears: 10,
  },
  production_expansion: {
    irrigationEfficiency: 0.5,
    energyMix: { solar: 0.08, wind: 0.05, hydro: 0.12, fossil: 0.75 },
    cropIntensity: 0.9,
    waterRecyclingRate: 0.15,
    populationGrowthRate: 0.025,
    subsidyLevel: 0.7,
    technologyAdoptionRate: 0.35,
    timeHorizonYears: 10,
  },
  renewable_transition: {
    irrigationEfficiency: 0.6,
    energyMix: { solar: 0.3, wind: 0.25, hydro: 0.25, fossil: 0.2 },
    cropIntensity: 0.55,
    waterRecyclingRate: 0.3,
    populationGrowthRate: 0.025,
    subsidyLevel: 0.25,
    technologyAdoptionRate: 0.65,
    timeHorizonYears: 10,
  },
};
