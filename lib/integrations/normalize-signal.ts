import type { WineTimeSignal } from "./connector-types";

/** Normalize connector records into the common WineTime signal contract. */
export function normalizeSignal(input: Omit<WineTimeSignal, "metadata"> & { metadata?: Record<string, unknown> }): WineTimeSignal {
  return {
    ...input,
    occurredAt: new Date(input.occurredAt).toISOString(),
    metadata: input.metadata ?? {},
  };
}

export function signalKey(signal: WineTimeSignal) {
  return `${signal.organizationId}:${signal.connectorId}:${signal.sourceRecordId}:${signal.signalType}`;
}
