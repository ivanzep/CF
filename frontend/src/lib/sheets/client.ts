export const TAB_SCHEMA = {
  Project: ["id", "name", "client", "address", "description", "projectDate"],
  Categories: ["id", "name", "sortOrder"],
  LineItems: ["id", "categoryId", "code", "description", "totalBudget", "scheduleMode", "startDate", "endDate", "sortOrder"],
  Payments: ["id", "lineItemId", "date", "amount"],
  Draws: ["id", "name", "date", "amount", "source", "sortOrder"],
  CapTable: ["id", "name", "role", "ownershipPercent", "sortOrder"],
  Contributions: ["id", "memberId", "date", "amount", "note"],
  Distributions: ["id", "memberId", "date", "amount", "note"],
} as const;

export type TabName = keyof typeof TAB_SCHEMA;
export const TAB_NAMES = Object.keys(TAB_SCHEMA) as TabName[];

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsFetch(token: string, path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets API ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined;
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

export async function createSpreadsheet(token: string, title: string): Promise<string> {
  const created = await sheetsFetch(token, "", {
    method: "POST",
    body: JSON.stringify({
      properties: { title },
      sheets: TAB_NAMES.map((name) => ({ properties: { title: name } })),
    }),
  });
  const spreadsheetId = created.spreadsheetId as string;
  await sheetsFetch(token, `/${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: TAB_NAMES.map((name) => ({ range: `${name}!A1`, values: [TAB_SCHEMA[name] as unknown as string[]] })),
    }),
  });
  return spreadsheetId;
}

export async function readAllTabs(token: string, spreadsheetId: string): Promise<Record<TabName, string[][]>> {
  const ranges = TAB_NAMES.map((name) => `ranges=${encodeURIComponent(`${name}!A1:Z20000`)}`).join("&");
  const result = await sheetsFetch(token, `/${spreadsheetId}/values:batchGet?${ranges}`);
  const out = {} as Record<TabName, string[][]>;
  TAB_NAMES.forEach((name, i) => {
    const rows: string[][] = result.valueRanges[i]?.values ?? [];
    out[name] = rows.slice(1); // drop header row
  });
  return out;
}

export async function writeTab(token: string, spreadsheetId: string, name: TabName, rows: (string | number)[][]): Promise<void> {
  await sheetsFetch(token, `/${spreadsheetId}/values/${encodeURIComponent(`${name}!A1:Z20000`)}:clear`, {
    method: "POST",
    body: "{}",
  });
  await sheetsFetch(token, `/${spreadsheetId}/values/${encodeURIComponent(`${name}!A1`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ range: `${name}!A1`, majorDimension: "ROWS", values: [TAB_SCHEMA[name] as unknown as string[], ...rows] }),
  });
}

export async function getSpreadsheetTitle(token: string, spreadsheetId: string): Promise<string> {
  const meta = await sheetsFetch(token, `/${spreadsheetId}?fields=properties.title`);
  return meta.properties.title as string;
}
