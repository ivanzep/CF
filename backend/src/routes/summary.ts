import { Router } from "express";
import { prisma } from "../db";
import { num, isoDate } from "../lib/dto";
import { getLineItemSchedule } from "../lib/lineItemSchedule";
import { computeCapTable } from "../lib/capTable";
import { param } from "../lib/params";

export const summaryRouter = Router({ mergeParams: true });

function monthKey(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

function monthFromKey(key: number): string {
  const year = Math.floor(key / 12);
  const month = key % 12;
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

summaryRouter.get("/summary", async (req, res) => {
  const projectId = param(req, "projectId");
  const [categories, lineItems, draws, members] = await Promise.all([
    prisma.category.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    prisma.lineItem.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      include: { payments: true },
    }),
    prisma.draw.findMany({ where: { projectId }, orderBy: { date: "asc" } }),
    prisma.capTableMember.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      include: { contributions: true, distributions: true },
    }),
  ]);

  const itemsWithSchedule = lineItems.map((li) => ({
    li,
    schedule: getLineItemSchedule(li),
  }));

  let minKey: number | null = null;
  let maxKey: number | null = null;
  const consider = (iso: string) => {
    const k = monthKey(iso);
    minKey = minKey === null ? k : Math.min(minKey, k);
    maxKey = maxKey === null ? k : Math.max(maxKey, k);
  };
  for (const { schedule } of itemsWithSchedule) {
    for (const b of schedule) consider(b.date.slice(0, 7) + "-01");
  }
  for (const d of draws) consider(isoDate(d.date) as string);

  const months: string[] = [];
  if (minKey !== null && maxKey !== null) {
    for (let k = minKey; k <= maxKey; k++) months.push(monthFromKey(k));
  }

  function monthlyMapFor(schedule: { date: string; amount: number }[]) {
    const map: Record<string, number> = {};
    for (const b of schedule) {
      const key = b.date.slice(0, 7) + "-01";
      map[key] = (map[key] ?? 0) + b.amount;
    }
    return map;
  }

  const categoryList = [...categories.map((c) => ({ id: c.id, name: c.name })), { id: null as string | null, name: "Uncategorized" }];

  const categoryOutputs = categoryList
    .map((cat) => {
      const items = itemsWithSchedule.filter(({ li }) => li.categoryId === cat.id);
      if (items.length === 0) return null;

      const lineItemOutputs = items.map(({ li, schedule }) => {
        const monthly = monthlyMapFor(schedule);
        return {
          id: li.id,
          code: li.code,
          description: li.description,
          totalBudget: num(li.totalBudget),
          scheduleMode: li.scheduleMode,
          monthly,
        };
      });

      const subtotal: Record<string, number> = {};
      let subtotalTotal = 0;
      for (const lo of lineItemOutputs) {
        for (const [month, amt] of Object.entries(lo.monthly)) {
          subtotal[month] = (subtotal[month] ?? 0) + amt;
        }
        subtotalTotal += lo.totalBudget ?? 0;
      }

      return { id: cat.id, name: cat.name, lineItems: lineItemOutputs, subtotal, subtotalTotal };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const grandMonthly: Record<string, number> = {};
  let grandTotal = 0;
  for (const cat of categoryOutputs) {
    for (const [month, amt] of Object.entries(cat.subtotal)) {
      grandMonthly[month] = (grandMonthly[month] ?? 0) + amt;
    }
    grandTotal += cat.subtotalTotal;
  }

  const capTableRows = computeCapTable(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      ownershipPercent: num(m.ownershipPercent),
      contributions: m.contributions.map((c) => ({ amount: num(c.amount) as number })),
      distributions: m.distributions.map((d) => ({ amount: num(d.amount) as number })),
    }))
  );

  res.json({
    months,
    categories: categoryOutputs,
    grandTotal: { monthly: grandMonthly, total: grandTotal },
    draws: draws.map((d) => ({
      id: d.id,
      name: d.name,
      date: isoDate(d.date),
      amount: num(d.amount),
      source: d.source,
    })),
    capTable: capTableRows,
    equityTotals: {
      totalContributed: capTableRows.reduce((a, r) => a + r.totalContributed, 0),
      totalDistributed: capTableRows.reduce((a, r) => a + r.totalDistributed, 0),
    },
  });
});
