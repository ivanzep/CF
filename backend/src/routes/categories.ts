import { Router } from "express";
import { prisma } from "../db";

export const categoriesRouter = Router();

categoriesRouter.patch("/:id", async (req, res) => {
  const { name, sortOrder } = req.body;
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  res.json(category);
});

categoriesRouter.delete("/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
