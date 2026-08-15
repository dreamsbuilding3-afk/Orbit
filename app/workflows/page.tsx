"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Kind = "trigger" | "condition" | "action";
type Step = { id: number; kind: Kind; title: string; detail: string; app: string };

const initialSteps: Step[] = [
  { id: 1, kind: "trigger", title: "New client detected", detail: "When a form is submitted on your website", app: "Website" },
  { id: 2, kind: "action", title: "Create client in CRM", detail: "Add the contact and company details", app: "CRM" },
  { id: 3, kind: "action", title: "Send welcome email", detail: "Send the onboarding email template", app: "Gmail" },
  { id: 4, kind: "action", title: "Notify the team", detail: "Tell the sales team a new client arrived", app: "WhatsApp" },
];

const mark = (kind: Kind) => kind === "trigger" ? "01" : kind === "condition" ? "?" : "→";

export default function WorkflowsPage() {
  const [steps, setSteps] = useState(initialSteps);
  const [active, setActive] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  async function saveWorkflow() {
    setSaving(true);
    setMessage("");
    try {
      if (!supabase) throw new Error("Supabase n'est pas configuré.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connecte-toi à ORBIT avant de sauvegarder un workflow.");

      let id = workflowId;
      if (!id) {
        const { data, error } = await supabase.rpc("create_workflow", {
          workflow_name: "Client onboarding",
          workflow_description: "Turn a business process into an automatic system.",
          workflow_trigger_type: "website_form",
        });
        if (error) throw error;
        id = data as string;
        setWorkflowId(id);
      }

      const { error: stepsError } = await supabase.rpc("save_workflow_steps", {
        target_workflow: id,
        steps: steps.map((step, position) => ({
          position,
          step_type: step.kind,
          name: step.title,
          description: step.detail,
          config: { app: step.app },
        })),
      });
      if (stepsError) throw stepsError;

      setSaved(true);
      setMessage("Workflow enregistré dans ORBIT.");
      setTimeout(() => setSaved(false), 1600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer le workflow.");
    } finally {
      setSaving(false);
    }
  }

  function addStep(kind: Kind) {
    const id = Math.max(...steps.map(s => s.id), 0) + 1;
    const templates: Record<Kind, [string, string, string]> = {
      trigger: ["Payment received", "A payment is confirmed", "Stripe"],
      condition: ["Check customer value", "Continue only if the condition is true", "ORBIT"],
      action: ["Create task", "Assign a follow-up task to the team", "CRM"],
    };
    const [title, detail, app] = templates[kind];
    setSteps([...steps, { id, kind, title, detail, app }]);
    setActive(id);
    setMessage("");
  }

  return (
    <main className="workflow-builder">
      <header className="builder-topbar">
        <div className="builder-brand"><Link href="/">ORBIT</Link><span>/</span><strong>Workflows</strong></div>
        <div className="builder-actions">
          <button className="builder-ghost" onClick={() => setEnabled(!enabled)}><i className={enabled ? "on" : ""} /> {enabled ? "Active" : "Paused"}</button>
          <button className="builder-save" disabled={saving} onClick={saveWorkflow}>{saving ? "Saving…" : saved ? "Saved ✓" : "Save workflow"}</button>
        </div>
      </header>

      <div className="builder-layout">
        <aside className="builder-side">
          <Link href="/" className="back-link">← Overview</Link>
          <div className="builder-title"><p className="eyebrow">WORKFLOW BUILDER</p><h1>Client onboarding</h1><p>Turn a business process into an automatic system.</p></div>
          <label className="field-label">WORKFLOW NAME<input defaultValue="Client onboarding" /></label>
          <div className="side-section"><p className="eyebrow">ADD TO FLOW</p><button onClick={() => addStep("trigger")}><span>01</span>Trigger <b>+</b></button><button onClick={() => addStep("condition")}><span>?</span>Condition <b>+</b></button><button onClick={() => addStep("action")}><span>→</span>Action <b>+</b></button></div>
          <div className="builder-help"><div>✦</div><strong>Build with plain language</strong><p>Tell ORBIT what should happen and turn it into steps automatically.</p><button>Ask ORBIT →</button></div>
        </aside>

        <section className="canvas">
          <div className="canvas-head"><div><p className="eyebrow">AUTOMATION LOGIC</p><h2>When this happens, ORBIT does the rest.</h2></div><span className="canvas-status"><i className={enabled ? "on" : ""} /> {enabled ? "Workflow active" : "Workflow paused"}</span></div>
          {message && <div className="save-message">{message}</div>}
          <div className="flow-canvas"><div className="flow-column">
            {steps.map((step, index) => (
              <div key={step.id} className="flow-block-wrap">
                <button className={`flow-block ${step.kind} ${active === step.id ? "selected" : ""}`} onClick={() => setActive(step.id)}>
                  <span className="flow-number">{mark(step.kind)}</span><span className="flow-main"><small>{step.kind}</small><strong>{step.title}</strong><em>{step.detail}</em></span><span className="flow-app">{step.app}</span><span className="flow-more">•••</span>
                </button>
                {index < steps.length - 1 && <div className="flow-line"><span /></div>}
              </div>
            ))}
            <button className="add-between" onClick={() => addStep("action")}><span>+</span> Add step</button>
          </div></div>
        </section>

        <aside className="inspector">
          <div className="inspector-head"><p className="eyebrow">STEP {String(steps.findIndex(s => s.id === active) + 1).padStart(2, "0")}</p><button onClick={() => setActive(steps[0].id)}>×</button></div>
          {(() => { const step = steps.find(s => s.id === active) ?? steps[0]; return <>
            <div className="inspector-icon">{mark(step.kind)}</div><h3>{step.title}</h3><p className="inspector-copy">{step.detail}</p>
            <div className="inspector-divider" />
            <label className="field-label">STEP TYPE<input value={step.kind === "trigger" ? "Trigger" : step.kind === "condition" ? "Condition" : "Action"} readOnly /></label>
            <label className="field-label">CONNECTED APP<input value={step.app} readOnly /></label>
            <label className="field-label">DESCRIPTION<textarea defaultValue={step.detail} /></label>
            <button className="delete-step" onClick={() => { if (steps.length > 1) { const next = steps.filter(s => s.id !== step.id); setSteps(next); setActive(next[0].id); } }}>Remove step</button>
          </>; })()}
        </aside>
      </div>
      <style jsx>{`.save-message{position:absolute;top:76px;right:24px;padding:9px 12px;border:1px solid #e4e4e2;border-radius:10px;background:rgba(255,255,255,.9);backdrop-filter:blur(16px);font-size:9px;color:#555;box-shadow:0 10px 30px rgba(0,0,0,.05);z-index:5}.builder-save:disabled{opacity:.55;cursor:wait}`}</style>
    </main>
  );
}
