import { MAX_ATTENTION_ITEMS, type AttentionItem } from "./attention/config";
import { collectChips, computeSeverityScore } from "./attention/chips";
import { loadAttentionRows } from "./attention/queries";

export const getNeedsAttention = async (): Promise<AttentionItem[]> => {
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

  return items.sort((a, b) => b.severityScore - a.severityScore).slice(0, MAX_ATTENTION_ITEMS);
};
