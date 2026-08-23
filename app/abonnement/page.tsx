"use client";
import Link from "next/link";
import { WINE_TIME_PLANS } from "@/lib/billing/plans";

export default function AbonnementPage() {
  return (
    <main className="app-shell"><section className="content" style={{width:"100%"}}>
      <header className="topbar"><div className="breadcrumbs"><Link href="/">Workspace</Link><b>/</b><strong>Abonnement</strong></div><span className="topbar-muted">Plans & limites</span></header>
      <div className="page subscription-page">
        <div className="hero-row"><div><p className="eyebrow">WINE TIME · ABONNEMENT</p><h1>Choose the level of analysis your business needs.</h1><p className="hero-copy">Plans, limits and included capabilities are already structured. Stripe will be connected later without changing this experience.</p></div></div>
        <section className="subscription-grid">{WINE_TIME_PLANS.map(plan=><article key={plan.id} className={`glass-card plan-card ${plan.recommended?"recommended":""}`}>
          {plan.recommended&&<div className="plan-badge">RECOMMANDÉ</div>}
          <div className="plan-top"><div><p className="eyebrow">PLAN</p><h2>{plan.name}</h2></div><span className="plan-mark">{plan.id.slice(0,1).toUpperCase()}</span></div>
          <p className="plan-description">{plan.description}</p>
          <div className="plan-price"><strong>{plan.monthlyPrice===null?"Sur devis":`${plan.monthlyPrice} €`}</strong>{plan.monthlyPrice!==null&&<span>/ mois</span>}</div>
          <div className="plan-features"><p className="eyebrow">INCLUS</p>{plan.features.map(feature=><div key={feature}><span>✓</span><span>{feature}</span></div>)}</div>
          <div className="plan-limits">{plan.limits.connectors===null?"Connecteurs illimités":`${plan.limits.connectors} connecteurs`} · {plan.limits.members===null?"membres illimités":`${plan.limits.members} membres`}<br/>{plan.limits.monthlySignals===null?"Volume de signaux adapté à votre infrastructure":`${plan.limits.monthlySignals.toLocaleString("fr-FR")} signaux / mois`}</div>
          <button disabled className="plan-button">Paiement bientôt disponible</button>
        </article>)}</section>
        <section className="subscription-note"><div><strong>Stripe n'est pas encore connecté.</strong><p>Aucun paiement n'est déclenché ici. Les droits et limites WineTime sont déjà préparés pour recevoir le système de facturation.</p></div><Link href="/integrations">Voir mes connexions →</Link></section>
      </div>
      <style jsx>{`.subscription-page{max-width:1420px;padding-top:52px}.subscription-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.plan-card{position:relative;padding:25px;min-height:500px;display:flex;flex-direction:column;background:rgba(255,255,255,.78)}.plan-card.recommended{border-color:rgba(0,0,0,.18);box-shadow:0 24px 70px rgba(0,0,0,.08)}.plan-badge{position:absolute;top:16px;right:16px;padding:6px 9px;border-radius:8px;background:#111;color:#fff;font-size:8px;letter-spacing:.1em;font-weight:700}.plan-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.plan-top h2{margin:0;font-size:22px;letter-spacing:-.04em}.plan-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#f0f0ef;border:1px solid var(--line);font-size:11px;font-weight:700}.plan-description{min-height:58px;margin:15px 0 0;color:#888;font-size:12px;line-height:1.65}.plan-price{display:flex;align-items:baseline;gap:6px;margin:24px 0}.plan-price strong{font-size:36px;letter-spacing:-.055em}.plan-price span{color:#999;font-size:10px}.plan-features{border-top:1px solid var(--line);padding-top:18px}.plan-features>p{margin-bottom:10px}.plan-features div{display:flex;gap:9px;margin:10px 0;color:#666;font-size:11px;line-height:1.45}.plan-features div span:first-child{color:#111;font-weight:700}.plan-limits{margin-top:auto;padding-top:18px;border-top:1px solid var(--line);color:#999;font-size:10px;line-height:1.7}.plan-button{width:100%;margin-top:18px;height:40px;border:1px solid #dededb;border-radius:10px;background:#f4f4f2;color:#999;font-size:10px;font-weight:700}.subscription-note{margin-top:18px;padding:22px 24px;display:flex;justify-content:space-between;align-items:center;gap:24px;border-radius:17px;background:#111;color:#fff;box-shadow:0 20px 55px rgba(0,0,0,.12)}.subscription-note strong{font-size:12px}.subscription-note p{margin:5px 0 0;color:#999;font-size:10px;line-height:1.5}.subscription-note a{color:#fff;text-decoration:none;border:1px solid #444;border-radius:10px;padding:10px 13px;font-size:10px;white-space:nowrap}@media(max-width:1000px){.subscription-grid{grid-template-columns:1fr}.plan-card{min-height:auto}}@media(max-width:700px){.subscription-page{padding:32px 20px 50px}.subscription-note{align-items:flex-start;flex-direction:column}.subscription-note a{width:100%;text-align:center}}`}</style>
    </section></main>
  );
}
