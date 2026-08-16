"use client";

import Link from "next/link";

type IconName = "grid" | "flow" | "plug" | "users" | "activity" | "settings" | "spark" | "arrow" | "check";
function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    flow: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M8 6.5 16 11M8 17.5 16 13"/></>,
    plug: <><path d="M9 7V3M15 7V3M7 7h10v3a5 5 0 0 1-10 0V7Z"/><path d="M12 15v6"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/></>,
    activity: <path d="M3 12h4l3-8 4 16 3-8h4"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-1.9 1.9-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21h-2.7v-.08A1.8 1.8 0 0 0 11 19.27a1.8 1.8 0 0 0-1.98-.36l-.06.06-1.9-1.9.06-.06A1.8 1.8 0 0 0 7.48 15 1.8 1.8 0 0 0 5.83 14H5.75v-2.7h.08A1.8 1.8 0 0 0 7.48 10a1.8 1.8 0 0 0-.36-1.98l-.06-.06 1.9-1.9.06.06A1.8 1.8 0 0 0 11 5.73 1.8 1.8 0 0 0 12.1 4.08V4h2.7v.08A1.8 1.8 0 0 0 15.9 5.73a1.8 1.8 0 0 0 1.98.36l.06-.06 1.9 1.9-.06.06A1.8 1.8 0 0 0 19.42 10a1.8 1.8 0 0 0 1.65 1.3h.08V14h-.08A1.8 1.8 0 0 0 19.4 15Z"/></>,
    spark: <path d="m12 3-1.5 6.5L4 12l6.5 1.5L12 20l1.5-6.5L20 12l-6.5-2.5L12 3Z"/>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const nav = [
  ["Overview", "grid"], ["Workflows", "flow"], ["Integrations", "plug"], ["Clients", "users"], ["Activity", "activity"],
] as const;

const activity = [
  { title: "Payment received", detail: "Martin Construction · Stripe", time: "2 min ago" },
  { title: "New client detected", detail: "Sophie Martin · Website", time: "8 min ago" },
  { title: "Booking confirmed", detail: "Atelier Dupont · Calendar", time: "16 min ago" },
  { title: "Follow-up scheduled", detail: "Lucas Bernard · CRM", time: "31 min ago" },
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><span /></span><span>ORBARK</span></div>
        <div className="workspace"><span className="workspace-avatar">D</span><span>Dreams Building</span><span className="chevron">⌄</span></div>
        <nav className="nav">
          <p className="nav-label">ORBARK</p>
          <Link className="nav-item active" href="/"><Icon name="grid"/><span>Command Center</span></Link>
          <Link className="nav-item" href="/ark"><Icon name="spark"/><span>ARK Intelligence</span></Link>
          <p className="nav-label second">ORBIT EXECUTION</p>
          {nav.filter(([label]) => label !== "Overview").map(([label, icon]) => <Link key={label} className="nav-item" href={label === "Workflows" ? "/workflows" : label === "Integrations" ? "/integrations" : label === "Activity" ? "/activity" : "#"}><Icon name={icon}/><span>{label}</span></Link>)}
          <p className="nav-label second">SYSTEM</p>
          <Link className="nav-item" href="#"><Icon name="settings"/><span>Settings</span></Link>
        </nav>
        <div className="sidebar-bottom"><div className="status-card"><span className="status-dot"/><div><strong>ARK + ORBIT operational</strong><small>Intelligence and execution online</small></div></div><div className="profile"><span className="profile-avatar">DB</span><div><strong>Dreams Building</strong><small>Pro workspace</small></div><span className="more">•••</span></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="breadcrumbs"><span>ORBARK</span><b>/</b><strong>Command Center</strong></div><div className="top-actions"><span className="top-avatar">DB</span></div></header>
        <div className="page">
          <div className="hero-row">
            <div><p className="eyebrow">ORBARK · AUTONOMOUS BUSINESS OS</p><h1>Your business,<br/>understood and moving.</h1><p className="hero-copy">ARK thinks. ORBIT executes. One intelligent system for the work between your tools.</p></div>
            <Link className="primary-button" href="/ark"><Icon name="spark" size={16}/> Open ARK</Link>
          </div>

          <div className="intel-strip"><div><p className="eyebrow">ARK DAILY BRIEF</p><h2>Good morning.</h2><p>ARK is watching your workflows and will surface real opportunities and problems as signals arrive.</p></div><Link href="/ark" className="outline-button">View intelligence <Icon name="arrow" size={15}/></Link></div>

          <div className="metrics">
            <div className="metric-card"><span>Automations active</span><strong>12</strong><small>ORBIT workflows</small></div>
            <div className="metric-card"><span>Actions completed</span><strong>248</strong><small>Recorded executions</small></div>
            <div className="metric-card"><span>Intelligence status</span><strong>LIVE</strong><small>ARK monitoring signals</small></div>
            <div className="metric-card"><span>Human decisions</span><strong>0</strong><small>No approvals waiting</small></div>
          </div>

          <div className="section-heading"><div><p className="eyebrow">SYSTEM ACTIVITY</p><h2>What ORBARK is doing</h2></div><Link className="text-button" href="/activity">View all <Icon name="arrow" size={15}/></Link></div>
          <div className="main-grid">
            <div className="activity-card glass-card"><div className="card-head"><div><h3>Live execution</h3><p>Every action visible. Every decision traceable.</p></div><span className="live-pill"><i/> Live</span></div><div className="activity-list">{activity.map((item, i) => <div className="activity-item" key={item.title}><div className="activity-icon"><Icon name={i === 0 ? "check" : "flow"} size={16}/></div><div className="activity-text"><strong>{item.title}</strong><span>{item.detail}</span></div><div className="activity-meta"><span>{item.time}</span><b>Completed</b></div></div>)}</div></div>
            <div className="orbit-card glass-card"><div className="card-head"><div><h3>ARK → ORBIT</h3><p>Intelligence to execution</p></div><Link className="circle-button" href="/workflows"><Icon name="arrow" size={16}/></Link></div><div className="workflow"><div className="workflow-node"><span className="node-icon">01</span><div><strong>ARK detects</strong><small>Business signal</small></div><span className="node-check"><Icon name="check" size={12}/></span></div><div className="connector"/><div className="workflow-node"><span className="node-icon">02</span><div><strong>ARK decides</strong><small>Recommended action</small></div><span className="node-check"><Icon name="check" size={12}/></span></div><div className="connector"/><div className="workflow-node current"><span className="node-icon">03</span><div><strong>ORBIT executes</strong><small>Across connected tools</small></div><span className="node-pulse"/></div></div><Link href="/workflows" className="workflow-button">Open automations <Icon name="arrow" size={15}/></Link></div>
          </div>

          <div className="bottom-grid"><Link href="/ark" className="value-banner"><div className="value-orbit"><span/></div><div><p className="eyebrow">THE ORBARK PROMISE</p><h3>ARK thinks. ORBIT does.</h3><p>Understand what matters, decide what to do, and execute without unnecessary manual work.</p></div><Icon name="arrow" size={17}/></Link><Link href="/integrations" className="ask-card"><div className="ask-icon"><Icon name="plug" size={18}/></div><div><strong>Connect the tools you already use.</strong><p>Gmail, Calendar, Stripe, CRM and more.</p></div><Icon name="arrow" size={17}/></Link></div>
        </div>
      </section>
      <style jsx>{`.intel-strip{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:14px;padding:22px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(120deg,rgba(255,255,255,.95),rgba(247,247,246,.74));box-shadow:var(--shadow)}.intel-strip h2{margin:0;font-size:22px;letter-spacing:-.04em}.intel-strip p:not(.eyebrow){margin:6px 0 0;color:#8b8b89;font-size:10px;line-height:1.55;max-width:660px}.intel-strip .outline-button{margin-left:auto;text-decoration:none;color:#333}.circle-button{text-decoration:none}.value-banner{text-decoration:none;color:inherit}.ask-card{text-decoration:none;color:#fff}@media(max-width:900px){.intel-strip{display:block}.intel-strip .outline-button{display:inline-flex;margin-top:15px}.hero-row{display:block}.hero-row .primary-button{margin-top:20px;display:inline-flex}}
      `}</style>
    </main>
  );
}
