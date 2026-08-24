"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase-browser";

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  timestamp: number;
  state: "Completed" | "Running" | "Failed" | "Pending" | "Cancelled" | "Recorded";
};

function relativeTime(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function normalizeState(value: string | null | undefined): ActivityItem["state"] {
  switch (value) {
    case "completed":
    case "won":
      return "Completed";
    case "running":
    case "executing":
      return "Running";
    case "failed":
      return "Failed";
    case "pending":
    case "approved":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    default:
      return "Recorded";
  }
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!supabase) {
      setError("WineTime n'est pas encore connecté à sa base de données.");
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData.user;
      if (!user) {
        setItems([]);
        return;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1);

      if (membershipError) throw membershipError;
      const organizationId = memberships?.[0]?.organization_id;

      if (!organizationId) {
        setItems([]);
        return;
      }

      const [auditResult, arkResult, workflowResult] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("id, action, entity_type, entity_id, metadata, created_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("ark_action_runs")
          .select("id, action_type, status, error_message, created_at, finished_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("workflow_runs")
          .select("id, status, started_at, finished_at, error_message")
          .order("started_at", { ascending: false })
          .limit(30),
      ]);

      if (auditResult.error) throw auditResult.error;
      if (arkResult.error) throw arkResult.error;
      if (workflowResult.error) throw workflowResult.error;

      const auditItems: ActivityItem[] = (auditResult.data ?? []).map((event) => {
        const timestamp = new Date(event.created_at).getTime();
        const entity = event.entity_type ? event.entity_type.replaceAll("_", " ") : "workspace";
        return {
          id: `audit-${event.id}`,
          title: `${event.action.charAt(0).toUpperCase()}${event.action.slice(1)} ${entity}`,
          detail: event.entity_id ? `WineTime · ${event.entity_id}` : "WineTime · audit record",
          time: relativeTime(timestamp),
          timestamp,
          state: event.action === "execute" ? "Completed" : "Recorded",
        };
      });

      const arkItems: ActivityItem[] = (arkResult.data ?? []).map((event) => {
        const timestamp = new Date(event.created_at).getTime();
        return {
          id: `ark-${event.id}`,
          title: `ARK · ${event.action_type.replaceAll("_", " ")}`,
          detail: event.error_message ? `ARK · ${event.error_message}` : "ARK · autonomous action run",
          time: relativeTime(timestamp),
          timestamp,
          state: normalizeState(event.status),
        };
      });

      const workflowItems: ActivityItem[] = (workflowResult.data ?? []).map((run) => {
        const timestamp = new Date(run.started_at).getTime();
        return {
          id: `workflow-${run.id}`,
          title: `Workflow execution · ${run.status}`,
          detail: run.error_message ? `Workflow · ${run.error_message}` : "Workflow · automated execution",
          time: relativeTime(timestamp),
          timestamp,
          state: normalizeState(run.status),
        };
      });

      setItems([...auditItems, ...arkItems, ...workflowItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 30));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger l'activité.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const summary = useMemo(() => {
    const completed = items.filter((item) => item.state === "Completed").length;
    const active = items.filter((item) => item.state === "Running" || item.state === "Pending").length;
    const failed = items.filter((item) => item.state === "Failed").length;
    return { completed, active, failed };
  }, [items]);

  return (
    <main className="app-shell">
      <section className="content" style={{ width: "100%" }}>
        <header className="topbar">
          <div className="breadcrumbs"><a href="/">Workspace</a><b>/</b><strong>Activity</strong></div>
          <span className="topbar-muted">Transparency</span>
        </header>

        <div className="page activity-page">
          <div className="hero-row">
            <div>
              <p className="eyebrow">TRANSPARENCY</p>
              <h1>Everything WineTime does, clearly.</h1>
              <p className="hero-copy">A live, readable record of actions, integrations and automated work.</p>
            </div>
            <button className="refresh-button" onClick={() => void loadActivity()} disabled={refreshing}>
              {refreshing ? "Refreshing…" : "Refresh activity"}
            </button>
          </div>

          <section className="summary-grid">
            <div className="summary-card"><span>COMPLETED</span><strong>{summary.completed}</strong><p>Recorded successful work.</p></div>
            <div className="summary-card"><span>IN PROGRESS</span><strong>{summary.active}</strong><p>Actions still moving through WineTime.</p></div>
            <div className="summary-card"><span>ATTENTION</span><strong>{summary.failed}</strong><p>Runs that need review.</p></div>
          </section>

          <section className="glass-card activity-panel">
            <div className="card-head">
              <div><h3>Recent activity</h3><p>Real events from your connected workspace.</p></div>
              <div className="live-pill"><i />Live record</div>
            </div>

            {loading ? (
              <div className="empty-state"><strong>Loading your activity…</strong><span>WineTime is retrieving the latest workspace events.</span></div>
            ) : error ? (
              <div className="empty-state error-state"><strong>Activity is temporarily unavailable.</strong><span>{error}</span><button onClick={() => void loadActivity()}>Try again</button></div>
            ) : items.length === 0 ? (
              <div className="empty-state"><strong>No activity yet.</strong><span>Connect your tools and run an approved action. WineTime will record the work here.</span><a href="/connections">Connect your tools →</a></div>
            ) : (
              <div className="activity-list">
                {items.map((item) => (
                  <div key={item.id} className="activity-item">
                    <span className={`activity-icon state-${item.state.toLowerCase()}`}>{item.state === "Failed" ? "!" : item.state === "Running" ? "•" : "✓"}</span>
                    <div className="activity-text"><strong>{item.title}</strong><span>{item.detail}</span></div>
                    <div className="activity-meta"><span>{item.time}</span><b className={`status-${item.state.toLowerCase()}`}>{item.state}</b></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .activity-page{max-width:1280px;padding-top:52px;padding-bottom:80px}.hero-row{align-items:flex-end}.refresh-button{border:1px solid rgba(20,20,20,.12);background:rgba(255,255,255,.72);border-radius:12px;padding:11px 15px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(20,20,20,.05)}.refresh-button:disabled{opacity:.55;cursor:default}.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:30px 0 18px}.summary-card{border:1px solid rgba(20,20,20,.09);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(247,247,247,.7));padding:20px 22px;box-shadow:0 12px 32px rgba(20,20,20,.04)}.summary-card span{font-size:9px;letter-spacing:.14em;color:#999}.summary-card strong{display:block;font-size:28px;margin-top:8px}.summary-card p{margin:5px 0 0;color:#777;font-size:11px}.activity-panel{max-width:1180px;min-height:420px}.activity-list{padding:0 18px 18px}.activity-item{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:14px;align-items:center;padding:19px 12px;border-top:1px solid rgba(20,20,20,.07)}.activity-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#f5f5f5;font-weight:700}.state-running{background:#111;color:#fff}.state-failed{background:#f1e8e8;color:#8a2222}.activity-text{min-width:0}.activity-text strong{display:block;font-size:13px}.activity-text span{display:block;margin-top:5px;color:#777;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.activity-meta{display:flex;flex-direction:column;align-items:flex-end;gap:5px}.activity-meta span{font-size:10px;color:#999}.activity-meta b{font-size:9px;letter-spacing:.04em}.status-failed{color:#8a2222}.status-running{color:#111}.status-pending{color:#777}.empty-state{min-height:300px;padding:70px 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:9px}.empty-state strong{font-size:18px}.empty-state span{max-width:520px;color:#777;font-size:12px;line-height:1.6}.empty-state a,.empty-state button{margin-top:8px;border:0;background:none;text-decoration:underline;font:inherit;font-size:12px;font-weight:600;cursor:pointer}.error-state strong{color:#8a2222}.live-pill{white-space:nowrap}.live-pill i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#43d7b6;margin-right:7px}@media(max-width:800px){.hero-row{align-items:flex-start;gap:18px}.summary-grid{grid-template-columns:1fr}.activity-item{grid-template-columns:36px minmax(0,1fr)}.activity-meta{grid-column:2;align-items:flex-start}.activity-text span{white-space:normal}.activity-page{padding:32px 20px 50px}}
        `}</style>
      </section>
    </main>
  );
}
