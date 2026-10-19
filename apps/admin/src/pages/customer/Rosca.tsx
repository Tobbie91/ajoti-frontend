import { kobo, formatKobo } from "@/utils/kobo";
import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  Badge,
  Avatar,
  Tabs,
  Select,
  Loader,
} from "@mantine/core";
import {
  IconSearch,
  IconMessageCircle,
  IconHeadset,
} from "@tabler/icons-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isCircleAdmin } from "@/utils/auth-role";
import {
  listRoscaCircles,
  getMyJoinRequests,
  getMyParticipations,
  getRoscaSchedules,
  getCircleContributions,
  type RoscaCircle,
  type MyJoinRequest,
} from "@/utils/api";
import { PayContributionModal } from "./growth/PayContributionModal";
import { circleDeadlineLabel, getCircleDeadlineState } from "@/utils/circle-deadline";

type Participation = RoscaCircle;

// Joined is the first tab (land here when the member already belongs to groups);
// the remaining three are Discover filters.
const TABS = ["Joined", "All Groups", "Open Groups", "Invite-Only"] as const;

type GroupStatus = "Open" | "Invite Only";

interface RoscaGroup {
  id: string;
  name: string;
  duration: string;
  slots: string;
  status: GroupStatus;
  admin: string;
  hasInvite: boolean;
  canViewDetails: boolean;
  isRequestingUserAdmin: boolean;
}

interface JoinedGroup {
  id: string;
  name: string;
  completionRate: number;
  completedCycles: number;
  totalCycles: number;
  filledSlots: number;
  maxSlots: number;
  nextContribution: string;
  admin: string;
  circleStatus: string;
  frequency: string;
  contributionAmountKobo: string;
  nextDeadlineRaw?: string;
  nextContributionCycle?: number;
  nextContributionAmountKobo?: string;
  currentCyclePaidKobo: string;
  currentCycleOutstandingKobo: string;
  nextContributionPaidKobo: string;
  progressUnavailable: boolean;
  memberCount: number;
  currentCycle: number;
}

const statusBadge: Record<GroupStatus, { bg: string; color: string; border: string }> = {
  Open: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  "Invite Only": { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
};

function contributionDate(circle: { status?: string; nextContributionDeadline?: string | null }): string {
  const date = circle.nextContributionDeadline ? new Date(circle.nextContributionDeadline) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return date.toLocaleString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  }
  if (circle.status === "DRAFT") return "After the organiser starts the group";
  if (["COMPLETED", "CANCELLED"].includes(circle.status ?? "")) return "No further contributions";
  return "Schedule unavailable";
}


// Status-driven visual tone for the joined card.
type CardTone = "active" | "notready" | "completed" | "cancelled";
const CARD_TONE: Record<CardTone, { rail: string; badgeBg: string; badgeFg: string; badgeLabel: string; cycleBg: string; cycleBorder: string; cycleText: string }> = {
  active:    { rail: "#02A36E", badgeBg: "#E7F4EE", badgeFg: "#056148", badgeLabel: "Active",      cycleBg: "#FEF3C7", cycleBorder: "#FDE68A", cycleText: "#92400E" },
  notready:  { rail: "#9CA3AF", badgeBg: "#E5E7EB", badgeFg: "#374151", badgeLabel: "Not started", cycleBg: "#F3F4F6", cycleBorder: "#E5E7EB", cycleText: "#6B7280" },
  completed: { rail: "#1E40AF", badgeBg: "#DBEAFE", badgeFg: "#1E40AF", badgeLabel: "Completed",   cycleBg: "#DBEAFE", cycleBorder: "#BFDBFE", cycleText: "#1E40AF" },
  cancelled: { rail: "#9CA3AF", badgeBg: "#FEE2E2", badgeFg: "#991B1B", badgeLabel: "Cancelled",   cycleBg: "#F3F4F6", cycleBorder: "#E5E7EB", cycleText: "#6B7280" },
};

function cardToneFor(status: string): CardTone {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "completed";
  if (s === "CANCELLED") return "cancelled";
  if (s === "ACTIVE" || s === "STARTED") return "active";
  return "notready";
}

interface JoinedGroupCardProps {
  group: JoinedGroup;
  onView: () => void;
  onPay: () => void;
  onChat: () => void;
  onSupport: () => void;
}

function JoinedGroupCard({ group, onView, onPay, onChat, onSupport }: JoinedGroupCardProps) {
  const tone = cardToneFor(group.circleStatus);
  const t = CARD_TONE[tone];
  const canPay = tone === "active" && !group.progressUnavailable && group.nextContributionCycle != null;
  const canExit = ["DRAFT", "ACTIVE"].includes(group.circleStatus);
  const pct = Math.max(0, Math.min(100, group.totalCycles > 0 ? Math.round((group.completedCycles / group.totalCycles) * 100) : 0));
  const ringDeg = (pct / 100) * 360;

  const cycleStripLabel = (() => {
    if (tone === "completed") return "All cycles complete";
    if (tone === "cancelled") return "Group cancelled";
    if (tone === "notready")  return "Starts when the organiser activates the group";
    const cycle = group.nextContributionCycle ?? group.currentCycle;
    return cycle > group.currentCycle
      ? `Cycle ${cycle} contribution · Pay early`
      : `Cycle ${cycle || "—"} contribution`;
  })();

  const cycleStripSubtle = (() => {
    if (group.progressUnavailable) return "Schedule and contribution progress unavailable. Refresh to try again.";
    const deadlineState = getCircleDeadlineState({ circleStatus: group.circleStatus, deadline: group.nextDeadlineRaw });
    if (deadlineState === "upcoming") return `Upcoming · Pay by ${group.nextContribution}`;
    if (deadlineState === "overdue") return `Overdue · Due ${group.nextContribution}`;
    if (deadlineState === "unavailable" && tone === "active") return `${circleDeadlineLabel.unavailable} · Refresh to check the schedule.`;
    if (tone === "active") return `${circleDeadlineLabel[deadlineState]} · ${group.nextContribution}`;
    if (tone === "notready") return "No contributions yet";
    return `${circleDeadlineLabel[deadlineState]} · ${group.nextContribution}`;
  })();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#E4E6E1] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ paddingLeft: 20 }}
    >
      {/* Status rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: t.rail }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Text fw={700} className="truncate text-[17px] leading-tight text-[#0F172A]">
            {group.name}
          </Text>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#64748B]">
            <span>{group.memberCount || "—"} members</span>
            <span className="inline-block h-1 w-1 rounded-full bg-[#CBD5E1]" />
            <span>{group.frequency ? group.frequency.toLowerCase() : "—"}</span>
            {(kobo(group.contributionAmountKobo) ?? 0n) > 0n && (
              <>
                <span className="inline-block h-1 w-1 rounded-full bg-[#CBD5E1]" />
                <span>{formatKobo(group.contributionAmountKobo)}</span>
              </>
            )}
          </div>
        </div>
        <Badge
          size="sm"
          radius="xl"
          styles={{
            root: {
              backgroundColor: t.badgeBg,
              color: t.badgeFg,
              border: `1px solid ${t.badgeBg}`,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 10.5,
              letterSpacing: 0.4,
              paddingLeft: 10,
              paddingRight: 10,
              height: 22,
              flexShrink: 0,
            },
          }}
        >
          {t.badgeLabel}
        </Badge>
      </div>

      {/* Progress ring + text */}
      <div className="mt-4 flex items-center gap-4">
        <div
          className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${t.rail} 0deg ${ringDeg}deg, #F1F3EF ${ringDeg}deg 360deg)`,
          }}
          aria-hidden="true"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
            <Text fw={700} className="text-[12px]" style={{ color: t.rail }}>
              {group.progressUnavailable ? "—" : `${pct}%`}
            </Text>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Text className="text-[11px] uppercase tracking-wide text-[#64748B]">
            {group.progressUnavailable ? "Group progress" : "Cycle progress"}
          </Text>
          <Text fw={700} className="mt-0.5 text-[13.5px] text-[#0F172A]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {group.progressUnavailable ? "Progress unavailable" : `${group.completedCycles} of ${group.totalCycles} cycles`}
          </Text>
        </div>
      </div>

      {tone === "active" && !group.progressUnavailable && (
        <div className="mt-3 flex flex-col gap-1 rounded-lg bg-[#F9FAFB] px-3 py-2">
          <Text className="text-[11.5px] text-[#475569]">
            Current cycle {group.currentCycle}: <strong>{kobo(group.currentCycleOutstandingKobo) === 0n ? "Paid" : Number(group.currentCyclePaidKobo) > 0 ? "Partially paid" : "Unpaid"}</strong>
            {` · ${formatKobo(group.currentCyclePaidKobo)} paid · ${formatKobo(group.currentCycleOutstandingKobo)} outstanding`}
          </Text>
          {group.nextContributionCycle != null && group.nextContributionCycle > group.currentCycle && (
            <Text className="text-[11.5px] text-[#475569]">
              Cycle {group.nextContributionCycle}: {formatKobo(group.nextContributionPaidKobo)} paid · {formatKobo(group.nextContributionAmountKobo ?? 0)} remaining
            </Text>
          )}
        </div>
      )}

      {/* Cycle info strip */}
      <div
        className="mt-4 rounded-xl border px-3.5 py-3"
        style={{ background: t.cycleBg, borderColor: t.cycleBorder, color: t.cycleText }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Text fw={700} className="text-[12.5px] leading-tight" style={{ color: t.cycleText }}>
              {cycleStripLabel}
            </Text>
            <Text className="mt-0.5 text-[11.5px]" style={{ color: t.cycleText, opacity: 0.9 }}>
              {cycleStripSubtle}
            </Text>
          </div>
          {tone === "active" && (kobo(group.contributionAmountKobo) ?? 0n) > 0n && !group.progressUnavailable && (
            <Text
              fw={700}
              className="flex-shrink-0 text-[13px]"
              style={{ color: t.cycleText, fontVariantNumeric: "tabular-nums" }}
            >
              {formatKobo(group.nextContributionAmountKobo ?? group.contributionAmountKobo)}
            </Text>
          )}
        </div>
      </div>

      {/* Primary CTA pair */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onView}
          className="cursor-pointer rounded-lg border border-[#02A36E] bg-white py-2.5 text-[12.5px] font-semibold text-[#0B6B55] transition-colors hover:bg-[#E7F4EE]"
        >
          {tone === "completed" ? "View history" : "View group"}
        </button>
        <button
          type="button"
          onClick={canPay ? onPay : undefined}
          disabled={!canPay}
          aria-disabled={!canPay}
          className={`rounded-lg py-2.5 text-[12.5px] font-semibold transition-colors ${
            canPay
              ? "cursor-pointer bg-[#0B6B55] text-white hover:bg-[#095C49]"
              : "cursor-not-allowed border border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]"
          }`}
        >
          {group.progressUnavailable ? "Progress unavailable" : group.nextContributionCycle != null && group.nextContributionCycle > group.currentCycle ? `Pay Cycle ${group.nextContributionCycle} Early` : "Pay contribution"}
        </button>
      </div>

      {/* Secondary links */}
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={onChat}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-[11.5px] text-[#64748B] transition-colors hover:bg-[#F1F3EF] hover:text-[#0F172A]"
        >
          <IconMessageCircle size={13} />
          {tone === "completed" ? "Previous group chat" : "Group chat"}
        </button>
        {canExit && (
          <button
            type="button"
            onClick={onSupport}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-[11.5px] text-[#64748B] transition-colors hover:bg-[#F1F3EF] hover:text-[#0F172A]"
          >
            <IconHeadset size={13} />
            Contact support
          </button>
        )}
      </div>
    </div>
  );
}

export function Rosca() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const admin = isCircleAdmin();
  // Joined is the default landing tab so the member sees their own groups
  // first. A deep-link like ?tab=open overrides. No post-load auto-flip —
  // that caused a visible "All Groups → Joined" flash.
  const [activeTab, setActiveTab] = useState<string>(() => {
    const slug = (searchParams.get("tab") ?? "").toLowerCase();
    if (slug === "open" || slug === "open-groups") return "Open Groups";
    if (slug === "invite" || slug === "invite-only") return "Invite-Only";
    if (slug === "all" || slug === "all-groups") return "All Groups";
    return "Joined";
  });
  const [joinedStatus, setJoinedStatus] = useState<string>(["active", "completed"].includes(searchParams.get("status") ?? "") ? searchParams.get("status")! : "all");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [groups, setGroups] = useState<RoscaGroup[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joinedGroups, setJoinedGroups] = useState<JoinedGroup[]>([]);
  const [joinedLoading, setJoinedLoading] = useState(true);
  const [joinedReadError, setJoinedReadError] = useState(false);
  const [membershipReadError, setMembershipReadError] = useState(false);
  const [discoverReadError, setDiscoverReadError] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [payPlan, setPayPlan] = useState<JoinedGroup | null>(null);

  // ─── Fetch discover list + joined-ID set ────────────────────────────────
  useEffect(() => {
    setMembershipReadError(false);
    setDiscoverReadError(false);
    Promise.allSettled([
      listRoscaCircles(),
      getMyParticipations(),
      getMyJoinRequests(),
    ]).then(([circlesRes, partRes, joinRes]) => {
      if (circlesRes.status === "fulfilled") {
        const uniqueCircles = [...new Map(circlesRes.value.filter((circle) => circle?.id).map((circle) => [circle.id, circle])).values()];
        const mapped: RoscaGroup[] = uniqueCircles.map((c: RoscaCircle) => {
          const slotsLeft = (c.maxSlots ?? 0) - (c.filledSlots ?? 0);
          const adminName = c.admin
            ? `${c.admin.firstName ?? ""} ${c.admin.lastName ?? ""}`.trim()
            : "Unknown";
          return {
            id: c.id,
            name: c.name,
            duration: c.durationCycles ? `${c.durationCycles} cycles` : "",
            slots: `${slotsLeft} Slots`,
            status: (c.visibility === "PRIVATE"
              ? "Invite Only"
              : "Open") as GroupStatus,
            admin: adminName,
            hasInvite: c.hasInvite ?? false,
            canViewDetails: c.canViewDetails ?? c.visibility !== "PRIVATE",
            isRequestingUserAdmin: c.isRequestingUserAdmin ?? false,
          };
        });
        setGroups(mapped);
      } else {
        const err = circlesRes.reason;
        if (
          err instanceof Error &&
          err.message.toLowerCase().includes("unauthorized")
        ) {
          setNeedsLogin(true);
        } else {
          setDiscoverReadError(true);
        }
      }

      if (partRes.status === "rejected" || joinRes.status === "rejected") {
        setMembershipReadError(true);
      }

      const ids = new Set<string>();
      if (partRes.status === "fulfilled") {
        partRes.value.forEach((c) => ids.add(c.id));
      }
      if (joinRes.status === "fulfilled") {
        joinRes.value
          .filter((r) => ["ACTIVE", "STARTED", "COMPLETED"].includes((r.status ?? "").toUpperCase()))
          .forEach((r) => ids.add(r.circleId));
      }
      setJoinedIds(ids);
    });
  }, [refreshVersion]);

  // ─── Fetch joined-group details — always, not only on Joined tab ─────────
  useEffect(() => {
    setJoinedLoading(true);
    setJoinedReadError(false);

    function mapJoinRequest(r: MyJoinRequest): JoinedGroup {
      const circle = (r.circle ?? {}) as Partial<RoscaCircle>;
      const completed = circle.status === "COMPLETED"
        ? Number(circle.durationCycles ?? 0)
        : Math.max(0, Number(circle.currentCycle ?? 1) - 1);
      const total = Number(circle.durationCycles ?? 1);
      const adminName = circle.admin
        ? `${circle.admin.firstName ?? ""} ${circle.admin.lastName ?? ""}`.trim()
        : "Admin";
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: r.circleId,
        name: circle.name ?? `Circle ${r.circleId.slice(0, 6)}`,
        completionRate,
        completedCycles: completed,
        totalCycles: total,
        filledSlots: Number(circle.filledSlots ?? 0),
        maxSlots: Number(circle.maxSlots ?? 0),
        nextContribution: contributionDate(circle),
        admin: adminName,
        circleStatus: (circle.status as string) ?? "",
        frequency: (circle.frequency as string) ?? "",
        contributionAmountKobo: String(circle.contributionAmount ?? "0"),
        nextDeadlineRaw: circle.nextContributionDeadline ?? undefined,
        currentCyclePaidKobo: "0",
        currentCycleOutstandingKobo: String(circle.contributionAmount ?? "0"),
        nextContributionPaidKobo: "0",
        progressUnavailable: true,
        memberCount: Number(circle.filledSlots ?? 0),
        currentCycle: Number(circle.currentCycle ?? 1),
      };
    }

    function mapParticipation(c: Participation): JoinedGroup {
      const completed = c.status === "COMPLETED"
        ? Number(c.durationCycles ?? 0)
        : Math.max(0, Number(c.currentCycle ?? 1) - 1);
      const total = Number(c.durationCycles ?? 1);
      const adminName = c.admin
        ? `${c.admin.firstName ?? ""} ${c.admin.lastName ?? ""}`.trim()
        : "Admin";
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: c.id,
        name: c.name ?? `Circle ${c.id.slice(0, 6)}`,
        completionRate,
        completedCycles: completed,
        totalCycles: total,
        filledSlots: Number(c.filledSlots ?? 0),
        maxSlots: Number(c.maxSlots ?? 0),
        nextContribution: contributionDate(c),
        admin: adminName,
        circleStatus: c.status ?? "",
        frequency: c.frequency ?? "",
        contributionAmountKobo: String(c.contributionAmount ?? "0"),
        nextDeadlineRaw: c.nextContributionDeadline ?? undefined,
        currentCyclePaidKobo: "0",
        currentCycleOutstandingKobo: String(c.contributionAmount ?? "0"),
        nextContributionPaidKobo: "0",
        progressUnavailable: true,
        memberCount: Number(c.filledSlots ?? 0),
        currentCycle: Number(c.currentCycle ?? 1),
      };
    }

    Promise.allSettled([getMyJoinRequests(), getMyParticipations()])
      .then(([joinRes, partRes]) => {
        setJoinedReadError(joinRes.status === "rejected" || partRes.status === "rejected");
        const joinRequests = joinRes.status === "fulfilled" ? joinRes.value : [];
        const participations = partRes.status === "fulfilled" ? partRes.value : [];

        const approvedRequests = joinRequests.filter((r) =>
          ["ACTIVE", "STARTED", "COMPLETED"].includes((r.status ?? "").toUpperCase()),
        );

        const seenIds = new Set<string>();
        const merged: JoinedGroup[] = [];
        for (const c of participations) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            merged.push(mapParticipation(c));
          }
        }
        for (const r of approvedRequests) {
          if (!seenIds.has(r.circleId)) {
            seenIds.add(r.circleId);
            merged.push(mapJoinRequest(r));
          }
        }
        return Promise.all(merged.map(async (group) => {
          try {
            const [schedules, contributions] = await Promise.all([
              getRoscaSchedules(group.id),
              getCircleContributions(group.id),
            ]);
            if (schedules.length === 0) {
              return { ...group, progressUnavailable: ["ACTIVE", "STARTED", "COMPLETED"].includes(group.circleStatus.toUpperCase()) };
            }
            const completedCycles = schedules.filter((schedule) => schedule.status === 'COMPLETED').length;
            const totalCycles = schedules.length;
            const paidByCycle = new Map<number, bigint>();
            for (const contribution of contributions) {
              paidByCycle.set(
                contribution.cycleNumber,
                (paidByCycle.get(contribution.cycleNumber) ?? 0n) + BigInt(contribution.amount),
              );
            }
            const nextSchedule = schedules
              .filter((schedule) => ['IN_PROGRESS', 'UPCOMING'].includes((schedule.status ?? '').toUpperCase()))
              .sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))
              .find((schedule) =>
                schedule.cycleNumber != null &&
                (paidByCycle.get(schedule.cycleNumber) ?? 0n) < BigInt(group.contributionAmountKobo),
              );
            const nextCycle = nextSchedule?.cycleNumber;
            const paidTowardNextCycle = nextCycle == null ? 0n : paidByCycle.get(nextCycle) ?? 0n;
            const expected = BigInt(group.contributionAmountKobo);
            const amountDue = expected > paidTowardNextCycle ? expected - paidTowardNextCycle : 0n;
            const paidCurrent = paidByCycle.get(group.currentCycle) ?? 0n;
            const currentCyclePaid = expected < paidCurrent ? expected : paidCurrent;
            return {
              ...group, completedCycles, totalCycles,
              completionRate: Math.round((completedCycles / totalCycles) * 100),
              currentCyclePaidKobo: String(currentCyclePaid),
              currentCycleOutstandingKobo: String(expected - currentCyclePaid),
              nextContributionPaidKobo: String(paidTowardNextCycle),
              progressUnavailable: false,
              nextContributionCycle: nextCycle,
              nextContributionAmountKobo: String(amountDue),
              nextDeadlineRaw: nextSchedule?.contributionDeadline,
              nextContribution: nextSchedule?.contributionDeadline
                ? new Date(nextSchedule.contributionDeadline).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                : group.nextContribution,
            };
          } catch {
            return { ...group, progressUnavailable: true };
          }
        })).then(setJoinedGroups);
      })
      .catch(() => {
        setJoinedGroups([]);
        setJoinedReadError(true);
      })
      .finally(() => setJoinedLoading(false));
  }, [refreshVersion]);

  // Discover list filtering
  const filtered = groups.filter((g) => {
    if (joinedIds.has(g.id)) return false;
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.admin.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "All Groups") return matchesSearch;
    if (activeTab === "Open Groups") return g.status === "Open" && matchesSearch;
    if (activeTab === "Invite-Only") return g.status === "Invite Only" && matchesSearch;
    return matchesSearch;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 6);
  const hasJoined = joinedGroups.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setRefreshVersion((v) => v + 1)}
          className="cursor-pointer text-sm font-semibold text-[#02A36E]"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* ─── Hero banner (desktop) ──────────────────────────────────────── */}
        <div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-r from-[#02A36E] to-[#00C853] px-6 py-8 text-white sm:block sm:px-10 sm:py-10">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text fw={700} className="text-[22px] sm:text-[28px] leading-tight">
                Welcome to ajo
              </Text>
              <Text size="sm" className="mt-2 text-white/90 leading-relaxed">
                Join trusted savings groups and grow your money together with others.
              </Text>
            </div>
            <button
              onClick={() => navigate("/rosca/how-it-works")}
              className="w-fit flex-shrink-0 cursor-pointer rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#02A36E] shadow-sm"
            >
              How it Works
            </button>
          </div>
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-28 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute right-48 top-2 h-24 w-24 rounded-full bg-white/5" />
        </div>

        {/* ─── Mobile heading ─────────────────────────────────────────────── */}
        <div className="sm:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Text fw={700} className="text-[26px] leading-tight text-[#0F172A]">
                Find an ajo
              </Text>
              <Text size="sm" c="dimmed" className="mt-1">
                Discover a group or jump into one you've joined.
              </Text>
            </div>
            <button
              type="button"
              onClick={() => navigate("/rosca/how-it-works")}
              className="shrink-0 cursor-pointer rounded-lg border border-[#0B6B55] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0B6B55]"
            >
              How it works
            </button>
          </div>
        </div>

        {/* ─── Tab bar — Joined first, then Discover filters ─────────────── */}
        <div>
          {/* Desktop 4-tab bar — full-width, bold, pill-style */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-4 gap-2 rounded-xl bg-[#F1F3EF] p-1">
              {TABS.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setShowAll(false);
                    }}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-bold transition-colors ${
                      active
                        ? "bg-[#0B6B55] text-white shadow-sm"
                        : "text-[#64748B] hover:bg-white hover:text-[#0F172A]"
                    }`}
                  >
                    {tab}
                    {tab === "Joined" && hasJoined && (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2 text-[11px] font-bold ${
                          active ? "bg-white/20 text-white" : "bg-[#E7F4EE] text-[#056148]"
                        }`}
                        style={{ height: 18, minWidth: 20 }}
                      >
                        {joinedGroups.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile: visible "Joined" pill + white Select dropdown for Discover filters */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => { setActiveTab("Joined"); setShowAll(false); }}
              className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === "Joined"
                  ? "bg-[#0B6B55] text-white shadow-sm"
                  : "border border-[#E5E7EB] bg-white text-[#374151]"
              }`}
            >
              Joined{hasJoined ? ` (${joinedGroups.length})` : ""}
            </button>
            <Select
              aria-label="Discover ajo groups"
              placeholder="Discover"
              value={activeTab === "Joined" ? null : activeTab}
              onChange={(value) => {
                if (!value) return;
                setActiveTab(value);
                setShowAll(false);
              }}
              data={[
                { value: "All Groups", label: "All groups" },
                { value: "Open Groups", label: "Open groups" },
                { value: "Invite-Only", label: "Invite-only" },
              ]}
              allowDeselect={false}
              radius="md"
              className="flex-1"
              styles={{
                input: {
                  borderColor: activeTab !== "Joined" ? "#0B6B55" : "#E5E7EB",
                  backgroundColor: "#FFFFFF",
                  fontWeight: 600,
                  color: activeTab !== "Joined" ? "#0B6B55" : "#374151",
                  height: 44,
                },
              }}
            />
          </div>
        </div>

        {/* ─── JOINED TAB CONTENT ─────────────────────────────────────────── */}
        {activeTab === "Joined" ? (
          joinedLoading ? (
            <div className="flex justify-center py-16">
              <Loader color="#02A36E" size="md" />
            </div>
          ) : !hasJoined ? (
            joinedReadError ? (
              <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-10 text-center">
                <Text fw={600} className="text-red-800">Joined groups could not be loaded</Text>
                <Text size="sm" className="text-red-700">Your group history is unavailable. Try again to reload it.</Text>
                <button type="button" onClick={() => setRefreshVersion((v) => v + 1)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-300">Try again</button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Text fw={600} className="text-[#374151]">No joined groups yet</Text>
                <Text size="sm" className="text-[#9CA3AF]">
                  Discover and join an ajo circle to see it here.
                </Text>
                <button
                  type="button"
                  onClick={() => { setActiveTab("All Groups"); setShowAll(false); }}
                  className="mt-2 cursor-pointer rounded-lg bg-[#02A36E] px-5 py-2 text-sm font-semibold text-white"
                >
                  Browse ajo groups
                </button>
              </div>
            )
          ) : (
            <>
              <Select label="Joined circle status" value={joinedStatus} onChange={value => setJoinedStatus(value ?? 'all')} data={[{ value: 'all', label: 'All joined circles' }, { value: 'active', label: 'Active circles' }, { value: 'completed', label: 'Completed history' }]} />
              {joinedGroups.filter(group => joinedStatus === 'all' || group.circleStatus.toLowerCase() === joinedStatus).length === 0 && <Text>No circles match this status.</Text>}
              {joinedReadError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Some membership data could not be loaded. The groups below may be incomplete.</div>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {joinedGroups.filter(group => joinedStatus === 'all' || group.circleStatus.toLowerCase() === joinedStatus).map((group) => (
                  <JoinedGroupCard
                    key={group.id}
                    group={group}
                    onView={() => navigate(`/rosca/${group.id}`)}
                    onPay={() => setPayPlan(group)}
                    onChat={() => navigate(`/messages?circleId=${encodeURIComponent(group.id)}`)}
                    onSupport={() => navigate(`/support?category=ROSCA&subject=${encodeURIComponent(`Group exit request: ${group.name}`)}&body=${encodeURIComponent(`Group ID: ${group.id}\nReason for requesting to leave: `)}`)}
                  />
                ))}
              </div>
            </>
          )
        ) : null}

        {/* ─── Become-admin promo (desktop only, only on Discover tabs) ──── */}
        {!admin && activeTab !== "Joined" && (
          <div className="hidden items-center justify-between rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-6 py-4 sm:flex">
            <div>
              <Text fw={600} size="sm" className="text-[#0F172A]">
                Become an ajo admin
              </Text>
              <Text size="xs" className="text-[#6B7280]">
                Activate admin access to create and manage your own group.
              </Text>
            </div>
            <button
              onClick={() => navigate("/rosca/become-admin")}
              className="cursor-pointer rounded-lg bg-[#02A36E] px-5 py-2.5 text-sm font-medium text-white"
            >
              Activate
            </button>
          </div>
        )}

        {/* ─── DISCOVER TAB CONTENT (search + grid) ───────────────────────── */}
        {activeTab !== "Joined" && (<>
        {/* Desktop search + my-requests */}
        <div className="hidden items-center gap-3 sm:flex">
          <TextInput
            placeholder="Search groups or admins..."
            leftSection={<IconSearch size={18} color="#9CA3AF" />}
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="flex-1"
            styles={{ input: { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" } }}
          />
          <button
            onClick={() => navigate("/rosca/requests")}
            className="flex h-[42px] cursor-pointer items-center gap-2 rounded-lg border border-[#02A36E] bg-white px-4 text-[13px] font-medium text-[#02A36E]"
          >
            My Requests
          </button>
        </div>

        {/* ─── Mobile search + Requests/Invites shortcuts ──────────────────── */}
        <div className="space-y-3 sm:hidden">
          <TextInput
            aria-label="Search ajo groups"
            placeholder="Search groups or admins"
            leftSection={<IconSearch size={18} color="#9CA3AF" />}
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{ input: { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" } }}
          />
          <div className="flex items-center justify-end gap-3 text-xs font-semibold text-[#0B6B55]">
            <button type="button" onClick={() => navigate("/rosca/requests")}>Requests</button>
            <button type="button" onClick={() => navigate("/rosca/invites")}>Invites</button>
          </div>
        </div>

        {/* ─── Discover grid ──────────────────────────────────────────────── */}
        {needsLogin ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Text fw={600} className="text-[#374151]">
              Login to view available ajo groups
            </Text>
            <button
              onClick={() => navigate("/login")}
              className="cursor-pointer rounded-lg bg-[#02A36E] px-8 py-2.5 text-sm font-semibold text-white"
            >
              Login
            </button>
          </div>
        ) : discoverReadError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Available groups could not be loaded. Try again to refresh the list.
            <button type="button" onClick={() => setRefreshVersion((v) => v + 1)} className="ml-2 font-semibold underline">Try again</button>
          </div>
        ) : membershipReadError ? (
          <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Membership status is unavailable, so groups are hidden until your membership can be checked.
            <button type="button" onClick={() => setRefreshVersion((v) => v + 1)} className="ml-2 font-semibold underline">Try again</button>
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((group) => {
              const openGroup = () => {
                if (group.canViewDetails || group.isRequestingUserAdmin) {
                  navigate(`/rosca/${group.id}`);
                } else if (group.hasInvite) {
                  navigate("/rosca/invites");
                }
              };
              const hasAction =
                group.canViewDetails || group.isRequestingUserAdmin || group.hasInvite;
              const actionLabel =
                group.status === "Open"
                  ? "View group"
                  : group.canViewDetails || group.isRequestingUserAdmin
                    ? "View group"
                    : group.hasInvite
                      ? "View invitation"
                      : "Invite only";

              return (
                <article
                  key={group.id}
                  className="flex min-h-[210px] flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#B7D9CF] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Text
                      component="h3"
                      fw={700}
                      className="line-clamp-2 text-[17px] leading-snug text-[#0F172A]"
                    >
                      {group.name}
                    </Text>
                    <Badge
                      size="md"
                      radius="xl"
                      className="shrink-0"
                      styles={{
                        root: {
                          backgroundColor: statusBadge[group.status].bg,
                          color: statusBadge[group.status].color,
                          border: `1px solid ${statusBadge[group.status].border}`,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: 11,
                          paddingLeft: 10,
                          paddingRight: 10,
                          height: 25,
                        },
                      }}
                    >
                      {group.status}
                    </Badge>
                  </div>

                  <Text size="sm" fw={600} className="mt-3 text-[#475569]">
                    {group.slots} available
                  </Text>
                  <Text size="sm" c="dimmed" mb="sm">
                    {group.duration}
                  </Text>

                  <div className="mt-auto border-t border-[#F1F5F9] pt-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar size={32} radius="xl" color="teal" variant="light">
                        {group.admin.charAt(0)}
                      </Avatar>
                      <div className="min-w-0">
                        <Text size="xs" className="text-[#64748B]">
                          Organised by
                        </Text>
                        <Text fw={600} className="truncate text-[13px] text-[#1E293B]">
                          {group.admin}
                        </Text>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openGroup}
                      disabled={!hasAction}
                      aria-label={`${actionLabel}: ${group.name}`}
                      className={`mt-4 w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                        hasAction
                          ? "cursor-pointer bg-[#02A36E] text-white hover:bg-[#01875B]"
                          : "cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8]"
                      }`}
                    >
                      {actionLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Text fw={600} className="text-[#374151]">
              No groups found
            </Text>
            <Text size="sm" className="mt-1 text-[#9CA3AF]">
              Try adjusting your search or filter.
            </Text>
          </div>
        )}

        {!showAll && filtered.length > 6 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="rounded-lg border border-[#02A36E] px-8 py-2.5 text-sm font-medium text-[#02A36E]"
            >
              Show More
            </button>
          </div>
        )}
        </>)}
      </div>

      {!admin && (
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#E5E7EB] py-5 sm:hidden">
          <div>
            <Text fw={600} size="sm">Want to organise an ajo?</Text>
            <Text size="xs" c="dimmed">Learn about creating and managing a group.</Text>
          </div>
          <button
            type="button"
            onClick={() => navigate("/rosca/become-admin")}
            className="shrink-0 text-xs font-semibold text-[#0B6B55]"
          >
            Learn more
          </button>
        </div>
      )}

      {/* Shared pay-contribution modal — opens from the joined card Pay CTA
          without navigating away from the Ajo page. */}
      <PayContributionModal
        opened={payPlan !== null}
        onClose={() => setPayPlan(null)}
        circleId={payPlan?.id ?? ""}
        currentCycleNumber={payPlan?.currentCycle}
        nextCycleNumber={payPlan?.nextContributionCycle}
        contributionAmountKobo={payPlan?.nextContributionAmountKobo ?? payPlan?.contributionAmountKobo ?? "0"}
        amountAlreadyPaidKobo={payPlan?.nextContributionPaidKobo ?? "0"}
        nextDeadline={payPlan?.nextDeadlineRaw}
        nextPaymentFallback={payPlan?.nextContribution}
        onPaid={() => {
          setPayPlan(null);
          setRefreshVersion((v) => v + 1);
        }}
      />
    </div>
  );
}
