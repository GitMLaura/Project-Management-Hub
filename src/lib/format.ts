// "2026-06-30" -> "30/06/2026" (pure string handling: no time zone surprises).
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
