const workflows = [
  { name: "Client onboarding", trigger: "New client detected", steps: "4 steps", runs: "84 runs", status: "Active" },
  { name: "Payment follow-up", trigger: "Payment failed", steps: "3 steps", runs: "21 runs", status: "Active" },
  { name: "Post-service review", trigger: "Booking completed", steps: "5 steps", runs: "143 runs", status: "Active" },
  { name: "Lead qualification", trigger: "Website form submitted", steps: "6 steps", runs: "57 runs", status: "Draft" },
];

export default function WorkflowsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8f8f8", color: "#111", fontFamily: "Arial, sans-serif", padding: "48px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <a href="/" style={{ color: "#555", textDecoration: "none" }}>← Back to ORBIT</a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: 48, marginBottom: 32 }}>
          <div><p style={{ letterSpacing: ".14em", fontSize: 11, color: "#777" }}>AUTOMATION</p><h1 style={{ fontSize: 42, margin: "8px 0" }}>Workflows</h1><p style={{ color: "#666", fontSize: 16 }}>The business processes ORBIT runs for you.</p></div>
          <button style={{ border: 0, borderRadius: 14, background: "#111", color: "white", padding: "13px 18px", fontWeight: 600 }}>+ New workflow</button>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {workflows.map((workflow) => (
            <div key={workflow.name} style={{ background: "rgba(255,255,255,.82)", border: "1px solid #e7e7e7", borderRadius: 20, padding: 22, display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto", alignItems: "center", gap: 18, boxShadow: "0 12px 35px rgba(0,0,0,.035)" }}>
              <div><strong>{workflow.name}</strong><div style={{ color: "#777", fontSize: 13, marginTop: 6 }}>{workflow.trigger}</div></div>
              <div><small style={{ color: "#999" }}>STEPS</small><div>{workflow.steps}</div></div>
              <div><small style={{ color: "#999" }}>RUNS</small><div>{workflow.runs}</div></div>
              <div><span style={{ padding: "6px 10px", borderRadius: 999, background: workflow.status === "Active" ? "#f1f1f1" : "#fafafa", border: "1px solid #e5e5e5", fontSize: 12 }}>{workflow.status}</span></div>
              <a href="#" style={{ color: "#111", textDecoration: "none" }}>→</a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
