export type WineTimePlanId = "starter" | "growth" | "scale" | "enterprise";

export type WineTimePlan = {
  id: WineTimePlanId;
  name: string;
  monthlyPrice: number | null;
  description: string;
  limits: {
    connectors: number | null;
    members: number | null;
    monthlySignals: number | null;
  };
  features: string[];
  recommended?: boolean;
};

/** Pricing is product configuration only. Payment processing is intentionally
 * provider-agnostic until Stripe (or another processor) is connected. */
export const WINE_TIME_PLANS: WineTimePlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49,
    description: "Pour commencer à identifier les pertes invisibles.",
    limits: { connectors: 3, members: 2, monthlySignals: 10000 },
    features: ["Détection des pertes", "Dashboard de récupération", "Rapports essentiels"],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 149,
    description: "Pour les entreprises qui veulent croiser plusieurs sources.",
    limits: { connectors: 10, members: 10, monthlySignals: 100000 },
    features: ["Tout Starter", "Corrélation multi-sources", "Plans de récupération", "Automatisations autorisées"],
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 499,
    description: "Pour les entreprises avec plusieurs systèmes et volumes importants.",
    limits: { connectors: 30, members: 50, monthlySignals: 1000000 },
    features: ["Tout Growth", "Connecteurs avancés", "Analyse multi-systèmes", "Suivi de la valeur récupérée"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    description: "Infrastructure WineTime adaptée aux besoins complexes de l'entreprise.",
    limits: { connectors: null, members: null, monthlySignals: null },
    features: ["Tout Scale", "Connecteurs personnalisés", "API / systèmes internes", "Sécurité et gouvernance avancées", "Accompagnement dédié"],
  },
];

export function getWineTimePlan(id: WineTimePlanId) {
  return WINE_TIME_PLANS.find((plan) => plan.id === id);
}
