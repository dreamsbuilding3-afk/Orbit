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
  const secret = request.headers.get("x-orbit-webhook-secret") || request.nextUrl.searchParams.get("secret");
  if (!secret) return NextResponse.json({ error: "Missing webhook secret." }, { status: 401 });

  let payload: unknown = {};
  try {
    payload = await request.json();
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

  return NextResponse.json({ accepted: true, run_id: runId, status: "queued" }, { status: 202 });
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: "Use POST to trigger this workflow." }, { status: 405, headers: { Allow: "POST" } });
}
