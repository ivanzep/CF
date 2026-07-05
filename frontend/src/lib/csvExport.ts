import type { Project, Summary } from "../types";

export type ExportSection = "project" | "lineItems" | "draws" | "capTable" | "summary";

export const EXPORT_SECTION_LABELS: Record<ExportSection, string> = {
  project: "Project info",
  lineItems: "Line items",
  draws: "Draws",
  capTable: "Cap table",
  summary: "Cash flow summary (monthly grid)",
};

export const EXPORT_SECTION_ORDER: ExportSection[] = ["project", "lineItems", "draws", "capTable", "summary"];

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function money(n: number | null | undefined): number {
  return Math.round(((n ?? 0) + Number.EPSILON) * 100) / 100;
}

function toCsvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvEscape).join(",");
}

export function buildProjectCsv(project: Project): string {
  return [
    toCsvRow(["Field", "Value"]),
    toCsvRow(["Name", project.name]),
    toCsvRow(["Client", project.client]),
    toCsvRow(["Address", project.address]),
    toCsvRow(["Description", project.description]),
    toCsvRow(["Date", project.projectDate]),
  ].join("\n");
}

export function buildLineItemsCsv(project: Project): string {
  const catName = (id: string | null) => project.categories.find((c) => c.id === id)?.name ?? "";
  const rows = [
    toCsvRow(["Category", "Code", "Description", "Budget", "Schedule Mode", "Start Date", "End Date", "Payment Date", "Payment Amount"]),
  ];
  for (const li of project.lineItems) {
    if (li.scheduleMode === "CUSTOM" && li.payments.length) {
      for (const p of li.payments) {
        rows.push(
          toCsvRow([catName(li.categoryId), li.code, li.description, money(li.totalBudget), li.scheduleMode, "", "", p.date, money(p.amount)])
        );
      }
    } else {
      rows.push(
        toCsvRow([catName(li.categoryId), li.code, li.description, money(li.totalBudget), li.scheduleMode, li.startDate, li.endDate, "", ""])
      );
    }
  }
  return rows.join("\n");
}

export function buildDrawsCsv(project: Project): string {
  const rows = [toCsvRow(["Name", "Date", "Amount", "Source"])];
  for (const d of project.draws) rows.push(toCsvRow([d.name, d.date, money(d.amount), d.source]));
  return rows.join("\n");
}

export function buildCapTableCsv(project: Project): string {
  const rows = [toCsvRow(["Member", "Role", "Ownership %", "Type", "Date", "Amount", "Note"])];
  for (const m of project.capTable) {
    if (!m.contributions.length && !m.distributions.length) {
      rows.push(toCsvRow([m.name, m.role, m.ownershipPercent, "", "", "", ""]));
    }
    for (const c of m.contributions) {
      rows.push(toCsvRow([m.name, m.role, m.ownershipPercent, "Contribution", c.date, money(c.amount), c.note]));
    }
    for (const d of m.distributions) {
      rows.push(toCsvRow([m.name, m.role, m.ownershipPercent, "Distribution", d.date, money(d.amount), d.note]));
    }
  }
  return rows.join("\n");
}

export function buildSummaryCsv(summary: Summary): string {
  const header = ["Line item", "Budget", ...summary.months];
  const rows = [toCsvRow(header)];
  for (const cat of summary.categories) {
    rows.push(toCsvRow([cat.name, "", ...summary.months.map(() => "")]));
    for (const li of cat.lineItems) {
      rows.push(
        toCsvRow([
          li.code ? `${li.code} ${li.description}` : li.description,
          money(li.totalBudget),
          ...summary.months.map((m) => money(li.monthly[m])),
        ])
      );
    }
    rows.push(toCsvRow([`Total ${cat.name}`, money(cat.subtotalTotal), ...summary.months.map((m) => money(cat.subtotal[m]))]));
  }
  rows.push(
    toCsvRow(["Grand Total", money(summary.grandTotal.total), ...summary.months.map((m) => money(summary.grandTotal.monthly[m]))])
  );
  return rows.join("\n");
}

export function buildCombinedCsv(project: Project, summary: Summary | undefined, sections: ExportSection[]): string {
  const parts: string[] = [];
  for (const s of sections) {
    parts.push(`# ${EXPORT_SECTION_LABELS[s]}`);
    if (s === "project") parts.push(buildProjectCsv(project));
    if (s === "lineItems") parts.push(buildLineItemsCsv(project));
    if (s === "draws") parts.push(buildDrawsCsv(project));
    if (s === "capTable") parts.push(buildCapTableCsv(project));
    if (s === "summary" && summary) parts.push(buildSummaryCsv(summary));
    parts.push("");
  }
  return parts.join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
