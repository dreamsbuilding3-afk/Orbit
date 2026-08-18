"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finalizing your connection…");

  useEffect(() => {
    let cancelled = false;
    async function finish() {
      if (!supabase) { setMessage("Supabase is not configured."); return; }
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setMessage(error.message); return; }
      }

      const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (!user || !session) { setMessage("No authenticated session found."); return; }

      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
      if (membershipError || !memberships?.[0]) { setMessage("No WineTime workspace found for this account."); return; }
      const org = memberships[0].organization_id;

      const { error } = await supabase.from("integration_connections").upsert({
        organization_id: org,
        provider: "gmail",
        status: "connected",
        account_label: user.email ?? "Google account",
        scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.modify"],
        metadata: { auth_provider: "google", connected_at: new Date().toISOString() },
        last_error: null,
      }, { onConflict: "organization_id,provider" });
      if (error) { setMessage(error.message); return; }

      if (session.provider_refresh_token) {
        const response = await fetch("/api/integrations/google/store-token", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ providerRefreshToken: session.provider_refresh_token }),
        });
        if (!response.ok) {
          const detail = await response.json().catch(() => null) as { error?: string } | null;
          setMessage(detail?.error ?? "Google connected, but secure token storage failed.");
          return;
        }
      }

      if (!cancelled) router.replace("/integrations?connected=gmail");
    }
    finish();
    return () => { cancelled = true; };
  }, [router]);

  return <main className="app-shell"><section className="content" style={{ width: "100%" }}><div className="page"><div className="glass-card" style={{ maxWidth: 560, margin: "15vh auto", padding: 32, textAlign: "center" }}><p className="eyebrow">WineTime CONNECTION</p><h1>Connecting Gmail</h1><p className="hero-copy">{message}</p></div></div></section></main>;
}
