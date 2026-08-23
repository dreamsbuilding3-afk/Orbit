"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Opportunity = { id: string; opportunity_type: string; title: string; reason: string; estimated_value: number | null; confidence: number | null; status: string; created_at: string };

export default function ArkOpportunities() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
      const organizationId = memberships?.[0]?.organization_id;
      if (!organizationId) { setLoading(false); return; }
      const { data } = await supabase.from("ark_opportunities").select("id,opportunity_type,title,reason,estimated_value,confidence,status,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  const total = items.reduce((sum, item) => sum + (item.estimated_value ?? 0), 0);
  const open = items.filter(item => item.status === "open" || item.status === "recommended").length;
  const confident = items.filter(item => (item.confidence ?? 0) >= 0.8).length;

  return (
    <main className="ark-opportunities-page">
      <header className="ark-opportunities-top">
        <div className="ark-opportunities-brand"><Link href="/ark">WineTime</Link><span>/</span><strong>Opportunities</strong></div>
        <nav><Link href="/ark">Brief</Link><Link className="active" href="/ark/opportunities">Opportunities</Link><Link href="/ark/memory">Memory</Link></nav>
      </header>

      <div className="ark-opportunities-wrap">
        <section className="ark-opportunities-hero">
          <div>
            <p className="eyebrow">ARK RADAR</p>
            <h1>Where the business<br />can improve.</h1>
            <p>Every opportunity here must come from real business signals. ARK never invents revenue.</p>
          </div>
          <div className="radar-status"><i className={loading ? "pulse" : ""} />{loading ? "Scanning signals" : "Radar active"}</div>
        </section>

        <section className="opportunity-metrics">
          <article className="metric featured"><p className="eyebrow">REVENUE OPPORTUNITIES</p><h2>{items.length ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "No verified value yet"}</h2><p>{items.length ? `${items.length} open signals with a recorded value.` : "Connect tools and capture events before ARK estimates anything."}</p></article>
          <article className="metric"><p className="eyebrow">OPEN</p><strong>{open}</strong><span>opportunities</span></article>
          <article className="metric"><p className="eyebrow">HIGH CONFIDENCE</p><strong>{confident}</strong><span>signals at 80%+</span></article>
        </section>

        <section className="opportunity-section">
          <div className="section-title"><p className="eyebrow">ARK FINDINGS</p><h2>Verified business opportunities</h2></div>
          <div className="opportunity-list">
            {items.length ? items.map(item => (
              <article className="opportunity-row" key={item.id}>
                <div><span className="category">{item.opportunity_type}</span><h3>{item.title}</h3><p>{item.reason}</p><small>{item.estimated_value == null ? "Value not estimated" : `Estimated value: $${item.estimated_value.toLocaleString()}`} · {item.confidence == null ? "Confidence —" : `Confidence ${Math.round(item.confidence * 100)}%`}</small></div>
                <span className="status">{item.status}</span>
              </article>
            )) : (
              <div className="opportunity-empty"><div className="empty-mark">◎</div><strong>ARK has not verified an opportunity yet.</strong><span>This stays empty until connected business data produces a defensible signal.</span></div>
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .ark-opportunities-page{min-height:100vh;background:radial-gradient(circle at 70% 5%,rgba(255,255,255,.98),transparent 35%),linear-gradient(135deg,#f7f7f6,#fff 52%,#f3f3f2);color:#111;font-family:DM Sans,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .ark-opportunities-page a{color:inherit}
        .ark-opportunities-top{height:70px;display:flex;align-items:center;justify-content:space-between;padding:0 42px;border-bottom:1px solid rgba(0,0,0,.07);background:rgba(255,255,255,.78);backdrop-filter:blur(22px);position:sticky;top:0;z-index:20}
        .ark-opportunities-brand{display:flex;align-items:center;gap:10px;font-size:12px}.ark-opportunities-brand a{text-decoration:none;font-weight:700}.ark-opportunities-brand span{color:#d1d1cf}.ark-opportunities-brand strong{color:#777;font-weight:500}
        .ark-opportunities-top nav{display:flex;gap:24px}.ark-opportunities-top nav a{font-size:10px;color:#999;text-decoration:none}.ark-opportunities-top nav a:hover,.ark-opportunities-top nav .active{color:#111}.ark-opportunities-top nav .active{font-weight:600}
        .ark-opportunities-wrap{width:min(1240px,calc(100% - 84px));margin:auto;padding:58px 0 90px}
        .ark-opportunities-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;margin-bottom:40px}.ark-opportunities-hero>div:first-child{max-width:780px}.ark-opportunities-hero h1{margin:0;font-size:clamp(42px,5vw,64px);line-height:1.03;letter-spacing:-.055em;font-weight:600}.ark-opportunities-hero p:not(.eyebrow){max-width:720px;margin:18px 0 0;color:#777;font-size:14px;line-height:1.7}
        .eyebrow{margin:0 0 12px;color:#aaa;font-size:9px;letter-spacing:.15em;font-weight:700}.radar-status{display:inline-flex;align-items:center;gap:9px;flex:none;padding:9px 12px;border:1px solid rgba(0,0,0,.07);border-radius:10px;background:rgba(255,255,255,.86);box-shadow:0 8px 25px rgba(0,0,0,.035);color:#666;font-size:9px;font-weight:600}.radar-status i{width:7px;height:7px;border-radius:50%;background:#111;box-shadow:0 0 0 4px rgba(0,0,0,.055)}.radar-status i.pulse{animation:opPulse 1.4s ease-in-out infinite}@keyframes opPulse{50%{opacity:.3;transform:scale(.8)}}
        .opportunity-metrics{display:grid;grid-template-columns:minmax(0,1.55fr) repeat(2,minmax(180px,.72fr));gap:14px;margin-bottom:52px}.metric{min-height:168px;padding:25px;border:1px solid rgba(0,0,0,.075);border-radius:18px;background:rgba(255,255,255,.8);box-shadow:0 20px 60px rgba(0,0,0,.055);display:flex;flex-direction:column;justify-content:space-between}.metric h2{margin:10px 0 0;font-size:29px;line-height:1.15;letter-spacing:-.04em;font-weight:600}.metric>p:not(.eyebrow){max-width:600px;margin:10px 0 0;color:#999;font-size:11px;line-height:1.6}.metric strong{margin-top:18px;font-size:42px;line-height:1;letter-spacing:-.05em;font-weight:600}.metric span{color:#999;font-size:10px}
        .opportunity-section{margin-top:0}.section-title{margin-bottom:16px}.section-title h2{margin:0;font-size:22px;line-height:1.2;letter-spacing:-.035em;font-weight:600}.opportunity-list{overflow:hidden;border:1px solid rgba(0,0,0,.075);border-radius:18px;background:rgba(255,255,255,.7);box-shadow:0 20px 60px rgba(0,0,0,.045)}.opportunity-row{display:flex;align-items:flex-start;justify-content:space-between;gap:32px;padding:28px 26px;border-bottom:1px solid rgba(0,0,0,.055);background:rgba(255,255,255,.4);transition:background .18s}.opportunity-row:hover{background:rgba(255,255,255,.9)}.opportunity-row:last-child{border-bottom:0}.opportunity-row>div{min-width:0;max-width:850px}.category{display:inline-block;color:#aaa;font-size:9px;letter-spacing:.13em;text-transform:uppercase;font-weight:700}.opportunity-row h3{margin:9px 0 8px;font-size:18px;line-height:1.3;letter-spacing:-.025em;font-weight:600}.opportunity-row p{max-width:740px;margin:0;color:#777;font-size:13px;line-height:1.7}.opportunity-row small{display:block;margin-top:13px;color:#aaa;font-size:10px;line-height:1.5}.status{flex:none;padding:7px 10px;border:1px solid rgba(0,0,0,.07);border-radius:9px;background:#fff;color:#666;white-space:nowrap;font-size:9px;font-weight:600}.opportunity-empty{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:48px 32px 52px}.empty-mark{display:grid;place-items:center;width:42px;height:42px;margin-bottom:6px;border:1px solid rgba(0,0,0,.07);border-radius:12px;background:#fff;color:#777;font-size:19px}.opportunity-empty strong{font-size:15px;font-weight:600}.opportunity-empty span{max-width:680px;color:#999;font-size:11px;line-height:1.6}
        @media(max-width:900px){.ark-opportunities-top{padding:0 24px}.ark-opportunities-wrap{width:calc(100% - 48px)}.opportunity-metrics{grid-template-columns:1fr 1fr}.metric.featured{grid-column:1/-1}}
        @media(max-width:700px){.ark-opportunities-top{height:60px;padding:0 16px}.ark-opportunities-brand strong{display:none}.ark-opportunities-top nav{max-width:62vw;gap:16px;overflow-x:auto;scrollbar-width:none}.ark-opportunities-top nav::-webkit-scrollbar{display:none}.ark-opportunities-top nav a{white-space:nowrap;font-size:9px}.ark-opportunities-wrap{width:calc(100% - 32px);padding:34px 0 70px}.ark-opportunities-hero{display:block;margin-bottom:28px}.ark-opportunities-hero h1{font-size:clamp(38px,11vw,50px)}.ark-opportunities-hero p:not(.eyebrow){font-size:12px;line-height:1.6}.radar-status{margin-top:17px}.opportunity-metrics{grid-template-columns:1fr;gap:10px;margin-bottom:34px}.metric.featured{grid-column:auto}.metric{min-height:0;padding:20px;border-radius:15px}.metric strong{font-size:36px}.section-title h2{font-size:18px}.opportunity-row{display:block;padding:23px 19px}.opportunity-row h3{font-size:16px}.opportunity-row p{font-size:12px;line-height:1.65}.status{display:inline-block;margin-top:16px}.opportunity-empty{padding:36px 22px 40px}}
      `}</style>
    </main>
  );
}
