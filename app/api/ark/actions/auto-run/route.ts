import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ error: "Supabase server environment is not configured." }, { status: 500 });
  }

  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!cronSecret || auth !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: recommendations, error: recommendationError } = await admin
    .from("ark_recommendations")
    .select("id,organization_id,opportunity_id,action,status")
    .eq("status", "pending")
    .limit(100);

  if (recommendationError) {
    return NextResponse.json({ error: recommendationError.message }, { status: 500 });
  }

  let queued = 0;
  let skipped = 0;

  for (const recommendation of recommendations ?? []) {
    const action = (recommendation.action ?? {}) as Record<string, unknown>;
    const actionType = String(action.action_type ?? action.type ?? "general");
    const category = String(
      action.category ??
        (actionType.includes("email") || actionType === "gmail.send"
          ? "emails"
          : actionType.includes("payment")
            ? "payments"
            : actionType.includes("calendar")
              ? "calendar"
              : actionType.includes("crm")
                ? "crm"
                : "data")
    );

    const { data: permission } = await admin
      .from("ark_permissions")
      .select("autonomy_level")
      .eq("organization_id", recommendation.organization_id)
      .eq("category", category)
      .maybeSingle();

    if (permission?.autonomy_level !== "auto") {
      skipped += 1;
      continue;
    }

    const { data: existing } = await admin
      .from("ark_action_runs")
      .select("id,status")
      .eq("recommendation_id", recommendation.id)
      .in("status", ["queued", "running", "completed"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const { error: runError } = await admin.from("ark_action_runs").insert({
      organization_id: recommendation.organization_id,
      recommendation_id: recommendation.id,
      opportunity_id: recommendation.opportunity_id,
      action_type: actionType,
      status: "queued",
      input: action,
    });

    if (runError) {
      skipped += 1;
      continue;
    }

    await admin
      .from("ark_recommendations")
      .update({ status: "queued" })
      .eq("id", recommendation.id)
      .eq("organization_id", recommendation.organization_id);

    queued += 1;
  }

  return NextResponse.json({ ok: true, queued, skipped });
}
