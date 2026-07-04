import { Router } from "express";
import { prisma } from "../db";
import { num, isoDate } from "../lib/dto";
import { getLineItemSchedule } from "../lib/lineItemSchedule";
import { param } from "../lib/params";

export const lineItemsRouter = Router();

function serializeLineItem(li: any) {
  return {
    id: li.id,
    categoryId: li.categoryId,
    code: li.code,
    description: li.description,
    totalBudget: num(li.totalBudget),
    scheduleMode: li.scheduleMode,
    startDate: isoDate(li.startDate),
    endDate: isoDate(li.endDate),
    sortOrder: li.sortOrder,
    payments: li.payments.map((p: any) => ({ id: p.id, date: isoDate(p.date), amount: num(p.amount) })),
    schedule: getLineItemSchedule(li),
  };
}

async function loadWithPayments(id: string) {
  return prisma.lineItem.findUnique({
    where: { id },
    include: { payments: { orderBy: { date: "asc" } } },
  });
}

// Nested under /api/projects/:projectId/line-items
export const lineItemsForProjectRouter = Router({ mergeParams: true });

lineItemsForProjectRouter.post("/", async (req, res) => {
  const { categoryId, code, description, totalBudget, scheduleMode, startDate, endDate, sortOrder } =
    req.body;
  if (!description || totalBudget == null) {
    return res.status(400).json({ error: "description and totalBudget are required" });
  }
  const created = await prisma.lineItem.create({
    data: {
      projectId: param(req, "projectId"),
      categoryId: categoryId ?? null,
      code,
      description,
      totalBudget,
      scheduleMode: scheduleMode ?? "EVEN",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      sortOrder: sortOrder ?? 0,
    },
    include: { payments: true },
  });
  res.status(201).json(serializeLineItem(created));
});

lineItemsRouter.patch("/:id", async (req, res) => {
  const { categoryId, code, description, totalBudget, scheduleMode, startDate, endDate, sortOrder } =
    req.body;
  const updated = await prisma.lineItem.update({
    where: { id: req.params.id },
    data: {
      ...(categoryId !== undefined && { categoryId }),
      ...(code !== undefined && { code }),
      ...(description !== undefined && { description }),
      ...(totalBudget !== undefined && { totalBudget }),
      ...(scheduleMode !== undefined && { scheduleMode }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
    include: { payments: { orderBy: { date: "asc" } } },
  });
  res.json(serializeLineItem(updated));
});

lineItemsRouter.delete("/:id", async (req, res) => {
  await prisma.lineItem.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Replace the full set of custom payment entries for a line item.
lineItemsRouter.put("/:id/payments", async (req, res) => {
  const entries: { date: string; amount: number }[] = req.body.payments ?? [];
  await prisma.$transaction([
    prisma.paymentEntry.deleteMany({ where: { lineItemId: req.params.id } }),
    prisma.paymentEntry.createMany({
      data: entries.map((e) => ({
        lineItemId: req.params.id,
        date: new Date(e.date),
        amount: e.amount,
      })),
    }),
  ]);
  const updated = await loadWithPayments(req.params.id);
  res.json(serializeLineItem(updated));
});
