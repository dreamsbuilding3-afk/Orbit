"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Workflow = { id: string; name: string; description: string | null; status: string; updated_at: string };

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    if (!supabase) { setMessage("Supabase n'est pas configuré."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Connecte-toi à WineTime pour voir tes workflows."); setLoading(false); return; }
    const { data: orgs, error: orgError } = await supabase.rpc("my_organizations");
    if (orgError) { setMessage(orgError.message); setLoading(false); return; }
    const orgId = orgs?.[0]?.id;
    if (!orgId) { setMessage("Aucune entreprise n'est encore associée à ce compte."); setLoading(false); return; }
    const { data, error } = await supabase.from("workflows").select("id,name,description,status,updated_at").eq("organization_id", orgId).neq("status", "archived").order("updated_at", { ascending: false });
    if (error) setMessage(error.message); else setWorkflows(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return <main className="app-shell">
    <section className="content" style={{ width: "100%" }}>
      <header className="topbar"><div className="breadcrumbs"><Link href="/">Workspace</Link><b>/</b><strong>Workflows</strong></div><Link className="builder-save" href="/workflows/new">+ New workflow</Link></header>
      <div className="page">
        <div className="hero-row"><div><p className="eyebrow">AUTOMATION</p><h1>Workflows that run the business.</h1><p className="hero-copy">Every workflow connects an event to the actions WineTime should execute automatically.</p></div><Link className="primary-button" href="/workflows/new">Create workflow →</Link></div>
        {message && <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>{message}</div>}
        <div className="section-heading"><div><p className="eyebrow">YOUR AUTOMATIONS</p><h2>{loading ? "Loading workflows…" : `${workflows.length} workflow${workflows.length === 1 ? "" : "s"}`}</h2></div></div>
        {!loading && workflows.length === 0 ? <div className="glass-card" style={{ padding: 42, textAlign: "center" }}><h3>No workflows yet.</h3><p>Create your first automation and let WineTime take care of the work between your tools.</p><Link className="primary-button" href="/workflows/new">Build your first workflow →</Link></div> : <div style={{ display: "grid", gap: 12 }}>{workflows.map(w => <Link href={`/workflows/${w.id}`} key={w.id} className="glass-card" style={{ padding: 22, display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}><div><p className="eyebrow">{w.status.toUpperCase()}</p><h3>{w.name}</h3><p>{w.description ?? "Automation workflow"}</p></div><span>Open →</span></Link>)}</div>}
      </div>
    </section>
  </main>;
}
