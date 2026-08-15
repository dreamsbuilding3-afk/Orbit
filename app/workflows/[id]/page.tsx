"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Step = { id?: string; position: number; step_type: "trigger" | "condition" | "action"; name: string; description: string | null; config: Record<string, unknown> };
type Workflow = { id: string; name: string; description: string | null; status: string; trigger_type: string | null };

const fallback: Step[] = [
  { position: 0, step_type: "trigger", name: "Trigger", description: "Choose what starts this workflow.", config: {} },
  { position: 1, step_type: "action", name: "Action", description: "Choose what ORBIT should execute.", config: {} },
];

export default function WorkflowPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!supabase) { setMessage("Supabase n'est pas configuré."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Connecte-toi à ORBIT pour ouvrir ce workflow."); setLoading(false); return; }
    const { data, error } = await supabase.from("workflows").select("id,name,description,status,trigger_type").eq("id", id).single();
    if (error) { setMessage(error.message); setLoading(false); return; }
    const { data: stepData, error: stepError } = await supabase.from("workflow_steps").select("id,position,step_type,name,description,config").eq("workflow_id", id).order("position");
    if (stepError) setMessage(stepError.message);
    setWorkflow(data);
    setSteps(stepData?.length ? stepData : fallback);
    setLoading(false);
  }

  useEffect(() => { if (id) load(); }, [id]);

  function updateStep(index: number, patch: Partial<Step>) {
    setSteps(current => current.map((step, i) => i === index ? { ...step, ...patch } : step));
  }

  function addStep(type: "condition" | "action") {
    setSteps(current => [...current, { position: current.length, step_type: type, name: type === "condition" ? "Condition" : "Action", description: "Configure this step.", config: {} }]);
  }

  async function save() {
    if (!supabase || !workflow) return;
    setSaving(true); setMessage("");
    const normalized = steps.map((s, position) => ({ position, step_type: s.step_type, name: s.name, description: s.description, config: s.config }));
    const { error } = await supabase.rpc("save_workflow_steps", { target_workflow: workflow.id, steps: normalized });
    if (error) setMessage(error.message); else setMessage("Workflow saved in ORBIT.");
    setSaving(false);
  }

  if (loading) return <main className="app-shell"><section className="content"><div className="page"><p>Loading workflow…</p></div></section></main>;

  return <main className="app-shell">
    <section className="content" style={{ width: "100%" }}>
      <header className="topbar"><div className="breadcrumbs"><Link href="/workflows">Workflows</Link><b>/</b><strong>{workflow?.name ?? "Workflow"}</strong></div><button className="builder-save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save workflow"}</button></header>
      <div className="page">
        {!workflow ? <div className="glass-card" style={{ padding: 32 }}>{message || "Workflow not found."}</div> : <>
          <div className="hero-row"><div><p className="eyebrow">WORKFLOW BUILDER</p><h1>{workflow.name}</h1><p className="hero-copy">{workflow.description || "Connect an event to the work ORBIT should execute automatically."}</p></div><span className="status-pill">{workflow.status}</span></div>
          {message && <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>{message}</div>}
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ display: "grid", gap: 14 }}>
              {steps.map((step, index) => <div key={step.id ?? `${step.position}-${index}`} style={{ display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 16, alignItems: "center", padding: 18, border: "1px solid rgba(0,0,0,.08)", borderRadius: 18, background: "rgba(255,255,255,.72)" }}>
                <span className="eyebrow">{step.step_type.toUpperCase()}</span>
                <div><input value={step.name} onChange={e => updateStep(index, { name: e.target.value })} style={{ width: "100%", border: 0, outline: 0, background: "transparent", fontSize: 18, fontWeight: 650 }} /><p style={{ margin: "6px 0 0", opacity: .58 }}>{step.description}</p></div>
                <span style={{ opacity: .4 }}>{index + 1}</span>
              </div>)}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}><button className="secondary-button" onClick={() => addStep("condition")}>+ Condition</button><button className="secondary-button" onClick={() => addStep("action")}>+ Action</button></div>
          </div>
        </>}
      </div>
    </section>
  </main>;
}
