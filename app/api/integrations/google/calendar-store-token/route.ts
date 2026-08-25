import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptGoogleToken } from "@/lib/server/google-token";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return NextResponse.json({ error: "Supabase server environment is not configured." }, { status: 500 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  const body = await request.json().catch(() => null) as { providerRefreshToken?: string; organizationId?: string } | null;
  if (!body?.providerRefreshToken) return NextResponse.json({ error: "Missing Google refresh token." }, { status: 400 });
  if (!body.organizationId) return NextResponse.json({ error: "Missing organization context." }, { status: 400 });

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("organization_id, role")
    .eq("organization_id", body.organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError || !membership || !["owner", "admin"].includes(membership.role)) return NextResponse.json({ error: "Organization access denied." }, { status: 403 });

  let encrypted: string;
  try { encrypted = encryptGoogleToken(body.providerRefreshToken); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Token encryption is unavailable." }, { status: 500 }); }

  const { error } = await admin.from("integration_connections").upsert({
    organization_id: body.organizationId,
    provider: "google_calendar",
    status: "connected",
    account_label: user.email ?? "Google account",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.readonly"],
    metadata: { auth_provider: "google", google_refresh_token_encrypted: encrypted, google_refresh_token_saved_at: new Date().toISOString(), connected_by: user.id },
    granted_by: user.id,
    revoked_at: null,
    last_error: null,
  }, { onConflict: "organization_id,provider" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
