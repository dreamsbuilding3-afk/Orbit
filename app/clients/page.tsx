"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase-browser";

type ClientStatus = "prospect" | "client" | "at_risk" | "inactive";

type Client = {
  id: string;
  organization_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  estimated_value: number | null;
  source: string | null;
  last_contact_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  prospect: "Prospect",
  client: "Client",
  at_risk: "À relancer",
  inactive: "Inactif",
};

function formatValue(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ClientStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", estimated_value: "", status: "prospect" as ClientStatus });

  const loadClients = useCallback(async () => {
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
        setClients([]);
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
        setClients([]);
        return;
      }

      const { data, error: clientError } = await supabase
        .from("clients")
        .select("id, organization_id, name, company, email, phone, status, estimated_value, source, last_contact_at, notes, created_at, updated_at")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });

      if (clientError) throw clientError;
      setClients((data ?? []) as Client[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les clients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesStatus = status === "all" || client.status === status;
      const matchesQuery = !normalized || [client.name, client.company, client.email, client.phone].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [clients, query, status]);

  const summary = useMemo(() => ({
    total: clients.length,
    prospects: clients.filter((client) => client.status === "prospect").length,
    active: clients.filter((client) => client.status === "client").length,
    atRisk: clients.filter((client) => client.status === "at_risk").length,
    pipeline: clients.reduce((total, client) => total + Number(client.estimated_value ?? 0), 0),
  }), [clients]);

  async function createClient() {
    if (!supabase || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("Session utilisateur introuvable.");

      const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1);
      if (membershipError) throw membershipError;
      const organizationId = memberships?.[0]?.organization_id;
      if (!organizationId) throw new Error("Aucune organisation active trouvée.");

      const { error: insertError } = await supabase.from("clients").insert({
        organization_id: organizationId,
        created_by: user.id,
        name: form.name.trim(),
        company: form.company.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        status: form.status,
      });
      if (insertError) throw insertError;

      setForm({ name: "", company: "", email: "", phone: "", estimated_value: "", status: "prospect" });
      setShowCreate(false);
      await loadClients();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Impossible de créer le client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="content" style={{ width: "100%" }}>
        <header className="topbar">
          <div className="breadcrumbs"><a href="/">Workspace</a><b>/</b><strong>Clients</strong></div>
          <span className="topbar-muted">CRM</span>
        </header>

        <div className="page clients-page">
          <div className="hero-row">
            <div>
              <p className="eyebrow">CLIENTS · CRM</p>
              <h1>Le portefeuille client, au même endroit.</h1>
              <p className="hero-copy">Centralisez prospects, clients et relances. ARK pourra ensuite s'appuyer sur ces fiches pour mieux qualifier les opportunités.</p>
            </div>
            <div className="hero-actions">
              <button className="refresh-button" onClick={() => void loadClients()} disabled={refreshing}>{refreshing ? "Actualisation…" : "Actualiser"}</button>
              <button className="primary-button" onClick={() => setShowCreate(true)}>+ Ajouter un client</button>
            </div>
          </div>

          <section className="summary-grid">
            <div className="summary-card"><span>PORTEFEUILLE</span><strong>{summary.total}</strong><p>Contacts enregistrés.</p></div>
            <div className="summary-card"><span>PROSPECTS</span><strong>{summary.prospects}</strong><p>Opportunités commerciales.</p></div>
            <div className="summary-card"><span>CLIENTS</span><strong>{summary.active}</strong><p>Relations actuellement actives.</p></div>
            <div className="summary-card"><span>VALEUR ESTIMÉE</span><strong>{formatValue(summary.pipeline)}</strong><p>Pipeline saisi dans les fiches.</p></div>
          </section>

          <section className="glass-card clients-panel">
            <div className="toolbar">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom, une entreprise, un email…" aria-label="Rechercher" />
              <select value={status} onChange={(event) => setStatus(event.target.value as "all" | ClientStatus)} aria-label="Filtrer par statut">
                <option value="all">Tous les statuts</option>
                <option value="prospect">Prospects</option>
                <option value="client">Clients</option>
                <option value="at_risk">À relancer</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            {error ? (
              <div className="empty-state error-state"><strong>Le CRM est temporairement indisponible.</strong><span>{error}</span><button onClick={() => void loadClients()}>Réessayer</button></div>
            ) : loading ? (
              <div className="empty-state"><strong>Chargement du portefeuille…</strong><span>WineTime récupère les fiches clients de votre organisation.</span></div>
            ) : filteredClients.length === 0 ? (
              <div className="empty-state"><strong>{clients.length === 0 ? "Aucun client pour le moment." : "Aucun résultat."}</strong><span>{clients.length === 0 ? "Ajoutez votre premier prospect ou client pour commencer à construire le CRM WineTime." : "Modifiez la recherche ou le filtre pour retrouver une fiche."}</span>{clients.length === 0 && <button className="primary-button" onClick={() => setShowCreate(true)}>Ajouter le premier client</button>}</div>
            ) : (
              <div className="client-list">
                {filteredClients.map((client) => (
                  <article key={client.id} className="client-row">
                    <div className="avatar">{client.name.trim().slice(0, 1).toUpperCase()}</div>
                    <div className="client-main"><strong>{client.name}</strong><span>{client.company || client.email || "Contact sans entreprise"}</span></div>
                    <div className="client-contact"><strong>{client.email || "—"}</strong><span>{client.phone || "Téléphone non renseigné"}</span></div>
                    <div className="client-value"><strong>{formatValue(client.estimated_value)}</strong><span>Dernier contact · {formatDate(client.last_contact_at)}</span></div>
                    <span className={`status-badge status-${client.status}`}>{STATUS_LABELS[client.status]}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {showCreate && (
          <div className="modal-backdrop" onMouseDown={() => !saving && setShowCreate(false)}>
            <section className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
              <div className="modal-head"><div><p className="eyebrow">NOUVELLE FICHE</p><h2>Ajouter un client</h2></div><button className="close-button" onClick={() => setShowCreate(false)} disabled={saving}>×</button></div>
              <div className="form-grid">
                <label>Nom<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex. Marie Dupont" autoFocus /></label>
                <label>Entreprise<input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Ex. Atelier Martin" /></label>
                <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="marie@entreprise.fr" /></label>
                <label>Téléphone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+596 …" /></label>
                <label>Valeur estimée<input type="number" min="0" step="1" value={form.estimated_value} onChange={(event) => setForm({ ...form, estimated_value: event.target.value })} placeholder="5000" /></label>
                <label>Statut<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}><option value="prospect">Prospect</option><option value="client">Client</option><option value="at_risk">À relancer</option><option value="inactive">Inactif</option></select></label>
              </div>
              <div className="modal-footer"><button className="secondary-button" onClick={() => setShowCreate(false)} disabled={saving}>Annuler</button><button className="primary-button" onClick={() => void createClient()} disabled={saving || !form.name.trim()}>{saving ? "Création…" : "Créer la fiche"}</button></div>
            </section>
          </div>
        )}

        <style jsx>{`
          .clients-page{max-width:1280px;padding-top:52px;padding-bottom:100px}.hero-row{align-items:flex-end}.hero-actions{display:flex;gap:10px;align-items:center}.refresh-button,.secondary-button{border:1px solid rgba(20,20,20,.12);background:rgba(255,255,255,.78);border-radius:12px;padding:11px 15px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(20,20,20,.04)}.primary-button{border:1px solid rgba(35,93,255,.2);background:linear-gradient(135deg,#111,#353535);color:#fff;border-radius:12px;padding:11px 16px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 10px 24px rgba(20,20,20,.1)}.primary-button:disabled,.refresh-button:disabled,.secondary-button:disabled{opacity:.55;cursor:default}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:30px 0 18px}.summary-card{border:1px solid rgba(20,20,20,.09);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(247,247,247,.72));padding:20px 22px;box-shadow:0 12px 32px rgba(20,20,20,.04)}.summary-card span{font-size:9px;letter-spacing:.14em;color:#999}.summary-card strong{display:block;font-size:28px;margin-top:8px}.summary-card p{margin:5px 0 0;color:#777;font-size:11px}.clients-panel{overflow:hidden}.toolbar{display:flex;gap:10px;padding:18px;border-bottom:1px solid rgba(20,20,20,.07)}.toolbar input,.toolbar select,.form-grid input,.form-grid select{width:100%;border:1px solid rgba(20,20,20,.1);border-radius:11px;background:rgba(255,255,255,.9);padding:11px 12px;font:inherit;font-size:12px;outline:none}.toolbar input{max-width:620px}.toolbar select{max-width:190px}.client-list{padding:0 16px 16px}.client-row{display:grid;grid-template-columns:38px minmax(180px,1.4fr) minmax(170px,1fr) minmax(140px,.8fr) auto;gap:14px;align-items:center;padding:17px 10px;border-top:1px solid rgba(20,20,20,.07)}.avatar{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:#f3f3f3;font-size:12px;font-weight:700}.client-main,.client-contact,.client-value{min-width:0}.client-main strong,.client-contact strong,.client-value strong{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.client-main span,.client-contact span,.client-value span{display:block;color:#888;font-size:10px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status-badge{justify-self:end;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:700;background:#f5f5f5;color:#666}.status-client{background:#edf7f1;color:#24704a}.status-at_risk{background:#fff7e9;color:#8a5b00}.status-inactive{background:#f1f1f1;color:#888}.status-prospect{background:#eef3ff;color:#3656a8}.empty-state{min-height:300px;padding:70px 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:9px}.empty-state strong{font-size:18px}.empty-state span{max-width:560px;color:#777;font-size:12px;line-height:1.6}.empty-state button{margin-top:8px}.error-state strong{color:#8a2222}.modal-backdrop{position:fixed;inset:0;z-index:80;background:rgba(18,18,18,.22);backdrop-filter:blur(10px);display:grid;place-items:center;padding:20px}.modal-card{width:min(680px,100%);background:rgba(255,255,255,.96);border:1px solid rgba(20,20,20,.12);border-radius:24px;box-shadow:0 30px 80px rgba(20,20,20,.18);padding:24px}.modal-head{display:flex;justify-content:space-between;align-items:flex-start}.modal-head h2{margin:6px 0 0;font-size:24px}.close-button{width:34px;height:34px;border:0;border-radius:50%;background:#f3f3f3;font-size:22px;cursor:pointer}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:24px}.form-grid label{display:flex;flex-direction:column;gap:7px;font-size:10px;font-weight:700;color:#666}.modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:24px;padding-top:18px;border-top:1px solid rgba(20,20,20,.07)}@media(max-width:980px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.client-row{grid-template-columns:38px minmax(0,1fr) auto}.client-contact,.client-value{display:none}}@media(max-width:680px){.clients-page{padding:32px 20px 100px}.hero-actions{width:100%;justify-content:flex-start;flex-wrap:wrap}.summary-grid{grid-template-columns:1fr 1fr}.toolbar{flex-direction:column}.toolbar input,.toolbar select{max-width:none}.client-row{grid-template-columns:36px minmax(0,1fr) auto}.status-badge{font-size:8px}.form-grid{grid-template-columns:1fr}.modal-card{padding:20px}.modal-head h2{font-size:21px}}
        `}</style>
      </section>
    </main>
  );
}
