import { Router } from "express";
import { prisma } from "../db";
import { num, isoDate } from "../lib/dto";
import { getLineItemSchedule } from "../lib/lineItemSchedule";

export const projectsRouter = Router();

const projectInclude = {
  categories: { orderBy: { sortOrder: "asc" as const } },
  lineItems: {
    orderBy: { sortOrder: "asc" as const },
    include: { payments: { orderBy: { date: "asc" as const } } },
  },
  draws: { orderBy: { sortOrder: "asc" as const } },
  capTable: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      contributions: { orderBy: { date: "asc" as const } },
      distributions: { orderBy: { date: "asc" as const } },
    },
  },
};

function serializeProject(p: any) {
  return {
    id: p.id,
    name: p.name,
    client: p.client,
    address: p.address,
    description: p.description,
    projectDate: isoDate(p.projectDate),
    categories: p.categories.map((c: any) => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })),
    lineItems: p.lineItems.map((li: any) => ({
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
    })),
    draws: p.draws.map((d: any) => ({
      id: d.id,
      name: d.name,
      date: isoDate(d.date),
      amount: num(d.amount),
      source: d.source,
      sortOrder: d.sortOrder,
    })),
    capTable: p.capTable.map((m: any) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      ownershipPercent: num(m.ownershipPercent),
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
    })),
  };
}

projectsRouter.get("/", async (_req, res) => {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "asc" } });
  res.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      address: p.address,
      projectDate: isoDate(p.projectDate),
    }))
  );
});

projectsRouter.post("/", async (req, res) => {
  const { name, client, address, description, projectDate } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const project = await prisma.project.create({
    data: {
      name,
      client,
      address,
      description,
      projectDate: projectDate ? new Date(projectDate) : undefined,
    },
    include: projectInclude,
  });
  res.status(201).json(serializeProject(project));
});

projectsRouter.get("/:id", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: projectInclude,
  });
  if (!project) return res.status(404).json({ error: "not found" });
  res.json(serializeProject(project));
});

projectsRouter.patch("/:id", async (req, res) => {
  const { name, client, address, description, projectDate } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(client !== undefined && { client }),
      ...(address !== undefined && { address }),
      ...(description !== undefined && { description }),
      ...(projectDate !== undefined && { projectDate: new Date(projectDate) }),
    },
    include: projectInclude,
  });
  res.json(serializeProject(project));
});

projectsRouter.delete("/:id", async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// --- Categories ---

projectsRouter.post("/:id/categories", async (req, res) => {
  const { name, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const category = await prisma.category.create({
    data: { projectId: req.params.id, name, sortOrder: sortOrder ?? 0 },
  });
  res.status(201).json(category);
});

export { projectInclude, serializeProject };
