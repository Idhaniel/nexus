"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function HashVerifier() {
  const [recordId, setRecordId] = useState("");
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const verify = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/provenance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: Number(recordId),
          combinedHash: hash.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult(j.error || "Request failed");
        return;
      }
      setResult(j.valid ? "Hash matches on-chain record." : "Hash does NOT match.");
    } catch {
      setResult("Verification request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-4">
      <div>
        <Label htmlFor="rid">On-chain record ID</Label>
        <Input
          id="rid"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          placeholder="e.g. 1"
          className="mt-1 font-mono"
        />
      </div>
      <div>
        <Label htmlFor="h">Combined hash (64 hex chars)</Label>
        <Textarea
          id="h"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="mt-1 min-h-[100px] font-mono text-xs"
          placeholder="Paste SHA-256 hex digest"
        />
      </div>
      <Button type="button" onClick={verify} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying…
          </>
        ) : (
          "Verify"
        )}
      </Button>
      {result && (
        <p
          className={
            result.includes("NOT") || result.includes("failed")
              ? "text-amber-400"
              : "text-emerald-400"
          }
        >
          {result}
        </p>
      )}
    </div>
  );
}
