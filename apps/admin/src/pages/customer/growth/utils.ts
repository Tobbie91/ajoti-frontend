import { formatKobo } from "@/utils/kobo";
import type { RoscaSchedule, CircleMember } from "@/utils/api";

export interface CycleRow {
  cycle: number;
  recipientName: string;
  status: "Completed" | "Current" | "Upcoming" | "Skipped" | "Cancelled" | "Unavailable";
  payoutDate?: string;
  contributionDeadline?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatNaira(kobo: string | number): string {
  return formatKobo(kobo);
}

export function getRatingColor(value: number): string {
  if (value >= 80) return "#02A36E";
  if (value >= 60) return "#10B981";
  if (value >= 40) return "#F59E0B";
  return "#EF4444";
}

export function circleStatusBadge(status: string): {
  bg: string;
  color: string;
  label: string;
} {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return { bg: "#D1FAE5", color: "#065F46", label: "Active" };
    case "COMPLETED":
      return { bg: "#DBEAFE", color: "#1E40AF", label: "Completed" };
    case "CANCELLED":
      return { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" };
    default:
      return { bg: "#FEF3C7", color: "#92400E", label: status ?? "Draft" };
  }
}

export function mapSchedulesToCycles(
  schedules: RoscaSchedule[],
  members: CircleMember[],
): CycleRow[] {
  const memberMap = new Map(members.map((m) => [m.userId, m.name]));
  const sorted = [...schedules].sort(
    (a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0),
  );

  return sorted.map((s) => {
    const st = (s.status ?? "").toUpperCase();
    const rowStatus: CycleRow["status"] = ({ COMPLETED: 'Completed', PAID: 'Completed', IN_PROGRESS: 'Current', UPCOMING: 'Upcoming', SKIPPED: 'Skipped', CANCELLED: 'Cancelled' } as const)[st as 'COMPLETED'] ?? 'Unavailable';
    const recipientName = s.recipientName ?? (s.recipientId
      ? (memberMap.get(s.recipientId) ?? `Cycle ${s.cycleNumber}`)
      : `Cycle ${s.cycleNumber}`);
    return {
      cycle: s.cycleNumber ?? 0,
      recipientName,
      status: rowStatus,
      payoutDate: s.payoutDate,
      contributionDeadline: s.contributionDeadline,
    };
  });
}
