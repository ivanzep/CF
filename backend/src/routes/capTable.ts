import { Router } from "express";
import { prisma } from "../db";
import { num, isoDate } from "../lib/dto";
import { computeCapTable, autoSplitAmount } from "../lib/capTable";
import { param } from "../lib/params";

export const capTableRouter = Router();
export const capTableForProjectRouter = Router({ mergeParams: true });

function serializeMember(m: any) {
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    ownershipPercent: num(m.ownershipPercent),
    sortOrder: m.sortOrder,
    contributions: m.contributions.map((c: any) => ({
      id: c.id,
      date: isoDate(c.date),
      amount: num(c.amount),
      note: c.note,
    })),
    distributions: m.distributions.map((d: any) => ({
      id: d.id,
      date: isoDate(d.date),
      amount: num(d.amount),
      note: d.note,
    })),
  };
}

const memberInclude = {
  contributions: { orderBy: { date: "asc" as const } },
  distributions: { orderBy: { date: "asc" as const } },
};

// --- Members ---

capTableForProjectRouter.post("/members", async (req, res) => {
  const { name, role, ownershipPercent, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const member = await prisma.capTableMember.create({
    data: {
      projectId: param(req, "projectId"),
      name,
      role: role ?? "LP",
      ownershipPercent: ownershipPercent ?? null,
      sortOrder: sortOrder ?? 0,
    },
    include: memberInclude,
  });
  res.status(201).json(serializeMember(member));
});

capTableRouter.patch("/members/:id", async (req, res) => {
  const { name, role, ownershipPercent, sortOrder } = req.body;
  const member = await prisma.capTableMember.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(ownershipPercent !== undefined && { ownershipPercent }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
    include: memberInclude,
  });
  res.json(serializeMember(member));
});

capTableRouter.delete("/members/:id", async (req, res) => {
  await prisma.capTableMember.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// --- Contributions ---

capTableRouter.post("/members/:id/contributions", async (req, res) => {
  const { date, amount, note } = req.body;
  if (!date || amount == null) return res.status(400).json({ error: "date and amount are required" });
  await prisma.contribution.create({
    data: { memberId: req.params.id, date: new Date(date), amount, note },
  });
  const member = await prisma.capTableMember.findUnique({
    where: { id: req.params.id },
    include: memberInclude,
  });
  res.status(201).json(serializeMember(member));
});

capTableRouter.patch("/contributions/:id", async (req, res) => {
  const { date, amount, note } = req.body;
  const contribution = await prisma.contribution.update({
    where: { id: req.params.id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(amount !== undefined && { amount }),
      ...(note !== undefined && { note }),
    },
  });
  res.json({ id: contribution.id, date: isoDate(contribution.date), amount: num(contribution.amount), note: contribution.note });
});

capTableRouter.delete("/contributions/:id", async (req, res) => {
  await prisma.contribution.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// --- Distributions ("member draws") ---

capTableRouter.post("/members/:id/distributions", async (req, res) => {
  const { date, amount, note } = req.body;
  if (!date || amount == null) return res.status(400).json({ error: "date and amount are required" });
  await prisma.distribution.create({
    data: { memberId: req.params.id, date: new Date(date), amount, note },
  });
  const member = await prisma.capTableMember.findUnique({
    where: { id: req.params.id },
    include: memberInclude,
  });
  res.status(201).json(serializeMember(member));
});

capTableRouter.patch("/distributions/:id", async (req, res) => {
  const { date, amount, note } = req.body;
  const distribution = await prisma.distribution.update({
    where: { id: req.params.id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(amount !== undefined && { amount }),
      ...(note !== undefined && { note }),
    },
  });
  res.json({ id: distribution.id, date: isoDate(distribution.date), amount: num(distribution.amount), note: distribution.note });
});

capTableRouter.delete("/distributions/:id", async (req, res) => {
  await prisma.distribution.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Split a single distribution event across all members, proportional to
// each member's ownership percentage (manual override or pro-rata by contributions).
capTableForProjectRouter.post("/distributions/auto-split", async (req, res) => {
  const { date, totalAmount, note } = req.body;
  if (!date || totalAmount == null) {
    return res.status(400).json({ error: "date and totalAmount are required" });
  }
  const members = await prisma.capTableMember.findMany({
    where: { projectId: param(req, "projectId") },
    include: memberInclude,
  });
  const rows = computeCapTable(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      ownershipPercent: num(m.ownershipPercent),
      contributions: m.contributions.map((c) => ({ amount: num(c.amount) as number })),
      distributions: m.distributions.map((d) => ({ amount: num(d.amount) as number })),
    }))
  );
  const splits = autoSplitAmount(rows, totalAmount);
  await prisma.$transaction(
    splits
      .filter((s) => s.amount !== 0)
      .map((s) =>
        prisma.distribution.create({
          data: { memberId: s.memberId, date: new Date(date), amount: s.amount, note },
        })
      )
  );
  const updatedMembers = await prisma.capTableMember.findMany({
    where: { projectId: param(req, "projectId") },
    orderBy: { sortOrder: "asc" },
    include: memberInclude,
  });
  res.json(updatedMembers.map(serializeMember));
});

// Computed cap table view: ownership %, totals contributed/distributed, net position.
capTableForProjectRouter.get("/cap-table", async (req, res) => {
  const members = await prisma.capTableMember.findMany({
    where: { projectId: param(req, "projectId") },
    orderBy: { sortOrder: "asc" },
    include: memberInclude,
  });
  const rows = computeCapTable(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      ownershipPercent: num(m.ownershipPercent),
      contributions: m.contributions.map((c) => ({ amount: num(c.amount) as number })),
      distributions: m.distributions.map((d) => ({ amount: num(d.amount) as number })),
    }))
  );
  res.json(rows);
});
