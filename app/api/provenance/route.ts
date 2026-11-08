import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyOnChain } from "@/lib/blockchain/contract";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("scenarioId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = 10;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = createServiceRoleClient();

    let q = supabase
      .from("provenance_records")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (scenarioId) {
      q = q.eq("scenario_id", scenarioId);
    }

    const { data: rows, error, count } = await q;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = [...new Set((rows ?? []).map((r) => r.scenario_id))];
    let nameMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: scenarios } = await supabase
        .from("scenarios")
        .select("id, name")
        .in("id", ids);
      nameMap = Object.fromEntries(
        (scenarios ?? []).map((s) => [s.id as string, s.name as string])
      );
    }

    const canVerify = Boolean(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);

    const enriched = await Promise.all(
      (rows ?? []).map(async (row) => {
        let onChainMatch: boolean | null = null;
        const rid = row.on_chain_record_id;
        const ch = row.combined_hash;
        if (canVerify && rid != null && ch) {
          try {
            onChainMatch = await verifyOnChain(Number(rid), ch);
          } catch {
            onChainMatch = null;
          }
        }
        return {
          ...row,
          scenario_name: nameMap[row.scenario_id] ?? null,
          on_chain_match: onChainMatch,
        };
      })
    );

    return NextResponse.json({
      records: enriched,
      page,
      perPage,
      total: count ?? 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load provenance";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
