"use client";

import { useState } from "react";

type IconName = "grid" | "flow" | "plug" | "users" | "activity" | "settings" | "search" | "bell" | "arrow" | "spark" | "check";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    flow: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M8 6.5 16 11M8 17.5 16 13"/></>,
    plug: <><path d="M9 7V3M15 7V3M7 7h10v3a5 5 0 0 1-10 0V7Z"/><path d="M12 15v6"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 1 0 0-8M21 21v-2a4 4 0 0 0-3-3.87"/></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-1.9 1.9-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21h-2.7v-.08A1.8 1.8 0 0 0 11 19.27a1.8 1.8 0 0 0-1.98-.36l-.06.06-1.9-1.9.06-.06A1.8 1.8 0 0 0 7.48 15 1.8 1.8 0 0 0 5.83 14H5.75v-2.7h.08A1.8 1.8 0 0 0 7.48 10a1.8 1.8 0 0 0-.36-1.98l-.06-.06 1.9-1.9.06.06A1.8 1.8 0 0 0 11 5.73 1.8 1.8 0 0 0 12.1 4.08V4h2.7v.08A1.8 1.8 0 0 0 15.9 5.73a1.8 1.8 0 0 0 1.98.36l.06-.06 1.9 1.9-.06.06A1.8 1.8 0 0 0 19.42 10a1.8 1.8 0 0 0 1.65 1.3h.08V14h-.08A1.8 1.8 0 0 0 19.4 15Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    spark: <><path d="m12 3-1.5 6.5L4 12l6.5 1.5L12 20l1.5-6.5L20 12l-6.5-2.5L12 3Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const nav = [
  ["Overview", "grid"], ["Workflows", "flow"], ["Integrations", "plug"], ["Clients", "users"], ["Activity", "activity"],
] as const;

const activity = [
  { title: "Payment received", detail: "Martin Construction · Stripe", time: "2 min ago", state: "Completed" },
  { title: "New client detected", detail: "Sophie Martin · Website", time: "8 min ago", state: "Completed" },
  { title: "Booking confirmed", detail: "Atelier Dupont · Calendar", time: "16 min ago", state: "Completed" },
  { title: "Follow-up scheduled", detail: "Lucas Bernard · CRM", time: "31 min ago", state: "Completed" },
];

export default function Home() {
  const [active, setActive] = useState("Overview");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><span /></span><span>ORBIT</span></div>
        <div className="workspace"><span className="workspace-avatar">D</span><span>Dreams Building</span><span className="chevron">⌄</span></div>

        <nav className="nav">
          <p className="nav-label">WORKSPACE</p>
          {nav.map(([label, icon]) => (
            <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => setActive(label)}>
              <Icon name={icon} /><span>{label}</span>{label === "Activity" && <span className="nav-count">12</span>}
            </button>
          ))}
          <p className="nav-label second">SYSTEM</p>
          <button className={`nav-item ${active === "Settings" ? "active" : ""}`} onClick={() => setActive("Settings")}><Icon name="settings"/><span>Settings</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="status-card"><span className="status-dot"/><div><strong>All systems operational</strong><small>ORBIT is running normally</small></div></div>
          <div className="profile"><span className="profile-avatar">DB</span><div><strong>Dreams Building</strong><small>Pro workspace</small></div><span className="more">•••</span></div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{active}</strong></div>
          <div className="top-actions"><button className="icon-button"><Icon name="search"/></button><button className="icon-button notification"><Icon name="bell"/><i/></button><span className="top-avatar">DB</span></div>
        </header>

        <div className="page">
          <div className="hero-row">
            <div><p className="eyebrow">THURSDAY, AUGUST 14 · LIVE</p><h1>Your business is moving.</h1><p className="hero-copy">ORBIT connects your tools and takes care of the work between them.</p></div>
            <button className="primary-button"><Icon name="spark" size={16}/> Ask ORBIT</button>
          </div>

          <div className="metrics">
            <div className="metric-card"><span>Automations active</span><strong>12</strong><small><em>+2</em> this month</small></div>
            <div className="metric-card"><span>Actions completed</span><strong>248</strong><small><em>+18%</em> vs. last month</small></div>
            <div className="metric-card"><span>Time saved</span><strong>18h 42m</strong><small><em>≈ $1,120</em> estimated value</small></div>
            <div className="metric-card"><span>Success rate</span><strong>99.2%</strong><small><em>↑ 0.4%</em> this month</small></div>
          </div>

          <div className="section-heading"><div><p className="eyebrow">AUTOMATION</p><h2>What ORBIT is doing</h2></div><button className="text-button">View activity <Icon name="arrow" size={15}/></button></div>

          <div className="main-grid">
            <div className="activity-card glass-card">
              <div className="card-head"><div><h3>Live activity</h3><p>Every action, connected and visible.</p></div><span className="live-pill"><i/> Live</span></div>
              <div className="activity-list">{activity.map((item, i) => <div className="activity-item" key={item.title}><div className="activity-icon"><Icon name={i === 0 ? "check" : "flow"} size={16}/></div><div className="activity-text"><strong>{item.title}</strong><span>{item.detail}</span></div><div className="activity-meta"><span>{item.time}</span><b>{item.state}</b></div></div>)}</div>
            </div>

            <div className="orbit-card glass-card">
              <div className="card-head"><div><h3>Active workflow</h3><p>Client onboarding</p></div><button className="circle-button"><Icon name="arrow" size={16}/></button></div>
              <div className="workflow">
                <div className="workflow-node"><span className="node-icon">01</span><div><strong>New client</strong><small>Website form</small></div><span className="node-check"><Icon name="check" size={12}/></span></div>
                <div className="connector"/>
                <div className="workflow-node"><span className="node-icon">02</span><div><strong>Add to CRM</strong><small>Client created</small></div><span className="node-check"><Icon name="check" size={12}/></span></div>
                <div className="connector"/>
                <div className="workflow-node"><span className="node-icon">03</span><div><strong>Send welcome</strong><small>Email · Gmail</small></div><span className="node-check"><Icon name="check" size={12}/></span></div>
                <div className="connector"/>
                <div className="workflow-node current"><span className="node-icon">04</span><div><strong>Notify team</strong><small>WhatsApp · Next</small></div><span className="node-pulse"/></div>
              </div>
              <button className="workflow-button">Open workflow <Icon name="arrow" size={15}/></button>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="value-banner"><div className="value-orbit"><span/><span/><span/></div><div><p className="eyebrow">THE ORBIT PROMISE</p><h3>Your tools. One intelligent system.</h3><p>When something happens in your business, ORBIT knows what should happen next.</p></div><button className="outline-button">Explore automations <Icon name="arrow" size={15}/></button></div>
            <div className="ask-card"><div className="ask-icon"><Icon name="spark" size={18}/></div><div><strong>Tell ORBIT what to automate.</strong><p>Describe a process in plain language.</p></div><Icon name="arrow" size={17}/></div>
          </div>
        </div>
      </section>
    </main>
  );
}
