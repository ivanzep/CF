function storageKey(projectId: string): string {
  return `cf-month-notes:${projectId}`;
}

export function loadMonthNotes(projectId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(projectId)) || "{}");
  } catch {
    return {};
  }
}

export function saveMonthNotes(projectId: string, notes: Record<string, string>): void {
  localStorage.setItem(storageKey(projectId), JSON.stringify(notes));
}
