import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGoogleAccessToken } from "@/lib/server/google-oauth";

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

async function updateActionRun(admin: any, id: string, organizationId: string, values: Record<string, unknown>) {
  const { error } = await admin.from("ark_action_runs").update(values).eq("id", id).eq("organization_id", organizationId);
  return error;
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
    .in("status", ["pending", "approved"])
    .limit(100);

  if (recommendationError) return NextResponse.json({ error: recommendationError.message }, { status: 500 });

  let executed = 0;
  let queued = 0;
  let skipped = 0;
  let failed = 0;
  let rateLimited = 0;

  for (const recommendation of recommendations ?? []) {
    const organizationId = recommendation.organization_id;
    if (!organizationId) {
      failed += 1;
      continue;
    }

    const { data: rate, error: rateError } = await admin.rpc("check_action_rate_limit", {
      p_organization_id: organizationId,
      p_action: "ark.auto-run",
      p_limit: 60,
      p_window_seconds: 60,
    });
    const rateResult = Array.isArray(rate) ? rate[0] : rate;
    if (rateError || !rateResult?.allowed) {
      rateLimited += 1;
      continue;
    }

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
      .eq("organization_id", organizationId)
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
      .in("status", ["pending", "approved", "executing", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.status === "completed") {
      skipped += 1;
      continue;
    }

    let runId = existing?.id as string | undefined;
    if (!runId) {
      const { data: run, error: runError } = await admin.from("ark_action_runs").insert({
        organization_id: organizationId,
        recommendation_id: recommendation.id,
        opportunity_id: recommendation.opportunity_id,
        action_type: actionType,
        status: "pending",
        input: action,
      }).select("id").single();

      if (runError || !run) {
        failed += 1;
        continue;
      }
      runId = run.id;
      queued += 1;
    }

    if (!runId) {
      failed += 1;
      continue;
    }
    const actionRunId = runId;

    if (!actionType.toLowerCase().includes("email") && actionType !== "gmail.send") {
      await updateActionRun(admin, actionRunId, organizationId, {
        status: "cancelled",
        error_message: `Unsupported automatic action type: ${actionType}.`,
        finished_at: new Date().toISOString(),
      });
      skipped += 1;
      continue;
    }

    const { data: connection, error: connectionError } = await admin
      .from("integration_connections")
      .select("metadata,status,refresh_token_encrypted")
      .eq("organization_id", organizationId)
      .eq("provider", "gmail")
      .maybeSingle();

    const metadata = (connection?.metadata as Record<string, unknown> | null) ?? {};
    const encryptedRefreshToken = connection?.refresh_token_encrypted ?? metadata.google_refresh_token_encrypted;
    const connectionActive = connection?.status === "active" || connection?.status === "connected";
    if (connectionError || !connectionActive || typeof encryptedRefreshToken !== "string" || !encryptedRefreshToken) {
      const errorText = "Gmail connection is not active or no server-side Google refresh token is available.";
      await updateActionRun(admin, actionRunId, organizationId, {
        status: "failed",
        error_message: errorText,
        finished_at: new Date().toISOString(),
      });
      await admin.from("ark_recommendations").update({ status: "pending" }).eq("id", recommendation.id).eq("organization_id", organizationId);
      failed += 1;
      continue;
    }

    const to = String(action.to ?? action.recipient ?? "").trim();
    const subject = String(action.subject ?? "ORBIT message");
    const message = String(action.body ?? action.message ?? "");
    if (!to) {
      await updateActionRun(admin, actionRunId, organizationId, {
        status: "failed",
        error_message: "Gmail action is missing a recipient.",
        finished_at: new Date().toISOString(),
      });
      failed += 1;
      continue;
    }

    await updateActionRun(admin, actionRunId, organizationId, {
      status: "executing",
      error_message: null,
      started_at: new Date().toISOString(),
    });

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
      await updateActionRun(admin, actionRunId, organizationId, {
        status: "completed",
        output,
        error_message: null,
        finished_at: new Date().toISOString(),
      });
      await admin.from("ark_recommendations").update({ status: "executed" }).eq("id", recommendation.id).eq("organization_id", organizationId);
      executed += 1;
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Automatic execution failed.";
      await updateActionRun(admin, actionRunId, organizationId, {
        status: "failed",
        error_message: errorText,
        finished_at: new Date().toISOString(),
      });
      await admin.from("ark_recommendations").update({ status: "pending" }).eq("id", recommendation.id).eq("organization_id", organizationId);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, executed, queued, skipped, failed, rate_limited: rateLimited });
}
