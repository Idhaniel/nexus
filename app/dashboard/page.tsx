"use client";

import { useMemo, useState } from "react";
import { FEWRadarChart } from "@/components/dashboard/FEWRadarChart";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { ComparisonChart } from "@/components/dashboard/ComparisonChart";
import { Button } from "@/components/ui/button";
import { SCENARIO_PRESETS, runFEWModel } from "@/lib/model/fewEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESET_KEYS = [
  "baseline",
  "efficiency",
  "production_expansion",
  "renewable_transition",
] as const;

const LABELS: Record<string, string> = {
  baseline: "Baseline",
  efficiency: "Efficiency",
  production_expansion: "Production expansion",
  renewable_transition: "Renewable transition",
};

export default function DashboardPage() {
  const [selected, setSelected] =
    useState<(typeof PRESET_KEYS)[number]>("baseline");

  const presetResults = useMemo(() => {
    return PRESET_KEYS.map((k) => ({
      key: k,
      label: LABELS[k],
      result: runFEWModel(SCENARIO_PRESETS[k]),
    }));
  }, []);

  const radarData = presetResults.map((p) => ({
    name: p.label,
    water: p.result.waterUseIndex,
    energy: p.result.energyUseIndex,
    food: p.result.foodOutputIndex,
  }));

  const selectedResult = presetResults.find((p) => p.key === selected)!.result;
  const baselineWater = presetResults[0].result.waterUseIndex;

  const comparisonRows = presetResults.map((p) => ({
    name: p.label,
    water: p.result.waterUseIndex,
    energy: p.result.energyUseIndex,
    food: p.result.foodOutputIndex,
  }));

  const latest = selectedResult;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scenario dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Compare preset FEW trajectories and inspect longitudinal behavior.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-few-water/30 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-few-water">Water index</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold">{latest.waterUseIndex}</p>
            <p className="text-xs text-muted-foreground">Latest preset run</p>
          </CardContent>
        </Card>
        <Card className="border-few-energy/30 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-few-energy">Energy index</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold">{latest.energyUseIndex}</p>
            <p className="text-xs text-muted-foreground">Latest preset run</p>
          </CardContent>
        </Card>
        <Card className="border-few-food/30 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-few-food">Food index</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold">{latest.foodOutputIndex}</p>
            <p className="text-xs text-muted-foreground">Latest preset run</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Quick presets
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {PRESET_KEYS.map((k) => (
              <Button
                key={k}
                size="sm"
                variant={selected === k ? "default" : "secondary"}
                onClick={() => setSelected(k)}
              >
                {LABELS[k]}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>Radar — four presets</CardTitle>
        </CardHeader>
        <CardContent>
          <FEWRadarChart data={radarData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle>Timeline — {LABELS[selected]}</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineChart timeline={selectedResult.timeline} />
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle>Grouped comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonChart
              data={comparisonRows}
              baselineWater={baselineWater}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
