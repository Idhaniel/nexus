import { NextResponse } from "next/server";
import { runFEWModel } from "@/lib/model/fewEngine";
import {
  computeCombinedHash,
  hashParameters,
  hashResults,
  sha256,
} from "@/lib/blockchain/hash";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { validateScenarioParameters } from "@/lib/validation/scenario";
import { getRequestUser, userOwnsScenario } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scenarioId = body.scenarioId as string | undefined;
    const parameters = body.parameters;

    const v = validateScenarioParameters(parameters);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const result = runFEWModel(v.params);

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

    const inputHash = hashParameters(v.params);
    const parametersHash = hashParameters(v.params);
    const outputHash = hashResults(outputPayload);
    const modelVersionHash = sha256(result.modelVersion);
    const combinedHash = computeCombinedHash({
      inputHash,
      outputHash,
      parametersHash,
      modelVersionHash,
    });

    if (!scenarioId) {
      return NextResponse.json({
        result,
        inputHash,
        outputHash,
        parametersHash,
        modelVersionHash,
        combinedHash,
        saved: false,
      });
    }

    const user = await getRequestUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to save results." }, { status: 401 });
    }
    if (!(await userOwnsScenario(user.id, scenarioId))) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const supabase = createServiceRoleClient();

    const { count } = await supabase
      .from("scenario_results")
      .select("*", { count: "exact", head: true })
      .eq("scenario_id", scenarioId);

    const runNumber = (count ?? 0) + 1;

    const { data: inserted, error } = await supabase
      .from("scenario_results")
      .insert({
        scenario_id: scenarioId,
        run_number: runNumber,
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

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: error.message || "Failed to save results" },
        { status: 500 }
      );
    }

    await supabase
      .from("scenarios")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", scenarioId);

    return NextResponse.json({
      result,
      resultId: inserted?.id,
      inputHash,
      outputHash,
      parametersHash,
      modelVersionHash,
      combinedHash,
      saved: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Model run failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
