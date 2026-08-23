"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Workflow = { id: string; name: string; description: string | null; status: string; updated_at: string };

export default function WorkflowsPage() {
  const [workflows,setWorkflows]=useState<Workflow[]>([]); const [loading,setLoading]=useState(true); const [message,setMessage]=useState("");
  async function load(){
    if(!supabase){setMessage("Supabase n'est pas configuré.");setLoading(false);return;}
    const {data:{user}}=await supabase.auth.getUser(); if(!user){setMessage("Connecte-toi à WineTime pour voir tes workflows.");setLoading(false);return;}
    const {data:orgs,error:orgError}=await supabase.rpc("my_organizations"); if(orgError){setMessage(orgError.message);setLoading(false);return;}
    const orgId=orgs?.[0]?.id; if(!orgId){setMessage("Aucune entreprise n'est encore associée à ce compte.");setLoading(false);return;}
    const {data,error}=await supabase.from("workflows").select("id,name,description,status,updated_at").eq("organization_id",orgId).neq("status","archived").order("updated_at",{ascending:false});
    if(error)setMessage(error.message);else setWorkflows(data??[]);setLoading(false);
  }
  useEffect(()=>{load();},[]);
  return <main className="app-shell"><section className="content" style={{width:"100%"}}>
    <header className="topbar"><div className="breadcrumbs"><Link href="/">Workspace</Link><b>/</b><strong>Workflows</strong></div><Link className="builder-save" href="/workflows/new">+ New workflow</Link></header>
    <div className="page workflows-page">
      <div className="hero-row"><div><p className="eyebrow">AUTOMATION</p><h1>Workflows that run the business.</h1><p className="hero-copy">Connect an event to the work WineTime should execute automatically, with a clear view of every step.</p></div><Link className="primary-button" href="/workflows/new">Create workflow →</Link></div>
      {message&&<div className="glass-card workflow-message">{message}</div>}
      <div className="section-heading"><div><p className="eyebrow">YOUR AUTOMATIONS</p><h2>{loading?"Loading workflows…":`${workflows.length} workflow${workflows.length===1?"":"s"}`}</h2></div><span className="workflow-hint">Each workflow stays isolated to your organization.</span></div>
      {!loading&&workflows.length===0?<div className="glass-card empty-workflows"><div className="empty-icon">+</div><h3>No workflows yet.</h3><p>Create your first automation and let WineTime take care of the work between your tools.</p><Link className="primary-button" href="/workflows/new">Build your first workflow →</Link></div>:<div className="workflow-list">{workflows.map(w=><Link href={`/workflows/${w.id}`} key={w.id} className="glass-card workflow-card">
        <div className="workflow-card-main"><div className="workflow-status"><i/>{w.status}</div><h3>{w.name}</h3><p>{w.description??"Automation workflow"}</p><small>Updated {new Date(w.updated_at).toLocaleDateString("fr-FR")}</small></div><div className="workflow-open">Open <span>→</span></div>
      </Link>)}</div>}
    </div>
    <style jsx>{`.workflows-page{max-width:1420px;padding-top:52px}.workflow-message{padding:17px;margin-bottom:24px}.workflow-hint{color:#aaa;font-size:9px}.workflow-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.workflow-card{padding:24px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;min-height:190px;text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}.workflow-card:hover{transform:translateY(-2px);box-shadow:0 24px 65px rgba(0,0,0,.08)}.workflow-card-main{min-width:0}.workflow-status{display:flex;align-items:center;gap:7px;color:#999;font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:700}.workflow-status i{width:6px;height:6px;border-radius:50%;background:#111;box-shadow:0 0 0 4px rgba(0,0,0,.05)}.workflow-card h3{margin:20px 0 7px;font-size:20px;letter-spacing:-.04em}.workflow-card p{margin:0;color:#888;font-size:11px;line-height:1.6;max-width:560px}.workflow-card small{display:block;margin-top:20px;color:#aaa;font-size:9px}.workflow-open{flex:none;color:#555;font-size:10px}.workflow-open span{margin-left:7px;color:#111}.empty-workflows{min-height:360px;padding:50px 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#f0f0ef;border:1px solid var(--line);font-size:20px}.empty-workflows h3{margin:18px 0 6px;font-size:18px}.empty-workflows p{max-width:440px;color:#888;font-size:11px;line-height:1.6;margin:0 0 22px}@media(max-width:900px){.workflow-list{grid-template-columns:1fr}.workflow-card{min-height:160px}}@media(max-width:700px){.workflows-page{padding:32px 20px 50px}.hero-row{align-items:flex-start;flex-direction:column}.workflow-hint{display:none}}
    `}</style>
  </section></main>;
}
