"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Run = { id: string; status: string; started_at: string | null; finished_at: string | null };

type Metrics = { runs: number; completed: number; failed: number };

export default function ArkPage() {
  const [metrics, setMetrics] = useState<Metrics>({ runs: 0, completed: 0, failed: 0 });
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1);
      const org = memberships?.[0]?.organization_id;
      if (!org) { setLoading(false); return; }

      const { data: workflows } = await supabase
        .from("workflows")
        .select("id")
        .eq("organization_id", org);
      const workflowIds = (workflows ?? []).map(w => w.id);
      if (!workflowIds.length) { setLoading(false); return; }

      const { data: runs } = await supabase
        .from("workflow_runs")
        .select("id,status,started_at,finished_at")
        .in("workflow_id", workflowIds)
        .order("started_at", { ascending: false })
        .limit(20);

      const safeRuns = runs ?? [];
      setRecentRuns(safeRuns);
      setMetrics({
        runs: safeRuns.length,
        completed: safeRuns.filter(r => r.status === "completed").length,
        failed: safeRuns.filter(r => r.status === "failed").length,
      });
      setLoading(false);
    }
    load();
  }, []);

  const successRate = metrics.runs ? Math.round((metrics.completed / metrics.runs) * 100) : 0;

  return (
    <main className="ark-shell">
      <header className="ark-topbar">
        <div className="ark-brand"><span className="ark-orbit"><i /></span><Link href="/">ORBIT</Link><span>/</span><strong>ARK</strong></div>
        <div className="ark-nav"><Link className="active" href="/ark">Brief</Link><span>Intelligence</span><span>Opportunities</span><span>Memory</span></div>
      </header>

      <div className="ark-page">
        <section className="ark-hero">
          <div>
            <p className="eyebrow">ARK INTELLIGENCE</p>
            <h1>Your business,<br />understood.</h1>
            <p>ARK analyzes what ORBIT already knows and highlights what matters next.</p>
          </div>
          <div className="ark-state"><span />{loading ? "Analyzing workspace" : "Intelligence layer active"}</div>
        </section>

        <section className="brief-grid">
          <article className="brief-card focus-card">
            <p className="eyebrow">ARK DAILY BRIEF</p>
            <h2>ARK THINKS.<br /><span>ORBIT DOES.</span></h2>
            <p className="muted">The intelligence layer is being connected to your existing workflows. No existing automation is replaced.</p>
            <Link href="/workflows" className="brief-button">Open automations →</Link>
          </article>

          <article className="brief-card metric-focus">
            <p className="eyebrow">EXECUTION SIGNAL</p>
            <strong>{metrics.completed}</strong>
            <span>completed workflow runs</span>
            <small>{metrics.runs} runs observed · {successRate}% completion rate</small>
          </article>

          <article className="brief-card metric-focus">
            <p className="eyebrow">ATTENTION</p>
            <strong>{metrics.failed}</strong>
            <span>failed runs to review</span>
            <small>ARK will surface real operational issues as the intelligence layer grows.</small>
          </article>
        </section>

        <section className="brief-section">
          <div className="section-head"><div><p className="eyebrow">ARK ACTIVITY</p><h2>What the system actually did</h2></div><Link href="/activity">View activity →</Link></div>
          <div className="run-list">
            {recentRuns.length ? recentRuns.slice(0, 8).map(run => (
              <div className="run-row" key={run.id}>
                <span className={`run-dot ${run.status}`} />
                <div><strong>Workflow execution</strong><small>{run.started_at ? new Date(run.started_at).toLocaleString() : "No start time"}</small></div>
                <span className={`run-status ${run.status}`}>{run.status}</span>
              </div>
            )) : <div className="empty-state"><strong>ARK is waiting for real business signals.</strong><span>Connect integrations and run workflows. ARK will build intelligence from the events ORBIT actually receives.</span></div>}
          </div>
        </section>

        <section className="control-card">
          <div><p className="eyebrow">HUMAN CONTROL</p><h2>Intelligence without losing control.</h2><p>ARK will recommend first. Sensitive actions stay behind explicit permissions.</p></div>
          <Link href="/integrations">Manage connected tools →</Link>
        </section>
      </div>

      <style jsx>{`
        .ark-shell{min-height:100vh;background:radial-gradient(circle at 50% 0%,#fff 0,#f7f7f6 45%,#efefee 100%);color:#111}
        .ark-topbar{height:70px;padding:0 38px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(0,0,0,.07);background:rgba(255,255,255,.72);backdrop-filter:blur(25px);position:sticky;top:0;z-index:5}
        .ark-brand,.ark-nav{display:flex;align-items:center;gap:10px;font-size:11px}.ark-brand a{text-decoration:none;font-weight:700;letter-spacing:.06em}.ark-brand span{color:#d0d0ce}.ark-brand strong{font-weight:600}.ark-orbit{width:25px;height:25px;border:1px solid #d7d7d5;border-radius:50%;position:relative}.ark-orbit:before,.ark-orbit:after{content:"";position:absolute;inset:5px;border:1px solid #ddd;border-radius:50%;transform:rotate(45deg)}.ark-orbit:after{transform:rotate(-45deg)}.ark-orbit i{position:absolute;width:5px;height:5px;background:#111;border-radius:50%;top:9px;left:9px}.ark-nav{gap:22px;color:#999}.ark-nav .active{color:#111}.ark-page{max-width:1180px;margin:0 auto;padding:58px 32px 80px}.ark-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-bottom:34px}.ark-hero h1{margin:0;font-size:46px;line-height:1.02;letter-spacing:-.06em;font-weight:600}.ark-hero p:not(.eyebrow){max-width:560px;margin:15px 0 0;color:#8b8b89;font-size:13px;line-height:1.6}.ark-state{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(0,0,0,.07);border-radius:10px;background:rgba(255,255,255,.72);color:#777;font-size:9px}.ark-state span{width:6px;height:6px;border-radius:50%;background:#111;box-shadow:0 0 0 4px rgba(0,0,0,.055)}.brief-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:13px}.brief-card{border:1px solid rgba(0,0,0,.075);border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 20px 60px rgba(0,0,0,.05);padding:24px}.focus-card h2{font-size:29px;line-height:1.08;letter-spacing:-.045em;margin:4px 0 12px}.focus-card h2 span{color:#999}.muted{color:#999;font-size:10px;line-height:1.6;max-width:420px}.brief-button{display:inline-flex;margin-top:18px;padding:10px 13px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-size:9px;font-weight:600}.metric-focus{display:flex;flex-direction:column;min-height:205px}.metric-focus strong{font-size:45px;letter-spacing:-.06em;margin-top:auto}.metric-focus span{font-size:10px;font-weight:600}.metric-focus small{margin-top:9px;color:#aaa;font-size:8px;line-height:1.5}.brief-section{margin-top:42px}.section-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:13px}.section-head h2{margin:0;font-size:20px;letter-spacing:-.035em}.section-head a{color:#777;text-decoration:none;font-size:9px}.run-list{border:1px solid rgba(0,0,0,.075);border-radius:17px;background:rgba(255,255,255,.7);overflow:hidden}.run-row{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:center;padding:15px 18px;border-bottom:1px solid rgba(0,0,0,.05)}.run-row:last-child{border-bottom:0}.run-dot{width:7px;height:7px;border-radius:50%;background:#aaa}.run-dot.completed{background:#111}.run-dot.failed{background:#777}.run-row strong{display:block;font-size:10px}.run-row small{display:block;margin-top:3px;color:#aaa;font-size:8px}.run-status{text-transform:uppercase;font-size:8px;letter-spacing:.1em;color:#999}.run-status.completed{color:#111}.empty-state{padding:44px 25px;display:grid;gap:8px;text-align:center}.empty-state strong{font-size:12px}.empty-state span{color:#999;font-size:9px;line-height:1.6;max-width:540px;margin:auto}.control-card{margin-top:14px;padding:24px;border:1px solid rgba(0,0,0,.075);border-radius:17px;background:#111;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:20px}.control-card h2{margin:0;font-size:17px;letter-spacing:-.03em}.control-card p:last-child{margin:5px 0 0;color:#888;font-size:9px}.control-card a{color:#fff;text-decoration:none;font-size:9px;white-space:nowrap}@media(max-width:900px){.ark-nav{display:none}.ark-hero,.control-card{display:block}.ark-state{display:inline-flex;margin-top:20px}.brief-grid{grid-template-columns:1fr}.metric-focus{min-height:150px}.ark-page{padding:40px 18px 60px}.ark-hero h1{font-size:38px}}
      `}</style>
    </main>
  );
}
