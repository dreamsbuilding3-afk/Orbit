import { createClient } from "@supabase/supabase-js";
import { decryptGoogleToken } from "@/lib/server/google-token";

type AdminClient = ReturnType<typeof createClient>;
type JsonRecord = Record<string, unknown>;

type ExecuteOptions = {
  admin: AdminClient;
  workflowId: string;
  organizationId: string;
  actorUserId?: string | null;
  payload?: JsonRecord;
  runId?: string;
  source?: string;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function getPath(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => asRecord(value)[key], root);
}

function interpolate(value: string, context: JsonRecord): string {
  return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, path: string) => {
    const result = getPath(context, path.trim());
    return result === null || result === undefined ? "" : String(result);
  });
}

function conditionResult(config: JsonRecord, context: JsonRecord): boolean {
  const field = String(config.field ?? "").trim();
  if (!field) return true;
  const actual = getPath(context, field);
  const operator = String(config.operator ?? "exists").toLowerCase();
  const expected = interpolate(String(config.value ?? ""), context);
  if (operator === "exists") return actual !== undefined && actual !== null && actual !== "";
  if (operator === "not_exists") return actual === undefined || actual === null || actual === "";
  if (operator === "eq" || operator === "equals" || operator === "=") return String(actual ?? "") === expected;
  if (operator === "neq" || operator === "not_equals" || operator === "!=") return String(actual ?? "") !== expected;
  if (operator === "contains") return String(actual ?? "").toLowerCase().includes(expected.toLowerCase());
  if (operator === "starts_with") return String(actual ?? "").toLowerCase().startsWith(expected.toLowerCase());
  return Boolean(actual);
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth server credentials are not configured.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google token refresh failed (${response.status}). ${detail.slice(0, 220)}`);
  }
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Google did not return an access token.");
  return data.access_token;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function runGmail(admin: AdminClient, organizationId: string, config: JsonRecord, context: JsonRecord) {
  const { data: connection, error } = await admin.from("integration_connections")
    .select("id,status,metadata,refresh_token_encrypted,last_used_at")
    .eq("organization_id", organizationId)
    .eq("provider", "gmail")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!connection || connection.status !== "active") throw new Error("Gmail connection is not active. Connect Gmail before running this workflow.");

  const encryptedRefreshToken = String(connection.refresh_token_encrypted ?? asRecord(connection.metadata).google_refresh_token_encrypted ?? "");
  if (!encryptedRefreshToken) throw new Error("Gmail is connected, but no refresh token is stored. Reconnect Gmail.");
  const accessToken = await refreshGoogleAccessToken(decryptGoogleToken(encryptedRefreshToken));

  const to = interpolate(String(config.to ?? ""), context).trim();
  const subject = interpolate(String(config.subject ?? "WineTime notification"), context);
  const body = interpolate(String(config.body ?? ""), context);
  if (!to) throw new Error("Gmail action is missing a recipient.");

  const raw = [`To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", body].join("\r\n");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: base64Url(raw) }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gmail refused the action (${response.status}). ${detail.slice(0, 220)}`);
  }
  const output = await response.json().catch(() => ({}));
  await admin.from("integration_connections").update({ last_used_at: new Date().toISOString() }).eq("id", connection.id);
  return output;
}

async function runCrm(admin: AdminClient, organizationId: string, config: JsonRecord, context: JsonRecord, actorUserId?: string | null) {
  const client = asRecord(context.client);
  const company = asRecord(context.company);
  const name = interpolate(String(config.name ?? client.name ?? `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim()), context).trim();
  const email = interpolate(String(config.email ?? client.email ?? ""), context).trim() || null;
  const phone = interpolate(String(config.phone ?? client.phone ?? ""), context).trim() || null;
  const companyName = interpolate(String(config.company ?? company.name ?? client.company ?? ""), context).trim() || null;
  if (!name) throw new Error("CRM action is missing the client name.");

  let query = admin.from("clients").select("id,name,email").eq("organization_id", organizationId);
  if (email) query = query.eq("email", email);
  else query = query.eq("name", name);
  const { data: existing, error: lookupError } = await query.maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (existing) return { id: existing.id, created: false, name: existing.name, email: existing.email };

  const { data: created, error } = await admin.from("clients").insert({
    organization_id: organizationId,
    name,
    company: companyName,
    email,
    phone,
    status: String(config.status ?? "prospect"),
    estimated_value: config.estimated_value ? Number(config.estimated_value) : null,
    source: String(config.source ?? "workflow"),
    created_by: actorUserId ?? null,
  }).select("id,name,email").single();
  if (error || !created) throw new Error(error?.message ?? "Could not create CRM client.");
  return { id: created.id, created: true, name: created.name, email: created.email };
}

export async function executeWorkflowRun(options: ExecuteOptions) {
  const { admin, workflowId, organizationId, actorUserId = null, payload = {}, source = "manual" } = options;
  let runId = options.runId;

  const { data: workflow, error: workflowError } = await admin.from("workflows")
    .select("id,name,status,organization_id,trigger_type")
    .eq("id", workflowId).eq("organization_id", organizationId).maybeSingle();
  if (workflowError || !workflow) throw new Error("Workflow not found.");
  if (workflow.status === "archived") throw new Error("Archived workflows cannot run.");

  const { data: steps, error: stepsError } = await admin.from("workflow_steps")
    .select("id,position,step_type,name,description,config")
    .eq("workflow_id", workflow.id).order("position");
  if (stepsError) throw new Error(stepsError.message);
  if (!steps?.length) throw new Error("Workflow has no steps.");

  if (!runId) {
    const { data: run, error } = await admin.from("workflow_runs")
      .insert({ workflow_id: workflow.id, status: "running", context: { source, payload } })
      .select("id").single();
    if (error || !run) throw new Error(error?.message ?? "Could not create workflow run.");
    runId = run.id;
  } else {
    await admin.from("workflow_runs").update({ status: "running", context: { source, payload }, error_message: null }).eq("id", runId);
  }

  const context: JsonRecord = { payload, client: asRecord(payload.client), company: asRecord(payload.company), event: payload };
  const results: JsonRecord[] = [];
  let blocked = false;

  try {
    for (const step of steps) {
      const startedAt = new Date().toISOString();
      const { data: runStep, error: runStepError } = await admin.from("workflow_run_steps")
        .insert({ run_id: runId, step_id: step.id, status: "running", started_at: startedAt }).select("id").single();
      if (runStepError || !runStep) throw new Error(runStepError?.message ?? "Could not create workflow run step.");

      try {
        const config = asRecord(step.config);
        let output: unknown = {};
        let status: "completed" | "skipped" = "completed";

        if (blocked) {
          status = "skipped";
          output = { skipped: true, reason: "condition_failed" };
        } else if (step.step_type === "condition") {
          const passed = conditionResult(config, context);
          output = { evaluated: true, result: passed };
          if (!passed) blocked = true;
        } else if (step.step_type === "trigger") {
          output = { accepted: true, source, payload_keys: Object.keys(payload) };
        } else {
          const app = String(config.app ?? "").toLowerCase();
          if (app === "gmail") output = await runGmail(admin, organizationId, config, context);
          else if (app === "crm" || app === "clients") output = await runCrm(admin, organizationId, config, context, actorUserId);
          else throw new Error(`Unsupported workflow action app: ${app || "unknown"}.`);
        }

        await admin.from("workflow_run_steps").update({ status, finished_at: new Date().toISOString(), output }).eq("id", runStep.id);
        results.push({ step: step.name, status, output });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Workflow step failed.";
        await admin.from("workflow_run_steps").update({ status: "failed", finished_at: new Date().toISOString(), error_message: message }).eq("id", runStep.id);
        throw error;
      }
    }

    const finalStatus = blocked ? "completed" : "completed";
    await admin.from("workflow_runs").update({ status: finalStatus, finished_at: new Date().toISOString(), context: { source, payload, results, condition_blocked: blocked } }).eq("id", runId);
    await admin.from("audit_logs").insert({ organization_id: organizationId, actor_user_id: actorUserId, action: "execute", entity_type: "workflow", entity_id: workflow.id, metadata: { run_id: runId, source, status: finalStatus } });
    return { runId, status: finalStatus, results, conditionBlocked: blocked };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed.";
    await admin.from("workflow_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: message }).eq("id", runId);
    await admin.from("audit_logs").insert({ organization_id: organizationId, actor_user_id: actorUserId, action: "execute", entity_type: "workflow", entity_id: workflow.id, metadata: { run_id: runId, source, status: "failed" } });
    throw Object.assign(new Error(message), { runId });
  }
}
