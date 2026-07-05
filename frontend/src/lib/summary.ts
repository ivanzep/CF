import type { Project, Summary, SummaryCategory } from "../types";
import { getLineItemSchedule } from "./schedule";
import { computeCapTable } from "./capTable";

function monthKey(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}
function monthFromKey(key: number): string {
  const year = Math.floor(key / 12);
  const month = key % 12;
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

export function buildSummary(project: Project): Summary {
  const itemsWithSchedule = project.lineItems.map((li) => ({ li, schedule: getLineItemSchedule(li) }));

  let minKey: number | null = null;
  let maxKey: number | null = null;
  const consider = (iso: string) => {
    const k = monthKey(iso);
    minKey = minKey === null ? k : Math.min(minKey, k);
    maxKey = maxKey === null ? k : Math.max(maxKey, k);
  };
  for (const { schedule } of itemsWithSchedule) for (const b of schedule) consider(`${b.date.slice(0, 7)}-01`);
  for (const d of project.draws) consider(d.date.slice(0, 10));

  const months: string[] = [];
  if (minKey !== null && maxKey !== null) for (let k = minKey; k <= maxKey; k++) months.push(monthFromKey(k));

  function monthlyMapFor(schedule: { date: string; amount: number }[]) {
    const map: Record<string, number> = {};
    for (const b of schedule) {
      const key = `${b.date.slice(0, 7)}-01`;
      map[key] = (map[key] ?? 0) + b.amount;
    }
    return map;
  }

  const categoryList = [
    ...project.categories.map((c) => ({ id: c.id as string | null, name: c.name })),
    { id: null as string | null, name: "Uncategorized" },
  ];

  const categories: SummaryCategory[] = categoryList
    .map((cat) => {
      const items = itemsWithSchedule.filter(({ li }) => li.categoryId === cat.id);
      if (items.length === 0) return null;

      const lineItems = items.map(({ li, schedule }) => ({
        id: li.id,
        code: li.code,
        description: li.description,
        totalBudget: li.totalBudget,
        scheduleMode: li.scheduleMode,
        monthly: monthlyMapFor(schedule),
      }));

      const subtotal: Record<string, number> = {};
      let subtotalTotal = 0;
      for (const lo of lineItems) {
        for (const [month, amt] of Object.entries(lo.monthly)) subtotal[month] = (subtotal[month] ?? 0) + amt;
        subtotalTotal += lo.totalBudget;
      }

      return { id: cat.id, name: cat.name, lineItems, subtotal, subtotalTotal };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const grandMonthly: Record<string, number> = {};
  let grandTotal = 0;
  for (const cat of categories) {
    for (const [month, amt] of Object.entries(cat.subtotal)) grandMonthly[month] = (grandMonthly[month] ?? 0) + amt;
    grandTotal += cat.subtotalTotal;
  }

  const capTableRows = computeCapTable(project.capTable);

  return {
    months,
    categories,
    grandTotal: { monthly: grandMonthly, total: grandTotal },
    draws: project.draws.map((d) => ({ id: d.id, name: d.name, date: d.date, amount: d.amount, source: d.source })),
    capTable: capTableRows,
    equityTotals: {
      totalContributed: capTableRows.reduce((a, r) => a + r.totalContributed, 0),
      totalDistributed: capTableRows.reduce((a, r) => a + r.totalDistributed, 0),
    },
  };
}
