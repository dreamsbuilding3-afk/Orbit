const events = [
  ["Payment received", "Martin Construction · Stripe", "2 min ago", "Completed"],
  ["New client detected", "Sophie Martin · Website", "8 min ago", "Completed"],
  ["Booking confirmed", "Atelier Dupont · Calendar", "16 min ago", "Completed"],
  ["Follow-up scheduled", "Lucas Bernard · CRM", "31 min ago", "Completed"],
  ["Welcome email sent", "Claire Laurent · Gmail", "44 min ago", "Completed"],
  ["Lead qualified", "Studio Nova · Website", "1h ago", "Completed"],
];

export default function ActivityPage() {
  return (
    <main className="app-shell">
      <section className="content" style={{ width: "100%" }}>
        <header className="topbar"><div className="breadcrumbs"><a href="/">Workspace</a><b>/</b><strong>Activity</strong></div><span className="topbar-muted">Transparency</span></header>
        <div className="page activity-page">
          <div className="hero-row">
            <div><p className="eyebrow">TRANSPARENCY</p><h1>Everything WineTime does, clearly.</h1><p className="hero-copy">A calm, readable record of actions, integrations and automated work.</p></div>
          </div>
          <section className="glass-card activity-panel">
            <div className="card-head"><div><h3>Recent activity</h3><p>Latest actions across your connected systems.</p></div><div className="live-pill"><i />Live record</div></div>
            <div className="activity-list">
              {events.map(([title, detail, time, state]) => <div key={title + time} className="activity-item">
                <span className="activity-icon">✓</span>
                <div className="activity-text"><strong>{title}</strong><span>{detail}</span></div>
                <div className="activity-meta"><span>{time}</span><b>{state}</b></div>
              </div>)}
            </div>
          </section>
          <style jsx>{`
            .activity-page{max-width:1280px;padding-top:52px}.activity-panel{max-width:1100px;min-height:520px}.activity-panel .activity-list{padding:0 18px 18px}.activity-panel .activity-item{padding:20px 12px}.activity-panel .activity-text strong{font-size:12px}.activity-panel .activity-text span{font-size:10px;margin-top:5px}.activity-panel .activity-meta span{font-size:9px}.activity-panel .activity-meta b{font-size:9px;margin-top:5px}.activity-panel .activity-icon{width:36px;height:36px;border-radius:11px}
            @media(max-width:700px){.activity-page{padding:32px 20px 50px}.activity-panel .activity-item{grid-template-columns:36px minmax(0,1fr);align-items:start}.activity-panel .activity-meta{grid-column:2;text-align:left;margin-top:4px}.activity-panel .activity-text span{white-space:normal}}
          `}</style>
        </div>
      </section>
    </main>
  );
}
