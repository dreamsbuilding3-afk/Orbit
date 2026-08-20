import type { CorrelatedLoss } from "./correlate-losses";

export type RecoveryPlan = CorrelatedLoss & {
  recoverableValue: number | null;
  action: "recover_payment" | "collect_invoice" | "recover_cart" | "follow_up_deal" | "follow_up_customer";
  actionLabel: string;
  expectedOutcome: string;
  automationReady: boolean;
};

/**
 * Turns a verified loss finding into an explicit recovery plan.
 * Monetary recovery is deliberately conservative: without a source amount,
 * WineTime reports the opportunity but never invents a euro value.
 */
export function buildRecoveryPlans(losses: CorrelatedLoss[]): RecoveryPlan[] {
  return losses.map((loss) => {
    switch (loss.ruleId) {
      case "failed-payment":
        return {
          ...loss,
          recoverableValue: loss.estimatedValue,
          action: "recover_payment",
          actionLabel: "Relancer le paiement échoué",
          expectedOutcome: "Récupérer le revenu associé au paiement échoué.",
          automationReady: true,
        };
      case "overdue-invoice":
        return {
          ...loss,
          recoverableValue: loss.estimatedValue,
          action: "collect_invoice",
          actionLabel: "Relancer la facture impayée",
          expectedOutcome: "Accélérer le recouvrement du montant dû.",
          automationReady: true,
        };
      case "abandoned-cart":
        return {
          ...loss,
          recoverableValue: loss.estimatedValue,
          action: "recover_cart",
          actionLabel: "Lancer une relance panier",
          expectedOutcome: "Donner au client une nouvelle occasion de finaliser sa commande.",
          automationReady: true,
        };
      case "stalled-deal":
        return {
          ...loss,
          recoverableValue: loss.estimatedValue,
          action: "follow_up_deal",
          actionLabel: "Relancer l'opportunité",
          expectedOutcome: "Réactiver une opportunité commerciale bloquée.",
          automationReady: true,
        };
      default:
        return {
          ...loss,
          recoverableValue: loss.estimatedValue,
          action: "follow_up_customer",
          actionLabel: "Préparer une relance client",
          expectedOutcome: "Réduire les pertes liées à une absence de suivi.",
          automationReady: true,
        };
    }
  });
}
