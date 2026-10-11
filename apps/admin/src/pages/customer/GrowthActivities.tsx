import { OverviewTab } from "./growth/OverviewTab";
import { MembersTab } from "./growth/MembersTab";
import { AdminTab } from "./growth/AdminTab";
import { GrowthTab } from "./growth/GrowthTab";
import { PeerReviewsTab } from "./growth/PeerReviewsTab";
import { circleStatusBadge, mapSchedulesToCycles } from "./growth/utils";
import type { CycleRow } from "./growth/utils";
import { useState, useEffect } from "react";
import {
  Text,
  Badge,
  Avatar,
  Progress,
  RingProgress,
  Textarea,
  Slider,
  Loader,
  Modal,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconInfoCircle,
  IconMessageCircle,
  IconCalendar,
  IconShieldCheck,
  IconWallet,
  IconCheck,
  IconCash,
} from "@tabler/icons-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getRoscaCircle,
  getRoscaSchedules,
  getCircleContributions,
  makeContribution,
  getWalletBalance,
  submitPeerReview,
  getTrustScore,
  messageAdmin,
  leaveRoscaCircle,
  type RoscaCircle,
  type RoscaSchedule,
  type CircleContribution,
  type CircleMember,
} from "@/utils/api";

const GROUP_TABS = [
  "Overview",
  "Members",
  "Admin",
  "Growth & Activities",
  "Peer Reviews",
] as const;

// ── Main Component ───────────────────────────────────────────────────────────

const TAB_SLUG: Record<string, string> = {
  overview: "Overview",
  members: "Members",
  admin: "Admin",
  growth: "Growth & Activities",
  peer: "Peer Reviews",
};

export function GrowthActivities() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  // Deep-link support: ?tab=<slug> seeds the active tab, ?pay=1 auto-opens the
  // pay modal, ?action=contribute (older link style) also lands on the growth tab.
  const initialTabSlug = searchParams.get("tab") ?? "";
  const contributionShortcut = searchParams.get("action") === "contribute";
  const [activeTab, setActiveTab] = useState<string>(
    TAB_SLUG[initialTabSlug.toLowerCase()]
      ?? (contributionShortcut ? "Growth & Activities" : "Overview"),
  );
  const autoPay = searchParams.get("pay") === "1" || contributionShortcut;
  const [loading, setLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [circle, setCircle] = useState<RoscaCircle | null>(null);
  const [schedules, setSchedules] = useState<RoscaSchedule[]>([]);
  const [contributions, setContributions] = useState<CircleContribution[]>([]);
  const [userTrustScore, setUserTrustScore] = useState(0);

  const currentUserId = (() => {
    try {
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : {};
      return u.id ?? u._id ?? "";
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      getRoscaCircle(id),
      getRoscaSchedules(id),
      getCircleContributions(id),
      getTrustScore().catch(
        () => ({ trustScore: 0 }) as { trustScore: number },
      ),
    ])
      .then(([c, s, contrib, ts]) => {
        if (cancelled) return;
        setCircle(c);
        setSchedules(s);
        setContributions(contrib);
        setUserTrustScore((ts as { trustScore: number }).trustScore ?? 0);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load group activity");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, refreshVersion]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader size={48} color="#02A36E" />
      </div>
    );
  }

  if (loadError || !circle) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Text fw={600} className="text-[#374151]">
          {loadError ?? "Circle not found"}
        </Text>
        <button
          onClick={() => navigate("/rosca?tab=joined")}
          className="cursor-pointer text-sm font-medium text-[#02A36E]"
        >
          Back to joined groups
        </button>
        <button type="button" onClick={() => setRefreshVersion(v => v + 1)} className="cursor-pointer text-sm font-semibold text-[#02A36E]">Try again</button>
      </div>
    );
  }

  const members = ((circle as any).members as CircleMember[]) ?? [];
  const adminName = circle.admin
    ? `${circle.admin.firstName} ${circle.admin.lastName}`.trim()
    : "Admin";
  const cycles = mapSchedulesToCycles(schedules, members);
  const completedCycles = cycles.filter((c) => c.status === "Completed").length;
  const totalCycles = circle.durationCycles;
  const progressPercent =
    totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0;

  const trustPercent = Math.min(100, userTrustScore);

  // Next pending payout
  const nextSchedule = schedules
    .filter(
      (s) => ["IN_PROGRESS", "UPCOMING"].includes((s.status ?? "").toUpperCase()),
    )
    .sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))[0];
  const nextPaymentDate = nextSchedule?.payoutDate
    ? new Date(nextSchedule.payoutDate as string).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : circle.status === "COMPLETED" ? "All payouts completed" : "Schedule unavailable";
  const nextContributionDate = nextSchedule?.contributionDeadline
    ? new Date(nextSchedule.contributionDeadline).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : "Not scheduled";

  const totalContributed = contributions.reduce(
    (s, c) => s + Number(c.amount),
    0,
  );
  const statusBadge = circleStatusBadge((circle as any).status ?? "");

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-6">
      <div className="flex flex-col gap-5">
        {/* ─── Back + title row ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/rosca?tab=joined")}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
          >
            <IconArrowLeft size={18} color="#374151" />
            Back
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            {circle.name}
          </Text>
          <button type="button" onClick={() => setRefreshVersion(v => v + 1)} className="ml-auto cursor-pointer text-sm font-semibold text-[#02A36E]">Refresh</button>
        </div>

        {/* ─── Pill tabs at the top — full width, bold ──────────────────── */}
        <div className="grid grid-cols-5 gap-1.5 rounded-xl bg-[#F1F3EF] p-1">
          {GROUP_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-2 py-2.5 text-[12px] font-bold transition-colors sm:text-[14px] ${
                  active
                    ? "bg-[#0B6B55] text-white shadow-sm"
                    : "text-[#64748B] hover:bg-white hover:text-[#0F172A]"
                }`}
              >
                {tab === "Growth & Activities" ? "Growth" : tab === "Peer Reviews" ? "Peers" : tab}
              </button>
            );
          })}
        </div>

        {/* ─── Prominent Make-a-contribution button (visible on every tab) ── */}
        {circle.status === "ACTIVE" && nextSchedule && (() => {
          const nextCycle = nextSchedule.cycleNumber;
          const alreadyPaid = nextCycle != null && contributions.some(c => c.cycleNumber === nextCycle);
          if (alreadyPaid) {
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-3">
                <div className="flex items-center gap-3">
                  <IconCheck size={20} color="#02A36E" />
                  <div>
                    <Text fw={700} className="text-[14px] text-[#065F46]">Cycle {nextCycle} paid</Text>
                    <Text className="text-[12px] text-[#047857]">Thanks — you're clear until the next cycle opens.</Text>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FEF3C7] px-5 py-3">
              <div className="flex items-center gap-3">
                <IconCash size={22} color="#B45309" />
                <div>
                  <Text fw={700} className="text-[14px] text-[#92400E]">
                    Cycle {nextCycle} contribution due
                  </Text>
                  <Text className="text-[12px] text-[#92400E]">
                    Pay by {nextContributionDate}
                  </Text>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Growth & Activities");
                  // Scroll to top so the Pay flow is visible after switching tabs
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="cursor-pointer rounded-lg bg-[#0B6B55] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#095C49]"
              >
                Make a contribution
              </button>
            </div>
          );
        })()}
        {circle.status === "DRAFT" && (
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
            <Text size="sm" c="dimmed">
              The organiser must fill the group and start it before contributions can be paid.
            </Text>
          </div>
        )}

        {activeTab === "Overview" && (
          <OverviewTab
            circleName={circle.name}
            circleId={id!}
            circleStatus={(circle as any).status ?? ""}
            statusBadge={statusBadge}
            nextPaymentDate={nextPaymentDate}
            contributionAmountKobo={circle.contributionAmount}
            frequency={(circle as any).frequency ?? ""}
            userStatus={(circle as any).userMembershipStatus ?? "ACTIVE"}
            totalContributedKobo={totalContributed}
            completedCycles={completedCycles}
            totalCycles={totalCycles}
            progressPercent={progressPercent}
            cycles={cycles}
            members={members}
            currentUserId={currentUserId}
            currentCycleNumber={nextSchedule?.cycleNumber}
            ownContributions={contributions}
            refreshVersion={refreshVersion}
          />
        )}
        {activeTab === "Members" && (
          <MembersTab
            circleName={circle.name}
            statusBadge={statusBadge}
            members={members}
          />
        )}
        {activeTab === "Admin" && (
          <AdminTab
            circleId={id!}
            circleName={circle.name}
            statusBadge={statusBadge}
            adminName={adminName}
            adminBio={(circle as any).description ?? ""}
          />
        )}
        {activeTab === "Growth & Activities" && (
          <GrowthTab
            trustPercent={trustPercent}
            trustScore={userTrustScore}
            nextPaymentDate={nextContributionDate}
            contributions={contributions}
            setContributions={setContributions}
            contributionAmountKobo={circle.contributionAmount}
            circleId={id!}
            circleStatus={(circle as any).status ?? ""}
            nextCycleNumber={nextSchedule?.cycleNumber}
            nextDeadline={
              nextSchedule?.contributionDeadline as string | undefined
            }
            autoOpenPay={autoPay}
            openContributionOnLoad={contributionShortcut}
          />
        )}
        {activeTab === "Peer Reviews" && (
          <PeerReviewsTab
            circleId={id!}
            circleName={circle.name}
            circleStatus={(circle as any).status ?? ""}
            members={members.filter((m) => m.userId !== currentUserId)}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
