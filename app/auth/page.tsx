"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

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
      const supabase = getSupabaseBrowserClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { company_name: company } } });

      if (result.error) throw result.error;

      if (mode === "signup" && result.data.user) {
        const slug = company.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { error } = await supabase.rpc("create_organization", { org_name: company, org_slug: slug || `workspace-${result.data.user.id.slice(0, 8)}` });
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
    </main>
  );
}
