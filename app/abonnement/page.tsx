import Link from "next/link";
import { WINE_TIME_PLANS } from "@/lib/billing/plans";

export default function AbonnementPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f7f7f5", color: "#171717", padding: "32px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#777", textDecoration: "none", fontSize: 13 }}>← Retour à WineTime</Link>
        <header style={{ margin: "34px 0 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: "#8b8b88" }}>WINE TIME · ABONNEMENT</div>
          <h1 style={{ margin: "8px 0 10px", fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-.05em", lineHeight: 1.02 }}>Payez WineTime pour ne plus laisser de valeur sur la table.</h1>
          <p style={{ margin: 0, maxWidth: 720, color: "#777", lineHeight: 1.7, fontSize: 15 }}>Choisissez le niveau d'analyse adapté à votre entreprise. Les paiements ne sont pas encore connectés : cette page prépare votre offre avant l'activation de Stripe.</p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: 14 }}>
          {WINE_TIME_PLANS.map((plan) => (
            <article key={plan.id} style={{ position: "relative", background: "#fff", border: plan.recommended ? "2px solid #171717" : "1px solid #e4e4e1", borderRadius: 18, padding: 22, boxShadow: "0 8px 30px rgba(0,0,0,.045)" }}>
              {plan.recommended && <div style={{ position: "absolute", top: -12, left: 18, background: "#171717", color: "#fff", borderRadius: 999, padding: "5px 10px", fontSize: 10, fontWeight: 700 }}>RECOMMANDÉ</div>}
              <h2 style={{ margin: 0, fontSize: 20 }}>{plan.name}</h2>
              <p style={{ minHeight: 48, color: "#777", fontSize: 12, lineHeight: 1.55 }}>{plan.description}</p>
              <div style={{ margin: "18px 0" }}>
                <strong style={{ fontSize: 34, letterSpacing: "-.04em" }}>{plan.monthlyPrice === null ? "Sur devis" : `${plan.monthlyPrice} €`}</strong>
                {plan.monthlyPrice !== null && <span style={{ color: "#888", fontSize: 12 }}> / mois</span>}
              </div>
              <div style={{ borderTop: "1px solid #eee", paddingTop: 15 }}>
                <p style={{ margin: "0 0 9px", fontSize: 11, fontWeight: 700 }}>INCLUS</p>
                {plan.features.map((feature) => <div key={feature} style={{ display: "flex", gap: 8, margin: "8px 0", fontSize: 12, color: "#555" }}><span>✓</span><span>{feature}</span></div>)}
              </div>
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #eee", color: "#888", fontSize: 11, lineHeight: 1.7 }}>
                {plan.limits.connectors === null ? "Connecteurs illimités" : `${plan.limits.connectors} connecteurs`} · {plan.limits.members === null ? "membres illimités" : `${plan.limits.members} membres`}<br />
                {plan.limits.monthlySignals === null ? "Volume de signaux adapté à votre infrastructure" : `${plan.limits.monthlySignals.toLocaleString("fr-FR")} signaux / mois`}
              </div>
              <button disabled style={{ width: "100%", marginTop: 18, padding: "11px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#f3f3f1", color: "#999", fontWeight: 700, cursor: "not-allowed" }}>
                Paiement bientôt disponible
              </button>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 18, background: "#171717", color: "#fff", borderRadius: 18, padding: "22px 24px", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div><div style={{ fontWeight: 700, marginBottom: 5 }}>Votre abonnement sera connecté à Stripe plus tard.</div><div style={{ color: "#aaa", fontSize: 12, lineHeight: 1.5 }}>Aucun paiement n'est déclenché depuis cette page. Les plans, droits et limites WineTime sont déjà structurés.</div></div>
          <Link href="/integrations" style={{ color: "#fff", textDecoration: "none", border: "1px solid #555", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>Configurer mes connexions →</Link>
        </section>
      </div>
      <style>{`@media(max-width:700px){main{padding:20px!important}article{padding:18px!important}}`}</style>
    </main>
  );
}
