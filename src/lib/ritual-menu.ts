// Which encontro the Encontros page shows: the menu lists the kinds (daily, weekly...),
// and each kind shows its newest encontro unless another one is asked for. Pure.
import { RITUAL_KINDS, isRitualKind, type RitualKind } from "@/lib/transcripts";

type Meeting = { id: string; kind: RitualKind; heldOn: string };

// Menu order: the four everyday kinds first; "review" only when the project has one.
export function menuKinds(meetings: readonly Meeting[]): { value: RitualKind; label: string; count: number }[] {
  const order: RitualKind[] = ["daily", "weekly", "retro", "planning", "review"];
  return order
    .map((value) => ({
      value,
      label: RITUAL_KINDS.find((kind) => kind.value === value)?.label ?? value,
      count: meetings.filter((meeting) => meeting.kind === value).length,
    }))
    .filter((item) => item.value !== "review" || item.count > 0);
}

// The chosen kind (falls back to the first one that has encontros) and its encontros, newest first.
export function pickMeetings<T extends Meeting>(
  meetings: readonly T[],
  rawKind: string | undefined,
  rawId: string | undefined,
): { kind: RitualKind; list: T[]; current: T | null } {
  const withMeetings = menuKinds(meetings).find((item) => item.count > 0)?.value ?? "daily";
  const kind = isRitualKind(rawKind) ? rawKind : withMeetings;
  const list = meetings.filter((meeting) => meeting.kind === kind).sort((a, b) => b.heldOn.localeCompare(a.heldOn));
  const current = list.find((meeting) => meeting.id === rawId) ?? list[0] ?? null;
  return { kind, list, current };
}
