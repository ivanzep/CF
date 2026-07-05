export function genId(prefix: string): string {
  const random = (crypto as { randomUUID?: () => string }).randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}
