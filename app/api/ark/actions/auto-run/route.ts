import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGoogleAccessToken } from "@/lib/server/google-oauth";

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

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
    .in("status", ["pending", "queued"])
    .limit(100);

  if (recommendationError) return NextResponse.json({ error: recommendationError.message }, { status: 500 });

  let executed = 0;
  let queued = 0;
  let skipped = 0;
  let failed = 0;

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

    if (existing?.status === "completed") {
      skipped += 1;
      continue;
    }

    let runId = existing?.id as string | undefined;
    if (!runId) {
      const { data: run, error: runError } = await admin.from("ark_action_runs").insert({
        organization_id: recommendation.organization_id,
        recommendation_id: recommendation.id,
        opportunity_id: recommendation.opportunity_id,
        action_type: actionType,
        status: "queued",
        input: action,
      }).select("id").single();

      if (runError || !run) {
        failed += 1;
        continue;
      }
      runId = run.id;
      queued += 1;
    }

    if (!actionType.toLowerCase().includes("email") && actionType !== "gmail.send") {
      skipped += 1;
      continue;
    }

    const { data: connection, error: connectionError } = await admin
      .from("integration_connections")
      .select("metadata,status")
      .eq("organization_id", recommendation.organization_id)
      .eq("provider", "gmail")
      .maybeSingle();

    const encryptedRefreshToken = (connection?.metadata as Record<string, unknown> | null)?.google_refresh_token_encrypted;
    if (connectionError || connection?.status !== "connected" || typeof encryptedRefreshToken !== "string") {
      await admin.from("ark_action_runs").update({ status: "failed", error: "Gmail is connected but no server-side Google refresh token is available." }).eq("id", runId).eq("organization_id", recommendation.organization_id);
      await admin.from("ark_recommendations").update({ status: "failed" }).eq("id", recommendation.id).eq("organization_id", recommendation.organization_id);
      failed += 1;
      continue;
    }

    const to = String(action.to ?? action.recipient ?? "").trim();
    const subject = String(action.subject ?? "ORBIT message");
    const message = String(action.body ?? action.message ?? "");
    if (!to) {
      await admin.from("ark_action_runs").update({ status: "failed", error: "Gmail action is missing a recipient." }).eq("id", runId).eq("organization_id", recommendation.organization_id);
      await admin.from("ark_recommendations").update({ status: "failed" }).eq("id", recommendation.id).eq("organization_id", recommendation.organization_id);
      failed += 1;
      continue;
    }

    await admin.from("ark_action_runs").update({ status: "running", error: null }).eq("id", runId).eq("organization_id", recommendation.organization_id);

    try {
      const accessToken = await getGoogleAccessToken(encryptedRefreshToken);
      const raw = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        message,
      ].join("\r\n");

      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: base64Url(raw) }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gmail refused the action (${response.status}). ${detail.slice(0, 400)}`);
      }

      const output = await response.json().catch(() => ({}));
      await admin.from("ark_action_runs").update({ status: "completed", output, error: null }).eq("id", runId).eq("organization_id", recommendation.organization_id);
      await admin.from("ark_recommendations").update({ status: "executed" }).eq("id", recommendation.id).eq("organization_id", recommendation.organization_id);
      executed += 1;
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Automatic execution failed.";
      await admin.from("ark_action_runs").update({ status: "failed", error: errorText }).eq("id", runId).eq("organization_id", recommendation.organization_id);
      await admin.from("ark_recommendations").update({ status: "failed" }).eq("id", recommendation.id).eq("organization_id", recommendation.organization_id);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, executed, queued, skipped, failed });
}
