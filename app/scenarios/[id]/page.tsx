"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { SensitivityChart } from "@/components/dashboard/SensitivityChart";
import { ProvenanceBadge } from "@/components/dashboard/ProvenanceBadge";
import type { ScenarioResultRow, ScenarioRow, ProvenanceRecordRow } from "@/lib/types";

export default function ScenarioDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [scenario, setScenario] = useState<ScenarioRow | null>(null);
  const [latestResult, setLatestResult] = useState<ScenarioResultRow | null>(
    null
  );
  const [provenance, setProvenance] = useState<ProvenanceRecordRow | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/scenarios/${id}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Not found");
        if (!cancelled) {
          setScenario(j.scenario);
          setLatestResult(j.latestResult ?? null);
          setProvenance(j.provenance ?? null);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <p className="text-destructive">
        {error}. <Link href="/scenarios">Back to list</Link>
      </p>
    );
  }

  if (!scenario) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const timeline = latestResult?.timeline_data ?? [];
  const sensitivity = latestResult?.sensitivity_data ?? [];

  const provStatus =
    provenance?.verification_status === "confirmed"
      ? "verified"
      : provenance?.verification_status === "failed"
        ? "failed"
        : "pending";

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/scenarios"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Scenarios
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{scenario.name}</h1>
          <Badge>{scenario.type}</Badge>
          <Badge variant="outline">{scenario.status}</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          {scenario.description || "No description"}
        </p>
      </div>

      {latestResult && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-few-water/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-few-water">Water</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl">{latestResult.water_use_index}</p>
                <p className="text-xs text-muted-foreground">
                  {Number(latestResult.water_use_lower).toFixed(1)} –{" "}
                  {Number(latestResult.water_use_upper).toFixed(1)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-few-energy/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-few-energy">Energy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl">{latestResult.energy_use_index}</p>
                <p className="text-xs text-muted-foreground">
                  {Number(latestResult.energy_use_lower).toFixed(1)} –{" "}
                  {Number(latestResult.energy_use_upper).toFixed(1)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-few-food/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-few-food">Food</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl">{latestResult.food_output_index}</p>
                <p className="text-xs text-muted-foreground">
                  {Number(latestResult.food_output_lower).toFixed(1)} –{" "}
                  {Number(latestResult.food_output_upper).toFixed(1)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineChart timeline={timeline} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sensitivity</CardTitle>
            </CardHeader>
            <CardContent>
              <SensitivityChart data={sensitivity} dimension="overall" />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Provenance</CardTitle>
          {provenance && (
            <ProvenanceBadge
              status={provStatus}
              txHash={provenance.transaction_hash ?? undefined}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-xs break-all text-muted-foreground">
          {provenance ? (
            <>
              <p>
                <span className="text-foreground">Combined:</span>{" "}
                {provenance.combined_hash}
              </p>
              <p>
                <span className="text-foreground">Tx:</span>{" "}
                {provenance.transaction_hash ? (
                  <a
                    className="text-primary hover:underline"
                    href={`https://amoy.polygonscan.com/tx/${provenance.transaction_hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {provenance.transaction_hash}
                  </a>
                ) : (
                  "—"
                )}
              </p>
              <p>
                <span className="text-foreground">Block:</span>{" "}
                {provenance.block_number ?? "—"}
              </p>
              <p>
                <span className="text-foreground">Record ID:</span>{" "}
                {provenance.on_chain_record_id ?? "—"}
              </p>
            </>
          ) : (
            <p>No provenance record for this scenario yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
