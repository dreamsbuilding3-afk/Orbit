"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type PrivacyRequest = {
  id: string;
  request_type: string;
  status: string;
  requested_at: string;
  due_at: string;
};

type Consent = {
  consent_type: string;
  version: string;
  granted_at: string;
  revoked_at: string | null;
};

const requestTypes = [
  ["export", "Exporter mes données", "Recevoir une copie structurée des données associées à l'organisation."],
  ["access", "Demander l'accès", "Obtenir une vue des données personnelles traitées par WineTime."],
  ["rectification", "Rectifier mes données", "Signaler des informations personnelles incorrectes ou incomplètes."],
  ["erasure", "Demander l'effacement", "Demander la suppression des données lorsqu'elle est légalement applicable."],
  ["restriction", "Limiter un traitement", "Demander la limitation temporaire d'un traitement."],
  ["objection", "M'opposer à un traitement", "Demander l'arrêt d'un traitement lorsque le droit d'opposition s'applique."],
];

const consentTypes = [
  ["integration", "Connexions aux outils", "Autorise WineTime à utiliser les données des intégrations que votre organisation a connectées."],
  ["ai_processing", "Analyse par l'IA", "Autorise l'analyse des données nécessaires aux fonctions IA de WineTime."],
  ["analytics", "Analytics produit", "Autorise l'utilisation de données d'usage pour améliorer le produit."],
];

export default function PrivacyCenterPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    if (!supabase) return setMessage("Supabase n'est pas configuré sur ce déploiement.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("Connecte-toi à WineTime pour accéder au centre de confidentialité.");
    const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
    const organizationId = memberships?.[0]?.organization_id;
    if (!organizationId) return setMessage("Aucune organisation active n'a été trouvée.");
    setOrgId(organizationId);
    const [requestResult, consentResult] = await Promise.all([
      supabase.from("privacy_requests").select("id,request_type,status,requested_at,due_at").eq("organization_id", organizationId).order("requested_at", { ascending: false }).limit(20),
      supabase.from("organization_consents").select("consent_type,version,granted_at,revoked_at").eq("organization_id", organizationId).order("granted_at", { ascending: false }),
    ]);
    if (requestResult.error) setMessage("Impossible de charger les demandes de confidentialité.");
    setRequests(requestResult.data ?? []);
    setConsents(consentResult.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function submitRequest(type: string) {
    if (!supabase || !orgId) return;
    setBusy(type); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Session expirée. Reconnecte-toi."); setBusy(""); return; }
    const { error } = await supabase.from("privacy_requests").insert({ organization_id: orgId, requested_by: user.id, request_type: type });
    if (error) setMessage(`Impossible d'enregistrer la demande : ${error.message}`);
    else { setMessage("✅ Demande enregistrée. Elle apparaît dans l'historique ci-dessous."); await load(); }
    setBusy("");
  }

  async function toggleConsent(type: string) {
    if (!supabase || !orgId) return;
    setBusy(`consent:${type}`); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Session expirée. Reconnecte-toi."); setBusy(""); return; }
    const active = consents.find(c => c.consent_type === type && !c.revoked_at);
    if (active) {
      const { error } = await supabase.from("organization_consents").update({ revoked_at: new Date().toISOString() }).eq("organization_id", orgId).eq("consent_type", type).is("revoked_at", null);
      if (error) setMessage(`Révocation impossible : ${error.message}`);
      else setMessage("Autorisation révoquée.");
    } else {
      const { error } = await supabase.from("organization_consents").insert({ organization_id: orgId, granted_by: user.id, consent_type: type, version: "2026-08-01" });
      if (error) setMessage(`Autorisation impossible à enregistrer : ${error.message}`);
      else setMessage("Autorisation enregistrée.");
    }
    await load(); setBusy("");
  }

  return (
    <main className="app-shell">
      <section className="content integrations-content" style={{ width: "100%" }}>
        <header className="topbar"><Link href="/">WineTime</Link><span className="topbar-muted">Confidentialité</span></header>
        <div className="page privacy-page">
          <header className="privacy-hero">
            <div><p className="eyebrow">CONFIDENTIALITÉ & CONTRÔLE</p><h1>Vos données. Vos droits. Vos décisions.</h1><p>WineTime centralise les contrôles de confidentialité de votre organisation : autorisations, demandes d'accès, export, rectification et effacement.</p></div>
            <div className="privacy-badge"><strong>RGPD</strong><span>Centre de contrôle</span></div>
          </header>

          {message && <div className="glass-card privacy-message">{message}</div>}

          <section className="privacy-section">
            <div className="section-title"><div><p className="eyebrow">VOS DROITS</p><h2>Faire une demande</h2></div><span>Chaque demande est horodatée et suivie.</span></div>
            <div className="privacy-grid">
              {requestTypes.map(([type, title, description]) => (
                <article className="glass-card privacy-card" key={type}>
                  <span className="privacy-number">{type.toUpperCase()}</span><h3>{title}</h3><p>{description}</p>
                  <button className="secondary-button" disabled={!!busy} onClick={() => submitRequest(type)}>{busy === type ? "Enregistrement…" : "Faire la demande"}</button>
                </article>
              ))}
            </div>
          </section>

          <section className="privacy-section">
            <div className="section-title"><div><p className="eyebrow">AUTORISATIONS</p><h2>Contrôler les traitements</h2></div><span>Les changements sont enregistrés dans l'audit.</span></div>
            <div className="consent-list">
              {consentTypes.map(([type, title, description]) => {
                const active = consents.some(c => c.consent_type === type && !c.revoked_at);
                return <article className="glass-card consent-row" key={type}><div><h3>{title}</h3><p>{description}</p><small>{active ? "Autorisation active" : "Autorisation non active"}</small></div><button className={active ? "consent-on" : "secondary-button"} disabled={!!busy} onClick={() => toggleConsent(type)}>{busy === `consent:${type}` ? "…" : active ? "Révoquer" : "Autoriser"}</button></article>;
              })}
            </div>
          </section>

          <section className="privacy-section">
            <div className="section-title"><div><p className="eyebrow">HISTORIQUE</p><h2>Demandes récentes</h2></div></div>
            <div className="glass-card request-history">
              {requests.length === 0 ? <p>Aucune demande de confidentialité pour le moment.</p> : requests.map(r => <div className="request-row" key={r.id}><div><strong>{r.request_type}</strong><span>Demandée le {new Date(r.requested_at).toLocaleDateString("fr-FR")}</span></div><div><span className={`request-status ${r.status}`}>{r.status}</span><small>Échéance {new Date(r.due_at).toLocaleDateString("fr-FR")}</small></div></div>)}
            </div>
          </section>

          <div className="privacy-note"><strong>Important</strong><span>WineTime conserve uniquement les données nécessaires à ses services et applique une politique de rétention. Certaines demandes peuvent être soumises à des obligations légales de conservation.</span></div>
        </div>
      </section>
      <style jsx global>{`
        .privacy-page{max-width:1280px;padding-top:52px;padding-bottom:80px}.privacy-hero{display:grid;grid-template-columns:minmax(0,1.5fr) 300px;gap:40px;align-items:end;margin-bottom:42px}.privacy-hero h1{margin:0;font-size:44px;line-height:1.04;letter-spacing:-.055em;font-weight:600}.privacy-hero p:not(.eyebrow){max-width:760px;color:#777;font-size:14px;line-height:1.7}.privacy-badge{padding:24px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.72);box-shadow:var(--shadow)}.privacy-badge strong{display:block;font-size:26px;letter-spacing:-.04em}.privacy-badge span{display:block;margin-top:5px;color:#888;font-size:11px}.privacy-message{padding:16px;margin-bottom:28px}.privacy-section{margin-top:40px}.section-title{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:16px}.section-title h2{margin:0;font-size:21px;letter-spacing:-.035em}.section-title>span{font-size:10px;color:#aaa}.privacy-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.privacy-card{min-height:220px;padding:22px;display:flex;flex-direction:column}.privacy-number{font-size:8px;letter-spacing:.13em;color:#aaa;font-weight:700}.privacy-card h3{margin:24px 0 7px;font-size:16px}.privacy-card p{margin:0;color:#888;font-size:11px;line-height:1.65}.privacy-card .secondary-button{margin-top:auto;width:100%}.consent-list{display:grid;gap:12px}.consent-row{padding:20px;display:flex;align-items:center;justify-content:space-between;gap:24px}.consent-row h3{margin:0;font-size:15px}.consent-row p{margin:6px 0;color:#888;font-size:11px;line-height:1.5}.consent-row small{color:#aaa;font-size:9px}.consent-on{border:1px solid #222;background:#222;color:#fff;border-radius:10px;padding:10px 14px;font-size:10px;cursor:pointer}.request-history{padding:0 20px}.request-history>p{padding:20px;color:#888;font-size:12px}.request-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:17px 0;border-bottom:1px solid rgba(0,0,0,.07)}.request-row:last-child{border-bottom:0}.request-row div{display:flex;align-items:center;gap:12px}.request-row strong{font-size:11px}.request-row span,.request-row small{color:#999;font-size:9px}.request-status{padding:5px 8px;border-radius:7px;background:#f1f1ef;color:#777!important;font-weight:700}.request-status.completed{background:#e9f4ec;color:#28703c!important}.request-status.rejected{background:#f7eaea;color:#8b3333!important}.privacy-note{display:flex;gap:10px;margin-top:28px;padding:16px 18px;border:1px solid var(--line);border-radius:14px;color:#888;font-size:10px;line-height:1.6}.privacy-note strong{color:#222}.privacy-note span{flex:1}@media(max-width:900px){.privacy-hero,.privacy-grid{grid-template-columns:1fr}.privacy-badge{display:none}.consent-row,.section-title,.request-row{align-items:flex-start;flex-direction:column}.request-row div{flex-wrap:wrap}.privacy-hero h1{font-size:34px}}
      `}</style>
    </main>
  );
}
