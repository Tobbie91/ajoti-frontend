import { useEffect, useState } from "react";
import {
  Text,
  Badge,
  RingProgress,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconCheck,
  IconClock,
  IconMessageCircle,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  getAllCircleContributions,
  type CircleContribution,
  type CircleMember,
  type Contribution,
} from "@/utils/api";
import { RoscaCommitments } from "@/components/RoscaCommitments";
import { formatNaira, type CycleRow } from "./utils";

type MemberStatus = "paid" | "partial" | "unpaid" | "defaulted";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || "?").toUpperCase();
}

function fmtDateShort(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
  } catch {
    return "—";
  }
}

function fmtTimeShort(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "—";
  }
}

function fmtDateLong(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function StatusPill({ status }: { status: MemberStatus }) {
  const tones = {
    paid: { bg: "#DCFCE7", color: "#065F46", label: "Paid" },
    partial: { bg: "#DBEAFE", color: "#1E40AF", label: "Partial" },
    unpaid: { bg: "#FEF3C7", color: "#92400E", label: "Unpaid" },
    defaulted: { bg: "#B91C1C", color: "#FFFFFF", label: "Defaulted" },
  }[status];
  return (
    <span
      style={{
        display: "inline-block",
        background: tones.bg,
        color: tones.color,
        fontSize: 10.5,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      {tones.label}
    </span>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

export function OverviewTab({
  circleName,
  circleId,
  circleStatus,
  statusBadge,
  nextPaymentDate,
  contributionAmountKobo,
  frequency,
  userStatus,
  totalContributedKobo,
  completedCycles,
  totalCycles,
  progressPercent,
  cycles,
  members,
  currentUserId,
  currentCycleNumber,
  ownContributions,
  refreshVersion,
}: {
  circleName: string;
  circleId: string;
  circleStatus: string;
  statusBadge: { bg: string; color: string; label: string };
  nextPaymentDate: string;
  contributionAmountKobo: string | number;
  frequency: string;
  userStatus: string;
  totalContributedKobo: number;
  completedCycles: number;
  totalCycles: number;
  progressPercent: number;
  cycles: CycleRow[];
  members: CircleMember[];
  currentUserId: string;
  currentCycleNumber?: number;
  ownContributions: CircleContribution[];
  refreshVersion: number;
}) {
  const navigate = useNavigate();
  const canRequestExit = userStatus === "ACTIVE" && (circleStatus === "DRAFT" || circleStatus === "ACTIVE");

  // Circle members and admins can read cycle contributions; non-members fall
  // back to their own payment history only.
  const [allContribs, setAllContribs] = useState<Contribution[] | null>(null);
  const [allContribsAccess, setAllContribsAccess] = useState<"loading" | "granted" | "denied">("loading");

  useEffect(() => {
    let active = true;
    setAllContribsAccess("loading");
    getAllCircleContributions(circleId)
      .then((rows) => {
        if (!active) return;
        setAllContribs(rows);
        setAllContribsAccess("granted");
      })
      .catch(() => {
        if (!active) return;
        setAllContribs(null);
        setAllContribsAccess("denied");
      });
    return () => { active = false; };
  }, [circleId, refreshVersion]);

  // Pick which cycle to display in the roster. Default = current. User can
  // scroll back through completed cycles.
  const [rosterCycle, setRosterCycle] = useState<number | undefined>(currentCycleNumber);
  useEffect(() => {
    if (currentCycleNumber != null) setRosterCycle(currentCycleNumber);
  }, [currentCycleNumber]);

  const availableCycles = (() => {
    const set = new Set<number>();
    cycles.forEach((c) => set.add(c.cycle));
    if (currentCycleNumber != null) set.add(currentCycleNumber);
    return Array.from(set).sort((a, b) => a - b);
  })();

  // Build the selected-cycle paid/partial/unpaid/defaulted roster.
  type RosterRow = {
    userId: string;
    name: string;
    isSelf: boolean;
    status: MemberStatus;
    paidAt?: string;
    isLate?: boolean;
    amount?: string;
  };
  const activeCycle = rosterCycle ?? currentCycleNumber;
  const isHistoricalCycle = activeCycle != null && currentCycleNumber != null && activeCycle < currentCycleNumber;

  const roster: RosterRow[] = members.map((m) => {
    let paid = false;
    let partial = false;
    let paidAt: string | undefined;
    let isLate: boolean | undefined;
    let amount: string | undefined;

    if (activeCycle != null) {
      if (allContribsAccess === "granted" && allContribs) {
        const row = allContribs.find(
          (c) => c.userId === m.userId && c.cycleNumber === activeCycle && c.paidAt,
        );
        if (row) {
          amount = row.amount;
          paid = BigInt(row.amount) >= BigInt(contributionAmountKobo);
          partial = !paid;
          paidAt = row.paidAt ?? undefined;
          isLate = row.isLate;
        }
      } else if (m.userId === currentUserId) {
        // At least we always know our own status via ownContributions.
        const row = ownContributions.find((c) => c.cycleNumber === activeCycle);
        if (row) {
          amount = row.amount;
          paid = BigInt(row.amount) >= BigInt(contributionAmountKobo);
          partial = !paid;
          paidAt = row.paidAt;
        }
      }
    }
    // Status priority: paid (full) > partial (some paid) > defaulted (historical, nothing paid) > unpaid.
    const status: MemberStatus = paid
      ? "paid"
      : partial
        ? "partial"
        : isHistoricalCycle
          ? "defaulted"
          : "unpaid";
    return {
      userId: m.userId,
      name: m.name || `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Member",
      isSelf: m.userId === currentUserId,
      status,
      paidAt,
      isLate,
      amount,
    };
  }).sort((a, b) => {
    const order = { paid: 0, partial: 1, unpaid: 2, defaulted: 3 } as const;
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    return a.name.localeCompare(b.name);
  });

  const paidCount = roster.filter((r) => r.status === "paid").length;
  const partialCount = roster.filter((r) => r.status === "partial").length;
  const unpaidCount = roster.filter((r) => r.status === "unpaid").length;
  const defaultedCount = roster.filter((r) => r.status === "defaulted").length;
  const totalMembers = roster.length;

  // Latest server-recorded timestamp across the roster, used for "Last updated".
  const lastUpdatedIso: string | undefined = roster
    .map((r) => r.paidAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .pop();

  // "Due" line text for the active cycle.
  const dueDateStr = fmtDateShort(cycles.find(c => c.cycle === activeCycle)?.contributionDeadline);


  return (
    <div className="flex flex-col gap-5">
      {/* Group Header */}
      <div className="flex items-center gap-3">
        <Text fw={700} className="text-[20px] text-[#0F172A]">
          {circleName}
        </Text>
        <Badge
          size="md"
          radius="xl"
          styles={{
            root: {
              backgroundColor: statusBadge.bg,
              color: statusBadge.color,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 12,
            },
          }}
        >
          {statusBadge.label}
        </Badge>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4">
        <IconInfoCircle size={20} color="#0284C7" className="mt-0.5 flex-shrink-0" />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          {completedCycles > 0
            ? `${completedCycles} of ${totalCycles} cycles completed. Keep up the great work!`
            : circleStatus === 'DRAFT'
              ? 'The organiser must fill all member slots and start the group before contributions begin.'
              : circleStatus === 'ACTIVE' || circleStatus === 'STARTED'
                ? `Ajo has started. Cycle ${currentCycleNumber ?? 1} is open — the first contribution kicks off the first payout.`
                : 'Your ajo is getting ready.'}
          {!["Schedule unavailable", "All payouts completed"].includes(nextPaymentDate) && completedCycles > 0
            ? ` The next group payout is scheduled for ${nextPaymentDate}.`
            : ""}
        </Text>
      </div>

      {/* ─── Cycle contributions card ──────────────────────────────── */}
      {allContribsAccess !== "granted" && <Text role="status" c={allContribsAccess === "denied" ? "red" : "dimmed"}>{allContribsAccess === "loading" ? "Loading circle payment progress…" : "Unable to load circle payment progress. Refresh to try again."}</Text>}
      {allContribsAccess === "granted" && activeCycle != null && members.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          {/* Header: title + per-member + due + last-updated | cycle pills */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Text fw={700} className="text-[18px] text-[#0F172A]">
                Cycle {activeCycle} contributions
              </Text>
              <Text className="mt-1 text-[12.5px] text-[#64748B]">
                {formatNaira(contributionAmountKobo)} per member · {members.length} member{members.length === 1 ? "" : "s"} · Due {dueDateStr || "[DUE DATE]"}
              </Text>
              {lastUpdatedIso && (
                <Text className="mt-1 text-[11.5px] text-[#94A3B8]">
                  Last updated {fmtDateLong(lastUpdatedIso)}
                </Text>
              )}
            </div>
            {availableCycles.length > 1 && (
              <div className="flex items-center gap-2">
                <Text className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Cycle
                </Text>
                <div className="flex max-w-[65vw] gap-1.5 overflow-x-auto">
                  {availableCycles.map((n) => {
                    const isActive = n === activeCycle;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRosterCycle(n)}
                        aria-label={`View cycle ${n}`}
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[13px] font-bold transition-colors ${
                          isActive
                            ? "bg-[#0B6B55] text-white"
                            : "border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F3F4F6]"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Circle progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <Text fw={600} className="text-[13.5px] text-[#0F172A]">
                Circle progress
              </Text>
              <Text className="text-[12px] text-[#64748B]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {paidCount} paid · {partialCount} partial · {unpaidCount} unpaid · {defaultedCount} defaulted
              </Text>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
              {totalMembers > 0 && (
                <>
                  <div style={{ width: `${(paidCount / totalMembers) * 100}%`, background: "#02A36E" }} />
                  <div style={{ width: `${(partialCount / totalMembers) * 100}%`, background: "#60A5FA" }} />
                  <div style={{ width: `${(unpaidCount / totalMembers) * 100}%`, background: "#FDE68A" }} />
                  <div style={{ width: `${(defaultedCount / totalMembers) * 100}%`, background: "#F87171" }} />
                </>
              )}
            </div>
          </div>

          {/* Who's paid table */}
          <div className="mt-5 overflow-x-auto">
            <div className="flex items-center justify-between">
              <Text fw={600} className="text-[13.5px] text-[#0F172A]">
                Who's paid
              </Text>
              <Text className="text-[11.5px] text-[#94A3B8]">
                Visible to all members
              </Text>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_90px_60px_100px] gap-2 border-b border-[#E5E7EB] pb-2 sm:grid-cols-[1fr_110px_70px_110px]">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Member</Text>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Date</Text>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Time</Text>
              <Text className="text-right text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Status</Text>
            </div>
            {roster.map((r) => (
              <div
                key={r.userId}
                className="grid grid-cols-[1fr_90px_60px_100px] items-center gap-2 border-b border-[#F3F4F6] py-3 last:border-b-0 sm:grid-cols-[1fr_110px_70px_110px]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold ${
                      r.isSelf ? "bg-[#02A36E] text-white" : "bg-[#E5E7EB] text-[#6B7280]"
                    }`}
                  >
                    {initials(r.name)}
                  </div>
                  <Text fw={600} className="truncate text-[13px] text-[#0F172A]">
                    {r.name}
                  </Text>
                  {r.isSelf && (
                    <span className="rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[9.5px] font-bold text-[#065F46]">
                      YOU
                    </span>
                  )}
                </div>
                <Text className="text-[12px] text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtDateShort(r.paidAt)}
                </Text>
                <Text className="text-[12px] text-[#374151]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtTimeShort(r.paidAt)}
                </Text>
                <div className="flex justify-end">
                  <StatusPill status={r.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer: disclosure + contact admin */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Text className="max-w-[420px] text-[11.5px] leading-snug text-[#94A3B8]">
              Every member of the circle sees this list. Dates and times are recorded by the server.
            </Text>
            <button
              type="button"
              onClick={() => navigate(`/messages?circleId=${circleId}`)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-4 py-2 text-[12.5px] font-semibold text-white"
            >
              <IconMessageCircle size={16} />
              Contact admin
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Contributed", value: userStatus === "ADMIN" ? "Not a member" : formatNaira(totalContributedKobo) },
          { label: `${frequency || "Per Cycle"} Due`, value: formatNaira(contributionAmountKobo) },
          { label: "Frequency", value: frequency },
          { label: "Your Status", value: userStatus === "ACTIVE" ? "Active" : userStatus, isGreen: userStatus === "ACTIVE" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <Text fw={500} className="text-[12px] text-[#6B7280]">{item.label}</Text>
            <Text
              fw={700}
              className={`mt-1 text-[18px] ${item.isGreen ? "text-[#02A36E]" : "text-[#0F172A]"}`}
            >
              {item.value}
            </Text>
          </div>
        ))}
      </div>

      {/* Payout Timeline + Cycle Progress */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">Payout Timeline</Text>
          <RingProgress
            size={180}
            thickness={16}
            roundCaps
            sections={[{ value: progressPercent, color: "#02A36E" }]}
            label={
              <div className="flex flex-col items-center">
                <Text fw={800} className="text-[28px] text-[#0F172A]">
                  {Math.round(progressPercent)}%
                </Text>
                <Text fw={500} className="text-[12px] text-[#6B7280]">Complete</Text>
              </div>
            }
          />
          <Text fw={500} className="mt-4 text-[13px] text-[#6B7280]">
            {completedCycles} of {totalCycles} cycles completed
          </Text>
        </div>

        <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">Cycle Progress</Text>
          {cycles.length === 0 ? (
            <Text fw={400} className="text-[13px] text-[#9CA3AF]">No cycles scheduled yet.</Text>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3">
              {cycles.map((cycle) => (
                <div key={cycle.cycle} className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      cycle.status === "Completed"
                        ? "bg-[#02A36E] text-white"
                        : cycle.status === "Current"
                          ? "border-2 border-[#02A36E] bg-white text-[#02A36E]"
                          : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    {cycle.status === "Completed" ? <IconCheck size={16} stroke={2.5} /> : cycle.cycle}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text fw={600} className="truncate text-[13px] text-[#0F172A]">
                      {cycle.recipientName}
                    </Text>
                  </div>
                  <Badge
                    size="sm"
                    radius="xl"
                    styles={{
                      root: {
                        backgroundColor:
                          cycle.status === "Completed" ? "#D1FAE5"
                            : cycle.status === "Current" ? "#FEF3C7"
                            : "#F3F4F6",
                        color:
                          cycle.status === "Completed" ? "#065F46"
                            : cycle.status === "Current" ? "#92400E"
                            : "#6B7280",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 11,
                      },
                    }}
                  >
                    {cycle.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compact collateral — bottom of Overview, not a page-level block anymore */}
      {userStatus !== "ADMIN" && <RoscaCommitments circleId={circleId} refreshVersion={refreshVersion} />}

      {canRequestExit && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <Text size="sm" c="dimmed">
            To leave this group, contact Support. The team will review your request before making membership or collateral changes.
          </Text>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/support?category=ROSCA&subject=${encodeURIComponent(`Group exit request: ${circleName}`)}&body=${encodeURIComponent(`Group ID: ${circleId}\nReason for requesting to leave: `)}`,
              )
            }
            className="mt-3 cursor-pointer text-sm font-semibold text-[#02A36E]"
          >
            Contact Support
          </button>
        </div>
      )}
    </div>
  );
}
