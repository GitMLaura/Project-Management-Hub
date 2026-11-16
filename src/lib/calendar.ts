// Month grid for the deadline calendar on the Status page. Pure: no database, no clock.

export type CalendarDeadline = { deadline: string; done: boolean }; // YYYY-MM-DD

export type CalendarDay = {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  count: number; // tasks due that day that are not done yet
  late: number; // of those, how many are already past due
};

export type CalendarMonth = {
  label: string; // "novembro 2026"
  prev: string; // "2026-10"
  next: string; // "2026-12"
  weeks: CalendarDay[][]; // Sunday first
};

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const DAY_MS = 24 * 60 * 60 * 1000;

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// "2026-12" -> {2026, 12}. Anything else falls back to the month of `today`.
export function parseMonth(raw: string | undefined, today: string): { year: number; month: number } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw ?? "");
  const source = match ? `${match[1]}-${match[2]}` : today.slice(0, 7);
  return { year: Number(source.slice(0, 4)), month: Number(source.slice(5, 7)) };
}

export function buildCalendarMonth(input: {
  year: number;
  month: number; // 1-12
  today: string;
  deadlines: readonly CalendarDeadline[];
}): CalendarMonth {
  const { year, month, today } = input;
  const first = Date.UTC(year, month - 1, 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOffset = new Date(first).getUTCDay(); // 0 = Sunday
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const pending = input.deadlines.filter((item) => !item.done);
  const weeks: CalendarDay[][] = [];
  for (let cell = 0; cell < totalCells; cell += 1) {
    const date = iso(first + (cell - startOffset) * DAY_MS);
    const due = pending.filter((item) => item.deadline === date);
    const day: CalendarDay = {
      iso: date,
      day: Number(date.slice(8, 10)),
      inMonth: date.slice(0, 7) === monthKey(year, month),
      isToday: date === today,
      count: due.length,
      late: date < today ? due.length : 0,
    };
    if (cell % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(day);
  }

  const prev = month === 1 ? monthKey(year - 1, 12) : monthKey(year, month - 1);
  const next = month === 12 ? monthKey(year + 1, 1) : monthKey(year, month + 1);
  return { label: `${MONTHS[month - 1]} ${year}`, prev, next, weeks };
}
