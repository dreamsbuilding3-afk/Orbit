import type { WineTimeSignal } from "@/lib/integrations/connector-types";

type LossRule = {
  id: string;
  title: string;
  description: string;
  signalTypes: string[];
  valueMultiplier?: number;
};

export type LossFinding = {
  ruleId: string;
  title: string;
  reason: string;
  estimatedValue: number | null;
  confidence: number;
  sourceSignals: string[];
  category: "revenue" | "cost" | "time" | "customer" | "operational";
};

const RULES: LossRule[] = [
  { id: "failed-payment", title: "Paiements échoués à récupérer", description: "Des paiements ont échoué et peuvent représenter du revenu récupérable.", signalTypes: ["payment_failed"] },
  { id: "overdue-invoice", title: "Factures en retard", description: "Des factures restent impayées et méritent une action de recouvrement.", signalTypes: ["invoice_overdue"] },
  { id: "abandoned-cart", title: "Paniers abandonnés", description: "Des commandes ont été commencées sans être finalisées.", signalTypes: ["cart_abandoned"] },
  { id: "stalled-deal", title: "Opportunités commerciales bloquées", description: "Des opportunités restent sans progression et peuvent nécessiter une relance.", signalTypes: ["deal_stalled"] },
  { id: "follow-up-gap", title: "Relances manquantes", description: "Un signal commercial ou de communication indique qu'un suivi attendu n'a pas eu lieu.", signalTypes: ["follow_up_gap"] },
];

/**
 * Deterministic first-pass loss engine. It only produces a finding when the
 * connected source emits a supported signal. No signal means no invented loss.
 * Later versions can add cross-source correlation and customer-specific rules.
 */
export function detectLosses(signals: WineTimeSignal[]): LossFinding[] {
  const findings: LossFinding[] = [];
  for (const rule of RULES) {
    const matches = signals.filter((s) => rule.signalTypes.includes(s.signalType));
    if (!matches.length) continue;
    const amounts = matches.map((s) => s.amount).filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0);
    const estimatedValue = amounts.length ? amounts.reduce((a, b) => a + b, 0) : null;
    const confidence = Math.min(0.99, 0.55 + Math.min(0.35, matches.length * 0.05));
    findings.push({
      ruleId: rule.id,
      title: rule.title,
      reason: rule.description,
      estimatedValue,
      confidence,
      sourceSignals: matches.map((s) => `${s.connectorId}:${s.sourceRecordId}`),
      category: rule.id === "failed-payment" || rule.id === "overdue-invoice" || rule.id === "abandoned-cart" ? "revenue" : rule.id === "follow-up-gap" ? "customer" : "operational",
    });
  }
  return findings;
}

export function lossEngineRules() {
  return RULES.map((rule) => ({ ...rule }));
}
