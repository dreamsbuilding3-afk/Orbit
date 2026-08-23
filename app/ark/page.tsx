"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Run = { id: string; status: string; started_at: string | null; finished_at: string | null };
type ArkEvent = { id: string; event_type: string; source: string; occurred_at: string };
type Metrics = { runs: number; completed: number; failed: number; events: number; opportunities: number };

export default function ArkPage() {
  const [metrics, setMetrics] = useState<Metrics>({ runs: 0, completed: 0, failed: 0, events: 0, opportunities: 0 });
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [recentEvents, setRecentEvents] = useState<ArkEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
      const org = memberships?.[0]?.organization_id;
      if (!org) { setLoading(false); return; }

      const { data: workflows } = await supabase.from("workflows").select("id").eq("organization_id", org);
      const workflowIds = (workflows ?? []).map(w => w.id);
      const { data: runs } = workflowIds.length
        ? await supabase.from("workflow_runs").select("id,status,started_at,finished_at").in("workflow_id", workflowIds).order("started_at", { ascending: false }).limit(20)
        : { data: [] as Run[] };
      const { data: events } = await supabase.from("ark_events").select("id,event_type,source,occurred_at").eq("organization_id", org).order("occurred_at", { ascending: false }).limit(12);
      const { count: opportunityCount } = await supabase.from("ark_opportunities").select("id", { count: "exact", head: true }).eq("organization_id", org).in("status", ["new", "open", "recommended"]);

      const safeRuns = runs ?? [];
      const safeEvents = events ?? [];
      setRecentRuns(safeRuns);
      setRecentEvents(safeEvents);
      setMetrics({
        runs: safeRuns.length,
        completed: safeRuns.filter(r => r.status === "completed").length,
        failed: safeRuns.filter(r => r.status === "failed").length,
        events: safeEvents.length,
        opportunities: opportunityCount ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="ark-shell">
      <header className="ark-topbar">
        <div className="ark-brand"><span className="ark-orbit"><i /></span><Link href="/">WineTime</Link><span>/</span><strong>ARK</strong></div>
        <nav className="ark-nav" aria-label="ARK navigation">
          <Link className="active" href="/ark">Brief</Link>
          <Link href="/ark/opportunities">Opportunities</Link>
          <Link href="/ark/recommendations">Recommendations</Link>
          <Link href="/ark/memory">Memory</Link>
          <Link href="/ark/permissions">Permissions</Link>
        </nav>
      </header>

      <div className="ark-page">
        <section className="ark-hero">
          <div>
            <p className="eyebrow">ARK INTELLIGENCE</p>
            <h1>Your business,<br />understood.</h1>
            <p>ARK analyzes the real signals flowing through WineTime and surfaces what matters next.</p>
          </div>
          <div className="ark-state"><span />{loading ? "Analyzing workspace" : "Intelligence layer active"}</div>
        </section>

        <section className="brief-grid">
          <article className="brief-card focus-card"><p className="eyebrow">ARK DAILY BRIEF</p><h2>ARK THINKS.<br /><span>WineTime DOES.</span></h2><p className="muted">Signals enter through WineTime. ARK analyzes them without replacing your existing automations.</p><Link href="/ark/opportunities" className="brief-button">Review opportunities →</Link></article>
          <article className="brief-card metric-focus"><p className="eyebrow">SIGNALS</p><strong>{metrics.events}</strong><span>recent business events</span><small>Real events captured by the ARK event stream.</small></article>
          <article className="brief-card metric-focus"><p className="eyebrow">OPPORTUNITIES</p><strong>{metrics.opportunities}</strong><span>verified open signals</span><small>Created only when WineTime receives defensible source data.</small></article>
        </section>

        <section className="journey-card">
          <div><p className="eyebrow">THE ARK JOURNEY</p><h2>From signal to controlled action.</h2><p>Each stage has a dedicated workspace. Nothing is hidden behind the brief.</p></div>
          <div className="journey-steps">
            <Link href="/ark/opportunities"><span>01</span><strong>Detect</strong><small>Verified opportunities</small></Link>
            <Link href="/ark/recommendations"><span>02</span><strong>Recommend</strong><small>Actions worth considering</small></Link>
            <Link href="/ark/permissions"><span>03</span><strong>Control</strong><small>What ARK may do</small></Link>
            <Link href="/ark/memory"><span>04</span><strong>Remember</strong><small>Business context and decisions</small></Link>
          </div>
        </section>

        <section className="brief-section"><div className="section-head"><div><p className="eyebrow">ARK RADAR</p><h2>Recent business signals</h2></div><Link href="/ark/opportunities">View findings →</Link></div><div className="run-list">{recentEvents.length ? recentEvents.map(event => <div className="run-row" key={event.id}><span className="run-dot completed"/><div><strong>{event.event_type}</strong><small>{event.source} · {new Date(event.occurred_at).toLocaleString()}</small></div><span className="run-status completed">observed</span></div>) : <div className="empty-state"><strong>ARK is waiting for real business signals.</strong><span>Use a connected integration or webhook to send the first event into WineTime.</span></div>}</div></section>

        <section className="brief-section"><div className="section-head"><div><p className="eyebrow">EXECUTION</p><h2>What WineTime actually did</h2></div><Link href="/activity">View activity →</Link></div><div className="run-list">{recentRuns.length ? recentRuns.slice(0, 8).map(run => <div className="run-row" key={run.id}><span className={`run-dot ${run.status}`} /><div><strong>Workflow execution</strong><small>{run.started_at ? new Date(run.started_at).toLocaleString() : "No start time"}</small></div><span className={`run-status ${run.status}`}>{run.status}</span></div>) : <div className="empty-state"><strong>No workflow runs yet.</strong><span>When WineTime executes, ARK will be able to use the resulting signals.</span></div>}</div></section>

        <section className="control-card"><div><p className="eyebrow">HUMAN CONTROL</p><h2>Intelligence without losing control.</h2><p>ARK recommends first. Sensitive actions stay behind explicit permissions.</p></div><Link href="/ark/permissions">Review permissions →</Link></section>
      </div>

      <style jsx>{`
        .ark-shell{min-height:100vh;background:radial-gradient(circle at 50% 0%,#fff 0,#f7f7f6 45%,#efefee 100%);color:#111}.ark-topbar{height:70px;padding:0 38px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(0,0,0,.07);background:rgba(255,255,255,.72);backdrop-filter:blur(25px);position:sticky;top:0;z-index:5}.ark-brand,.ark-nav{display:flex;align-items:center;gap:10px;font-size:11px}.ark-brand a{text-decoration:none;font-weight:700;letter-spacing:.06em}.ark-brand span{color:#d0d0ce}.ark-brand strong{font-weight:600}.ark-orbit{width:25px;height:25px;border:1px solid #d7d7d5;border-radius:50%;position:relative}.ark-orbit:before,.ark-orbit:after{content:"";position:absolute;inset:5px;border:1px solid #ddd;border-radius:50%;transform:rotate(45deg)}.ark-orbit:after{transform:rotate(-45deg)}.ark-orbit i{position:absolute;width:5px;height:5px;background:#111;border-radius:50%;top:9px;left:9px}.ark-nav{gap:20px;color:#999;white-space:nowrap}.ark-nav a{text-decoration:none;color:inherit}.ark-nav .active{color:#111}.ark-page{max-width:1180px;margin:0 auto;padding:58px 32px 80px}.ark-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-bottom:34px}.ark-hero h1{margin:0;font-size:46px;line-height:1.02;letter-spacing:-.06em;font-weight:600}.ark-hero p:not(.eyebrow){max-width:560px;margin:15px 0 0;color:#8b8b89;font-size:13px;line-height:1.6}.ark-state{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(0,0,0,.07);border-radius:10px;background:rgba(255,255,255,.72);color:#777;font-size:9px}.ark-state span{width:6px;height:6px;border-radius:50%;background:#111;box-shadow:0 0 0 4px rgba(0,0,0,.055)}.brief-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:13px}.brief-card{border:1px solid rgba(0,0,0,.075);border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 20px 60px rgba(0,0,0,.05);padding:24px}.focus-card h2{font-size:29px;line-height:1.08;letter-spacing:-.045em;margin:4px 0 12px}.focus-card h2 span{color:#999}.muted{color:#999;font-size:10px;line-height:1.6;max-width:420px}.brief-button{display:inline-flex;margin-top:18px;padding:10px 13px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-size:9px;font-weight:600}.metric-focus{display:flex;flex-direction:column;min-height:205px}.metric-focus strong{font-size:45px;letter-spacing:-.06em;margin-top:auto}.metric-focus span{font-size:10px;font-weight:600}.metric-focus small{margin-top:9px;color:#aaa;font-size:8px;line-height:1.5}.journey-card{margin-top:14px;padding:24px;border:1px solid rgba(0,0,0,.075);border-radius:17px;background:rgba(255,255,255,.72);box-shadow:0 20px 60px rgba(0,0,0,.035)}.journey-card h2{margin:3px 0 5px;font-size:20px;letter-spacing:-.035em}.journey-card>div:first-child>p:last-child{margin:0;color:#999;font-size:10px}.journey-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:18px}.journey-steps a{display:grid;gap:5px;padding:14px;border:1px solid rgba(0,0,0,.07);border-radius:13px;background:#fff;text-decoration:none;color:inherit}.journey-steps span{font-size:8px;color:#aaa;letter-spacing:.1em}.journey-steps strong{font-size:11px}.journey-steps small{font-size:8px;color:#999;line-height:1.4}.brief-section{margin-top:42px}.section-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:13px}.section-head h2{margin:0;font-size:20px;letter-spacing:-.035em}.section-head a{color:#777;text-decoration:none;font-size:9px}.run-list{border:1px solid rgba(0,0,0,.075);border-radius:17px;background:rgba(255,255,255,.7);overflow:hidden}.run-row{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:center;padding:15px 18px;border-bottom:1px solid rgba(0,0,0,.05)}.run-row:last-child{border-bottom:0}.run-dot{width:7px;height:7px;border-radius:50%;background:#aaa}.run-dot.completed{background:#111}.run-dot.failed{background:#777}.run-row strong{display:block;font-size:10px}.run-row small{display:block;margin-top:3px;color:#aaa;font-size:8px}.run-status{text-transform:uppercase;font-size:8px;letter-spacing:.1em;color:#999}.run-status.completed{color:#111}.empty-state{padding:44px 25px;display:grid;gap:8px;text-align:center}.empty-state strong{font-size:12px}.empty-state span{color:#999;font-size:9px;line-height:1.6;max-width:540px;margin:auto}.control-card{margin-top:14px;padding:24px;border:1px solid rgba(0,0,0,.075);border-radius:17px;background:#111;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:20px}.control-card h2{margin:0;font-size:17px;letter-spacing:-.03em}.control-card p:last-child{margin:5px 0 0;color:#888;font-size:9px}.control-card a{color:#fff;text-decoration:none;font-size:9px;white-space:nowrap}@media(max-width:1050px){.ark-nav{gap:13px;font-size:10px}.journey-steps{grid-template-columns:repeat(2,1fr)}}@media(max-width:900px){.ark-nav{display:none}.ark-hero,.control-card{display:block}.ark-state{display:inline-flex;margin-top:20px}.brief-grid{grid-template-columns:1fr}.metric-focus{min-height:150px}.ark-page{padding:40px 18px 60px}.ark-hero h1{font-size:38px}.journey-steps{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
