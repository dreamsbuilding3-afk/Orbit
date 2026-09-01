"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Workflow = { id: string; name: string; description: string | null; status: string; updated_at: string };
type Filter = "all" | "active" | "draft" | "paused";

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "paused") return "Paused";
  if (status === "draft") return "Draft";
  return status;
}

export default function WorkflowsPage() {
  const [workflows,setWorkflows]=useState<Workflow[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [filter,setFilter]=useState<Filter>("all");
  const [toggling,setToggling]=useState<string|null>(null);

  async function load(){
    if(!supabase){setMessage("Supabase n'est pas configuré.");setLoading(false);return;}
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setMessage("Connecte-toi à WineTime pour voir tes workflows.");setLoading(false);return;}
    const {data:memberships,error:membershipError}=await supabase.from("organization_members").select("organization_id").eq("user_id",user.id);
    if(membershipError){setMessage(membershipError.message);setLoading(false);return;}
    const organizationIds=[...new Set((memberships??[]).map((membership)=>membership.organization_id))];
    if(organizationIds.length===0){setMessage("Aucune entreprise n'est encore associée à ce compte.");setLoading(false);return;}
    const {data,error}=await supabase.from("workflows").select("id,name,description,status,updated_at").in("organization_id",organizationIds).neq("status","archived").order("updated_at",{ascending:false});
    if(error)setMessage(error.message);else setWorkflows(data??[]);setLoading(false);
  }

  async function toggleWorkflow(workflow:Workflow){
    if(!supabase || toggling)return;
    const nextStatus=workflow.status==="active"?"paused":"active";
    setToggling(workflow.id);setMessage("");
    const {error}=await supabase.from("workflows").update({status:nextStatus,updated_at:new Date().toISOString()}).eq("id",workflow.id);
    if(error){setMessage(error.message);}else{setWorkflows(current=>current.map(item=>item.id===workflow.id?{...item,status:nextStatus,updated_at:new Date().toISOString()}:item));setMessage(`${workflow.name} est maintenant ${statusLabel(nextStatus).toLowerCase()}.`);}
    setToggling(null);
  }

  useEffect(()=>{void load();},[]);

  const visibleWorkflows=useMemo(()=>filter==="all"?workflows:workflows.filter(workflow=>workflow.status===filter),[filter,workflows]);
  const activeCount=workflows.filter(workflow=>workflow.status==="active").length;
  const draftCount=workflows.filter(workflow=>workflow.status==="draft").length;
  const pausedCount=workflows.filter(workflow=>workflow.status==="paused").length;

  return <main className="app-shell"><section className="content" style={{width:"100%"}}>
    <header className="topbar"><div className="breadcrumbs"><Link href="/">Workspace</Link><b>/</b><strong>Workflows</strong></div><Link className="builder-save" href="/workflows/new">+ New workflow</Link></header>
    <div className="page workflows-page">
      <div className="hero-row"><div><p className="eyebrow">AUTOMATION</p><h1>Workflows that run the business.</h1><p className="hero-copy">Connect an event to the work WineTime should execute automatically, with a clear view of every step.</p></div><Link className="primary-button" href="/workflows/new">Create workflow →</Link></div>
      {message&&<div className="glass-card workflow-message">{message}</div>}
      <div className="workflow-overview"><button className={`filter-pill ${filter==="all"?"selected":""}`} onClick={()=>setFilter("all")}><strong>{workflows.length}</strong><span>All</span></button><button className={`filter-pill ${filter==="active"?"selected":""}`} onClick={()=>setFilter("active")}><strong>{activeCount}</strong><span>Active</span></button><button className={`filter-pill ${filter==="draft"?"selected":""}`} onClick={()=>setFilter("draft")}><strong>{draftCount}</strong><span>Draft</span></button><button className={`filter-pill ${filter==="paused"?"selected":""}`} onClick={()=>setFilter("paused")}><strong>{pausedCount}</strong><span>Paused</span></button></div>
      <div className="section-heading"><div><p className="eyebrow">YOUR AUTOMATIONS</p><h2>{loading?"Loading workflows…":`${visibleWorkflows.length} workflow${visibleWorkflows.length===1?"":"s"}`}</h2></div><span className="workflow-hint">Open a workflow to configure steps and test it before going live.</span></div>
      {!loading&&visibleWorkflows.length===0?<div className="glass-card empty-workflows"><div className="empty-icon">+</div><h3>{workflows.length===0?"No workflows yet.":"No workflows in this view."}</h3><p>{workflows.length===0?"Create your first automation and let WineTime take care of the work between your tools.":"Change the status filter or open another workflow."}</p><Link className="primary-button" href="/workflows/new">{workflows.length===0?"Build your first workflow →":"View all workflows →"}</Link></div>:<div className="workflow-list">{visibleWorkflows.map(w=><article className="glass-card workflow-card" key={w.id}>
        <Link href={`/workflows/${w.id}`} className="workflow-card-link"><div className="workflow-card-main"><div className={`workflow-status status-${w.status}`}><i/>{statusLabel(w.status)}</div><h3>{w.name}</h3><p>{w.description??"Automation workflow"}</p><small>Updated {new Date(w.updated_at).toLocaleDateString("fr-FR")}</small></div><div className="workflow-open">Open <span>→</span></div></Link>
        <div className="workflow-actions"><Link href={`/workflows/${w.id}`} className="workflow-secondary">Configure</Link>{w.status!=="draft"&&<button type="button" className="workflow-secondary" onClick={()=>void toggleWorkflow(w)} disabled={toggling===w.id}>{toggling===w.id?"…":w.status==="active"?"Pause":"Activate"}</button>}</div>
      </article>)}</div>}
    </div>
    <style jsx>{`.workflows-page{max-width:1420px;padding-top:52px}.workflow-message{padding:17px;margin-bottom:24px}.workflow-hint{color:#aaa;font-size:9px}.workflow-overview{display:flex;gap:10px;flex-wrap:wrap;margin:-2px 0 30px}.filter-pill{border:1px solid rgba(0,0,0,.07);border-radius:14px;background:rgba(255,255,255,.62);padding:11px 14px;display:flex;align-items:center;gap:9px;cursor:pointer;color:#777}.filter-pill strong{font-size:13px;color:#222}.filter-pill span{font-size:10px}.filter-pill.selected{background:rgba(245,248,255,.82);border-color:rgba(31,88,205,.18);box-shadow:0 8px 25px rgba(31,88,205,.07)}.workflow-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.workflow-card{padding:24px;min-height:190px;display:flex;flex-direction:column;justify-content:space-between;gap:16px}.workflow-card-link{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;text-decoration:none;color:inherit;flex:1}.workflow-card:hover{box-shadow:0 24px 65px rgba(0,0,0,.08)}.workflow-card-main{min-width:0}.workflow-status{display:flex;align-items:center;gap:7px;color:#999;font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:700}.workflow-status i{width:6px;height:6px;border-radius:50%;background:#999;box-shadow:0 0 0 4px rgba(0,0,0,.04)}.workflow-status.status-active{color:#2458c7}.workflow-status.status-active i{background:#2458c7;box-shadow:0 0 0 4px rgba(36,88,199,.10)}.workflow-status.status-paused{color:#7d6a2b}.workflow-status.status-paused i{background:#a88a2a}.workflow-status.status-draft{color:#999}.workflow-card h3{margin:20px 0 7px;font-size:20px;letter-spacing:-.04em}.workflow-card p{margin:0;color:#888;font-size:11px;line-height:1.6;max-width:560px}.workflow-card small{display:block;margin-top:20px;color:#aaa;font-size:9px}.workflow-open{flex:none;color:#555;font-size:10px}.workflow-open span{margin-left:7px;color:#111}.workflow-actions{display:flex;gap:8px;flex-wrap:wrap}.workflow-secondary{border:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.68);border-radius:10px;padding:9px 12px;font:inherit;font-size:10px;color:#555;text-decoration:none;cursor:pointer}.workflow-secondary:hover{background:rgba(248,250,255,.92);color:#111}.workflow-secondary:disabled{opacity:.55;cursor:default}.empty-workflows{min-height:360px;padding:50px 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#f0f0ef;border:1px solid var(--line);font-size:20px}.empty-workflows h3{margin:18px 0 6px;font-size:18px}.empty-workflows p{max-width:440px;color:#888;font-size:11px;line-height:1.6;margin:0 0 22px}@media(max-width:900px){.workflow-list{grid-template-columns:1fr}.workflow-card{min-height:160px}}@media(max-width:700px){.workflows-page{padding:32px 20px 50px}.workflow-hint{display:none}.workflow-overview{margin-bottom:22px}.filter-pill{flex:1;justify-content:center;min-width:75px}.workflow-card-link{align-items:flex-start}.workflow-actions{width:100%}.workflow-secondary{flex:1;text-align:center}}`}</style>
  </section></main>;
}
