import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeWorkflowRun } from "@/lib/server/workflow-executor";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: "Supabase server environment is not configured." }, { status: 500 });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  const { workflowId } = await params;

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: memberships, error: membershipError } = await admin.from("organization_members")
    .select("organization_id,role").eq("user_id", user.id);
  if (membershipError || !memberships?.length) return NextResponse.json({ error: "No workspace found." }, { status: 403 });

  let payload: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) payload = parsed as Record<string, unknown>;
  } catch {}

  try {
    const result = await executeWorkflowRun({
      admin,
      workflowId,
      organizationId: memberships[0].organization_id,
      actorUserId: user.id,
      payload,
      source: "manual",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed.";
    const runId = error && typeof error === "object" && "runId" in error ? String((error as { runId?: unknown }).runId ?? "") : undefined;
    return NextResponse.json({ error: message, runId, status: "failed" }, { status: 502 });
  }
}
