import { Prisma } from "@prisma/client";

type Decimalish = Prisma.Decimal | number | string | null | undefined;

export function num(value: Decimalish): number | null {
  if (value == null) return null;
  return typeof value === "number" ? value : Number(value);
}

export function isoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}
