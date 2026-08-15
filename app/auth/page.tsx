"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!supabase) throw new Error("Supabase n'est pas encore configuré pour cet environnement.");

      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { company_name: company } } });

      if (result.error) throw result.error;

      if (mode === "signup" && result.data.user) {
        const slug = company.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { error } = await supabase.rpc("create_organization", {
          org_name: company.trim(),
          org_slug: slug || `workspace-${result.data.user.id.slice(0, 8)}`,
        });
        if (error) throw error;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("Compte créé. Vérifie ton email pour confirmer ton adresse.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orbit-mark"><span /></div>
      <div className="auth-card">
        <div className="auth-brand">ORBIT</div>
        <p className="eyebrow">BUSINESS AUTOMATION</p>
        <h1>{mode === "signin" ? "Your business, in motion." : "Start your orbit."}</h1>
        <p className="auth-copy">{mode === "signin" ? "Sign in to see what ORBIT is doing for your business." : "Create your workspace and start connecting the work between your tools."}</p>

        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && <label>COMPANY<input required value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" /></label>}
          <label>EMAIL<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label>
          <label>PASSWORD<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
          <button className="auth-submit" disabled={loading}>{loading ? "Connecting…" : mode === "signin" ? "Enter ORBIT →" : "Create workspace →"}</button>
        </form>

        {message && <p className="auth-message">{message}</p>}
        <button className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
          {mode === "signin" ? "New to ORBIT? Create your workspace" : "Already have an account? Sign in"}
        </button>
      </div>
      <p className="auth-footer">Private workspace · Secure by Supabase · Built for real businesses</p>
      <style jsx>{`
        .auth-page{min-height:100vh;display:grid;place-items:center;padding:40px 20px;background:radial-gradient(circle at 50% 18%,#fff 0,#f7f7f6 42%,#ededeb 100%);position:relative;overflow:hidden}
        .auth-page:before{content:"";position:absolute;width:700px;height:700px;border:1px solid rgba(0,0,0,.045);border-radius:50%;top:-420px;left:50%;transform:translateX(-50%);box-shadow:0 0 0 70px rgba(255,255,255,.35),0 0 0 140px rgba(255,255,255,.2)}
        .auth-card{width:min(440px,100%);padding:38px;border:1px solid rgba(0,0,0,.08);border-radius:24px;background:rgba(255,255,255,.82);backdrop-filter:blur(30px);box-shadow:0 35px 100px rgba(0,0,0,.08),inset 0 1px 0 #fff;position:relative;z-index:1}
        .auth-orbit-mark{position:absolute;top:8%;width:34px;height:34px;border:1px solid #d7d7d5;border-radius:50%;opacity:.8}.auth-orbit-mark:before,.auth-orbit-mark:after{content:"";position:absolute;inset:7px;border:1px solid #ddd;border-radius:50%;transform:rotate(55deg)}.auth-orbit-mark:after{transform:rotate(-55deg)}.auth-orbit-mark span{position:absolute;width:6px;height:6px;background:#111;border-radius:50%;top:14px;left:14px}
        .auth-brand{font-size:14px;font-weight:700;letter-spacing:.08em;margin-bottom:34px}.auth-card .eyebrow{margin-bottom:8px}.auth-card h1{margin:0;font-size:30px;line-height:1.08;letter-spacing:-.045em;font-weight:600}.auth-copy{margin:11px 0 28px;color:#929290;font-size:11px;line-height:1.6}.auth-form{display:grid;gap:16px}.auth-form label{font-size:8px;color:#aaa;letter-spacing:.12em;font-weight:700}.auth-form input{display:block;width:100%;height:46px;margin-top:7px;padding:0 13px;border:1px solid #e1e1df;border-radius:11px;background:rgba(255,255,255,.85);font:inherit;font-size:11px;letter-spacing:normal;outline:none;box-shadow:inset 0 1px 2px rgba(0,0,0,.015)}.auth-form input:focus{border-color:#999;box-shadow:0 0 0 3px rgba(0,0,0,.035)}.auth-submit{height:46px;margin-top:4px;border:1px solid #111;border-radius:11px;background:#111;color:#fff;font-size:10px;font-weight:600;cursor:pointer;box-shadow:0 12px 25px rgba(0,0,0,.13)}.auth-submit:disabled{opacity:.55;cursor:wait}.auth-message{margin:15px 0 0;padding:11px 12px;border:1px solid #e4e4e2;border-radius:10px;background:#fafafa;color:#666;font-size:9px;line-height:1.5}.auth-switch{width:100%;border:0;background:transparent;margin-top:20px;color:#777;font-size:9px;cursor:pointer}.auth-switch:hover{color:#111}.auth-footer{position:absolute;bottom:18px;color:#aaa;font-size:8px;letter-spacing:.04em}
        @media(max-width:520px){.auth-card{padding:28px 22px;border-radius:19px}.auth-card h1{font-size:26px}.auth-footer{display:none}}
      `}</style>
    </main>
  );
}
