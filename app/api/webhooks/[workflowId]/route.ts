import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const supabase = getClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const { workflowId } = await params;
  const secret = request.headers.get("x-orbit-webhook-secret");
  if (!secret) return NextResponse.json({ error: "Missing webhook secret." }, { status: 401 });

  let payload: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) payload = parsed as Record<string, unknown>;
  } catch {
    payload = {};
  }

  const { data: runId, error } = await supabase.rpc("receive_workflow_webhook", {
    p_workflow_id: workflowId,
    p_secret: secret,
    p_payload: payload,
  });

  if (error) {
    const status = error.message.includes("Invalid webhook secret") ? 401 : error.message.includes("Workflow unavailable") ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  const { error: eventError } = await supabase.rpc("record_ark_event", {
    p_workflow_id: workflowId,
    p_event_type: "workflow.webhook.received",
    p_source: "orbit_webhook",
    p_entity_type: "workflow_run",
    p_entity_id: runId,
    p_payload: payload,
  });

  return NextResponse.json({ accepted: true, run_id: runId, ark_event_recorded: !eventError, status: "queued" }, { status: 202 });
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: "Use POST to trigger this workflow." }, { status: 405, headers: { Allow: "POST" } });
}
