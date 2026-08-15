const integrations = [
  { name: "Gmail", category: "Communication", status: "Ready", description: "Read, classify and send business emails." },
  { name: "Google Calendar", category: "Scheduling", status: "Ready", description: "Create and manage appointments automatically." },
  { name: "Stripe", category: "Payments", status: "Ready", description: "React to payments, invoices and failed charges." },
  { name: "WhatsApp", category: "Messaging", status: "Connect", description: "Send customer and team notifications." },
  { name: "CRM", category: "Customers", status: "Connect", description: "Keep customer records synchronized." },
  { name: "Shopify", category: "Commerce", status: "Connect", description: "Turn orders into automated business actions." },
];

export default function IntegrationsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8f8f8", color: "#111", fontFamily: "Arial, sans-serif", padding: "48px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <a href="/" style={{ color: "#555", textDecoration: "none" }}>← Back to ORBIT</a>
        <div style={{ marginTop: 48, marginBottom: 32 }}><p style={{ letterSpacing: ".14em", fontSize: 11, color: "#777" }}>CONNECTIONS</p><h1 style={{ fontSize: 42, margin: "8px 0" }}>Integrations</h1><p style={{ color: "#666", fontSize: 16 }}>Connect the tools your business already uses. ORBIT handles the work between them.</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {integrations.map((integration) => (
            <article key={integration.name} style={{ background: "rgba(255,255,255,.82)", border: "1px solid #e7e7e7", borderRadius: 22, padding: 24, minHeight: 180, boxShadow: "0 12px 35px rgba(0,0,0,.035)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid #e5e5e5", display: "grid", placeItems: "center", background: "white", fontWeight: 700 }}>{integration.name.slice(0,1)}</div><span style={{ fontSize: 12, color: "#777" }}>{integration.status}</span></div>
              <h3 style={{ margin: "24px 0 7px" }}>{integration.name}</h3><p style={{ margin: 0, color: "#777", lineHeight: 1.5, fontSize: 14 }}>{integration.description}</p>
              <div style={{ marginTop: 18, fontSize: 11, letterSpacing: ".1em", color: "#999" }}>{integration.category.toUpperCase()}</div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
