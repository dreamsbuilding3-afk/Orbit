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
    <main style={{ minHeight: "100vh", background: "#f8f8f8", color: "#111", fontFamily: "Arial, sans-serif", padding: "48px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <a href="/" style={{ color: "#555", textDecoration: "none" }}>← Back to WineTime</a>
        <div style={{ marginTop: 48, marginBottom: 32 }}><p style={{ letterSpacing: ".14em", fontSize: 11, color: "#777" }}>TRANSPARENCY</p><h1 style={{ fontSize: 42, margin: "8px 0" }}>Activity</h1><p style={{ color: "#666", fontSize: 16 }}>A clear record of every action WineTime takes.</p></div>
        <section style={{ background: "rgba(255,255,255,.82)", border: "1px solid #e7e7e7", borderRadius: 22, overflow: "hidden", boxShadow: "0 12px 35px rgba(0,0,0,.035)" }}>
          {events.map(([title, detail, time, state]) => <div key={title + time} style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 16, alignItems: "center", borderBottom: "1px solid #eeeeee" }}><span style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #e3e3e3", display: "grid", placeItems: "center", background: "#fff" }}>✓</span><div><strong>{title}</strong><div style={{ color: "#777", fontSize: 13, marginTop: 4 }}>{detail}</div></div><div style={{ textAlign: "right", color: "#888", fontSize: 12 }}><div>{time}</div><span style={{ color: "#222" }}>{state}</span></div></div>)}
        </section>
      </div>
    </main>
  );
}
