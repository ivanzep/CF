export interface ScheduleBucket {
  date: string; // ISO date, first of month
  amount: number;
}

function monthKey(d: Date): number {
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

function firstOfMonth(monthsSinceEpoch: number): Date {
  const year = Math.floor(monthsSinceEpoch / 12);
  const month = monthsSinceEpoch % 12;
  return new Date(Date.UTC(year, month, 1));
}

/**
 * Spreads totalBudget evenly across every calendar month from startDate to
 * endDate (inclusive). The last month absorbs any rounding remainder so the
 * bucket sum always equals totalBudget exactly.
 */
export function computeEvenSchedule(
  startDate: Date,
  endDate: Date,
  totalBudget: number
): ScheduleBucket[] {
  const startKey = monthKey(startDate);
  const endKey = monthKey(endDate);
  if (endKey < startKey) {
    throw new Error("endDate must not be before startDate");
  }
  const numMonths = endKey - startKey + 1;
  const perMonth = Math.round((totalBudget / numMonths) * 100) / 100;

  const buckets: ScheduleBucket[] = [];
  let allocated = 0;
  for (let i = 0; i < numMonths; i++) {
    const isLast = i === numMonths - 1;
    const amount = isLast ? Math.round((totalBudget - allocated) * 100) / 100 : perMonth;
    allocated += amount;
    buckets.push({
      date: firstOfMonth(startKey + i).toISOString().slice(0, 10),
      amount,
    });
  }
  return buckets;
}
