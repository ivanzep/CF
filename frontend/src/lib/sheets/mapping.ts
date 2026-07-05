import type { TabName } from "./client";
import type { Project, LineItem, ScheduleMode } from "../../types";

type RawTabs = Record<TabName, string[][]>;

function str(row: string[], i: number): string {
  return row[i] != null ? String(row[i]) : "";
}
function strOrNull(row: string[], i: number): string | null {
  const v = str(row, i);
  return v === "" ? null : v;
}
function num(row: string[], i: number): number {
  const v = row[i];
  return v == null || v === "" ? 0 : Number(v);
}
function numOrNull(row: string[], i: number): number | null {
  const v = row[i];
  return v == null || v === "" ? null : Number(v);
}

export function parseProject(spreadsheetId: string, tabs: RawTabs): Project {
  const projectRow = tabs.Project[0] ?? [];
  const lineItems: LineItem[] = tabs.LineItems.map((row) => ({
    id: str(row, 0),
    categoryId: strOrNull(row, 1),
    code: strOrNull(row, 2),
    description: str(row, 3),
    totalBudget: num(row, 4),
    scheduleMode: (str(row, 5) || "EVEN") as ScheduleMode,
    startDate: strOrNull(row, 6),
    endDate: strOrNull(row, 7),
    sortOrder: num(row, 8),
    payments: [],
    schedule: [],
  }));
  const lineItemsById = new Map(lineItems.map((li) => [li.id, li]));
  tabs.Payments.forEach((row) => {
    const li = lineItemsById.get(str(row, 1));
    if (li) li.payments.push({ id: str(row, 0), date: str(row, 2), amount: num(row, 3) });
  });

  const capTable = tabs.CapTable.map((row) => ({
    id: str(row, 0),
    name: str(row, 1),
    role: str(row, 2) || "LP",
    ownershipPercent: numOrNull(row, 3),
    sortOrder: num(row, 4),
    contributions: [] as { id: string; date: string; amount: number; note: string | null }[],
    distributions: [] as { id: string; date: string; amount: number; note: string | null }[],
  }));
  const membersById = new Map(capTable.map((m) => [m.id, m]));
  tabs.Contributions.forEach((row) => {
    const m = membersById.get(str(row, 1));
    if (m) m.contributions.push({ id: str(row, 0), date: str(row, 2), amount: num(row, 3), note: strOrNull(row, 4) });
  });
  tabs.Distributions.forEach((row) => {
    const m = membersById.get(str(row, 1));
    if (m) m.distributions.push({ id: str(row, 0), date: str(row, 2), amount: num(row, 3), note: strOrNull(row, 4) });
  });

  return {
    id: spreadsheetId,
    name: str(projectRow, 1) || "Untitled Project",
    client: strOrNull(projectRow, 2),
    address: strOrNull(projectRow, 3),
    description: strOrNull(projectRow, 4),
    projectDate: str(projectRow, 5) || new Date().toISOString().slice(0, 10),
    categories: tabs.Categories.map((row) => ({ id: str(row, 0), name: str(row, 1), sortOrder: num(row, 2) })),
    lineItems,
    draws: tabs.Draws.map((row) => ({
      id: str(row, 0),
      name: str(row, 1),
      date: str(row, 2),
      amount: num(row, 3),
      source: strOrNull(row, 4),
      sortOrder: num(row, 5),
    })),
    capTable,
  };
}

export function toRows(tab: TabName, project: Project): (string | number)[][] {
  switch (tab) {
    case "Project":
      return [[project.id, project.name, project.client ?? "", project.address ?? "", project.description ?? "", project.projectDate]];
    case "Categories":
      return project.categories.map((c) => [c.id, c.name, c.sortOrder]);
    case "LineItems":
      return project.lineItems.map((li) => [
        li.id, li.categoryId ?? "", li.code ?? "", li.description, li.totalBudget,
        li.scheduleMode, li.startDate ?? "", li.endDate ?? "", li.sortOrder,
      ]);
    case "Payments":
      return project.lineItems.flatMap((li) => li.payments.map((p) => [p.id, li.id, p.date, p.amount]));
    case "Draws":
      return project.draws.map((d) => [d.id, d.name, d.date, d.amount, d.source ?? "", d.sortOrder]);
    case "CapTable":
      return project.capTable.map((m) => [m.id, m.name, m.role, m.ownershipPercent ?? "", m.sortOrder]);
    case "Contributions":
      return project.capTable.flatMap((m) => m.contributions.map((c) => [c.id, m.id, c.date, c.amount, c.note ?? ""]));
    case "Distributions":
      return project.capTable.flatMap((m) => m.distributions.map((d) => [d.id, m.id, d.date, d.amount, d.note ?? ""]));
  }
}
