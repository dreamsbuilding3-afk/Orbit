"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

const integrations = [
  { provider: "gmail", name: "Gmail", category: "Communication", description: "Read, classify and send business emails." },
  { provider: "google_calendar", name: "Google Calendar", category: "Scheduling", description: "Create and manage appointments automatically." },
  { provider: "stripe", name: "Stripe", category: "Payments", description: "React to payments, invoices and failed charges." },
  { provider: "whatsapp", name: "WhatsApp", category: "Messaging", description: "Send customer and team notifications." },
  { provider: "crm", name: "CRM", category: "Customers", description: "Keep customer records synchronized." },
  { provider: "shopify", name: "Shopify", category: "Commerce", description: "Turn orders into automated business actions." },
];

type Connection = { provider: string; status: string; account_label: string | null };

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage("Connecte-toi à ORBIT pour gérer les intégrations."); return; }
      const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
      const org = memberships?.[0]?.organization_id;
      if (!org) return;
      const { data } = await supabase.from("integration_connections").select("provider,status,account_label").eq("organization_id", org);
      setConnections(data ?? []);
    }
    load();
  }, []);

  async function connect(provider: string) {
    if (!supabase) return;
    if (provider === "gmail") {
      setMessage("Opening Google authorization…");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
          scopes: "openid email profile https://www.googleapis.com/auth/gmail.modify",
        },
      });
      if (error) setMessage(error.message);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Connecte-toi à ORBIT d'abord."); return; }
    const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
    const org = memberships?.[0]?.organization_id;
    if (!org) { setMessage("Aucun workspace ORBIT trouvé."); return; }
    const { error } = await supabase.from("integration_connections").upsert({ organization_id: org, provider, status: "connected", account_label: "Connection ready" }, { onConflict: "organization_id,provider" });
    if (error) setMessage(error.message); else setConnections(current => [...current.filter(c => c.provider !== provider), { provider, status: "connected", account_label: "Connection ready" }]);
  }

  return <main className="app-shell"><section className="content" style={{ width: "100%" }}><header className="topbar"><Link href="/">ORBIT</Link><span className="topbar-muted">Connections</span></header><div className="page"><div className="hero-row"><div><p className="eyebrow">CONNECTIONS</p><h1>Tools that work together.</h1><p className="hero-copy">Connect the software your business already uses. ORBIT will handle the work between them.</p></div></div>{message && <div className="glass-card" style={{padding:16,marginBottom:20}}>{message}</div>}<div className="integration-grid">{integrations.map(i => { const c = connections.find(x => x.provider === i.provider); const connected = c?.status === "connected"; return <article className="glass-card integration-card" key={i.provider}><div className="integration-head"><div className="integration-icon">{i.name.slice(0,1)}</div><span className="integration-status">{connected ? "Connected" : "Not connected"}</span></div><h3>{i.name}</h3><p>{i.description}</p><div className="integration-bottom"><span>{i.category.toUpperCase()}</span><button className="secondary-button" onClick={() => connect(i.provider)}>{connected ? "Connected" : "Connect"}</button></div></article>; })}</div></div></section></main>;
}
