import type { LineItem, ScheduleBucket } from "../types";

function monthKey(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

function monthFromKey(key: number): string {
  const year = Math.floor(key / 12);
  const month = key % 12;
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Spreads totalBudget evenly across every calendar month from startDate to
 * endDate (inclusive). The last month absorbs any rounding remainder so the
 * bucket sum always equals totalBudget exactly.
 */
export function computeEvenSchedule(startDate: string, endDate: string, totalBudget: number): ScheduleBucket[] {
  const startKey = monthKey(startDate);
  const endKey = monthKey(endDate);
  if (endKey < startKey) return [];
  const numMonths = endKey - startKey + 1;
  const perMonth = round2(totalBudget / numMonths);

  const buckets: ScheduleBucket[] = [];
  let allocated = 0;
  for (let i = 0; i < numMonths; i++) {
    const isLast = i === numMonths - 1;
    const amount = isLast ? round2(totalBudget - allocated) : perMonth;
    allocated += amount;
    buckets.push({ date: monthFromKey(startKey + i), amount });
  }
  return buckets;
}

export function getLineItemSchedule(item: LineItem): ScheduleBucket[] {
  if (item.scheduleMode === "CUSTOM") {
    return item.payments
      .map((p) => ({ date: p.date.slice(0, 10), amount: p.amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  if (!item.startDate || !item.endDate) return [];
  return computeEvenSchedule(item.startDate, item.endDate, item.totalBudget);
}
