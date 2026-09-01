import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptGoogleToken } from "@/lib/server/google-token";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth server credentials are not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google token refresh failed (${response.status}). ${detail.slice(0, 220)}`);
  }

  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google did not return an access token.");
  return data;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function POST(request: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: "Supabase server environment is not configured." }, { status: 500 });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  const { workflowId } = await params;

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: memberships, error: membershipError } = await admin
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", user.id);
  if (membershipError || !memberships?.length) return NextResponse.json({ error: "No workspace found." }, { status: 403 });
  const organizationId = memberships[0].organization_id;

  const { data: workflow, error: workflowError } = await admin
    .from("workflows")
    .select("id,name,status,organization_id,trigger_type")
    .eq("id", workflowId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (workflowError || !workflow) return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
  if (workflow.status === "archived") return NextResponse.json({ error: "Archived workflows cannot run." }, { status: 409 });

  const { data: steps, error: stepsError } = await admin
    .from("workflow_steps")
    .select("id,position,step_type,name,description,config")
    .eq("workflow_id", workflow.id)
    .order("position");
  if (stepsError) return NextResponse.json({ error: stepsError.message }, { status: 500 });
  if (!steps?.length) return NextResponse.json({ error: "Workflow has no steps." }, { status: 400 });

  const { data: run, error: runError } = await admin
    .from("workflow_runs")
    .insert({ workflow_id: workflow.id, status: "running", context: { source: "manual" } })
    .select("id")
    .single();
  if (runError || !run) return NextResponse.json({ error: runError?.message ?? "Could not create workflow run." }, { status: 500 });

  const results: Array<Record<string, unknown>> = [];

  try {
    let googleAccessToken: string | null = null;

    for (const step of steps) {
      const startedAt = new Date().toISOString();
      const { data: runStep, error: runStepError } = await admin
        .from("workflow_run_steps")
        .insert({ run_id: run.id, step_id: step.id, status: "running", started_at: startedAt })
        .select("id")
        .single();
      if (runStepError || !runStep) throw new Error(runStepError?.message ?? "Could not create run step.");

      try {
        if (step.step_type === "condition") {
          const output = { evaluated: true, result: true };
          await admin.from("workflow_run_steps").update({ status: "completed", finished_at: new Date().toISOString(), output }).eq("id", runStep.id);
          results.push({ step: step.name, status: "completed", output });
          continue;
        }

        if (step.step_type === "trigger") {
          const output = { accepted: true, source: "manual" };
          await admin.from("workflow_run_steps").update({ status: "completed", finished_at: new Date().toISOString(), output }).eq("id", runStep.id);
          results.push({ step: step.name, status: "completed", output });
          continue;
        }

        const config = (step.config ?? {}) as Record<string, unknown>;
        const app = String(config.app ?? "").toLowerCase();
        if (app !== "gmail") throw new Error(`Unsupported workflow action app: ${app || "unknown"}.`);

        if (!googleAccessToken) {
          const { data: connection, error: connectionError } = await admin
            .from("integration_connections")
            .select("status,metadata")
            .eq("organization_id", organizationId)
            .eq("provider", "gmail")
            .maybeSingle();
          if (connectionError) throw new Error(connectionError.message);
          const metadata = (connection?.metadata ?? {}) as Record<string, unknown>;
          const encryptedRefreshToken = String(metadata.google_refresh_token_encrypted ?? "");
          if (!encryptedRefreshToken) throw new Error("Gmail is connected, but WineTime has no securely stored refresh token. Reconnect Gmail.");
          if (!["connected", "active"].includes(String(connection?.status ?? ""))) throw new Error("Gmail connection is not active.");
          const refreshed = await refreshGoogleAccessToken(decryptGoogleToken(encryptedRefreshToken));
          googleAccessToken = refreshed.access_token ?? null;
        }

        const to = String(config.to ?? "").trim();
        const subject = String(config.subject ?? workflow.name);
        const body = String(config.body ?? "");
        if (!to) throw new Error(`Step \"${step.name}\" is missing a Gmail recipient.`);

        const raw = [`To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", body].join("\r\n");
        const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${googleAccessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ raw: base64Url(raw) }),
          cache: "no-store",
        });
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`Gmail refused step \"${step.name}\" (${response.status}). ${detail.slice(0, 220)}`);
        }

        const output = await response.json().catch(() => ({}));
        await admin.from("workflow_run_steps").update({ status: "completed", finished_at: new Date().toISOString(), output }).eq("id", runStep.id);
        results.push({ step: step.name, status: "completed", output });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Workflow step failed.";
        await admin.from("workflow_run_steps").update({ status: "failed", finished_at: new Date().toISOString(), error_message: message }).eq("id", runStep.id);
        throw error;
      }
    }

    await admin.from("workflow_runs").update({ status: "completed", finished_at: new Date().toISOString(), context: { source: "manual", results } }).eq("id", run.id);
    await admin.from("audit_logs").insert({ organization_id: organizationId, actor_user_id: user.id, action: "execute", entity_type: "workflow", entity_id: workflow.id, metadata: { run_id: run.id, source: "manual" } });

    return NextResponse.json({ ok: true, runId: run.id, status: "completed", results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed.";
    await admin.from("workflow_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: message }).eq("id", run.id);
    await admin.from("audit_logs").insert({ organization_id: organizationId, actor_user_id: user.id, action: "execute", entity_type: "workflow", entity_id: workflow.id, metadata: { run_id: run.id, source: "manual", status: "failed" } });
    return NextResponse.json({ error: message, runId: run.id, status: "failed" }, { status: 502 });
  }
}
