import type { RecoveryPlan } from "./value-recovery";

export type RecoveryOutcomeStatus = "planned" | "executed" | "recovered" | "failed" | "dismissed";

export type RecoveryOutcome = {
  planId: string;
  status: RecoveryOutcomeStatus;
  plannedValue: number | null;
  recoveredValue: number | null;
  currency?: string;
  executedAt?: string;
  completedAt?: string;
  evidence?: string;
};

export function createRecoveryOutcome(plan: RecoveryPlan, planId: string): RecoveryOutcome {
  return {
    planId,
    status: "planned",
    plannedValue: plan.recoverableValue,
    recoveredValue: null,
  };
}

export function recordRecovery(
  outcome: RecoveryOutcome,
  recoveredValue: number,
  evidence?: string,
  completedAt = new Date().toISOString(),
): RecoveryOutcome {
  const safeValue = Number.isFinite(recoveredValue) && recoveredValue >= 0 ? recoveredValue : 0;
  return {
    ...outcome,
    status: "recovered",
    recoveredValue: safeValue,
    completedAt,
    evidence,
  };
}

export function recoveryRate(outcomes: RecoveryOutcome[]) {
  const planned = outcomes.reduce((sum, item) => sum + (item.plannedValue ?? 0), 0);
  const recovered = outcomes.reduce((sum, item) => sum + (item.recoveredValue ?? 0), 0);
  return planned > 0 ? Math.min(1, recovered / planned) : 0;
}
