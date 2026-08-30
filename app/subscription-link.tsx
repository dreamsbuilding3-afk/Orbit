"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase-browser";

type Progress = { active_months:number; prospect_count:number; action_count:number; current_level:string; elite_unlocked:boolean };

export default function SubscriptionLink() {
  const pathname = usePathname();
  const [progress,setProgress]=useState<Progress|null>(null);

  const loadRewards=useCallback(async()=>{
    if(!supabase)return;
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return;
    const {data:membership}=await supabase.from("organization_members").select("organization_id").eq("user_id",user.id).limit(1).maybeSingle();
    if(!membership?.organization_id)return;
    const {data}=await supabase.rpc("refresh_winetime_rewards",{target_org:membership.organization_id});
    const next=Array.isArray(data)?data[0]:data;
    if(next)setProgress(next as Progress);
  },[]);

  useEffect(()=>{void loadRewards()},[loadRewards]);

  const months=progress?.active_months??0;
  const prospects=progress?.prospect_count??0;
  const elite=!!progress?.elite_unlocked;
  const completion=elite?100:Math.min(100,Math.round((Math.min(months/8,prospects/100))*100));
  const showHomePreview=pathname==="/";

  return <>
    {showHomePreview&&<Link href="/rewards" aria-label="Voir votre progression WineTime Rewards" style={{position:"fixed",right:28,bottom:28,zIndex:35,width:286,boxSizing:"border-box",display:"flex",alignItems:"center",gap:12,padding:"12px 13px",borderRadius:16,border:"1px solid rgba(39,78,155,.12)",background:"linear-gradient(135deg,rgba(247,250,255,.96),rgba(255,255,255,.94) 46%,rgba(237,245,255,.94))",color:"#152343",textDecoration:"none",boxShadow:"0 16px 38px rgba(22,57,118,.10), inset 0 1px 0 rgba(255,255,255,.96)",backdropFilter:"blur(18px)",transform:"perspective(1000px) rotateX(2deg) rotateY(-2deg)",transformStyle:"preserve-3d",animation:"rewardPreviewFloat 8.5s ease-in-out infinite",overflow:"hidden"}}>
      <span aria-hidden="true" style={{position:"absolute",inset:"-120%",background:"linear-gradient(120deg,transparent 44%,rgba(255,255,255,.5) 50%,transparent 56%)",animation:"rewardPreviewShine 9s linear infinite",pointerEvents:"none",opacity:.72}}/>
      <span aria-hidden="true" style={{position:"relative",zIndex:1,width:52,height:32,flex:"none",borderRadius:9,display:"grid",placeItems:"center",color:"#fff",fontSize:11,fontWeight:800,letterSpacing:".05em",background:"linear-gradient(135deg,#08286e 0%,#1148ab 40%,#2a6fd8 68%,#9ed4ff 100%)",boxShadow:"0 7px 14px rgba(11,54,132,.22), inset 0 1px 0 rgba(255,255,255,.46)",transform:"translateZ(5px) rotate(-3deg)"}}>W</span>
      <span style={{position:"relative",zIndex:1,minWidth:0,flex:1}}>
        <span style={{display:"block",fontSize:8,letterSpacing:".14em",fontWeight:800,color:"#6c7d9c"}}>WINE TIME REWARDS</span>
        <span style={{display:"block",marginTop:3,fontSize:11,fontWeight:700}}>{elite?"Elite débloqué":`${completion}% vers Elite`}</span>
        <span style={{display:"block",marginTop:2,fontSize:9,color:"#7786a0"}}>{months}/8 mois · {prospects}/100 prospects</span>
      </span>
      <span aria-hidden="true" style={{position:"relative",zIndex:1,color:"#5872a1",fontSize:17,transform:"translateZ(4px)"}}>→</span>
    </Link>}

    <Link href="/rewards" aria-label="Ouvrir WineTime Rewards" style={{position:"fixed",left:16,bottom:140,zIndex:40,width:218,boxSizing:"border-box",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(43,91,171,.12)",background:"linear-gradient(135deg,rgba(255,255,255,.97),rgba(239,246,255,.95))",color:"#315b9f",textDecoration:"none",fontSize:12,fontWeight:700,boxShadow:"0 6px 18px rgba(28,75,150,.08)",backdropFilter:"blur(14px)"}}>
      <span aria-hidden="true" style={{width:18,textAlign:"center",fontSize:14,lineHeight:1}}>✦</span>Rewards
    </Link>

    <Link href="/abonnement" aria-label="Ouvrir les abonnements WineTime" style={{position:"fixed",left:16,bottom:92,zIndex:40,width:218,boxSizing:"border-box",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(0,0,0,.07)",background:"rgba(255,255,255,.96)",color:"#3f3f3d",textDecoration:"none",fontSize:12,fontWeight:600,boxShadow:"0 6px 18px rgba(0,0,0,.06)",backdropFilter:"blur(14px)"}}>
      <span aria-hidden="true" style={{width:18,textAlign:"center",fontSize:15,lineHeight:1}}>€</span>Abonnement
    </Link>

    <style jsx global>{`@keyframes rewardPreviewFloat{0%,100%{transform:perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(0)}50%{transform:perspective(1000px) rotateX(3deg) rotateY(-3deg) translateY(-3px)}}@keyframes rewardPreviewShine{from{transform:translateX(-45%) rotate(6deg)}to{transform:translateX(45%) rotate(6deg)}}@media(max-width:600px){a[aria-label="Voir votre progression WineTime Rewards"]{width:198px!important;right:10px!important;bottom:12px!important;}}`}</style>
  </>;
}
