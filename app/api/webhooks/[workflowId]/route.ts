import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeWorkflowRun } from "@/lib/server/workflow-executor";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: "Supabase server environment is not configured." }, { status: 500 });

  const { workflowId } = await params;
  const secret = request.headers.get("x-orbit-webhook-secret") || request.nextUrl.searchParams.get("secret");
  if (!secret) return NextResponse.json({ error: "Missing webhook secret." }, { status: 401 });

  let payload: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) payload = parsed as Record<string, unknown>;
  } catch {}

  const { data: runId, error } = await admin.rpc("receive_workflow_webhook", {
    p_workflow_id: workflowId,
    p_secret: secret,
    p_payload: payload,
  });
  if (error) {
    const status = error.message.includes("Invalid webhook secret") ? 401 : error.message.includes("Workflow unavailable") ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  const { data: workflow, error: workflowError } = await admin.from("workflows")
    .select("organization_id").eq("id", workflowId).maybeSingle();
  if (workflowError || !workflow) return NextResponse.json({ error: "Workflow unavailable." }, { status: 404 });

  try {
    const result = await executeWorkflowRun({
      admin,
      workflowId,
      organizationId: workflow.organization_id,
      actorUserId: null,
      payload,
      runId,
      source: "webhook",
    });

    const { error: eventError } = await admin.rpc("record_ark_event", {
      p_workflow_id: workflowId,
      p_event_type: "workflow.webhook.executed",
      p_source: "orbit_webhook",
      p_entity_type: "workflow_run",
      p_entity_id: runId,
      p_payload: { ...payload, status: result.status },
    });

    return NextResponse.json({ accepted: true, ...result, ark_event_recorded: !eventError }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed.";
    const failedRunId = error && typeof error === "object" && "runId" in error ? String((error as { runId?: unknown }).runId ?? runId) : runId;
    return NextResponse.json({ accepted: false, run_id: failedRunId, status: "failed", error: message }, { status: 502 });
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: "Use POST to trigger this workflow." }, { status: 405, headers: { Allow: "POST" } });
}
