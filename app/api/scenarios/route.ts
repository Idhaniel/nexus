import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { validateScenarioParameters } from "@/lib/validation/scenario";
import type { ScenarioType } from "@/lib/types";

const VALID_TYPES: ScenarioType[] = [
  "baseline",
  "efficiency",
  "production_expansion",
  "renewable_transition",
  "custom",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = 10;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error, count } = await supabase
      .from("scenarios")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      scenarios: data ?? [],
      page,
      perPage,
      total: count ?? 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list scenarios";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, parameters } = body as {
      name?: string;
      description?: string;
      type?: string;
      parameters?: unknown;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!type || !VALID_TYPES.includes(type as ScenarioType)) {
      return NextResponse.json({ error: "invalid scenario type" }, { status: 400 });
    }

    const v = validateScenarioParameters(parameters);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("scenarios")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description ?? null,
        type,
        status: "draft",
        parameters: v.params,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scenario: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create scenario";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
