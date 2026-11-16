import type { HealthColor } from "@/lib/health";

const STYLES: Record<HealthColor, { dot: string; box: string }> = {
  green: { dot: "bg-green-600", box: "border-green-600/40 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100" },
  yellow: { dot: "bg-yellow-500", box: "border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100" },
  red: { dot: "bg-red-600", box: "border-red-600/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100" },
};

// The color never appears alone: the label is always written next to it.
export function HealthBadge({ color, label }: { color: HealthColor; label: string }) {
  const style = STYLES[color];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-sm font-medium ${style.box}`}>
      <span aria-hidden="true" className={`size-2.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
