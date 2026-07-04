import type { Project, ProjectListEntry, Summary, LineItem, Draw, CapTableMember, Category } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
const del = (path: string) => request<void>(path, { method: "DELETE" });

export const api = {
  listProjects: () => request<ProjectListEntry[]>("/projects"),
  createProject: (data: Partial<Project>) => post<Project>("/projects", data),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  updateProject: (id: string, data: Partial<Project>) => patch<Project>(`/projects/${id}`, data),
  deleteProject: (id: string) => del(`/projects/${id}`),
  getSummary: (id: string) => request<Summary>(`/projects/${id}/summary`),

  createCategory: (projectId: string, data: Partial<Category>) =>
    post<Category>(`/projects/${projectId}/categories`, data),
  updateCategory: (id: string, data: Partial<Category>) => patch<Category>(`/categories/${id}`, data),
  deleteCategory: (id: string) => del(`/categories/${id}`),

  createLineItem: (projectId: string, data: Partial<LineItem>) =>
    post<LineItem>(`/projects/${projectId}/line-items`, data),
  updateLineItem: (id: string, data: Partial<LineItem>) => patch<LineItem>(`/line-items/${id}`, data),
  deleteLineItem: (id: string) => del(`/line-items/${id}`),
  setLineItemPayments: (id: string, payments: { date: string; amount: number }[]) =>
    put<LineItem>(`/line-items/${id}/payments`, { payments }),

  createDraw: (projectId: string, data: Partial<Draw>) => post<Draw>(`/projects/${projectId}/draws`, data),
  updateDraw: (id: string, data: Partial<Draw>) => patch<Draw>(`/draws/${id}`, data),
  deleteDraw: (id: string) => del(`/draws/${id}`),

  createMember: (projectId: string, data: Partial<CapTableMember>) =>
    post<CapTableMember>(`/projects/${projectId}/members`, data),
  updateMember: (id: string, data: Partial<CapTableMember>) =>
    patch<CapTableMember>(`/cap-table/members/${id}`, data),
  deleteMember: (id: string) => del(`/cap-table/members/${id}`),

  createContribution: (memberId: string, data: { date: string; amount: number; note?: string }) =>
    post<CapTableMember>(`/cap-table/members/${memberId}/contributions`, data),
  deleteContribution: (id: string) => del(`/cap-table/contributions/${id}`),

  createDistribution: (memberId: string, data: { date: string; amount: number; note?: string }) =>
    post<CapTableMember>(`/cap-table/members/${memberId}/distributions`, data),
  deleteDistribution: (id: string) => del(`/cap-table/distributions/${id}`),

  autoSplitDistribution: (projectId: string, data: { date: string; totalAmount: number; note?: string }) =>
    post<CapTableMember[]>(`/projects/${projectId}/distributions/auto-split`, data),
};
