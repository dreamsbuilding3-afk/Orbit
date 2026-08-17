"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Recommendation={id:string;title:string;explanation:string;confidence:number|null;status:string;action:Record<string,unknown>;opportunity_id:string|null;created_at:string};
type Permission={category:string;autonomy_level:string};
const categories=["messages","emails","payments","refunds","calendar","crm","marketing","data","financial_actions"];

export default function ArkRecommendations(){
 const [items,setItems]=useState<Recommendation[]>([]); const [permissions,setPermissions]=useState<Permission[]>([]); const [busy,setBusy]=useState<string|null>(null); const [message,setMessage]=useState("");
 async function load(){
  if(!supabase)return; const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
  const {data:m}=await supabase.from("organization_members").select("organization_id").eq("user_id",user.id).limit(1); const org=m?.[0]?.organization_id; if(!org)return;
  const [{data:r},{data:p}]=await Promise.all([
   supabase.from("ark_recommendations").select("id,title,explanation,confidence,status,action,opportunity_id,created_at").eq("organization_id",org).order("created_at",{ascending:false}),
   supabase.from("ark_permissions").select("category,autonomy_level").eq("organization_id",org)
  ]); setItems(r??[]); setPermissions(p?.length?p:categories.map(category=>({category,autonomy_level:"observe"})));
 }
 useEffect(()=>{load();},[]);
 async function approve(item:Recommendation){
  if(!supabase)return; setBusy(item.id); setMessage("");
  const actionType=String(item.action.action_type??item.action.type??"general");
  const category=String(item.action.category??(actionType.includes("email")?"emails":actionType.includes("payment")?"payments":actionType.includes("calendar")?"calendar":actionType.includes("crm")?"crm":"data"));
  const permission=permissions.find(p=>p.category===category)?.autonomy_level??"observe";
  if(permission!=="approve"&&permission!=="auto"){setMessage(`Permission required: ${category} is currently set to ${permission}.`);setBusy(null);return;}
  const {data:{user}}=await supabase.auth.getUser(); if(!user){setMessage("Connecte-toi à ORBARK.");setBusy(null);return;}
  const {data:{session}}=await supabase.auth.getSession(); const providerToken=session?.provider_token;
  if(!providerToken){setMessage("Reconnecte Gmail pour permettre à ORBARK d'exécuter cette action.");setBusy(null);return;}
  const {error:e1}=await supabase.from("ark_recommendations").update({status:"approved"}).eq("id",item.id);
  if(e1){setMessage(e1.message);setBusy(null);return;}
  setItems(current=>current.map(x=>x.id===item.id?{...x,status:"approved"}:x)); setMessage("Recommendation approved. Execution is ready."); setBusy(null);
 }
 async function execute(item:Recommendation){
  if(!supabase)return; setBusy(item.id); setMessage("");
  const {data:{session}}=await supabase.auth.getSession(); const accessToken=session?.access_token; const providerToken=session?.provider_token;
  if(!accessToken||!providerToken){setMessage("Reconnecte Gmail pour exécuter cette action.");setBusy(null);return;}
  try{
   const response=await fetch("/api/ark/actions/execute",{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({recommendationId:item.id,providerToken})});
   const data=await response.json().catch(()=>({})); if(!response.ok)throw new Error(String(data.error??"Execution failed."));
   setItems(current=>current.map(x=>x.id===item.id?{...x,status:"executed"}:x)); setMessage("✅ ORBIT executed the Gmail action.");
  }catch(error){setMessage(error instanceof Error?error.message:"Impossible d'exécuter l'action.");}finally{setBusy(null);}
 }
 return <main className="ark-shell"><header className="ark-topbar"><div className="ark-brand"><Link href="/ark">ORBARK</Link><span>/</span><strong>Recommendations</strong></div><nav className="ark-nav"><Link href="/ark">Brief</Link><Link href="/ark/opportunities">Opportunities</Link><Link className="active" href="/ark/recommendations">Recommendations</Link><Link href="/ark/memory">Memory</Link></nav></header><div className="ark-page"><section className="ark-hero"><div><p className="eyebrow">ARK ACTIONS</p><h1>Decide what<br/>happens next.</h1><p>ARK prepares the decision. ORBIT executes it. Sensitive actions remain behind your permissions.</p></div><div className="ark-state"><span/>Human control active</div></section>{message&&<div className="notice">{message}</div>}<section className="brief-section"><div className="section-head"><div><p className="eyebrow">PENDING DECISIONS</p><h2>Recommendations waiting for you</h2></div></div><div className="memory-list">{items.length?items.map(item=> <article className="rec-row" key={item.id}><div className="rec-main"><span className="memory-cat">{item.status}</span><h3>{item.title}</h3><p>{item.explanation}</p><small>{item.confidence==null?"Confidence —":`Confidence ${Math.round(item.confidence*100)}%`}</small></div><div className="rec-actions">{item.status==="pending"?<button className="brief-button" disabled={busy===item.id} onClick={()=>approve(item)}>{busy===item.id?"Checking…":"Approve"}</button>:item.status==="approved"?<button className="brief-button" disabled={busy===item.id} onClick={()=>execute(item)}>{busy===item.id?"Executing…":"Execute"}</button>:<span className="run-status approved">{item.status}</span>}</div></article>):<div className="empty-state"><strong>ARK has no pending recommendations.</strong><span>Recommendations will appear here when business signals produce a defensible next action.</span></div>}</div></section></div><style jsx>{`.notice{margin-bottom:18px;padding:12px 14px;border:1px solid rgba(0,0,0,.08);border-radius:12px;background:rgba(255,255,255,.8);font-size:10px;color:#555}.rec-row{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:18px;border-bottom:1px solid rgba(0,0,0,.05)}.rec-row:last-child{border-bottom:0}.rec-main h3{margin:5px 0;font-size:12px}.rec-main p{margin:5px 0;color:#777;font-size:10px;line-height:1.5}.rec-main small{color:#aaa;font-size:8px}.rec-actions{min-width:92px;text-align:right}`}</style></main>;
}
