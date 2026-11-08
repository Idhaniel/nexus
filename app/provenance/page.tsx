"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HashVerifier } from "@/components/provenance/HashVerifier";
import { AuditTimeline } from "@/components/provenance/AuditTimeline";
import { Loader2 } from "lucide-react";

interface ProvRow {
  id: string;
  scenario_id: string;
  combined_hash: string;
  transaction_hash: string | null;
  block_number: number | null;
  created_at: string;
  verification_status: string;
  on_chain_record_id: number | null;
  scenario_name: string | null;
  on_chain_match: boolean | null;
}

export default function ProvenancePage() {
  const [rows, setRows] = useState<ProvRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/provenance?page=${page}`);
        const j = await res.json();
        if (!cancelled) {
          setRows(j.records ?? []);
          setTotal(j.total ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.combined_hash.toLowerCase().includes(s) ||
        (r.transaction_hash && r.transaction_hash.toLowerCase().includes(s)) ||
        (r.scenario_name && r.scenario_name.toLowerCase().includes(s))
    );
  }, [rows, q]);

  const verifyRow = async (r: ProvRow) => {
    if (!r.on_chain_record_id) return;
    await fetch("/api/provenance/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordId: r.on_chain_record_id,
        combinedHash: r.combined_hash,
      }),
    });
    const res = await fetch(`/api/provenance?page=${page}`);
    const j = await res.json();
    setRows(j.records ?? []);
  };

  const auditItems = filtered.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.scenario_name || r.scenario_id,
    at: new Date(r.created_at).toLocaleString(),
    hashPreview: r.combined_hash.slice(0, 18) + "…",
    status:
      r.verification_status === "confirmed"
        ? ("verified" as const)
        : r.verification_status === "failed"
          ? ("failed" as const)
          : ("pending" as const),
    txHash: r.transaction_hash,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit trail</h1>
        <p className="text-muted-foreground">
          Explore provenance rows stored in Supabase and cross-check against Polygon Mumbai.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              1. Model run produces SHA-256 fingerprints of inputs and outputs.
            </p>
            <p>
              2. A combined hash is recorded in `ProvenanceLedger` on Mumbai (or queued if RPC fails).
            </p>
            <p>
              3. Supabase stores transaction metadata for dashboards and offline audit.
            </p>
          </CardContent>
        </Card>
        <HashVerifier />
      </div>

      {auditItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline preview</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTimeline items={auditItems} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by scenario name, tx hash, or combined hash…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading records…
        </p>
      ) : (
        <div className="rounded-md border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Combined hash</TableHead>
                <TableHead>Tx</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Verify</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[140px] truncate">
                    {r.scenario_name || r.scenario_id}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.combined_hash.slice(0, 12)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.transaction_hash
                      ? `${r.transaction_hash.slice(0, 10)}…`
                      : "—"}
                  </TableCell>
                  <TableCell>{r.block_number ?? "—"}</TableCell>
                  <TableCell>{r.verification_status}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!r.on_chain_record_id}
                      onClick={() => verifyRow(r)}
                    >
                      Verify now
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
