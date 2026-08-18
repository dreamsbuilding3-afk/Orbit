"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Step = { id?: string; position: number; step_type: "trigger" | "condition" | "action"; name: string; description: string | null; config: Record<string, unknown> };
type Workflow = { id: string; name: string; description: string | null; status: string; trigger_type: string | null };

const fallback: Step[] = [
  { position: 0, step_type: "trigger", name: "Trigger", description: "Choose what starts this workflow.", config: {} },
  { position: 1, step_type: "action", name: "Action", description: "Choose what WineTime should execute.", config: {} },
];

function applyTemplate(value: string, context: Record<string, string>) {
  return value.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => context[key.trim()] ?? "");
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default function WorkflowPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!supabase) { setMessage("Supabase n'est pas configuré."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Connecte-toi à WineTime pour ouvrir ce workflow."); setLoading(false); return; }
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
    setSteps(current => [...current, { position: current.length, step_type: type, name: type === "condition" ? "Condition" : "Action", description: "Configure this step.", config: type === "action" ? { app: "Gmail", to: "{{client.email}}", subject: "Welcome", message: "Hello {{client.name}}" } : {} }]);
  }

  async function save() {
    if (!supabase || !workflow) return;
    setSaving(true); setMessage("");
    const normalized = steps.map((s, position) => ({ position, step_type: s.step_type, name: s.name, description: s.description, config: s.config }));
    const { error } = await supabase.rpc("save_workflow_steps", { target_workflow: workflow.id, steps: normalized });
    if (error) setMessage(error.message); else setMessage("Workflow saved in WineTime.");
    setSaving(false);
  }

  async function runWorkflow() {
    if (!supabase || !workflow) return;
    setRunning(true); setMessage("");
    let runId: string | null = null;
    try {
      const { data: run, error: runError } = await supabase.from("workflow_runs").insert({ workflow_id: workflow.id, status: "running", context: { source: "manual_test" } }).select("id").single();
      if (runError) throw runError;
      runId = run.id;
      const context = { "client.email": "test@example.com", "client.name": "Test Client", "company.name": "WineTime Test" };

      for (const step of steps) {
        const startedAt = new Date().toISOString();
        const { data: runStep, error: runStepError } = await supabase.from("workflow_run_steps").insert({ run_id: runId, step_id: step.id ?? null, status: "running", started_at: startedAt }).select("id").single();
        if (runStepError) throw runStepError;

        try {
          if (step.step_type === "condition") {
            await supabase.from("workflow_run_steps").update({ status: "completed", finished_at: new Date().toISOString(), output: { evaluated: true } }).eq("id", runStep.id);
            continue;
          }

          if (step.step_type === "action" && String(step.config.app ?? "").toLowerCase() === "gmail") {
            const { data: sessionData } = await supabase.auth.getSession();
            const providerToken = sessionData.session?.provider_token;
            if (!providerToken) throw new Error("Gmail provider token unavailable. Reconnect Google with Gmail access before running this workflow.");
            const to = applyTemplate(String(step.config.to ?? ""), context);
            const subject = applyTemplate(String(step.config.subject ?? ""), context);
            const body = applyTemplate(String(step.config.message ?? ""), context);
            if (!to || !subject) throw new Error("Gmail action requires a recipient and subject.");
            const raw = [
              `To: ${to}`,
              "Content-Type: text/plain; charset=utf-8",
              "MIME-Version: 1.0",
              `Subject: ${subject}`,
              "",
              body,
            ].join("\r\n");
            const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
              method: "POST",
              headers: { Authorization: `Bearer ${providerToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ raw: base64Url(raw) }),
            });
            if (!response.ok) throw new Error(`Gmail API error (${response.status}).`);
            const output = await response.json();
            await supabase.from("workflow_run_steps").update({ status: "completed", finished_at: new Date().toISOString(), output }).eq("id", runStep.id);
            continue;
          }

          await supabase.from("workflow_run_steps").update({ status: "completed", finished_at: new Date().toISOString(), output: { simulated: true, reason: "No executor configured for this action yet" } }).eq("id", runStep.id);
        } catch (stepError) {
          await supabase.from("workflow_run_steps").update({ status: "failed", finished_at: new Date().toISOString(), error_message: stepError instanceof Error ? stepError.message : "Step failed" }).eq("id", runStep.id);
          throw stepError;
        }
      }

      await supabase.from("workflow_runs").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", runId);
      setMessage("Workflow executed successfully.");
    } catch (error) {
      if (runId) await supabase.from("workflow_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : "Workflow failed" }).eq("id", runId);
      setMessage(error instanceof Error ? error.message : "Workflow execution failed.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <main className="app-shell"><section className="content"><div className="page"><p>Loading workflow…</p></div></section></main>;

  return <main className="app-shell">
    <section className="content" style={{ width: "100%" }}>
      <header className="topbar"><div className="breadcrumbs"><Link href="/workflows">Workflows</Link><b>/</b><strong>{workflow?.name ?? "Workflow"}</strong></div><div style={{ display: "flex", gap: 9 }}><button className="secondary-button" onClick={runWorkflow} disabled={running || saving}>{running ? "Running…" : "Run test"}</button><button className="builder-save" onClick={save} disabled={saving || running}>{saving ? "Saving…" : "Save workflow"}</button></div></header>
      <div className="page">
        {!workflow ? <div className="glass-card" style={{ padding: 32 }}>{message || "Workflow not found."}</div> : <>
          <div className="hero-row"><div><p className="eyebrow">WORKFLOW BUILDER</p><h1>{workflow.name}</h1><p className="hero-copy">{workflow.description || "Connect an event to the work WineTime should execute automatically."}</p></div><span className="status-pill">{workflow.status}</span></div>
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
