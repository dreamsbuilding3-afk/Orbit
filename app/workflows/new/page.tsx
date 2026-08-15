"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Kind = "trigger" | "condition" | "action";
type Step = { id: number; kind: Kind; title: string; detail: string; app: string };

const templates: Record<Kind, [string, string, string]> = {
  trigger: ["New client detected", "When a business event occurs", "Website"],
  condition: ["Check a condition", "Continue only when the rule is true", "ORBIT"],
  action: ["Send a notification", "Tell the right person what happened", "Gmail"],
};

export default function NewWorkflowPage() {
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, kind: "trigger", title: "New client detected", detail: "When a form is submitted on your website", app: "Website" },
    { id: 2, kind: "action", title: "Create client in CRM", detail: "Add the contact and company details", app: "CRM" },
    { id: 3, kind: "action", title: "Send welcome email", detail: "Send the onboarding email template", app: "Gmail" },
  ]);
  const [name, setName] = useState("Client onboarding");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function add(kind: Kind) {
    const [title, detail, app] = templates[kind];
    setSteps(s => [...s, { id: Date.now(), kind, title, detail, app }]);
  }

  async function save() {
    if (!supabase) return setMessage("Supabase n'est pas configuré.");
    setSaving(true); setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connecte-toi à ORBIT avant de sauvegarder.");
      const { data: workflowId, error } = await supabase.rpc("create_workflow", { workflow_name: name, workflow_description: "Business automation workflow", workflow_trigger_type: steps[0]?.kind ?? "manual" });
      if (error) throw error;
      const { error: stepError } = await supabase.rpc("save_workflow_steps", { target_workflow: workflowId, steps: steps.map((s, position) => ({ position, step_type: s.kind, name: s.title, description: s.detail, config: { app: s.app } })) });
      if (stepError) throw stepError;
      setMessage("Workflow enregistré dans ORBIT.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Impossible d'enregistrer."); }
    finally { setSaving(false); }
  }

  return <main className="workflow-builder">
    <header className="builder-topbar"><div className="builder-brand"><Link href="/workflows">ORBIT</Link><span>/</span><strong>New workflow</strong></div><div className="builder-actions"><Link className="builder-ghost" href="/workflows">Cancel</Link><button className="builder-save" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save workflow"}</button></div></header>
    <div className="builder-layout">
      <aside className="builder-side"><Link href="/workflows" className="back-link">← Workflows</Link><div className="builder-title"><p className="eyebrow">NEW AUTOMATION</p><h1>Build the next workflow.</h1><p>Connect a business event to the actions ORBIT should execute.</p></div><label className="field-label">WORKFLOW NAME<input value={name} onChange={e => setName(e.target.value)} /></label><div className="side-section"><p className="eyebrow">ADD TO FLOW</p><button onClick={() => add("trigger")}><span>01</span>Trigger <b>+</b></button><button onClick={() => add("condition")}><span>?</span>Condition <b>+</b></button><button onClick={() => add("action")}><span>→</span>Action <b>+</b></button></div></aside>
      <section className="canvas"><div className="canvas-head"><div><p className="eyebrow">AUTOMATION LOGIC</p><h2>When this happens, ORBIT does the rest.</h2></div></div>{message && <div className="save-message">{message}</div>}<div className="flow-canvas"><div className="flow-column">{steps.map((s, i) => <div className="flow-block-wrap" key={s.id}><div className={`flow-block ${s.kind}`}><span className="flow-number">{s.kind === "trigger" ? "01" : s.kind === "condition" ? "?" : "→"}</span><span className="flow-main"><small>{s.kind}</small><strong>{s.title}</strong><em>{s.detail}</em></span><span className="flow-app">{s.app}</span></div>{i < steps.length - 1 && <div className="flow-line"><span /></div>}</div>)}<button className="add-between" onClick={() => add("action")}><span>+</span> Add action</button></div></div></section>
    </div>
    <style jsx>{`.save-message{position:absolute;top:76px;right:24px;padding:9px 12px;border:1px solid #e4e4e2;border-radius:10px;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);font-size:9px;color:#555;box-shadow:0 10px 30px rgba(0,0,0,.05);z-index:5}.builder-ghost{text-decoration:none}`}</style>
  </main>;
}
