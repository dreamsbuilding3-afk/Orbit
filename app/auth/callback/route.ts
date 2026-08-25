import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/server/supabase";
import { encryptGoogleToken } from "@/lib/server/google-token";

const integrations = {
  gmail: { provider: "gmail", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.modify"] },
  google_calendar: { provider: "google_calendar", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.readonly"] },
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const integrationKey = url.searchParams.get("integration");
  const requestedOrganizationId = url.searchParams.get("organization_id");
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const redirectBase = new URL("/integrations", url.origin);

  if (errorDescription) {
    redirectBase.searchParams.set("error", errorDescription.slice(0, 180));
    return NextResponse.redirect(redirectBase);
  }

  const integration = integrationKey && integrationKey in integrations ? integrations[integrationKey as keyof typeof integrations] : null;
  if (!integration || !code) {
    redirectBase.searchParams.set("error", "Connexion Google invalide ou incomplète.");
    return NextResponse.redirect(redirectBase);
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    redirectBase.searchParams.set("error", "Impossible de finaliser la session Google.");
    return NextResponse.redirect(redirectBase);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!user || !session) {
    redirectBase.searchParams.set("error", "Session utilisateur introuvable.");
    return NextResponse.redirect(redirectBase);
  }

  let organizationId = requestedOrganizationId;
  if (!organizationId) {
    const { data: memberships, error } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id);
    if (error || !memberships || memberships.length !== 1) {
      redirectBase.searchParams.set("error", "Sélectionnez explicitement l'organisation à connecter.");
      return NextResponse.redirect(redirectBase);
    }
    organizationId = memberships[0].organization_id;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError || !membership || !["owner", "admin"].includes(membership.role)) {
    redirectBase.searchParams.set("error", "Vous n'avez pas les droits pour connecter cette organisation.");
    return NextResponse.redirect(redirectBase);
  }

  const providerRefreshToken = session.provider_refresh_token;
  if (!providerRefreshToken) {
    redirectBase.searchParams.set("error", "Google n'a pas fourni de refresh token. Reconnectez le compte avec l'accès hors connexion.");
    return NextResponse.redirect(redirectBase);
  }

  let encryptedRefreshToken: string;
  try {
    encryptedRefreshToken = encryptGoogleToken(providerRefreshToken);
  } catch {
    redirectBase.searchParams.set("error", "Le stockage sécurisé du token Google n'est pas configuré.");
    return NextResponse.redirect(redirectBase);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    redirectBase.searchParams.set("error", "La configuration serveur de WineTime est incomplète.");
    return NextResponse.redirect(redirectBase);
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { error: saveError } = await admin
    .from("integration_connections")
    .upsert({
      organization_id: organizationId,
      provider: integration.provider,
      status: "connected",
      account_label: user.email ?? "Google account",
      scopes: integration.scopes,
      metadata: { auth_provider: "google", google_refresh_token_encrypted: encryptedRefreshToken, google_refresh_token_saved_at: new Date().toISOString(), connected_by: user.id },
      granted_by: user.id,
      revoked_at: null,
      last_error: null,
    }, { onConflict: "organization_id,provider" });

  if (saveError) {
    redirectBase.searchParams.set("error", "Google a été autorisé mais le stockage sécurisé a échoué.");
    return NextResponse.redirect(redirectBase);
  }

  // Re-persist only the WineTime session tokens; Google provider tokens are not retained in the browser session.
  await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });

  redirectBase.searchParams.set("connected", integration.provider);
  return NextResponse.redirect(redirectBase);
}
