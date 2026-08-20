import type { RecoveryPlan } from "./value-recovery";

export type RecoveryMetrics = {
  opportunities: number;
  knownValue: number;
  highPriority: number;
  automationReady: number;
};

export function summarizeRecoveryPlans(plans: RecoveryPlan[]): RecoveryMetrics {
  return {
    opportunities: plans.length,
    knownValue: plans.reduce((total, plan) => total + (plan.recoverableValue ?? 0), 0),
    highPriority: plans.filter((plan) => plan.priority === "high").length,
    automationReady: plans.filter((plan) => plan.automationReady).length,
  };
}
