import { getWineTimePlan, type WineTimePlanId } from "./plans";

export type WineTimeEntitlement = {
  planId: WineTimePlanId;
  connectorsAllowed: number | null;
  membersAllowed: number | null;
  monthlySignalsAllowed: number | null;
};

export function getWineTimeEntitlements(planId: WineTimePlanId): WineTimeEntitlement {
  const plan = getWineTimePlan(planId);
  if (!plan) throw new Error(`Unknown WineTime plan: ${planId}`);
  return {
    planId: plan.id,
    connectorsAllowed: plan.limits.connectors,
    membersAllowed: plan.limits.members,
    monthlySignalsAllowed: plan.limits.monthlySignals,
  };
}

export function isWithinLimit(current: number, limit: number | null) {
  return limit === null || current < limit;
}
