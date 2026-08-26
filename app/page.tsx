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

const activity = [
  { title: "Payment received", detail: "Martin Construction · Stripe", time: "2 min ago" },
  { title: "New client detected", detail: "Sophie Martin · Website", time: "8 min ago" },
  { title: "Booking confirmed", detail: "Atelier Dupont · Calendar", time: "16 min ago" },
  { title: "Follow-up scheduled", detail: "Lucas Bernard · CRM", time: "31 min ago" },
];

function HeroMotion() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-glow" />
      <div className="hero-orbit hero-orbit-a" />
      <div className="hero-orbit hero-orbit-b" />
      <div className="hero-orbit hero-orbit-c" />
      <span className="hero-sphere hero-sphere-a" />
      <span className="hero-sphere hero-sphere-b" />
      <span className="hero-sphere hero-sphere-c" />
      <div className="hero-core"><span>W</span></div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><span /></span><span>WineTime</span></div>
        <div className="workspace"><span className="workspace-avatar">D</span><span>Dreams Building</span><span className="chevron">⌄</span></div>
        <nav className="nav">
          <p className="nav-label">WineTime</p>
          <Link className="nav-item active" href="/"><Icon name="grid"/><span>Accueil</span></Link>
          <Link className="nav-item" href="/ark"><Icon name="spark"/><span>Intelligence ARK</span></Link>
          <p className="nav-label second">PILOTER</p>
          <Link className="nav-item" href="/workflows"><Icon name="flow"/><span>Automatisations</span></Link>
          <Link className="nav-item" href="/integrations"><Icon name="plug"/><span>Connexions</span></Link>
          <Link className="nav-item" href="#"><Icon name="users"/><span>Clients</span></Link>
          <Link className="nav-item" href="/activity"><Icon name="activity"/><span>Activité</span></Link>
          <p className="nav-label second">SYSTÈME</p>
          <Link className="nav-item" href="#"><Icon name="settings"/><span>Réglages</span></Link>
        </nav>
        <div className="sidebar-bottom"><div className="status-card"><span className="status-dot"/><div><strong>WineTime opérationnel</strong><small>Intelligence et exécution en ligne</small></div></div><div className="profile"><span className="profile-avatar">DB</span><div><strong>Dreams Building</strong><small>Espace Pro</small></div><span className="more">•••</span></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="breadcrumbs"><span>WineTime</span><b>/</b><strong>Accueil</strong></div><div className="top-actions"><span className="top-avatar">DB</span></div></header>
        <div className="page">
          <div className="hero-row">
            <div className="hero-copy-block"><p className="eyebrow">VOTRE ENTREPRISE, ENFIN PILOTÉE SIMPLEMENT</p><h1>WineTime comprend<br/>ce qui se passe et agit.</h1><p className="hero-copy">Connectez vos outils. WineTime détecte les événements importants, vous propose les bonnes actions et exécute le travail à votre place.</p></div>
            <HeroMotion />
            <div className="hero-actions"><Link className="primary-button" href="/integrations"><Icon name="plug" size={16}/> Commencer par connecter mes outils</Link><Link className="secondary-hero-button" href="/ark">Découvrir ARK <Icon name="arrow" size={15}/></Link></div>
          </div>

          <section className="start-card">
            <div className="start-intro"><p className="eyebrow">VOTRE PREMIÈRE MISE EN ROUTE</p><h2>En 3 étapes, WineTime devient votre copilote.</h2><p>Pas besoin de tout comprendre maintenant. Suivez simplement ce parcours et WineTime vous guidera.</p></div>
            <div className="start-steps">
              <Link href="/integrations" className="start-step"><span className="step-number">01</span><div><strong>Connectez vos outils</strong><p>Gmail, Calendar, Stripe, CRM et les outils que votre entreprise utilise déjà.</p></div><Icon name="arrow" size={16}/></Link>
              <Link href="/workflows" className="start-step"><span className="step-number">02</span><div><strong>Choisissez ce que vous voulez automatiser</strong><p>Décrivez une tâche métier et transformez-la en automatisation claire.</p></div><Icon name="arrow" size={16}/></Link>
              <Link href="/ark" className="start-step"><span className="step-number">03</span><div><strong>Laissez WineTime détecter et agir</strong><p>ARK repère les opportunités, vous gardez le contrôle et WineTime exécute les actions approuvées.</p></div><Icon name="arrow" size={16}/></Link>
            </div>
          </section>

          <div className="intel-strip"><div><p className="eyebrow">ARK DAILY BRIEF</p><h2>Vous n'avez pas besoin de surveiller votre entreprise en permanence.</h2><p>ARK observe les signaux de vos outils et vous remonte ce qui mérite votre attention. Vous décidez. WineTime exécute.</p></div><Link href="/ark" className="outline-button">Voir ce qu'ARK a détecté <Icon name="arrow" size={15}/></Link></div>

          <div className="metrics">
            <div className="metric-card"><span>Automatisations actives</span><strong>12</strong><small>Workflows WineTime</small></div>
            <div className="metric-card"><span>Actions réalisées</span><strong>248</strong><small>Exécutions enregistrées</small></div>
            <div className="metric-card"><span>Intelligence</span><strong>LIVE</strong><small>ARK surveille les signaux</small></div>
            <div className="metric-card"><span>Décisions en attente</span><strong>0</strong><small>Rien à valider</small></div>
          </div>

          <div className="section-heading"><div><p className="eyebrow">CE QUI SE PASSE MAINTENANT</p><h2>WineTime travaille en arrière-plan.</h2></div><Link className="text-button" href="/activity">Voir toute l'activité <Icon name="arrow" size={15}/></Link></div>
          <div className="main-grid">
            <div className="activity-card glass-card"><div className="card-head"><div><h3>Exécution en direct</h3><p>Chaque action est visible et traçable.</p></div><span className="live-pill"><i/> En direct</span></div><div className="activity-list">{activity.map((item, i) => <div className="activity-item" key={item.title}><div className="activity-icon"><Icon name={i === 0 ? "check" : "flow"} size={16}/></div><div className="activity-text"><strong>{item.title}</strong><span>{item.detail}</span></div><div className="activity-meta"><span>{item.time}</span><b>Terminé</b></div></div>)}</div></div>
            <div className="orbit-card glass-card"><div className="card-head"><div><h3>De l'intelligence à l'action</h3><p>ARK → WineTime</p></div><Link className="circle-button" href="/workflows"><Icon name="arrow" size={16}/></Link></div><div className="workflow"><div className="workflow-node"><span className="node-icon">01</span><div><strong>ARK détecte</strong><small>Un signal important</small></div><span className="node-check"><Icon name="check" size={12}/></span></div><div className="connector"/><div className="workflow-node"><span className="node-icon">02</span><div><strong>Vous décidez</strong><small>Vous gardez le contrôle</small></div><span className="node-check"><Icon name="check" size={12}/></span></div><div className="connector"/><div className="workflow-node current"><span className="node-icon">03</span><div><strong>WineTime exécute</strong><small>Dans vos outils connectés</small></div><span className="node-pulse"/></div></div><Link href="/workflows" className="workflow-button">Voir mes automatisations <Icon name="arrow" size={15}/></Link></div>
          </div>

          <div className="bottom-grid"><Link href="/ark" className="value-banner"><div className="value-orbit"><span/></div><div><p className="eyebrow">LA PROMESSE WINE TIME</p><h3>Moins de surveillance. Plus d'action.</h3><p>WineTime comprend les signaux de votre entreprise, vous aide à décider quoi faire et s'occupe de l'exécution.</p></div><Icon name="arrow" size={17}/></Link><Link href="/integrations" className="ask-card"><div className="ask-icon"><Icon name="plug" size={18}/></div><div><strong>Prêt à commencer ?</strong><p>Connectez votre premier outil et faites votre première automatisation.</p></div><Icon name="arrow" size={17}/></Link></div>
        </div>
      </section>
      <style jsx>{`.hero-row{position:relative}.hero-actions{display:flex;flex-direction:column;align-items:flex-start;gap:10px;position:relative;z-index:5}.secondary-hero-button{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;color:#555;text-decoration:none;font-size:12px}.hero-copy-block{position:relative;z-index:4;max-width:650px}.hero-visual{position:absolute;right:42px;top:-8px;width:370px;height:290px;display:grid;place-items:center;isolation:isolate;overflow:visible;pointer-events:none;z-index:1;filter:drop-shadow(0 20px 34px rgba(0,0,0,.035))}.hero-glow{position:absolute;width:230px;height:230px;border-radius:50%;background:radial-gradient(circle,rgba(245,245,243,.98) 0%,rgba(218,218,215,.62) 34%,rgba(255,255,255,0) 72%);filter:blur(5px);animation:heroBreath 7s ease-in-out infinite}.hero-orbit{position:absolute;width:292px;height:132px;border:1.5px solid rgba(70,70,68,.28);border-radius:50%;box-shadow:inset 0 0 22px rgba(255,255,255,.95),0 12px 35px rgba(0,0,0,.055);transform-style:preserve-3d;opacity:.95}.hero-orbit-a{transform:rotateX(68deg) rotateZ(12deg);animation:heroOrbitA 12s linear infinite}.hero-orbit-b{width:250px;height:112px;transform:rotateX(68deg) rotateY(58deg) rotateZ(-20deg);animation:heroOrbitB 15s linear infinite reverse}.hero-orbit-c{width:208px;height:92px;border-color:rgba(70,70,68,.22);transform:rotateX(68deg) rotateY(-55deg) rotateZ(28deg);animation:heroOrbitC 10s linear infinite}.hero-core{position:relative;width:118px;height:118px;border-radius:34px;display:grid;place-items:center;background:linear-gradient(145deg,rgba(255,255,255,.99),rgba(220,220,218,.84));border:1.5px solid rgba(0,0,0,.16);box-shadow:inset 0 1px 0 #fff,0 22px 48px rgba(0,0,0,.12),0 0 0 16px rgba(255,255,255,.72);transform-style:preserve-3d;animation:heroCore 6s ease-in-out infinite}.hero-core:before{content:"";position:absolute;inset:10px;border-radius:27px;border:1px solid rgba(255,255,255,.95);box-shadow:inset 0 -12px 22px rgba(0,0,0,.045)}.hero-core span{position:relative;font-size:48px;font-weight:600;letter-spacing:-.12em;color:#20201f;text-shadow:0 1px 0 #fff}.hero-sphere{position:absolute;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff 0 16%,#d2d2d0 52%,#8f8f8c 100%);box-shadow:0 8px 16px rgba(0,0,0,.16),inset 1px 1px 2px #fff}.hero-sphere-a{animation:sphereA 12s linear infinite}.hero-sphere-b{animation:sphereB 15s linear infinite reverse}.hero-sphere-c{animation:sphereC 10s linear infinite}.start-card{margin:8px 0 14px;padding:24px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(135deg,#fff,#f7f7f5);box-shadow:var(--shadow)}.start-intro h2{margin:4px 0 7px;font-size:24px;letter-spacing:-.04em}.start-intro>p:not(.eyebrow){margin:0;color:#7f7f7d;font-size:12px;line-height:1.6;max-width:720px}.start-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px}.start-step{display:flex;align-items:flex-start;gap:12px;min-height:145px;padding:16px;border:1px solid var(--line);border-radius:14px;background:#fff;color:inherit;text-decoration:none;transition:transform .2s,box-shadow .2s}.start-step:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.06)}.step-number{font-size:10px;font-weight:700;letter-spacing:.08em;color:#8c8c89}.start-step div{flex:1}.start-step strong{display:block;font-size:13px;line-height:1.35}.start-step p{margin:7px 0 0;color:#898987;font-size:11px;line-height:1.55}.start-step>svg{flex:none;margin-top:2px;color:#999}.intel-strip{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:14px;padding:22px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(120deg,rgba(255,255,255,.95),rgba(247,247,246,.74));box-shadow:var(--shadow)}.intel-strip h2{margin:0;font-size:20px;letter-spacing:-.04em;max-width:760px}.intel-strip p:not(.eyebrow){margin:6px 0 0;color:#8b8b89;font-size:11px;line-height:1.55;max-width:760px}.intel-strip .outline-button{margin-left:auto;text-decoration:none;color:#333;white-space:nowrap}.circle-button{text-decoration:none}.value-banner{text-decoration:none;color:inherit}.ask-card{text-decoration:none;color:#fff}@keyframes heroBreath{0%,100%{transform:scale(.92);opacity:.72}50%{transform:scale(1.08);opacity:1}}@keyframes heroCore{0%,100%{transform:translateY(3px) rotateX(0deg) rotateY(-5deg)}50%{transform:translateY(-7px) rotateX(5deg) rotateY(8deg)}}@keyframes heroOrbitA{from{transform:rotateX(68deg) rotateZ(12deg)}to{transform:rotateX(68deg) rotateZ(372deg)}}@keyframes heroOrbitB{from{transform:rotateX(68deg) rotateY(58deg) rotateZ(-20deg)}to{transform:rotateX(68deg) rotateY(58deg) rotateZ(-380deg)}}@keyframes heroOrbitC{from{transform:rotateX(68deg) rotateY(-55deg) rotateZ(28deg)}to{transform:rotateX(68deg) rotateY(-55deg) rotateZ(388deg)}}@keyframes sphereA{0%{transform:translate(0,-146px)}25%{transform:translate(146px,0)}50%{transform:translate(0,146px)}75%{transform:translate(-146px,0)}100%{transform:translate(0,-146px)}}@keyframes sphereB{0%{transform:translate(128px,-52px)}25%{transform:translate(52px,102px)}50%{transform:translate(-128px,52px)}75%{transform:translate(-52px,-102px)}100%{transform:translate(128px,-52px)}}@keyframes sphereC{0%{transform:translate(-108px,-22px)}33%{transform:translate(64px,-70px)}66%{transform:translate(92px,72px)}100%{transform:translate(-108px,-22px)}}@media(max-width:1180px){.hero-row{display:block}.hero-visual{position:relative;right:auto;top:auto;width:100%;height:250px;margin:-6px 0 -4px}.hero-actions{flex-direction:row;align-items:center;margin-top:-2px}}@media(max-width:1100px){.start-steps{grid-template-columns:1fr}.start-step{min-height:0}.hero-actions{margin-top:20px}.intel-strip{display:block}.intel-strip .outline-button{display:inline-flex;margin-top:15px;margin-left:0;white-space:normal}}@media(max-width:900px){.hero-row{display:block}.hero-copy-block{max-width:720px}.hero-visual{width:100%;height:235px;margin:12px 0 -4px}.hero-actions{display:flex;flex-direction:column;align-items:flex-start;margin-top:0}.hero-row .primary-button{margin-top:0;display:inline-flex}.start-card{padding:18px}.start-intro h2{font-size:21px}.start-step{padding:15px}.start-step strong{font-size:14px}.start-step p{font-size:12px}.intel-strip{padding:18px}.intel-strip h2{font-size:19px}}@media(prefers-reduced-motion:reduce){.hero-glow,.hero-orbit,.hero-core,.hero-sphere{animation:none}.hero-core{transform:none}}`}</style>
    </main>
  );
}