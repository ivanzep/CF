import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Offsets are month indices starting at Jan 2025 (offset 0).
function monthDate(offset: number): Date {
  const year = 2025 + Math.floor(offset / 12);
  const month = offset % 12;
  return new Date(Date.UTC(year, month, 1));
}

interface YearSplit {
  y2025?: number;
  y2026?: number;
  y2027?: number;
  y2028?: number;
}

/**
 * Reverse-engineers an even monthly schedule (start/end date) from a total
 * budget plus its known per-calendar-year subtotals, as shown in the source
 * spreadsheet. Tries every (numMonths, startOffset) combination and picks
 * the best fit against the yearly split (the source sheet's own per-month
 * figures aren't perfectly uniform, so this is a best-effort reconstruction,
 * not an exact replay).
 */
function deriveEvenRange(totalBudget: number, split: YearSplit): { start: Date; end: Date } {
  const target = [split.y2025 ?? 0, split.y2026 ?? 0, split.y2027 ?? 0, split.y2028 ?? 0];

  let best: { n: number; s: number; error: number } | null = null;
  for (let n = 1; n <= 36; n++) {
    const perMonth = Math.round((totalBudget / n) * 100) / 100;
    for (let s = 0; s <= 47 - n + 1; s++) {
      const buckets = [0, 0, 0, 0];
      let allocated = 0;
      for (let k = 0; k < n; k++) {
        const isLast = k === n - 1;
        const amount = isLast ? Math.round((totalBudget - allocated) * 100) / 100 : perMonth;
        allocated += amount;
        const yearIdx = Math.floor((s + k) / 12);
        if (yearIdx > 3) continue;
        buckets[yearIdx] += amount;
      }
      const error = buckets.reduce((sumErr, b, i) => sumErr + Math.abs(b - target[i]), 0);
      if (!best || error < best.error - 0.01 || (Math.abs(error - best.error) <= 0.01 && n > best.n)) {
        best = { n, s, error };
      }
    }
  }

  return { start: monthDate(best!.s), end: monthDate(best!.s + best!.n - 1) };
}

interface SeedLineItem {
  code: string;
  description: string;
  totalBudget: number;
  split: YearSplit;
}

const ACQUISITION: SeedLineItem[] = [
  { code: "1.00", description: "LAND ACQUISITION", totalBudget: 5_395_324, split: { y2025: 5_395_324 } },
];

const STARTUP: SeedLineItem[] = [
  { code: "1.01", description: "PROJECT MANAGEMENT / DEVELOPER FEE (50%)", totalBudget: 217_000, split: { y2025: 36_166.67, y2026: 180_833.33 } },
  { code: "1.02", description: "ARCHITECTURE AND INTERIORS", totalBudget: 900_000, split: { y2025: 254_161.62, y2026: 645_838.38 } },
  { code: "1.03", description: "CIVIL ENGINEER", totalBudget: 24_200, split: { y2025: 12_418.18, y2026: 11_781.82 } },
  { code: "1.04", description: "DRY UTILITIES", totalBudget: 43_800, split: { y2025: 7_963.64, y2026: 35_836.36 } },
  { code: "1.05", description: "STRUCTURAL", totalBudget: 43_000, split: { y2025: 4_300, y2026: 38_700 } },
  { code: "1.06", description: "MEP", totalBudget: 72_000, split: { y2025: 7_200, y2026: 64_800 } },
  { code: "1.07", description: "PERMIT EXPEDITOR", totalBudget: 11_925, split: { y2026: 11_925 } },
  { code: "1.08", description: "LANDSCAPE", totalBudget: 72_800, split: { y2025: 24_266.67, y2026: 48_533.33 } },
  { code: "1.09", description: "GEOTECH", totalBudget: 3_500, split: { y2025: 3_500 } },
  { code: "1.10", description: "KITCHEN DESIGN CONSULTANT", totalBudget: 25_000, split: { y2026: 25_000 } },
  { code: "1.11", description: "AUDIO / VIDEO CONSULTANT", totalBudget: 30_000, split: { y2026: 30_000 } },
  { code: "1.13", description: "ADMIN LEGAL", totalBudget: 15_000, split: { y2025: 5_020, y2026: 9_980 } },
  { code: "1.14", description: "PERMITS & FEES", totalBudget: 210_396, split: { y2026: 210_396 } },
  { code: "1.15", description: "REAL ESTATE TAXES (50% OF TOTAL)", totalBudget: 42_988, split: { y2025: 14_115.5, y2026: 28_872.5 } },
  { code: "1.16", description: "INSURANCE & BONDS", totalBudget: 500_089, split: { y2026: 500_089 } },
  { code: "1.17", description: "50% SOFT COST CONTINGENCY", totalBudget: 53_132, split: { y2025: 9_660.36, y2026: 43_471.64 } },
  { code: "1.18", description: "MARKETING & ADVERTISING", totalBudget: 77_750, split: { y2025: 19_250, y2026: 58_500 } },
  { code: "1.19", description: "ENTITLEMENTS CONSULTANTS", totalBudget: 87_532, split: { y2025: 56_824, y2026: 30_708 } },
  { code: "1.20", description: "ENVIRONMENTAL / SITE CONDITIONS", totalBudget: 250_000, split: { y2026: 83_333.33, y2027: 166_666.67 } },
  { code: "1.21", description: "DEVELOPER STARTUP FEE (CONVERTED TO BROWN EQUITY)", totalBudget: 604_495, split: { y2026: 604_495 } },
];

// 1.12 ALCOHOL LICENCE is seeded separately below as a CUSTOM schedule
// (annual renewal fee on specific dates rather than an even monthly spread).

const CONSTRUCTION: SeedLineItem[] = [
  { code: "2.01", description: "GC FEE / CONSTRUCTION MANAGEMENT (5.8%)", totalBudget: 890_575, split: { y2026: 148_429.17, y2027: 445_287.5, y2028: 296_858.33 } },
  { code: "2.02", description: "GENERAL CONDITIONS", totalBudget: 150_744, split: { y2026: 25_124, y2027: 75_372, y2028: 50_248 } },
  { code: "2.03", description: "PRECON", totalBudget: 41_465, split: { y2026: 6_910.83, y2027: 20_732.5, y2028: 13_821.67 } },
  { code: "2.04", description: "STAFFING", totalBudget: 482_628, split: { y2026: 80_438, y2027: 241_314, y2028: 160_876 } },
  { code: "2.05", description: "PROJECT MANAGEMENT / DEVELOPER FEE (50%)", totalBudget: 217_000, split: { y2026: 36_166.67, y2027: 108_500, y2028: 72_333.33 } },
  { code: "2.06", description: "SIGNAGE / TRAFFIC / UTILITIES - MONTH 1", totalBudget: 30_000, split: { y2026: 12_857.14, y2027: 17_142.86 } },
  { code: "2.07", description: "SITE TESTING AND INSPECTIONS", totalBudget: 120_000, split: { y2026: 60_000, y2027: 60_000 } },
  { code: "2.08", description: "PERMIT ISSUANCE", totalBudget: 77_698, split: { y2026: 77_698 } },
  { code: "2.09", description: "REAL ESTATE TAXES (50% OF TOTAL)", totalBudget: 42_988, split: { y2026: 7_164.67, y2027: 21_494, y2028: 14_329.33 } },
  { code: "2.10", description: "MARKETING & ADVERTISING", totalBudget: 77_750, split: { y2026: 12_958.33, y2027: 38_875, y2028: 25_916.67 } },
  { code: "2.11", description: "50% SOFT COST CONTINGENCY (5% OF TOTAL)", totalBudget: 53_132, split: { y2026: 8_855.33, y2027: 26_566, y2028: 17_710.67 } },
  { code: "2.12", description: "CONSTRUCTION LOAN INTEREST", totalBudget: 161_200, split: { y2026: 161_200 } },
];

async function main() {
  const existing = await prisma.project.findFirst({ where: { name: "La Costa Hotel" } });
  if (existing) {
    console.log("Seed project already exists, skipping.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "La Costa Hotel",
      client: "",
      address: "",
      description: "",
      projectDate: new Date(),
    },
  });

  const categories = {
    acquisition: await prisma.category.create({ data: { projectId: project.id, name: "ACQUISITION", sortOrder: 0 } }),
    startup: await prisma.category.create({ data: { projectId: project.id, name: "PROJECT START-UP", sortOrder: 1 } }),
    construction: await prisma.category.create({ data: { projectId: project.id, name: "CONSTRUCTION AND FEES", sortOrder: 2 } }),
  };

  let sortOrder = 0;
  for (const item of ACQUISITION) {
    await prisma.lineItem.create({
      data: {
        projectId: project.id,
        categoryId: categories.acquisition.id,
        code: item.code,
        description: item.description,
        totalBudget: item.totalBudget,
        scheduleMode: "CUSTOM",
        sortOrder: sortOrder++,
        payments: { create: [{ date: monthDate(10), amount: item.totalBudget }] }, // Nov 2025
      },
    });
  }

  sortOrder = 0;
  for (const item of STARTUP) {
    const { start, end } = deriveEvenRange(item.totalBudget, item.split);
    await prisma.lineItem.create({
      data: {
        projectId: project.id,
        categoryId: categories.startup.id,
        code: item.code,
        description: item.description,
        totalBudget: item.totalBudget,
        scheduleMode: "EVEN",
        startDate: start,
        endDate: end,
        sortOrder: sortOrder++,
      },
    });
  }

  // 1.12 Alcohol Licence: annual renewal fee on two specific dates.
  await prisma.lineItem.create({
    data: {
      projectId: project.id,
      categoryId: categories.startup.id,
      code: "1.12",
      description: "ALCOHOL LICENCE",
      totalBudget: 100_000,
      scheduleMode: "CUSTOM",
      sortOrder: sortOrder++,
      payments: {
        create: [
          { date: new Date(Date.UTC(2027, 0, 1)), amount: 50_000 },
          { date: new Date(Date.UTC(2028, 0, 1)), amount: 50_000 },
        ],
      },
    },
  });

  sortOrder = 0;
  for (const item of CONSTRUCTION) {
    const { start, end } = deriveEvenRange(item.totalBudget, item.split);
    await prisma.lineItem.create({
      data: {
        projectId: project.id,
        categoryId: categories.construction.id,
        code: item.code,
        description: item.description,
        totalBudget: item.totalBudget,
        scheduleMode: "EVEN",
        startDate: start,
        endDate: end,
        sortOrder: sortOrder++,
      },
    });
  }

  await prisma.draw.createMany({
    data: [
      { projectId: project.id, name: "Draw 1", date: new Date(Date.UTC(2026, 8, 1)), amount: 600_000, source: "Construction Loan", sortOrder: 0 },
      { projectId: project.id, name: "Draw 2", date: new Date(Date.UTC(2027, 2, 1)), amount: 527_318.15, source: "Construction Loan", sortOrder: 1 },
    ],
  });

  const gp = await prisma.capTableMember.create({
    data: { projectId: project.id, name: "GP", role: "GP", ownershipPercent: 13, sortOrder: 0 },
  });
  const lp = await prisma.capTableMember.create({
    data: { projectId: project.id, name: "LP", role: "LP", ownershipPercent: 87, sortOrder: 1 },
  });

  await prisma.contribution.create({
    data: { memberId: gp.id, date: new Date(Date.UTC(2025, 10, 1)), amount: 1_100_000, note: "Initial capital contribution" },
  });
  await prisma.contribution.create({
    data: { memberId: lp.id, date: new Date(Date.UTC(2025, 10, 1)), amount: 7_577_460, note: "Initial capital contribution" },
  });

  console.log(`Seeded project ${project.id} (${project.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
