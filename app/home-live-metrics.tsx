"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase-browser";

export default function HomeLiveMetrics() {
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    if (pathname !== "/" || !supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const organizationId = membership?.organization_id;
    if (!organizationId) return;

    const [workflowResult, actionResult, eventResult, recommendationResult] = await Promise.all([
      supabase
        .from("workflows")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "active"),
      supabase
        .from("ark_action_runs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "completed"),
      supabase
        .from("ark_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("occurred_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("ark_recommendations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
    ]);

    const values = [
      workflowResult.count ?? 0,
      actionResult.count ?? 0,
      eventResult.count ?? 0,
      recommendationResult.count ?? 0,
    ];

    const cards = document.querySelectorAll<HTMLElement>(".metrics .metric-card");
    if (cards.length < 4) return;

    cards[0].querySelector("strong")!.textContent = String(values[0]);
    cards[0].querySelector("small")!.textContent = "Workflows actuellement actifs";

    cards[1].querySelector("strong")!.textContent = String(values[1]);
    cards[1].querySelector("small")!.textContent = "Exécutions terminées";

    cards[2].querySelector("strong")!.textContent = values[2] > 0 ? "LIVE" : "IDLE";
    cards[2].querySelector("small")!.textContent = values[2] > 0 ? `${values[2]} signal${values[2] > 1 ? "s" : ""} détecté${values[2] > 1 ? "s" : ""} aujourd'hui` : "Aucun nouveau signal aujourd'hui";

    cards[3].querySelector("strong")!.textContent = String(values[3]);
    cards[3].querySelector("small")!.textContent = values[3] === 0 ? "Rien à valider" : "Recommandations à examiner";
  }, [pathname]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (pathname !== "/") return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [pathname, refresh]);

  return null;
}
