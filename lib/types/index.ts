import type {
  FEWModelResult,
  FEWOutputYear,
  ScenarioParameters,
  SensitivityResult,
} from "@/lib/model/fewEngine";

export type ScenarioType =
  | "baseline"
  | "efficiency"
  | "production_expansion"
  | "renewable_transition"
  | "custom";

export type ScenarioStatus = "draft" | "running" | "completed" | "failed";

export type VerificationStatus = "pending" | "confirmed" | "failed";

export interface ScenarioRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  type: ScenarioType;
  status: ScenarioStatus;
  parameters: ScenarioParameters;
  created_at: string;
  updated_at: string;
}

export interface ScenarioResultRow {
  id: string;
  scenario_id: string;
  run_number: number;
  water_use_index: number;
  energy_use_index: number;
  food_output_index: number;
  water_use_absolute: number | null;
  energy_use_absolute: number | null;
  food_output_absolute: number | null;
  water_use_lower: number | null;
  water_use_upper: number | null;
  energy_use_lower: number | null;
  energy_use_upper: number | null;
  food_output_lower: number | null;
  food_output_upper: number | null;
  timeline_data: FEWOutputYear[] | null;
  sensitivity_data: SensitivityResult[] | null;
  model_version: string | null;
  execution_time_ms: number | null;
  input_hash: string | null;
  output_hash: string | null;
  created_at: string;
}

export interface ProvenanceRecordRow {
  id: string;
  scenario_id: string;
  result_id: string;
  input_hash: string;
  output_hash: string;
  parameters_hash: string;
  model_version_hash: string;
  combined_hash: string;
  transaction_hash: string | null;
  block_number: number | null;
  block_timestamp: string | null;
  contract_address: string | null;
  network_name: string | null;
  on_chain_record_id: number | null;
  verification_status: VerificationStatus;
  created_at: string;
}

export type { FEWModelResult, FEWOutputYear, ScenarioParameters, SensitivityResult };
