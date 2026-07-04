export type ScheduleMode = "EVEN" | "CUSTOM";

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface ScheduleBucket {
  date: string;
  amount: number;
}

export interface LineItem {
  id: string;
  categoryId: string | null;
  code: string | null;
  description: string;
  totalBudget: number;
  scheduleMode: ScheduleMode;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  payments: Payment[];
  schedule: ScheduleBucket[];
}

export interface Draw {
  id: string;
  name: string;
  date: string;
  amount: number;
  source: string | null;
  sortOrder: number;
}

export interface Contribution {
  id: string;
  date: string;
  amount: number;
  note: string | null;
}

export interface Distribution {
  id: string;
  date: string;
  amount: number;
  note: string | null;
}

export interface CapTableMember {
  id: string;
  name: string;
  role: string;
  ownershipPercent: number | null;
  sortOrder: number;
  contributions: Contribution[];
  distributions: Distribution[];
}

export interface Project {
  id: string;
  name: string;
  client: string | null;
  address: string | null;
  description: string | null;
  projectDate: string;
  categories: Category[];
  lineItems: LineItem[];
  draws: Draw[];
  capTable: CapTableMember[];
}

export interface ProjectListEntry {
  id: string;
  name: string;
  client: string | null;
  address: string | null;
  projectDate: string;
}

export interface SummaryLineItem {
  id: string;
  code: string | null;
  description: string;
  totalBudget: number;
  scheduleMode: ScheduleMode;
  monthly: Record<string, number>;
}

export interface SummaryCategory {
  id: string | null;
  name: string;
  lineItems: SummaryLineItem[];
  subtotal: Record<string, number>;
  subtotalTotal: number;
}

export interface CapTableRow {
  id: string;
  name: string;
  role: string;
  totalContributed: number;
  totalDistributed: number;
  netPosition: number;
  ownershipPercent: number;
  ownershipIsManual: boolean;
}

export interface SummaryDraw {
  id: string;
  name: string;
  date: string;
  amount: number;
  source: string | null;
}

export interface Summary {
  months: string[];
  categories: SummaryCategory[];
  grandTotal: { monthly: Record<string, number>; total: number };
  draws: SummaryDraw[];
  capTable: CapTableRow[];
  equityTotals: { totalContributed: number; totalDistributed: number };
}
