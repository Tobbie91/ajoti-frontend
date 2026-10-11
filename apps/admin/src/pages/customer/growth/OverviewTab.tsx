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
  IconLock,
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

  // Transparency: fetch all members' contributions. Backend may 403 for
  // non-admins — in that case we fall back to showing current user only.
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

  // Build the current-cycle paid/unpaid roster.
  type RosterRow = { userId: string; name: string; isSelf: boolean; paid: boolean; paidAt?: string; isLate?: boolean; amount?: string };
  const roster: RosterRow[] = members.map((m) => {
    let paid = false;
    let paidAt: string | undefined;
    let isLate: boolean | undefined;
    let amount: string | undefined;

    if (currentCycleNumber != null) {
      if (allContribsAccess === "granted" && allContribs) {
        const row = allContribs.find(
          (c) => c.userId === m.userId && c.cycleNumber === currentCycleNumber && c.paidAt,
        );
        if (row) {
          paid = true;
          paidAt = row.paidAt ?? undefined;
          isLate = row.isLate;
          amount = row.amount;
        }
      } else if (m.userId === currentUserId) {
        // At least we always know our own status via ownContributions.
        const row = ownContributions.find((c) => c.cycleNumber === currentCycleNumber);
        if (row) {
          paid = true;
          paidAt = row.paidAt;
          amount = row.amount;
        }
      }
    }
    return {
      userId: m.userId,
      name: m.name || `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Member",
      isSelf: m.userId === currentUserId,
      paid,
      paidAt,
      isLate,
      amount,
    };
  }).sort((a, b) => {
    if (a.paid !== b.paid) return a.paid ? -1 : 1;
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    return a.name.localeCompare(b.name);
  });

  const paidCount = roster.filter((r) => r.paid).length;
  const totalMembers = roster.length;

  function fmtWhen(iso: string | undefined): string {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  }

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
              : 'Your ajo is getting started.'}
          {!["Schedule unavailable", "All payouts completed"].includes(nextPaymentDate) && completedCycles > 0
            ? ` The next group payout is scheduled for ${nextPaymentDate}.`
            : ""}
        </Text>
      </div>

      {/* ─── This cycle: paid / not paid transparency panel ─────────────── */}
      {currentCycleNumber != null && members.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Text fw={700} className="text-[15px] text-[#0F172A]">
                Cycle {currentCycleNumber} · Who's paid
              </Text>
              <Text className="text-[12px] text-[#64748B]">
                Transparent view for peer review. Timestamps are server-recorded.
              </Text>
            </div>
            <Badge
              variant="light"
              color="green"
              size="lg"
              radius="sm"
              style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}
            >
              {paidCount} / {totalMembers} paid
            </Badge>
          </div>

          {allContribsAccess === "denied" && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#F9FAFB] px-3 py-2">
              <IconLock size={14} color="#94A3B8" className="mt-0.5 flex-shrink-0" />
              <Text className="text-[11.5px] leading-snug text-[#64748B]">
                Only your own payment status is shown — group-wide payment visibility is
                limited for this circle. The organiser can enable full peer transparency.
              </Text>
            </div>
          )}

          <div className="mt-4 flex flex-col divide-y divide-[#F1F3EF]">
            {roster.map((r) => (
              <div key={r.userId} className="flex items-center gap-3 py-2.5">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    r.paid
                      ? "bg-[#02A36E] text-white"
                      : "border border-[#E5E7EB] bg-white text-[#9CA3AF]"
                  }`}
                >
                  {r.paid ? <IconCheck size={14} stroke={2.5} /> : <IconClock size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text fw={600} className="truncate text-[13.5px] text-[#0F172A]">
                      {r.name}
                    </Text>
                    {r.isSelf && (
                      <span className="rounded bg-[#E7F4EE] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#056148]">
                        You
                      </span>
                    )}
                    {r.isLate && (
                      <span className="rounded bg-[#FEF3C7] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#92400E]">
                        Late
                      </span>
                    )}
                  </div>
                  {r.paid && r.paidAt && (
                    <Text className="text-[11px] text-[#64748B]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      Paid {fmtWhen(r.paidAt)}
                      {r.amount && ` · ${formatNaira(r.amount)}`}
                    </Text>
                  )}
                  {!r.paid && (
                    <Text className="text-[11px] text-[#9CA3AF]">
                      Not paid yet
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Contributed", value: formatNaira(totalContributedKobo) },
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
      <RoscaCommitments circleId={circleId} refreshVersion={refreshVersion} />

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
