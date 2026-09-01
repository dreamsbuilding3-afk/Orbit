"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Step={id?:string;position:number;step_type:"trigger"|"condition"|"action";name:string;description:string|null;config:Record<string,unknown>};
type Workflow={id:string;name:string;description:string|null;status:string;trigger_type:string|null};
type Run={id:string;status:string;started_at:string;finished_at:string|null;error_message:string|null};
const fallback:Step[]=[{position:0,step_type:"trigger",name:"Trigger",description:"Choose what starts this workflow.",config:{}},{position:1,step_type:"action",name:"Action",description:"Choose what WineTime should execute.",config:{}}];

export default function WorkflowPage(){
 const {id}=useParams<{id:string}>(); const [workflow,setWorkflow]=useState<Workflow|null>(null); const [steps,setSteps]=useState<Step[]>([]); const [runs,setRuns]=useState<Run[]>([]); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [running,setRunning]=useState(false); const [message,setMessage]=useState("");
 async function load(){
  if(!supabase){setMessage("Supabase n'est pas configuré.");setLoading(false);return;}
  const {data:{user}}=await supabase.auth.getUser(); if(!user){setMessage("Connecte-toi à WineTime pour ouvrir ce workflow.");setLoading(false);return;}
  const {data,error}=await supabase.from("workflows").select("id,name,description,status,trigger_type").eq("id",id).single(); if(error){setMessage(error.message);setLoading(false);return;}
  const [stepResult,runResult]=await Promise.all([supabase.from("workflow_steps").select("id,position,step_type,name,description,config").eq("workflow_id",id).order("position"),supabase.from("workflow_runs").select("id,status,started_at,finished_at,error_message").eq("workflow_id",id).order("started_at",{ascending:false}).limit(8)]);
  if(stepResult.error)setMessage(stepResult.error.message); if(runResult.error)setMessage(runResult.error.message); setWorkflow(data);setSteps(stepResult.data?.length?stepResult.data:fallback);setRuns(runResult.data??[]);setLoading(false);
 }
 useEffect(()=>{if(id)void load();},[id]);
 function updateStep(index:number,patch:Partial<Step>){setSteps(c=>c.map((s,i)=>i===index?{...s,...patch}:s));}
 function addStep(type:"condition"|"action"){setSteps(c=>[...c,{position:c.length,step_type:type,name:type==="condition"?"Condition":"Action",description:"Configure this step before saving.",config:{}}]);}
 async function save(){if(!supabase||!workflow)return;setSaving(true);setMessage("");const normalized=steps.map((s,position)=>({position,step_type:s.step_type,name:s.name,description:s.description,config:s.config}));const {error}=await supabase.rpc("save_workflow_steps",{target_workflow:workflow.id,steps:normalized});setMessage(error?error.message:"Workflow saved in WineTime.");setSaving(false);if(!error)void load();}
 async function runWorkflow(){
  if(!supabase||!workflow)return;setRunning(true);setMessage("");
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error("Session expirée. Reconnecte-toi à WineTime.");
   const response=await fetch(`/api/workflows/${workflow.id}/run`,{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`}});
   const payload=await response.json().catch(()=>null) as {error?:string;status?:string}|null;
   if(!response.ok)throw new Error(payload?.error??"Workflow execution failed.");
   setMessage(payload?.status==="completed"?"Workflow exécuté. Les actions autorisées ont été envoyées.":"Workflow lancé.");
  }catch(error){setMessage(error instanceof Error?error.message:"Workflow execution failed.");}
  finally{setRunning(false);void load();}
 }
 if(loading)return <main className="app-shell"><section className="content"><div className="page"><p>Loading workflow…</p></div></section></main>;
 return <main className="app-shell"><section className="content" style={{width:"100%"}}>
  <header className="topbar"><div className="breadcrumbs"><Link href="/workflows">Workflows</Link><b>/</b><strong>{workflow?.name??"Workflow"}</strong></div><div className="actions"><button className="secondary-button" onClick={runWorkflow} disabled={running||saving}>{running?"Execution…":"Run workflow"}</button><button className="builder-save" onClick={save} disabled={saving||running}>{saving?"Saving…":"Save workflow"}</button></div></header>
  <div className="page builder-page">{!workflow?<div className="glass-card empty">{message||"Workflow not found."}</div>:<>
   <div className="hero-row"><div><p className="eyebrow">WORKFLOW BUILDER</p><h1>{workflow.name}</h1><p className="hero-copy">{workflow.description||"Connect an event to the work WineTime should execute automatically."}</p></div><span className="status-pill">{workflow.status}</span></div>
   <div className="journey"><div><b>01</b><strong>Trigger</strong><span>What starts the workflow</span></div><div><b>02</b><strong>Conditions</strong><span>What must be true</span></div><div><b>03</b><strong>Actions</strong><span>What WineTime executes</span></div><div><b>04</b><strong>Review</strong><span>Run and monitor the workflow</span></div></div>
   {message&&<div className="glass-card notice">{message}</div>}
   <section className="glass-card builder-card"><div className="section-head"><div><p className="eyebrow">FLOW</p><h2>Build the workflow step by step.</h2></div><span>{steps.length} steps</span></div><div className="steps">{steps.map((step,index)=><div className="step" key={step.id??`${step.position}-${index}`}><div className={`step-number ${step.step_type}`}>{index+1}</div><div className="step-body"><span className="eyebrow">{step.step_type}</span><input value={step.name} onChange={e=>updateStep(index,{name:e.target.value})}/><p>{step.description}</p></div><span className="step-arrow">→</span></div>)}</div><div className="step-actions"><button className="secondary-button" onClick={()=>addStep("condition")}>+ Add condition</button><button className="secondary-button" onClick={()=>addStep("action")}>+ Add action</button></div></section>
   <section className="glass-card runs-card"><div className="section-head"><div><p className="eyebrow">RUN HISTORY</p><h2>Recent tests and executions.</h2></div><Link href="/activity">View activity →</Link></div>{runs.length===0?<div className="empty-small">No runs yet. Use <b>Run workflow</b> to execute the flow.</div>:<div className="run-list">{runs.map(run=><div className="run" key={run.id}><i className={`dot ${run.status}`}/><div><strong>{run.status}</strong><span>{new Date(run.started_at).toLocaleString("fr-FR")}</span></div><small>{run.error_message||"No error recorded"}</small></div>)}</div>}</section>
   <div className="safety-note">External actions run server-side using the organization's securely stored connections.</div>
  </>}</div>
  <style jsx>{`.builder-page{max-width:1280px;padding-top:48px;padding-bottom:80px}.actions{display:flex;gap:9px}.journey{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:28px 0 16px}.journey>div{padding:17px;border:1px solid rgba(0,0,0,.07);border-radius:15px;background:rgba(255,255,255,.65)}.journey b{display:block;font-size:9px;color:#aaa}.journey strong{display:block;margin-top:8px;font-size:12px}.journey span{display:block;margin-top:5px;color:#888;font-size:10px}.notice{padding:15px;margin-bottom:16px}.builder-card,.runs-card{padding:26px;margin-top:16px}.section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px}.section-head h2{margin:6px 0 0;font-size:20px;letter-spacing:-.03em}.section-head>span,.section-head>a{font-size:10px;color:#999}.steps{display:grid;gap:10px}.step{display:grid;grid-template-columns:42px 1fr auto;gap:15px;align-items:center;padding:18px;border:1px solid rgba(0,0,0,.07);border-radius:16px;background:rgba(255,255,255,.72)}.step-number{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#f0f0ef;font-weight:700}.step-number.trigger{background:#111;color:#fff}.step-body input{display:block;width:100%;border:0;outline:0;background:transparent;font-size:17px;font-weight:650;margin-top:6px}.step-body p{margin:5px 0 0;color:#888;font-size:10px}.step-arrow{color:#bbb}.step-actions{display:flex;gap:9px;margin-top:14px;flex-wrap:wrap}.run-list{display:grid}.run{display:grid;grid-template-columns:10px 180px 1fr;gap:12px;align-items:center;padding:15px 4px;border-top:1px solid rgba(0,0,0,.06)}.run .dot{width:7px;height:7px;border-radius:50%;background:#999}.run .dot.completed{background:#111}.run .dot.failed{background:#8a2222}.run strong{display:block;font-size:11px}.run span,.run small{color:#999;font-size:9px}.empty,.empty-small{text-align:center;color:#888;padding:55px}.safety-note{text-align:center;color:#aaa;font-size:9px;margin:18px auto;max-width:700px}@media(max-width:800px){.journey{grid-template-columns:1fr 1fr}.run{grid-template-columns:10px 1fr}.run small{grid-column:2}.actions{gap:6px}.builder-page{padding:32px 20px 55px}}@media(max-width:520px){.journey{grid-template-columns:1fr}.step{grid-template-columns:36px 1fr}.step-arrow{display:none}.actions .secondary-button{display:none}}`}</style>
 </section></main>;
}