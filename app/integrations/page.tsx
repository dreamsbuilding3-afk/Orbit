"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

const integrations = [
  { provider: "gmail", name: "Gmail", category: "Communication", description: "Read, classify and send business emails.", available: true },
  { provider: "google_calendar", name: "Google Calendar", category: "Scheduling", description: "Create and manage appointments automatically.", available: false },
  { provider: "stripe", name: "Stripe", category: "Payments", description: "React to payments, invoices and failed charges.", available: false },
  { provider: "whatsapp", name: "WhatsApp", category: "Messaging", description: "Send customer and team notifications.", available: false },
  { provider: "crm", name: "CRM", category: "Customers", description: "Keep customer records synchronized.", available: false },
  { provider: "shopify", name: "Shopify", category: "Commerce", description: "Turn orders into automated business actions.", available: false },
];

type Connection = { provider: string; status: string; account_label: string | null };

function base64Url(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [message, setMessage] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("WineTime Gmail test");
  const [body, setBody] = useState("This is a real message sent from WineTime through Gmail.");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage("Connecte-toi à WineTime pour gérer les intégrations."); return; }
      const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
      const org = memberships?.[0]?.organization_id;
      if (!org) return;
      const { data, error } = await supabase.from("integration_connections_safe").select("provider,status,account_label").eq("organization_id", org);
      if (error) { setMessage("Impossible de charger les connexions."); return; }
      setConnections(data ?? []);
    }
    load();
  }, []);

  async function connect(provider: string) {
    if (!supabase) return;
    if (provider !== "gmail") {
      setMessage("Cette intégration arrive prochainement. Elle n'est pas encore active dans WineTime.");
      return;
    }
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
  }

  async function sendGmailTest() {
    if (!supabase) return;
    if (!to.trim()) { setMessage("Indique un destinataire pour le test Gmail."); return; }
    setSending(true); setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      if (!token) throw new Error("La session Google n'a pas fourni de jeton Gmail. Reconnecte Gmail puis réessaie.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Impossible de déterminer l'adresse Gmail connectée.");
      const raw = [
        `From: ${user.email}`,
        `To: ${to.trim()}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
      ].join("\r\n");
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: base64Url(raw) }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gmail a refusé l'envoi (${response.status}). ${detail.slice(0, 180)}`);
      }
      setMessage("✅ Email de test envoyé via Gmail.");
      setTestOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'envoyer le test Gmail.");
    } finally {
      setSending(false);
    }
  }

  return <main className="app-shell">
    <section className="content" style={{ width: "100%" }}>
      <header className="topbar"><Link href="/">WineTime</Link><span className="topbar-muted">Connections</span></header>
      <div className="page">
        <div className="hero-row"><div><p className="eyebrow">CONNECTIONS</p><h1>Tools that work together.</h1><p className="hero-copy">Connect the software your business already uses. WineTime will handle the work between them.</p></div></div>
        {message && <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>{message}</div>}
        <div className="integration-grid">
          {integrations.map(i => {
            const c = connections.find(x => x.provider === i.provider);
            const connected = c?.status === "connected";
            return <article className="glass-card integration-card" key={i.provider}>
              <div className="integration-head"><div className="integration-icon">{i.name.slice(0,1)}</div><span className="integration-status">{connected ? "Connected" : i.available ? "Not connected" : "Coming soon"}</span></div>
              <h3>{i.name}</h3><p>{i.description}</p>
              <div className="integration-bottom"><span>{i.category.toUpperCase()}</span><button className="secondary-button" onClick={() => connect(i.provider)} disabled={!i.available}>{connected ? "Connected" : i.available ? "Connect" : "Coming soon"}</button></div>
              {i.provider === "gmail" && connected && <button className="secondary-button" style={{ marginTop: 12, width: "100%" }} onClick={() => setTestOpen(true)}>Send a test email</button>}
            </article>;
          })}
        </div>

        {testOpen && <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", padding: 20, background: "rgba(0,0,0,.18)", backdropFilter: "blur(8px)" }}>
          <div className="glass-card" style={{ width: "min(520px,100%)", padding: 24, background: "rgba(255,255,255,.95)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div><p className="eyebrow">GMAIL</p><h3 style={{ margin: 0 }}>Send a real test email</h3></div><button className="icon-button" onClick={() => setTestOpen(false)}>×</button></div>
            <label className="field-label">TO<input value={to} onChange={e => setTo(e.target.value)} placeholder="client@example.com" /></label>
            <label className="field-label">SUBJECT<input value={subject} onChange={e => setSubject(e.target.value)} /></label>
            <label className="field-label">MESSAGE<textarea value={body} onChange={e => setBody(e.target.value)} rows={6} /></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><button className="secondary-button" onClick={() => setTestOpen(false)}>Cancel</button><button className="builder-save" onClick={sendGmailTest} disabled={sending}>{sending ? "Sending…" : "Send test"}</button></div>
          </div>
        </div>}
      </div>
    </section>
  </main>;
}
