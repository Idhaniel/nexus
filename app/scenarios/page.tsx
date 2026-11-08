"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScenarioRow } from "@/lib/types";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/scenarios?page=${page}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed to load");
        if (!cancelled) {
          setScenarios(j.scenarios ?? []);
          setTotal(j.total ?? 0);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load scenarios");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scenarios</h1>
          <p className="text-muted-foreground">
            Your saved FEW configurations ({total} total).
          </p>
        </div>
        <Button asChild>
          <Link href="/scenarios/new">New scenario</Link>
        </Button>
      </div>

      {error && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-amber-200">
            {error}.{" "}
            <Link href="/auth" className="underline">
              Sign in
            </Link>{" "}
            to list your scenarios.
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : scenarios.length === 0 && !error ? (
        <p className="text-muted-foreground">
          No scenarios yet.{" "}
          <Link href="/scenarios/new" className="text-primary underline">
            Create one
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {scenarios.map((s) => (
            <li key={s.id}>
              <Link href={`/scenarios/${s.id}`}>
                <Card className="h-full border-border/80 bg-card/50 transition-colors hover:border-primary/40">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <Badge variant="secondary">{s.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {s.description || "No description"}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > 10 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * 10 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
