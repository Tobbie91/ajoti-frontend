import type { RoscaSchedule, CircleMember } from "@/utils/api";

export interface CycleRow {
  cycle: number;
  recipientName: string;
  status: "Completed" | "Current" | "Upcoming";
  payoutDate?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatNaira(kobo: string | number): string {
  const n = Number(kobo) / 100;
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
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

  let foundFirst = false;
  return sorted.map((s) => {
    const st = (s.status ?? "").toUpperCase();
    let rowStatus: CycleRow["status"];
    if (st === "COMPLETED" || st === "PAID") {
      rowStatus = "Completed";
    } else if (!foundFirst) {
      foundFirst = true;
      rowStatus = "Current";
    } else {
      rowStatus = "Upcoming";
    }
    const recipientName = s.recipientId
      ? (memberMap.get(s.recipientId) ?? `Cycle ${s.cycleNumber}`)
      : `Cycle ${s.cycleNumber}`;
    return {
      cycle: s.cycleNumber ?? 0,
      recipientName,
      status: rowStatus,
      payoutDate: s.payoutDate,
    };
  });
}
