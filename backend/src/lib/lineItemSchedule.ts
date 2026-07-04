import { Prisma } from "@prisma/client";
import { computeEvenSchedule, ScheduleBucket } from "./schedule";
import { num, isoDate } from "./dto";

interface LineItemLike {
  scheduleMode: string;
  startDate: Date | null;
  endDate: Date | null;
  totalBudget: Prisma.Decimal | number | string;
  payments: { date: Date; amount: Prisma.Decimal | number | string }[];
}

export function getLineItemSchedule(item: LineItemLike): ScheduleBucket[] {
  if (item.scheduleMode === "CUSTOM") {
    return item.payments
      .map((p) => ({ date: isoDate(p.date) as string, amount: num(p.amount) as number }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  if (!item.startDate || !item.endDate) return [];
  return computeEvenSchedule(item.startDate, item.endDate, num(item.totalBudget) as number);
}
