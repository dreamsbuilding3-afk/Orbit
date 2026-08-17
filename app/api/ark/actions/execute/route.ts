import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function base64Url(value: string) {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ error: "Supabase server environment is not configured." }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing access token." }, { status: 401 });

  const body = await request.json().catch(() => null) as { recommendationId?: string; providerToken?: string } | null;
  if (!body?.recommendationId || !body.providerToken) {
    return NextResponse.json({ error: "recommendationId and providerToken are required." }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership?.organization_id) return NextResponse.json({ error: "No workspace found." }, { status: 403 });
  const organizationId = membership.organization_id;

  const { data: recommendation, error: recommendationError } = await admin
    .from("ark_recommendations")
    .select("id,status,action,opportunity_id")
    .eq("id", body.recommendationId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (recommendationError || !recommendation) return NextResponse.json({ error: "Recommendation not found." }, { status: 404 });
  if (recommendation.status !== "approved") return NextResponse.json({ error: "Recommendation must be approved first." }, { status: 409 });

  const action = (recommendation.action ?? {}) as Record<string, unknown>;
  const actionType = String(action.action_type ?? action.type ?? "general");
  if (!actionType.toLowerCase().includes("email") && actionType !== "gmail.send") {
    return NextResponse.json({ error: "Only Gmail email execution is enabled in this V1 executor." }, { status: 400 });
  }

  const to = String(action.to ?? action.recipient ?? "").trim();
  const subject = String(action.subject ?? "ORBIT message");
  const message = String(action.body ?? action.message ?? "");
  if (!to) return NextResponse.json({ error: "Gmail action is missing a recipient." }, { status: 400 });

  const { data: run, error: runError } = await admin
    .from("ark_action_runs")
    .insert({
      organization_id: organizationId,
      recommendation_id: recommendation.id,
      opportunity_id: recommendation.opportunity_id,
      action_type: actionType,
      status: "running",
      input: action,
    })
    .select("id")
    .single();
  if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });

  try {
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
      headers: { Authorization: `Bearer ${body.providerToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: base64Url(raw) }),
    });

    if (!response.ok) {
      const detail = await response.text();
      await admin.from("ark_action_runs").update({ status: "failed", error: detail.slice(0, 500) }).eq("id", run.id).eq("organization_id", organizationId);
      return NextResponse.json({ error: `Gmail refused the action (${response.status}).` }, { status: 502 });
    }

    const output = await response.json().catch(() => ({}));
    await admin.from("ark_action_runs").update({ status: "completed", output }).eq("id", run.id).eq("organization_id", organizationId);
    await admin.from("ark_recommendations").update({ status: "executed" }).eq("id", recommendation.id).eq("organization_id", organizationId);

    return NextResponse.json({ ok: true, actionRunId: run.id });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Execution failed.";
    await admin.from("ark_action_runs").update({ status: "failed", error: messageText }).eq("id", run.id).eq("organization_id", organizationId);
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
