interface MemberWithRelations {
  id: string;
  name: string;
  role: string;
  ownershipPercent: number | null;
  contributions: { amount: number }[];
  distributions: { amount: number }[];
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

export function computeCapTable(members: MemberWithRelations[]): CapTableRow[] {
  const totals = members.map((m) => ({
    member: m,
    totalContributed: sum(m.contributions.map((c) => c.amount)),
    totalDistributed: sum(m.distributions.map((d) => d.amount)),
  }));

  const manualTotalPercent = sum(
    members.filter((m) => m.ownershipPercent != null).map((m) => m.ownershipPercent as number)
  );
  const remainingPercent = Math.max(0, 100 - manualTotalPercent);
  const proRataBase = sum(
    totals.filter((t) => t.member.ownershipPercent == null).map((t) => t.totalContributed)
  );

  return totals.map(({ member, totalContributed, totalDistributed }) => {
    let ownershipPercent: number;
    if (member.ownershipPercent != null) {
      ownershipPercent = member.ownershipPercent;
    } else if (proRataBase > 0) {
      ownershipPercent = (totalContributed / proRataBase) * remainingPercent;
    } else {
      ownershipPercent = 0;
    }
    return {
      id: member.id,
      name: member.name,
      role: member.role,
      totalContributed,
      totalDistributed,
      netPosition: totalContributed - totalDistributed,
      ownershipPercent: round(ownershipPercent),
      ownershipIsManual: member.ownershipPercent != null,
    };
  });
}

export function autoSplitAmount(
  rows: Pick<CapTableRow, "id" | "ownershipPercent">[],
  totalAmount: number
): { memberId: string; amount: number }[] {
  const totalPercent = sum(rows.map((r) => r.ownershipPercent));
  if (totalPercent <= 0) return rows.map((r) => ({ memberId: r.id, amount: 0 }));

  let allocated = 0;
  return rows.map((r, i) => {
    const isLast = i === rows.length - 1;
    const amount = isLast
      ? round(totalAmount - allocated)
      : round((r.ownershipPercent / totalPercent) * totalAmount);
    allocated += amount;
    return { memberId: r.id, amount };
  });
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
