import type { WineTimeSignal } from "@/lib/integrations/connector-types";
import type { LossFinding } from "./loss-engine";

export type CorrelatedLoss = LossFinding & {
  correlationId: string;
  evidence: string[];
  crossSource: boolean;
  priority: "high" | "medium" | "low";
};

/**
 * Correlates findings when different systems describe the same business event.
 * This intentionally stays deterministic: it raises priority from evidence,
 * but never invents a monetary value or claims causality without signals.
 */
export function correlateLosses(
  findings: LossFinding[],
  signals: WineTimeSignal[],
): CorrelatedLoss[] {
  return findings.map((finding) => {
    const related = signals.filter((signal) =>
      finding.sourceSignals.some((source) => source.startsWith(`${signal.connectorId}:`)),
    );
    const connectors = new Set(related.map((signal) => signal.connectorId));
    const crossSource = connectors.size > 1;
    const priority =
      crossSource || (finding.estimatedValue !== null && finding.estimatedValue > 1000)
        ? "high"
        : finding.confidence >= 0.75
          ? "medium"
          : "low";

    return {
      ...finding,
      correlationId: `${finding.ruleId}:${related.map((s) => s.sourceRecordId).join(",")}`,
      evidence: related.map(
        (signal) => `${signal.connectorId} → ${signal.signalType}${signal.amount != null ? ` (${signal.amount})` : ""}`,
      ),
      crossSource,
      priority,
    };
  });
}
