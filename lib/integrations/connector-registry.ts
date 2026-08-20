import type { WineTimeConnector } from "./connector-types";

export const connectorRegistry: WineTimeConnector[] = [
  { id: "gmail", name: "Gmail", category: "communication", status: "available", description: "Emails, relances et demandes sans réponse.", signals: ["email_received", "email_sent", "follow_up_gap"] },
  { id: "google_calendar", name: "Google Calendar", category: "calendar", status: "available", description: "Rendez-vous, disponibilité et ruptures de suivi.", signals: ["event", "meeting_gap", "cancellation"] },
  { id: "stripe", name: "Stripe", category: "payments", status: "coming_soon", description: "Paiements, factures, remboursements et revenus manqués.", signals: ["payment_failed", "invoice_overdue", "refund", "subscription_churn"] },
  { id: "crm", name: "CRM", category: "crm", status: "coming_soon", description: "Prospects, opportunités et ventes abandonnées.", signals: ["lead", "deal_stalled", "deal_lost", "follow_up_gap"] },
  { id: "erp", name: "ERP / comptabilité", category: "erp", status: "coming_soon", description: "Coûts, achats, stocks, marges et anomalies.", signals: ["cost", "purchase", "inventory", "margin"] },
  { id: "shopify", name: "Shopify", category: "commerce", status: "coming_soon", description: "Commandes, paniers et remboursements.", signals: ["cart_abandoned", "order_failed", "refund", "customer_churn"] },
  { id: "api", name: "API / base de données", category: "database", status: "custom", description: "Données propriétaires et outils internes via API.", signals: ["custom_event", "custom_transaction", "custom_metric"] },
  { id: "warehouse", name: "Data warehouse", category: "warehouse", status: "custom", description: "Croisement des données analytiques de l'entreprise.", signals: ["metric", "transaction", "customer_event"] },
];

export function getConnector(id: string) {
  return connectorRegistry.find((connector) => connector.id === id);
}
