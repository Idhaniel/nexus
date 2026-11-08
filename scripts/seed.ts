/**
 * Seed demo scenarios when SEED_USER_ID is set to a valid profiles.id (auth user).
 * Run: pnpm seed
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  runFEWModel,
  SCENARIO_PRESETS,
} from "../lib/model/fewEngine";
import {
  computeCombinedHash,
  hashParameters,
  hashResults,
  sha256,
} from "../lib/blockchain/hash";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SEED_USER_ID;

async function main() {
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!userId) {
    console.error("Set SEED_USER_ID to your Supabase auth user UUID (profiles.id).");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const presets = [
    { type: "baseline" as const, name: "Demo — Baseline" },
    { type: "efficiency" as const, name: "Demo — Efficiency" },
    { type: "production_expansion" as const, name: "Demo — Production expansion" },
    { type: "renewable_transition" as const, name: "Demo — Renewable transition" },
  ];

  for (const p of presets) {
    const params = SCENARIO_PRESETS[p.type];
    const result = runFEWModel(params);

    const { data: scenario, error: sErr } = await supabase
      .from("scenarios")
      .insert({
        user_id: userId,
        name: p.name,
        description: "Seeded preset scenario",
        type: p.type,
        status: "completed",
        parameters: params,
      })
      .select("id")
      .single();

    if (sErr || !scenario) {
      console.error("Scenario insert failed", sErr);
      continue;
    }

    const outputPayload = {
      waterUseIndex: result.waterUseIndex,
      energyUseIndex: result.energyUseIndex,
      foodOutputIndex: result.foodOutputIndex,
      waterUseAbsolute: result.waterUseAbsolute,
      energyUseAbsolute: result.energyUseAbsolute,
      foodOutputAbsolute: result.foodOutputAbsolute,
      waterUseLower: result.waterUseLower,
      waterUseUpper: result.waterUseUpper,
      energyUseLower: result.energyUseLower,
      energyUseUpper: result.energyUseUpper,
      foodOutputLower: result.foodOutputLower,
      foodOutputUpper: result.foodOutputUpper,
      timeline: result.timeline,
      sensitivityAnalysis: result.sensitivityAnalysis,
      modelVersion: result.modelVersion,
    };

    const inputHash = hashParameters(params);
    const parametersHash = hashParameters(params);
    const outputHash = hashResults(outputPayload);
    const modelVersionHash = sha256(result.modelVersion);
    const combinedHash = computeCombinedHash({
      inputHash,
      outputHash,
      parametersHash,
      modelVersionHash,
    });

    const { data: resRow, error: rErr } = await supabase
      .from("scenario_results")
      .insert({
        scenario_id: scenario.id,
        run_number: 1,
        water_use_index: result.waterUseIndex,
        energy_use_index: result.energyUseIndex,
        food_output_index: result.foodOutputIndex,
        water_use_absolute: result.waterUseAbsolute,
        energy_use_absolute: result.energyUseAbsolute,
        food_output_absolute: result.foodOutputAbsolute,
        water_use_lower: result.waterUseLower,
        water_use_upper: result.waterUseUpper,
        energy_use_lower: result.energyUseLower,
        energy_use_upper: result.energyUseUpper,
        food_output_lower: result.foodOutputLower,
        food_output_upper: result.foodOutputUpper,
        timeline_data: result.timeline,
        sensitivity_data: result.sensitivityAnalysis,
        model_version: result.modelVersion,
        execution_time_ms: result.executionTimeMs,
        input_hash: inputHash,
        output_hash: outputHash,
      })
      .select("id")
      .single();

    if (rErr || !resRow) {
      console.error("Result insert failed", rErr);
      continue;
    }

    await supabase.from("provenance_records").insert({
      scenario_id: scenario.id,
      result_id: resRow.id,
      input_hash: inputHash,
      output_hash: outputHash,
      parameters_hash: parametersHash,
      model_version_hash: modelVersionHash,
      combined_hash: combinedHash,
      transaction_hash:
        "0x" + "ab".repeat(32),
      block_number: 1,
      verification_status: "pending",
      network_name: "local-mock",
    });

    console.log("Seeded:", p.name, scenario.id);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
