"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParameterSlider } from "@/components/scenarios/ParameterSlider";
import { ScenarioResultDisplay } from "@/components/scenarios/ScenarioResult";
import {
  SCENARIO_PRESETS,
  type ScenarioParameters,
  type FEWModelResult,
} from "@/lib/model/fewEngine";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function normalizeMix(m: ScenarioParameters["energyMix"]) {
  const sum = m.solar + m.wind + m.hydro + m.fossil;
  if (sum === 0) {
    return { solar: 0.25, wind: 0.25, hydro: 0.25, fossil: 0.25 };
  }
  return {
    solar: m.solar / sum,
    wind: m.wind / sum,
    hydro: m.hydro / sum,
    fossil: m.fossil / sum,
  };
}

const TYPES = [
  { value: "baseline", label: "Baseline" },
  { value: "efficiency", label: "Efficiency" },
  { value: "production_expansion", label: "Production expansion" },
  { value: "renewable_transition", label: "Renewable transition" },
  { value: "custom", label: "Custom" },
] as const;

export function ScenarioBuilder() {
  const [name, setName] = useState("My FEW scenario");
  const [description, setDescription] = useState("");
  const [scenarioType, setScenarioType] =
    useState<(typeof TYPES)[number]["value"]>("baseline");
  const [params, setParams] = useState<ScenarioParameters>(
    SCENARIO_PRESETS.baseline
  );
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FEWModelResult | null>(null);
  const [hashes, setHashes] = useState<{
    inputHash: string;
    outputHash: string;
    parametersHash: string;
    modelVersionHash: string;
    combinedHash: string;
  } | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [chain, setChain] = useState<{
    status: "confirmed" | "pending" | "failed";
    txHash: string | null;
    recordId: number;
    alreadyRecorded?: boolean;
  } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const applyPreset = (t: (typeof TYPES)[number]["value"]) => {
    setScenarioType(t);
    if (t !== "custom" && SCENARIO_PRESETS[t]) {
      setParams(structuredClone(SCENARIO_PRESETS[t]));
    }
  };

  const setMix = (key: keyof ScenarioParameters["energyMix"], v: number) => {
    setParams((p) => {
      const next = { ...p, energyMix: { ...p.energyMix, [key]: v } };
      return { ...next, energyMix: normalizeMix(next.energyMix) };
    });
  };

  const runModel = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    setHashes(null);
    setChain(null);
    setScenarioId(null);
    setResultId(null);
    try {
      if (!supabase) {
        setError(
          "Supabase is not configured. Model simulation still works without saving scenarios."
        );
        const runRes = await fetch("/api/model/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parameters: params }),
        });
        const runJson = await runRes.json();
        if (!runRes.ok) {
          throw new Error(runJson.error || "Model run failed");
        }
        setResult(runJson.result as FEWModelResult);
        setHashes({
          inputHash: runJson.inputHash,
          outputHash: runJson.outputHash,
          parametersHash: runJson.parametersHash,
          modelVersionHash: runJson.modelVersionHash,
          combinedHash: runJson.combinedHash,
        });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in to create and save a scenario.");
        setLoading(false);
        return;
      }

      const createRes = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          type: scenarioType,
          parameters: params,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createJson.error || "Could not create scenario");
      }
      const sid = createJson.scenario.id as string;
      setScenarioId(sid);

      const runRes = await fetch("/api/model/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: sid, parameters: params }),
      });
      const runJson = await runRes.json();
      if (!runRes.ok) {
        throw new Error(runJson.error || "Model run failed");
      }
      setResult(runJson.result as FEWModelResult);
      setHashes({
        inputHash: runJson.inputHash,
        outputHash: runJson.outputHash,
        parametersHash: runJson.parametersHash,
        modelVersionHash: runJson.modelVersionHash,
        combinedHash: runJson.combinedHash,
      });
      if (runJson.resultId) setResultId(runJson.resultId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  };

  const recordChain = async () => {
    if (!scenarioId || !resultId || !hashes) return;
    setRecording(true);
    setError(null);
    try {
      const res = await fetch("/api/blockchain/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          resultId,
          ...hashes,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Recording failed");
      setChain({
        status: j.status,
        txHash: j.txHash ?? null,
        recordId: j.recordId ?? 0,
        alreadyRecorded: j.alreadyRecorded,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recording failed");
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>Scenario builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={scenarioType}
              onChange={(e) =>
                applyPreset(e.target.value as (typeof TYPES)[number]["value"])
              }
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <ParameterSlider
            label="Time horizon (years)"
            value={params.timeHorizonYears}
            min={1}
            max={20}
            step={1}
            hint="Projection length for the FEW trajectory (1–20 years)."
            onChange={(v) =>
              setParams((p) => ({ ...p, timeHorizonYears: Math.round(v) }))
            }
          />

          <ParameterSlider
            label="Irrigation efficiency"
            value={params.irrigationEfficiency}
            min={0}
            max={1}
            hint="Share of irrigation water effectively used by crops."
            onChange={(v) =>
              setParams((p) => ({ ...p, irrigationEfficiency: v }))
            }
          />
          <ParameterSlider
            label="Crop intensity"
            value={params.cropIntensity}
            min={0}
            max={1}
            hint="Agricultural intensification / land-use pressure."
            onChange={(v) => setParams((p) => ({ ...p, cropIntensity: v }))}
          />
          <ParameterSlider
            label="Water recycling rate"
            value={params.waterRecyclingRate}
            min={0}
            max={1}
            hint="Fraction of water recovered and reused."
            onChange={(v) =>
              setParams((p) => ({ ...p, waterRecyclingRate: v }))
            }
          />
          <ParameterSlider
            label="Population growth (annual)"
            value={params.populationGrowthRate}
            min={-0.02}
            max={0.08}
            step={0.005}
            hint="Annual population growth rate applied to demand drivers."
            onChange={(v) =>
              setParams((p) => ({ ...p, populationGrowthRate: v }))
            }
          />
          <ParameterSlider
            label="Subsidy level"
            value={params.subsidyLevel}
            min={0}
            max={1}
            hint="Policy support for energy/water — can lift consumption."
            onChange={(v) => setParams((p) => ({ ...p, subsidyLevel: v }))}
          />
          <ParameterSlider
            label="Technology adoption"
            value={params.technologyAdoptionRate}
            min={0}
            max={1}
            hint="Adoption of efficiency and precision-ag technologies."
            onChange={(v) =>
              setParams((p) => ({ ...p, technologyAdoptionRate: v }))
            }
          />

          <div className="space-y-3 rounded-lg border border-border/60 p-4">
            <p className="text-sm font-medium">Energy mix (sums to 1)</p>
            {(
              ["solar", "wind", "hydro", "fossil"] as const
            ).map((k) => (
              <ParameterSlider
                key={k}
                label={k}
                value={params.energyMix[k]}
                min={0}
                max={1}
                hint="Adjust one slider; mix is renormalized to sum to 1."
                onChange={(v) => setMix(k, v)}
              />
            ))}
            <p className="font-mono text-xs text-muted-foreground">
              Sum:{" "}
              {(
                params.energyMix.solar +
                params.energyMix.wind +
                params.energyMix.hydro +
                params.energyMix.fossil
              ).toFixed(3)}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={runModel}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running model…
              </>
            ) : (
              "Run model"
            )}
          </Button>

          {result && scenarioId && resultId && (
            <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
              Scenario saved.{" "}
              <Link href={`/scenarios/${scenarioId}`} className="underline underline-offset-2">
                View it
              </Link>
            </p>
          )}

          {chain && (
            <div
              role="status"
              className={
                chain.status === "confirmed"
                  ? "space-y-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
                  : "space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
              }
            >
              {chain.status === "confirmed" ? (
                <>
                  <p className="font-medium">
                    {chain.alreadyRecorded ? "Already recorded on-chain" : "Recorded on-chain"}
                    {chain.recordId ? ` · record #${chain.recordId}` : ""}
                  </p>
                  {chain.txHash && (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${chain.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-mono text-xs underline underline-offset-2"
                    >
                      View transaction {chain.txHash.slice(0, 10)}…{chain.txHash.slice(-6)}
                    </a>
                  )}
                </>
              ) : (
                <p>
                  Hashes saved, but the blockchain write didn&apos;t go through. It is marked
                  pending in the audit trail. You can try again.
                </p>
              )}
            </div>
          )}

          {result && hashes && resultId && chain?.status !== "confirmed" && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={recordChain}
              disabled={recording}
            >
              {recording ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording on-chain…
                </>
              ) : (
                "Record on blockchain"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parameter snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[420px] overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
              {JSON.stringify(params, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="res"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScenarioResultDisplay result={result} />
              {hashes && (
                <Card className="mt-4 border-dashed border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Cryptographic hashes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 font-mono text-xs break-all text-muted-foreground">
                    <p>
                      <span className="text-foreground">Combined:</span>{" "}
                      {hashes.combinedHash}
                    </p>
                    <p>
                      <span className="text-foreground">Output:</span>{" "}
                      {hashes.outputHash}
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
