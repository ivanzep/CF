import { Router } from "express";
import { prisma } from "../db";
import { num, isoDate } from "../lib/dto";
import { param } from "../lib/params";

export const drawsRouter = Router();
export const drawsForProjectRouter = Router({ mergeParams: true });

function serializeDraw(d: any) {
  return {
    id: d.id,
    name: d.name,
    date: isoDate(d.date),
    amount: num(d.amount),
    source: d.source,
    sortOrder: d.sortOrder,
  };
}

drawsForProjectRouter.post("/", async (req, res) => {
  const { name, date, amount, source, sortOrder } = req.body;
  if (!name || !date || amount == null) {
    return res.status(400).json({ error: "name, date and amount are required" });
  }
  const draw = await prisma.draw.create({
    data: {
      projectId: param(req, "projectId"),
      name,
      date: new Date(date),
      amount,
      source,
      sortOrder: sortOrder ?? 0,
    },
  });
  res.status(201).json(serializeDraw(draw));
});

drawsRouter.patch("/:id", async (req, res) => {
  const { name, date, amount, source, sortOrder } = req.body;
  const draw = await prisma.draw.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(amount !== undefined && { amount }),
      ...(source !== undefined && { source }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  res.json(serializeDraw(draw));
});

drawsRouter.delete("/:id", async (req, res) => {
  await prisma.draw.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
