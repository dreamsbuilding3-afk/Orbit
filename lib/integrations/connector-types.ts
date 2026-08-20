export type WineTimeConnectorCategory =
  | "payments"
  | "crm"
  | "erp"
  | "communication"
  | "commerce"
  | "calendar"
  | "support"
  | "database"
  | "warehouse"
  | "internal";

export type WineTimeConnectorStatus = "available" | "coming_soon" | "custom";

export type WineTimeConnector = {
  id: string;
  name: string;
  category: WineTimeConnectorCategory;
  status: WineTimeConnectorStatus;
  description: string;
  signals: string[];
};

export type WineTimeSignal = {
  organizationId: string;
  connectorId: string;
  sourceRecordId: string;
  occurredAt: string;
  signalType: string;
  amount?: number;
  currency?: string;
  entityType?: string;
  entityId?: string;
  metadata: Record<string, unknown>;
};

export const connectorCategories: Record<WineTimeConnectorCategory, string> = {
  payments: "Paiements",
  crm: "Clients & ventes",
  erp: "ERP / comptabilité",
  communication: "Communication",
  commerce: "Commerce",
  calendar: "Planning",
  support: "Support client",
  database: "Bases de données",
  warehouse: "Data warehouse",
  internal: "Systèmes internes",
};
