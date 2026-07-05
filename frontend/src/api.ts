import type { Project, ProjectListEntry, Summary, LineItem, Draw, CapTableMember, Category } from "./types";
import { getAccessToken } from "./lib/sheets/auth";
import { createSpreadsheet, readAllTabs, writeTab, type TabName } from "./lib/sheets/client";
import { parseProject, toRows } from "./lib/sheets/mapping";
import { listKnownProjects, upsertKnownProject, removeKnownProject } from "./lib/registry";
import { buildSummary } from "./lib/summary";
import { computeCapTable, autoSplitAmount } from "./lib/capTable";
import { getLineItemSchedule } from "./lib/schedule";
import { genId } from "./lib/id";
import { EXAMPLE_DATA } from "./lib/exampleData";

let cache: { spreadsheetId: string; project: Project } | null = null;

function recomputeSchedules(project: Project): void {
  for (const li of project.lineItems) li.schedule = getLineItemSchedule(li);
}

async function loadProject(id: string): Promise<Project> {
  const token = await getAccessToken();
  const raw = await readAllTabs(token, id);
  const project = parseProject(id, raw);
  recomputeSchedules(project);
  cache = { spreadsheetId: id, project };
  return project;
}

function requireCache(id?: string): { spreadsheetId: string; project: Project } {
  if (!cache) throw new Error("No project is loaded yet");
  if (id && cache.spreadsheetId !== id) throw new Error("Requested a different project than the one currently loaded");
  return cache;
}

async function persist(tabs: TabName[]): Promise<Project> {
  const { spreadsheetId, project } = requireCache();
  recomputeSchedules(project);
  const token = await getAccessToken();
  for (const tab of tabs) await writeTab(token, spreadsheetId, tab, toRows(tab, project));
  return project;
}

export const api = {
  listProjects: async (): Promise<ProjectListEntry[]> => listKnownProjects(),

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const token = await getAccessToken();
    const name = data.name || "New Project";
    const spreadsheetId = await createSpreadsheet(token, name);
    const project: Project = {
      id: spreadsheetId,
      name,
      client: data.client ?? null,
      address: data.address ?? null,
      description: data.description ?? null,
      projectDate: data.projectDate ?? new Date().toISOString().slice(0, 10),
      categories: [],
      lineItems: [],
      draws: [],
      capTable: [],
    };
    cache = { spreadsheetId, project };
    await persist(["Project"]);
    upsertKnownProject({ id: spreadsheetId, name, client: project.client, address: project.address, projectDate: project.projectDate });
    return project;
  },

  getProject: async (id: string): Promise<Project> => {
    if (cache && cache.spreadsheetId === id) return cache.project;
    return loadProject(id);
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const { project } = requireCache(id);
    Object.assign(project, data);
    await persist(["Project"]);
    upsertKnownProject({ id, name: project.name, client: project.client, address: project.address, projectDate: project.projectDate });
    return project;
  },

  deleteProject: async (id: string): Promise<void> => {
    removeKnownProject(id);
    if (cache?.spreadsheetId === id) cache = null;
  },

  getSummary: async (id: string): Promise<Summary> => {
    const project = cache && cache.spreadsheetId === id ? cache.project : await loadProject(id);
    return buildSummary(project);
  },

  createCategory: async (projectId: string, data: Partial<Category>): Promise<Category> => {
    const { project } = requireCache(projectId);
    const category: Category = { id: genId("cat"), name: data.name ?? "New Category", sortOrder: data.sortOrder ?? project.categories.length };
    project.categories.push(category);
    await persist(["Categories"]);
    return category;
  },
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const { project } = requireCache();
    const cat = project.categories.find((c) => c.id === id);
    if (!cat) throw new Error("Category not found");
    Object.assign(cat, data);
    await persist(["Categories"]);
    return cat;
  },
  deleteCategory: async (id: string): Promise<void> => {
    const { project } = requireCache();
    project.categories = project.categories.filter((c) => c.id !== id);
    await persist(["Categories"]);
  },

  createLineItem: async (projectId: string, data: Partial<LineItem>): Promise<LineItem> => {
    const { project } = requireCache(projectId);
    const li: LineItem = {
      id: genId("li"),
      categoryId: data.categoryId ?? null,
      code: data.code ?? null,
      description: data.description ?? "New line item",
      totalBudget: data.totalBudget ?? 0,
      scheduleMode: data.scheduleMode ?? "EVEN",
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      sortOrder: data.sortOrder ?? project.lineItems.length,
      payments: [],
      schedule: [],
    };
    project.lineItems.push(li);
    await persist(["LineItems"]);
    return li;
  },
  updateLineItem: async (id: string, data: Partial<LineItem>): Promise<LineItem> => {
    const { project } = requireCache();
    const li = project.lineItems.find((x) => x.id === id);
    if (!li) throw new Error("Line item not found");
    Object.assign(li, data);
    await persist(["LineItems"]);
    return li;
  },
  deleteLineItem: async (id: string): Promise<void> => {
    const { project } = requireCache();
    project.lineItems = project.lineItems.filter((x) => x.id !== id);
    await persist(["LineItems", "Payments"]);
  },
  setLineItemPayments: async (id: string, payments: { date: string; amount: number }[]): Promise<LineItem> => {
    const { project } = requireCache();
    const li = project.lineItems.find((x) => x.id === id);
    if (!li) throw new Error("Line item not found");
    li.payments = payments.map((p) => ({ id: genId("pay"), date: p.date, amount: p.amount }));
    await persist(["Payments"]);
    return li;
  },

  createDraw: async (projectId: string, data: Partial<Draw>): Promise<Draw> => {
    const { project } = requireCache(projectId);
    const draw: Draw = {
      id: genId("draw"),
      name: data.name ?? "New Draw",
      date: data.date ?? new Date().toISOString().slice(0, 10),
      amount: data.amount ?? 0,
      source: data.source ?? null,
      sortOrder: data.sortOrder ?? project.draws.length,
    };
    project.draws.push(draw);
    await persist(["Draws"]);
    return draw;
  },
  updateDraw: async (id: string, data: Partial<Draw>): Promise<Draw> => {
    const { project } = requireCache();
    const d = project.draws.find((x) => x.id === id);
    if (!d) throw new Error("Draw not found");
    Object.assign(d, data);
    await persist(["Draws"]);
    return d;
  },
  deleteDraw: async (id: string): Promise<void> => {
    const { project } = requireCache();
    project.draws = project.draws.filter((x) => x.id !== id);
    await persist(["Draws"]);
  },

  createMember: async (projectId: string, data: Partial<CapTableMember>): Promise<CapTableMember> => {
    const { project } = requireCache(projectId);
    const member: CapTableMember = {
      id: genId("member"),
      name: data.name ?? "New Member",
      role: data.role ?? "LP",
      ownershipPercent: data.ownershipPercent ?? null,
      sortOrder: data.sortOrder ?? project.capTable.length,
      contributions: [],
      distributions: [],
    };
    project.capTable.push(member);
    await persist(["CapTable"]);
    return member;
  },
  updateMember: async (id: string, data: Partial<CapTableMember>): Promise<CapTableMember> => {
    const { project } = requireCache();
    const m = project.capTable.find((x) => x.id === id);
    if (!m) throw new Error("Member not found");
    Object.assign(m, data);
    await persist(["CapTable"]);
    return m;
  },
  deleteMember: async (id: string): Promise<void> => {
    const { project } = requireCache();
    project.capTable = project.capTable.filter((x) => x.id !== id);
    await persist(["CapTable", "Contributions", "Distributions"]);
  },

  createContribution: async (memberId: string, data: { date: string; amount: number; note?: string }): Promise<CapTableMember> => {
    const { project } = requireCache();
    const m = project.capTable.find((x) => x.id === memberId);
    if (!m) throw new Error("Member not found");
    m.contributions.push({ id: genId("contrib"), date: data.date, amount: data.amount, note: data.note ?? null });
    await persist(["Contributions"]);
    return m;
  },
  deleteContribution: async (id: string): Promise<void> => {
    const { project } = requireCache();
    for (const m of project.capTable) m.contributions = m.contributions.filter((c) => c.id !== id);
    await persist(["Contributions"]);
  },

  createDistribution: async (memberId: string, data: { date: string; amount: number; note?: string }): Promise<CapTableMember> => {
    const { project } = requireCache();
    const m = project.capTable.find((x) => x.id === memberId);
    if (!m) throw new Error("Member not found");
    m.distributions.push({ id: genId("dist"), date: data.date, amount: data.amount, note: data.note ?? null });
    await persist(["Distributions"]);
    return m;
  },
  deleteDistribution: async (id: string): Promise<void> => {
    const { project } = requireCache();
    for (const m of project.capTable) m.distributions = m.distributions.filter((d) => d.id !== id);
    await persist(["Distributions"]);
  },

  autoSplitDistribution: async (projectId: string, data: { date: string; totalAmount: number; note?: string }): Promise<CapTableMember[]> => {
    const { project } = requireCache(projectId);
    const rows = computeCapTable(project.capTable);
    const splits = autoSplitAmount(rows, data.totalAmount);
    for (const s of splits) {
      if (s.amount === 0) continue;
      const m = project.capTable.find((x) => x.id === s.memberId);
      if (m) m.distributions.push({ id: genId("dist"), date: data.date, amount: s.amount, note: data.note ?? "Auto-split distribution" });
    }
    await persist(["Distributions"]);
    return project.capTable;
  },

  loadExampleData: async (projectId: string): Promise<Project> => {
    const { project } = requireCache(projectId);
    const categoriesByName = new Map<string, Category>();
    for (const c of EXAMPLE_DATA.categories) {
      const category: Category = { id: genId("cat"), name: c.name, sortOrder: c.sortOrder };
      project.categories.push(category);
      categoriesByName.set(c.name, category);
    }
    for (const li of EXAMPLE_DATA.lineItems) {
      const lineItem: LineItem = {
        id: genId("li"),
        categoryId: li.category ? categoriesByName.get(li.category)?.id ?? null : null,
        code: li.code,
        description: li.description,
        totalBudget: li.totalBudget,
        scheduleMode: li.scheduleMode as LineItem["scheduleMode"],
        startDate: li.startDate,
        endDate: li.endDate,
        sortOrder: li.sortOrder,
        payments: li.payments.map((p) => ({ id: genId("pay"), date: p.date, amount: p.amount })),
        schedule: [],
      };
      project.lineItems.push(lineItem);
    }
    for (const d of EXAMPLE_DATA.draws) {
      project.draws.push({ id: genId("draw"), name: d.name, date: d.date, amount: d.amount, source: d.source, sortOrder: d.sortOrder });
    }
    for (const m of EXAMPLE_DATA.capTable) {
      project.capTable.push({
        id: genId("member"),
        name: m.name,
        role: m.role,
        ownershipPercent: m.ownershipPercent,
        sortOrder: project.capTable.length,
        contributions: m.contributions.map((c) => ({ id: genId("contrib"), date: c.date, amount: c.amount, note: c.note })),
        distributions: m.distributions.map((dd) => ({ id: genId("dist"), date: dd.date, amount: dd.amount, note: dd.note })),
      });
    }
    await persist(["Categories", "LineItems", "Payments", "Draws", "CapTable", "Contributions", "Distributions"]);
    return project;
  },
};
