import { collectChips, computeSeverityScore } from "./attention/chips";
import { MAX_ATTENTION_ITEMS } from "./attention/config";
import { loadAttentionRows } from "./attention/load-rows.query.server";
import type { AttentionData, AttentionItem } from "./attention/types";

export const getNeedsAttention = async (): Promise<AttentionData> => {
  const rows = await loadAttentionRows();
  const nowMs = Date.now();
  const items: AttentionItem[] = [];

  for (const row of rows) {
    if (row.status === "retired") continue;

    const chips = collectChips(row, nowMs);
    if (chips.length === 0) continue;

    items.push({
      vehicleId: row.vehicleId,
      plateNumber: row.plateNumber,
      make: row.make,
      model: row.model,
      status: row.status,
      chips,
      severityScore: computeSeverityScore(chips),
    });
  }

  const sortedItems = items
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, MAX_ATTENTION_ITEMS);

  return {
    items: sortedItems,
    totalCount: sortedItems.length,
  };
};
