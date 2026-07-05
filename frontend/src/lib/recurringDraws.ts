function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const totalMonth = y * 12 + (m - 1) + months;
  const newYear = Math.floor(totalMonth / 12);
  const newMonth = totalMonth % 12;
  const daysInMonth = new Date(newYear, newMonth + 1, 0).getDate();
  const day = Math.min(d, daysInMonth);
  return `${newYear}-${String(newMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface RecurringDrawsInput {
  startDate: string;
  intervalMonths: number;
  count: number;
  totalAmount: number;
  splitEvenly: boolean;
  namePrefix: string;
  source: string | null;
  startIndex: number;
}

export interface GeneratedDraw {
  name: string;
  date: string;
  amount: number;
  source: string | null;
}

export function generateRecurringDraws(input: RecurringDrawsInput): GeneratedDraw[] {
  const amountEach = input.splitEvenly ? round2(input.totalAmount / input.count) : input.totalAmount;
  let allocated = 0;
  const draws: GeneratedDraw[] = [];
  for (let i = 0; i < input.count; i++) {
    const isLast = i === input.count - 1;
    const amount = input.splitEvenly ? (isLast ? round2(input.totalAmount - allocated) : amountEach) : amountEach;
    allocated += amount;
    draws.push({
      name: `${input.namePrefix} ${input.startIndex + i}`,
      date: addMonths(input.startDate, i * input.intervalMonths),
      amount,
      source: input.source,
    });
  }
  return draws;
}
