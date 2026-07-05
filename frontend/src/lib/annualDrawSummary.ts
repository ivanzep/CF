import type { SummaryDraw } from "../types";

export function yearOf(month: string): string {
  return month.slice(0, 4);
}

export function monthAfter(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const total = y * 12 + (m - 1) + 1;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function drawPeriodMonths(
  months: string[],
  sortedDraws: SummaryDraw[],
  activeDrawId: string | undefined
): string[] {
  const activeIndex = sortedDraws.findIndex((d) => d.id === activeDrawId);
  if (activeIndex < 0) return [];
  const activeDraw = sortedDraws[activeIndex];
  const previousDraw = activeIndex > 0 ? sortedDraws[activeIndex - 1] : undefined;
  const endMonth = activeDraw.date.slice(0, 7);
  const startMonth = previousDraw ? monthAfter(previousDraw.date.slice(0, 7)) : months[0]?.slice(0, 7);
  if (!startMonth) return [];
  return months.filter((m) => {
    const mm = m.slice(0, 7);
    return mm >= startMonth && mm <= endMonth;
  });
}
