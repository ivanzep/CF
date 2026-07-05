import type { ProjectListEntry } from "../types";

const KEY = "cf_known_projects";

export function listKnownProjects(): ProjectListEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProjectListEntry[]) : [];
  } catch {
    return [];
  }
}

export function upsertKnownProject(entry: ProjectListEntry): void {
  const list = listKnownProjects().filter((p) => p.id !== entry.id);
  list.push(entry);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function removeKnownProject(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(listKnownProjects().filter((p) => p.id !== id)));
}
