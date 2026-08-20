import type { WineTimePlanId } from "./plans";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";

export type WineTimeSubscription = {
  organizationId: string;
  planId: WineTimePlanId;
  status: SubscriptionStatus;
  provider: "none" | "stripe";
  providerSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
};

export function createUnpaidSubscription(organizationId: string, planId: WineTimePlanId): WineTimeSubscription {
  return {
    organizationId,
    planId,
    status: "trialing",
    provider: "none",
  };
}
