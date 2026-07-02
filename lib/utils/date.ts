export function getUtcDayBounds(date: Date): { start: string; end: string } {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function isSameUtcDay(left: string | Date, right: string | Date): boolean {
  const a = typeof left === "string" ? new Date(left) : left;
  const b = typeof right === "string" ? new Date(right) : right;

  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
