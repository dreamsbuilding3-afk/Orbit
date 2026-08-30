"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase-browser";

type Progress = {
  active_months: number;
  prospect_count: number;
  action_count: number;
  current_level: string;
  elite_unlocked: boolean;
};

export default function SubscriptionLink() {
  const pathname = usePathname();
  const [progress, setProgress] = useState<Progress | null>(null);

  const loadRewards = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!membership?.organization_id) return;
    const { data } = await supabase.rpc("refresh_winetime_rewards", {
      target_org: membership.organization_id,
    });
    const next = Array.isArray(data) ? data[0] : data;
    if (next) setProgress(next as Progress);
  }, []);

  useEffect(() => {
    void loadRewards();
  }, [loadRewards]);

  const months = progress?.active_months ?? 0;
  const prospects = progress?.prospect_count ?? 0;
  const elite = !!progress?.elite_unlocked;
  const completion = elite
    ? 100
    : Math.min(100, Math.round((Math.min(months / 8, prospects / 100)) * 100));

  const showHomePreview = pathname === "/";

  return (
    <>
      {showHomePreview && (
        <Link
          href="/rewards"
          aria-label="Voir votre progression WineTime Rewards"
          style={{
            position: "fixed",
            right: 28,
            bottom: 28,
            zIndex: 35,
            width: 286,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 13px",
            borderRadius: 16,
            border: "1px solid rgba(52,103,196,.12)",
            background: "linear-gradient(135deg,rgba(255,255,255,.94),rgba(239,246,255,.92))",
            color: "#152343",
            textDecoration: "none",
            boxShadow: "0 18px 45px rgba(30,70,140,.12)",
            backdropFilter: "blur(18px)",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 48,
              height: 30,
              flex: "none",
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".05em",
              background: "linear-gradient(135deg,#082f86,#155bd0 52%,#75b9ff)",
              boxShadow: "0 7px 16px rgba(16,63,150,.22)",
              transform: "rotate(-3deg)",
            }}
          >
            W
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: "block", fontSize: 8, letterSpacing: ".14em", fontWeight: 800, color: "#7182a1" }}>
              WINE TIME REWARDS
            </span>
            <span style={{ display: "block", marginTop: 3, fontSize: 11, fontWeight: 700 }}>
              {elite ? "Elite débloqué" : `${completion}% vers Elite`}
            </span>
            <span style={{ display: "block", marginTop: 2, fontSize: 9, color: "#7b8aa5" }}>
              {months}/8 mois · {prospects}/100 prospects
            </span>
          </span>
          <span aria-hidden="true" style={{ color: "#5573a9", fontSize: 18 }}>→</span>
        </Link>
      )}

      <Link
        href="/rewards"
        aria-label="Ouvrir WineTime Rewards"
        style={{
          position: "fixed",
          left: 16,
          bottom: 140,
          zIndex: 40,
          width: 218,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(43,91,171,.12)",
          background: "linear-gradient(135deg,rgba(255,255,255,.97),rgba(239,246,255,.95))",
          color: "#315b9f",
          textDecoration: "none",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 6px 18px rgba(28,75,150,.08)",
          backdropFilter: "blur(14px)",
        }}
      >
        <span aria-hidden="true" style={{ width: 18, textAlign: "center", fontSize: 14, lineHeight: 1 }}>✦</span>
        Rewards
      </Link>

      <Link
        href="/abonnement"
        aria-label="Ouvrir les abonnements WineTime"
        style={{
          position: "fixed",
          left: 16,
          bottom: 92,
          zIndex: 40,
          width: 218,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,.07)",
          background: "rgba(255,255,255,.96)",
          color: "#3f3f3d",
          textDecoration: "none",
          fontSize: 12,
          fontWeight: 600,
          boxShadow: "0 6px 18px rgba(0,0,0,.06)",
          backdropFilter: "blur(14px)",
        }}
      >
        <span aria-hidden="true" style={{ width: 18, textAlign: "center", fontSize: 15, lineHeight: 1 }}>€</span>
        Abonnement
      </Link>
    </>
  );
}
