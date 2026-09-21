import type { IncidentStatus } from "../../types/traffic";

const STATUS_STYLES: Record<IncidentStatus, { bg: string; fg: string }> = {
  Active: {
    bg: "bg-red-50 dark:bg-red-500/10",
    fg: "text-red-700 dark:text-red-400",
  },
  Investigating: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    fg: "text-amber-700 dark:text-amber-400",
  },
  Resolved: {
    bg: "bg-green-50 dark:bg-green-500/10",
    fg: "text-green-700 dark:text-green-400",
  },
};

export default function StatusBadge({ status }: { status: IncidentStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.fg}`}
    >
      {status}
    </span>
  );
}
