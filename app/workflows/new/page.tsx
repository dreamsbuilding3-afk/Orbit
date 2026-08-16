"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Kind = "trigger" | "condition" | "action";
type Step = {
  id: number;
  kind: Kind;
  title: string;
  detail: string;
  app: string;
  config: Record<string, string>;
};

const templates: Record<Kind, [string, string, string]> = {
  trigger: ["New client detected", "When a business event occurs", "Website"],
  condition: ["Check a condition", "Continue only when the rule is true", "ORBIT"],
  action: ["Send an email", "Send a message using a connected Gmail account", "Gmail"],
};

function initialSteps(): Step[] {
  return [
    { id: 1, kind: "trigger", title: "New client detected", detail: "When a form is submitted on your website", app: "Website", config: { event: "new_client" } },
    { id: 2, kind: "action", title: "Create client in CRM", detail: "Add the contact and company details", app: "CRM", config: { operation: "create_contact" } },
    { id: 3, kind: "action", title: "Send welcome email", detail: "Send the onboarding email template", app: "Gmail", config: { to: "{{client.email}}", subject: "Welcome to {{company.name}}", body: "Hi {{client.first_name}},\n\nWelcome to our company.", } },
  ];
}

export default function NewWorkflowPage() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [name, setName] = useState("Client onboarding");
  const [selected, setSelected] = useState<number | null>(3);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function add(kind: Kind) {
    const [title, detail, app] = templates[kind];
    const config = kind === "action" && app === "Gmail" ? { to: "{{client.email}}", subject: "Your update from {{company.name}}", body: "Hello {{client.first_name}},\n\nHere is an update from our team." } : {};
    const next = { id: Date.now(), kind, title, detail, app, config };
    setSteps(s => [...s, next]);
    setSelected(next.id);
  }

  function updateSelected(patch: Partial<Step>, configPatch?: Record<string, string>) {
    if (!selected) return;
    setSteps(current => current.map(step => step.id === selected ? { ...step, ...patch, config: { ...step.config, ...(configPatch ?? {}) } } : step));
  }

  async function save() {
    if (!supabase) return setMessage("Supabase n'est pas configuré.");
    setSaving(true); setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connecte-toi à ORBIT avant de sauvegarder.");
      const { data: workflowId, error } = await supabase.rpc("create_workflow", {
        workflow_name: name,
        workflow_description: "Business automation workflow",
        workflow_trigger_type: steps[0]?.kind ?? "manual",
      });
      if (error) throw error;
      const { error: stepError } = await supabase.rpc("save_workflow_steps", {
        target_workflow: workflowId,
        steps: steps.map((s, position) => ({ position, step_type: s.kind, name: s.title, description: s.detail, config: { app: s.app, ...s.config } })),
      });
      if (stepError) throw stepError;
      setMessage("Workflow enregistré dans ORBIT.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  }

  const active = steps.find(step => step.id === selected) ?? null;
  const isGmail = active?.kind === "action" && active.app === "Gmail";

  return <main className="workflow-builder">
    <header className="builder-topbar"><div className="builder-brand"><Link href="/workflows">ORBIT</Link><span>/</span><strong>New workflow</strong></div><div className="builder-actions"><Link className="builder-ghost" href="/workflows">Cancel</Link><button className="builder-save" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save workflow"}</button></div></header>
    <div className="builder-layout">
      <aside className="builder-side">
        <Link href="/workflows" className="back-link">← Workflows</Link>
        <div className="builder-title"><p className="eyebrow">NEW AUTOMATION</p><h1>Build the next workflow.</h1><p>Connect a business event to the actions ORBIT should execute.</p></div>
        <label className="field-label">WORKFLOW NAME<input value={name} onChange={e => setName(e.target.value)} /></label>
        <div className="side-section"><p className="eyebrow">ADD TO FLOW</p><button onClick={() => add("trigger")}><span>01</span>Trigger <b>+</b></button><button onClick={() => add("condition")}><span>?</span>Condition <b>+</b></button><button onClick={() => add("action")}><span>→</span>Action <b>+</b></button></div>
      </aside>
      <section className="canvas">
        <div className="canvas-head"><div><p className="eyebrow">AUTOMATION LOGIC</p><h2>When this happens, ORBIT does the rest.</h2></div></div>
        {message && <div className="save-message">{message}</div>}
        <div className="flow-canvas"><div className="flow-column">
          {steps.map((s, i) => <div className="flow-block-wrap" key={s.id}>
            <button type="button" className={`flow-block ${s.kind} ${selected === s.id ? "selected" : ""}`} onClick={() => setSelected(s.id)}>
              <span className="flow-number">{s.kind === "trigger" ? "01" : s.kind === "condition" ? "?" : "→"}</span>
              <span className="flow-main"><small>{s.kind}</small><strong>{s.title}</strong><em>{s.detail}</em></span><span className="flow-app">{s.app}</span>
            </button>
            {i < steps.length - 1 && <div className="flow-line"><span /></div>}
          </div>)}
          <button className="add-between" onClick={() => add("action")}><span>+</span> Add action</button>
        </div></div>
      </section>
      <aside className="builder-inspector">
        <p className="eyebrow">STEP CONFIGURATION</p>
        {!active ? <div className="inspector-empty"><strong>Select a step</strong><span>Choose a trigger, condition or action from the canvas.</span></div> : <>
          <h3>{active.title}</h3><p className="inspector-sub">{active.app} · {active.kind}</p>
          <label className="field-label">STEP NAME<input value={active.title} onChange={e => updateSelected({ title: e.target.value })} /></label>
          <label className="field-label">DESCRIPTION<textarea value={active.detail} onChange={e => updateSelected({ detail: e.target.value })} /></label>
          {isGmail && <div className="config-panel">
            <p className="eyebrow">GMAIL ACTION</p>
            <label className="field-label">TO<input value={active.config.to ?? ""} onChange={e => updateSelected({}, { to: e.target.value })} placeholder="client@email.com or {{client.email}}" /></label>
            <label className="field-label">SUBJECT<input value={active.config.subject ?? ""} onChange={e => updateSelected({}, { subject: e.target.value })} /></label>
            <label className="field-label">MESSAGE<textarea rows={7} value={active.config.body ?? ""} onChange={e => updateSelected({}, { body: e.target.value })} /></label>
            <div className="hint-box">Use variables such as <code>{"{{client.email}}"}</code> and <code>{"{{company.name}}"}</code>. ORBIT resolves them when the workflow runs.</div>
          </div>}
        </>}
      </aside>
    </div>
    <style jsx>{`
      .flow-block{width:100%;text-align:left;color:inherit}.flow-block.selected{box-shadow:0 0 0 2px rgba(0,0,0,.09),0 14px 30px rgba(0,0,0,.08);transform:translateY(-1px)}
      .builder-inspector{padding:28px 22px;background:rgba(255,255,255,.62);border-left:1px solid var(--line)}
      .builder-inspector h3{margin:7px 0 5px;font-size:18px;letter-spacing:-.03em}.inspector-sub{margin:0 0 22px;color:#999;font-size:9px}.inspector-empty{display:grid;gap:6px;padding:18px;border:1px dashed #ddd;border-radius:12px;background:rgba(255,255,255,.55)}.inspector-empty strong{font-size:11px}.inspector-empty span{font-size:9px;color:#999;line-height:1.5}
      .config-panel{margin-top:25px;padding-top:20px;border-top:1px solid var(--line)}.config-panel .field-label{margin-bottom:14px}.hint-box{padding:12px;border:1px solid var(--line);border-radius:10px;background:#fafafa;color:#888;font-size:8px;line-height:1.6}.hint-box code{color:#333;background:#fff;border:1px solid #e6e6e4;border-radius:4px;padding:2px 4px}
      .builder-inspector textarea{resize:vertical;min-height:70px}
      @media(max-width:1100px){.builder-layout{grid-template-columns:240px minmax(0,1fr)}.builder-inspector{grid-column:1 / -1;border-left:0;border-top:1px solid var(--line)}}
      @media(max-width:720px){.builder-layout{display:block}.builder-side{border-right:0;border-bottom:1px solid var(--line)}.builder-inspector{border-top:1px solid var(--line)}.builder-topbar{padding:0 14px}}
      .save-message{position:absolute;top:76px;right:24px;padding:9px 12px;border:1px solid #e4e4e2;border-radius:10px;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);font-size:9px;color:#555;box-shadow:0 10px 30px rgba(0,0,0,.05);z-index:5}.builder-ghost{text-decoration:none}
    `}</style>
  </main>;
}
