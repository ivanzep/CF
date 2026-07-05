import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Project, LineItem, Draw, CapTableMember, Category } from "./types";

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id as string),
    enabled: !!id,
  });
}

export function useSummary(id: string | undefined) {
  return useQuery({
    queryKey: ["summary", id],
    queryFn: () => api.getSummary(id as string),
    enabled: !!id,
  });
}

function useInvalidate(projectId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["project", projectId] });
    qc.invalidateQueries({ queryKey: ["summary", projectId] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };
}

export function useProjectMutations(projectId: string | undefined) {
  const invalidate = useInvalidate(projectId);

  const updateProject = useMutation({
    mutationFn: (data: Partial<Project>) => api.updateProject(projectId as string, data),
    onSuccess: invalidate,
  });

  const createCategory = useMutation({
    mutationFn: (data: Partial<Category>) => api.createCategory(projectId as string, data),
    onSuccess: invalidate,
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => api.updateCategory(id, data),
    onSuccess: invalidate,
  });
  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: invalidate,
  });

  const createLineItem = useMutation({
    mutationFn: (data: Partial<LineItem>) => api.createLineItem(projectId as string, data),
    onSuccess: invalidate,
  });
  const updateLineItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LineItem> }) => api.updateLineItem(id, data),
    onSuccess: invalidate,
  });
  const deleteLineItem = useMutation({
    mutationFn: (id: string) => api.deleteLineItem(id),
    onSuccess: invalidate,
  });
  const setLineItemPayments = useMutation({
    mutationFn: ({ id, payments }: { id: string; payments: { date: string; amount: number }[] }) =>
      api.setLineItemPayments(id, payments),
    onSuccess: invalidate,
  });

  const createDraw = useMutation({
    mutationFn: (data: Partial<Draw>) => api.createDraw(projectId as string, data),
    onSuccess: invalidate,
  });
  const createDraws = useMutation({
    mutationFn: (entries: { name: string; date: string; amount: number; source: string | null }[]) =>
      api.createDraws(projectId as string, entries),
    onSuccess: invalidate,
  });
  const updateDraw = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Draw> }) => api.updateDraw(id, data),
    onSuccess: invalidate,
  });
  const deleteDraw = useMutation({
    mutationFn: (id: string) => api.deleteDraw(id),
    onSuccess: invalidate,
  });

  const createMember = useMutation({
    mutationFn: (data: Partial<CapTableMember>) => api.createMember(projectId as string, data),
    onSuccess: invalidate,
  });
  const updateMember = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CapTableMember> }) => api.updateMember(id, data),
    onSuccess: invalidate,
  });
  const deleteMember = useMutation({
    mutationFn: (id: string) => api.deleteMember(id),
    onSuccess: invalidate,
  });

  const createContribution = useMutation({
    mutationFn: ({ memberId, date, amount, note }: { memberId: string; date: string; amount: number; note?: string }) =>
      api.createContribution(memberId, { date, amount, note }),
    onSuccess: invalidate,
  });
  const deleteContribution = useMutation({
    mutationFn: (id: string) => api.deleteContribution(id),
    onSuccess: invalidate,
  });

  const createDistribution = useMutation({
    mutationFn: ({ memberId, date, amount, note }: { memberId: string; date: string; amount: number; note?: string }) =>
      api.createDistribution(memberId, { date, amount, note }),
    onSuccess: invalidate,
  });
  const deleteDistribution = useMutation({
    mutationFn: (id: string) => api.deleteDistribution(id),
    onSuccess: invalidate,
  });

  const autoSplitDistribution = useMutation({
    mutationFn: (data: { date: string; totalAmount: number; note?: string }) =>
      api.autoSplitDistribution(projectId as string, data),
    onSuccess: invalidate,
  });

  const loadExampleData = useMutation({
    mutationFn: () => api.loadExampleData(projectId as string),
    onSuccess: invalidate,
  });

  return {
    updateProject,
    createCategory,
    updateCategory,
    deleteCategory,
    createLineItem,
    updateLineItem,
    deleteLineItem,
    setLineItemPayments,
    createDraw,
    createDraws,
    updateDraw,
    deleteDraw,
    createMember,
    updateMember,
    deleteMember,
    createContribution,
    deleteContribution,
    createDistribution,
    deleteDistribution,
    autoSplitDistribution,
    loadExampleData,
  };
}
