import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { validateScenarioParameters } from "@/lib/validation/scenario";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createServiceRoleClient();

    const { data: scenario, error: sErr } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", id)
      .single();

    if (sErr || !scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const { data: latestResult } = await supabase
      .from("scenario_results")
      .select("*")
      .eq("scenario_id", id)
      .order("run_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: provenance } = await supabase
      .from("provenance_records")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      scenario,
      latestResult,
      provenance,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load scenario";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: existing } = await supabase
      .from("scenarios")
      .select("status, user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft scenarios can be updated" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, parameters } = body as {
      name?: string;
      description?: string;
      parameters?: unknown;
    };

    if (parameters !== undefined) {
      const v = validateScenarioParameters(parameters);
      if (!v.ok) {
        return NextResponse.json({ error: v.error }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (body.parameters !== undefined) {
      const v = validateScenarioParameters(body.parameters);
      if (!v.ok) {
        return NextResponse.json({ error: v.error }, { status: 400 });
      }
      updates.parameters = v.params;
    }

    const { data, error } = await supabase
      .from("scenarios")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scenario: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update scenario";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: existing } = await supabase
      .from("scenarios")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("scenarios").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete scenario";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
