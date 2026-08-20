/** WineTime product principles: the loss engine must remain source-agnostic and outcome-driven. */
export const WINE_TIME_PRODUCT_PRINCIPLES = [
  "Find losses across the whole business, not inside one app.",
  "Cross signals from independent systems before declaring a pattern.",
  "Show evidence and confidence; never invent a loss or a recovered amount.",
  "Translate findings into a measurable recovery opportunity.",
  "Automate only after the business has authorized the action.",
  "Measure actual recovered value, not hypothetical savings.",
  "Keep every organization's data isolated and auditable.",
] as const;

export const FUTURE_CONNECTOR_CATEGORIES = [
  "payments",
  "crm",
  "erp",
  "accounting",
  "commerce",
  "support",
  "communication",
  "calendar",
  "database",
  "data_warehouse",
  "internal_api",
] as const;
