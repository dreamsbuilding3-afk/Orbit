"use client";

import Link from "next/link";

export default function RewardsPage() {
  return (
    <main className="rewards-page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="rewards-topbar">
        <Link href="/" className="back">← Retour à WineTime</Link>
        <span className="top-label">WINE TIME REWARDS</span>
      </header>

      <section className="rewards-wrap">
        <div className="intro">
          <p className="eyebrow">VOTRE FIDÉLITÉ DEVIENT UN AVANTAGE</p>
          <h1>Plus vous développez votre activité avec WineTime, plus vous débloquez.</h1>
          <p>Un programme pensé autour de votre utilisation réelle : durée, prospects générés et actions exécutées.</p>
        </div>

        <div className="elite-grid">
          <div className="card-scene" aria-label="Carte WineTime Elite">
            <div className="elite-card">
              <div className="card-shine" />
              <div className="card-top"><div className="chip"><i /><i /><i /></div><span className="contactless">)))</span></div>
              <div className="card-logo"><span>W</span> WineTime</div>
              <div className="card-title">ELITE</div>
              <div className="card-number">WINE · 08 100 248</div>
              <div className="card-bottom">
                <div><small>MEMBER SINCE</small><strong>2026</strong></div>
                <div><small>STATUS</small><strong>ACTIVE</strong></div>
                <div className="card-mark">W</div>
              </div>
            </div>
          </div>

          <div className="progress-panel">
            <div className="panel-top"><div><p className="eyebrow">PROGRESSION ELITE</p><h2>Encore 18 prospects.</h2></div><strong>82%</strong></div>
            <div className="progress-track"><span /></div>
            <div className="stats"><div><span>Mois actifs</span><strong>7 / 8</strong></div><div><span>Prospects générés</span><strong>82 / 100</strong></div><div><span>Actions exécutées</span><strong>248</strong></div></div>
            <div className="unlock"><span className="lock">✦</span><div><strong>Récompense Elite</strong><p>30 jours Pro+ · avantages premium · carte Elite</p></div><span className="chevron">→</span></div>
          </div>
        </div>

        <section className="rewards-list">
          <div className="list-head"><div><p className="eyebrow">CE QUE VOUS DÉBLOQUEZ</p><h2>Des avantages utiles, pas des points inutiles.</h2></div><span className="pill">4 niveaux</span></div>
          <div className="reward-levels">
            <div className="reward-level done"><span className="level">01</span><div><strong>Active</strong><p>Première connexion et activité régulière.</p></div><b>Débloqué</b></div>
            <div className="reward-level done"><span className="level">02</span><div><strong>Growth</strong><p>Premiers prospects et automatisations actives.</p></div><b>Débloqué</b></div>
            <div className="reward-level current"><span className="level">03</span><div><strong>Pro</strong><p>100 prospects + activité commerciale soutenue.</p></div><b>En cours</b></div>
            <div className="reward-level locked"><span className="level">04</span><div><strong>Elite</strong><p>8 mois actifs · récompenses premium · statut Elite.</p></div><b>À débloquer</b></div>
          </div>
        </section>

        <div className="benefits"><div><span>PRO+</span><strong>30 jours</strong><p>Accès temporaire aux fonctions premium.</p></div><div><span>SERVICE</span><strong>1 session</strong><p>Optimisation commerciale et automatisations.</p></div><div><span>ELITE</span><strong>Carte active</strong><p>Votre statut premium visible dans WineTime.</p></div></div>
      </section>

      <style jsx>{`
        .rewards-page{min-height:100vh;background:linear-gradient(135deg,#f5f8ff 0%,#fff 44%,#e9f1ff 100%);color:#101a2c;position:relative;overflow:hidden;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
        .ambient{position:absolute;border-radius:50%;filter:blur(75px);pointer-events:none}.ambient-a{width:460px;height:460px;background:rgba(66,110,255,.13);top:70px;right:2%}.ambient-b{width:320px;height:320px;background:rgba(39,83,201,.10);bottom:4%;left:7%}
        .rewards-topbar{height:70px;padding:0 42px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(30,55,110,.09);background:rgba(255,255,255,.62);backdrop-filter:blur(22px);position:relative;z-index:2}.back{font-size:11px;color:#687694;text-decoration:none}.top-label{font-size:9px;letter-spacing:.16em;font-weight:700;color:#7f8aa2}
        .rewards-wrap{max-width:1180px;margin:0 auto;padding:54px 42px 80px;position:relative;z-index:1}.intro{max-width:720px}.eyebrow{margin:0 0 9px;color:#8190ad;font-size:9px;letter-spacing:.14em;font-weight:700}.intro h1{margin:0;font-size:38px;line-height:1.08;letter-spacing:-.045em;font-weight:650;max-width:720px}.intro>p:last-child{margin:14px 0 0;color:#74819a;font-size:13px;line-height:1.6;max-width:650px}
        .elite-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);gap:48px;align-items:center;margin-top:54px}.card-scene{perspective:1400px;min-height:310px;display:grid;place-items:center}.elite-card{width:min(520px,100%);aspect-ratio:1.586;position:relative;transform:rotateX(10deg) rotateY(-12deg) rotateZ(-2deg);transform-style:preserve-3d;border-radius:28px;padding:30px 32px;background:linear-gradient(135deg,#03256f 0%,#0b3ea8 24%,#155bd0 46%,#3f8cf0 66%,#a9d7ff 100%);box-shadow:30px 38px 65px rgba(14,54,132,.33),inset 0 1px 0 rgba(255,255,255,.72),inset 0 -2px 0 rgba(0,24,88,.22),0 0 0 1px rgba(255,255,255,.18);overflow:hidden;animation:floatCard 7s ease-in-out infinite}.elite-card:after{content:"";position:absolute;inset:1px;border-radius:27px;background:linear-gradient(125deg,rgba(255,255,255,.16),transparent 25%,transparent 68%,rgba(255,255,255,.18));pointer-events:none}.elite-card:before{content:"";position:absolute;inset:-45%;background:linear-gradient(118deg,transparent 38%,rgba(255,255,255,.5) 49%,transparent 60%);transform:translateX(-75%) rotate(7deg);animation:shine 6.5s linear infinite}.card-shine{position:absolute;inset:0;background:radial-gradient(circle at 83% 18%,rgba(255,255,255,.42),transparent 21%),radial-gradient(circle at 14% 100%,rgba(177,225,255,.24),transparent 28%),radial-gradient(circle at 55% 0%,rgba(109,166,255,.18),transparent 40%);mix-blend-mode:screen}.card-top,.card-bottom,.card-logo,.card-title,.card-number{position:relative;z-index:2}.card-top{display:flex;justify-content:space-between;align-items:center}.chip{width:50px;height:38px;border-radius:9px;background:linear-gradient(135deg,#d9efff,#80aee8 60%,#5d88d2);box-shadow:inset 0 1px 2px rgba(255,255,255,.85),0 5px 12px rgba(0,0,0,.14);display:grid;grid-template-columns:1fr 1fr;overflow:hidden;border:1px solid rgba(255,255,255,.5)}.chip i{border:1px solid rgba(8,52,120,.25)}.contactless{font-size:22px;letter-spacing:-6px;transform:rotate(90deg);opacity:.84}.card-logo{position:absolute;top:108px;left:32px;color:#fff;font-size:15px;font-weight:600;letter-spacing:-.03em}.card-logo span{display:inline-grid;place-items:center;width:28px;height:28px;margin-right:8px;border-radius:9px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.34);font-size:13px}.card-title{position:absolute;top:107px;right:32px;color:#e8f3ff;font-size:18px;letter-spacing:.18em;font-weight:650}.card-number{position:absolute;left:32px;right:32px;bottom:88px;color:rgba(255,255,255,.96);font-size:20px;letter-spacing:.13em;font-weight:500;text-shadow:0 2px 8px rgba(0,26,95,.2)}.card-bottom{position:absolute;left:32px;right:32px;bottom:28px;display:flex;gap:32px;align-items:flex-end}.card-bottom small{display:block;color:rgba(235,247,255,.7);font-size:7px;letter-spacing:.15em}.card-bottom strong{display:block;margin-top:3px;color:#fff;font-size:9px;letter-spacing:.08em}.card-mark{margin-left:auto;font-size:32px;color:#fff;font-weight:300;opacity:.82;text-shadow:0 4px 15px rgba(0,32,120,.24)}
        .progress-panel{border:1px solid rgba(40,90,155,.11);border-radius:24px;background:rgba(255,255,255,.7);backdrop-filter:blur(24px);box-shadow:0 25px 70px rgba(26,71,143,.09);padding:28px}.panel-top{display:flex;align-items:flex-end;justify-content:space-between}.panel-top h2{margin:0;font-size:25px;letter-spacing:-.035em}.panel-top>strong{font-size:30px;letter-spacing:-.05em;color:#1647a9}.progress-track{height:11px;border-radius:999px;background:#e5eefb;overflow:hidden;margin:23px 0}.progress-track span{display:block;width:82%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#0b2f86,#1753c4,#4d90ed,#bde5ff);box-shadow:0 2px 14px rgba(24,78,189,.3)}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.stats div{padding:13px;border-radius:14px;background:rgba(246,250,255,.84);border:1px solid rgba(40,90,155,.08)}.stats span{display:block;color:#8190a7;font-size:8px}.stats strong{display:block;margin-top:7px;font-size:17px;letter-spacing:-.03em}.unlock{margin-top:14px;display:flex;align-items:center;gap:12px;padding:14px;border-radius:15px;background:linear-gradient(120deg,#f1f6ff,#fff);border:1px solid rgba(42,96,176,.11)}.lock{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#e5efff;color:#235ab1}.unlock strong{font-size:11px}.unlock p{margin:3px 0 0;font-size:9px;color:#8290a5}.chevron{margin-left:auto;color:#6b83a9;font-size:18px}
        .rewards-list{margin-top:54px;padding:28px;border-radius:24px;border:1px solid rgba(0,0,0,.07);background:rgba(255,255,255,.66);backdrop-filter:blur(20px)}.list-head{display:flex;align-items:flex-end;justify-content:space-between}.list-head h2{margin:0;font-size:22px;letter-spacing:-.03em}.pill{padding:7px 10px;border-radius:999px;background:#eaf2ff;color:#285da8;font-size:9px;font-weight:700}.reward-levels{margin-top:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.reward-level{min-height:140px;padding:17px;border-radius:16px;border:1px solid #e0e8f4;background:rgba(255,255,255,.68);display:flex;flex-direction:column}.reward-level.current{border-color:#7aa7eb;box-shadow:0 10px 30px rgba(31,87,177,.11)}.reward-level.locked{opacity:.64}.level{font-size:9px;color:#8390a6;letter-spacing:.1em}.reward-level strong{margin-top:auto;font-size:13px}.reward-level p{margin:5px 0 0;font-size:9px;color:#8794a7;line-height:1.45}.reward-level b{margin-top:14px;font-size:8px;color:#416da8}.benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.benefits>div{padding:20px 22px;border-radius:17px;background:#fff;border:1px solid rgba(0,0,0,.065);box-shadow:0 14px 35px rgba(0,0,0,.035)}.benefits span{display:block;font-size:8px;letter-spacing:.14em;color:#7c8ba3}.benefits strong{display:block;margin-top:8px;font-size:16px}.benefits p{margin:5px 0 0;color:#8994a8;font-size:9px;line-height:1.5}
        @keyframes floatCard{0%,100%{transform:rotateX(10deg) rotateY(-12deg) rotateZ(-2deg) translateY(0)}50%{transform:rotateX(13deg) rotateY(-16deg) rotateZ(-2deg) translateY(-10px)}}@keyframes shine{from{transform:translateX(-70%) rotate(7deg)}to{transform:translateX(70%) rotate(7deg)}}
        @media(max-width:900px){.rewards-wrap{padding:40px 22px 60px}.rewards-topbar{padding:0 22px}.elite-grid{grid-template-columns:1fr;gap:25px}.card-scene{min-height:260px}.intro h1{font-size:31px}.reward-levels{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.rewards-topbar{height:62px}.top-label{display:none}.elite-card{padding:21px;border-radius:21px}.card-logo{top:82px;left:21px}.card-title{top:82px;right:21px;font-size:13px}.card-number{left:21px;right:21px;bottom:70px;font-size:14px}.card-bottom{left:21px;right:21px;bottom:18px;gap:14px}.card-mark{font-size:24px}.stats,.reward-levels,.benefits{grid-template-columns:1fr}.rewards-list,.progress-panel{padding:20px}.list-head{align-items:flex-start;gap:10px;flex-direction:column}}
      `}</style>
    </main>
  );
}
