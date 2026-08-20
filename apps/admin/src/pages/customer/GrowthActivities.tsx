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
  Tabs,
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
import { useNavigate, useParams } from "react-router-dom";
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

export function GrowthActivities() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [loading, setLoading] = useState(true);

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
    Promise.all([
      getRoscaCircle(id),
      getRoscaSchedules(id).catch(() => [] as RoscaSchedule[]),
      getCircleContributions(id).catch(() => [] as CircleContribution[]),
      getTrustScore().catch(
        () => ({ trustScore: 0 }) as { trustScore: number },
      ),
    ])
      .then(([c, s, contrib, ts]) => {
        setCircle(c);
        setSchedules(s);
        setContributions(contrib);
        setUserTrustScore((ts as { trustScore: number }).trustScore ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader size={48} color="#02A36E" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Text fw={600} className="text-[#374151]">
          Circle not found
        </Text>
        <button
          onClick={() => navigate("/rosca")}
          className="cursor-pointer text-sm font-medium text-[#02A36E]"
        >
          Back to groups
        </button>
      </div>
    );
  }

  const members = ((circle as any).members as CircleMember[]) ?? [];
  const adminName = circle.admin
    ? `${circle.admin.firstName} ${circle.admin.lastName}`.trim()
    : "Admin";
  const cycles = mapSchedulesToCycles(schedules, members);
  const completedCycles = cycles.filter((c) => c.status === "Completed").length;
  const totalCycles = cycles.length || circle.durationCycles || 1;
  const progressPercent =
    totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0;

  const trustPercent = Math.min(100, userTrustScore);

  // Next pending payout
  const nextSchedule = schedules
    .filter(
      (s) => !["COMPLETED", "PAID"].includes((s.status ?? "").toUpperCase()),
    )
    .sort((a, b) => (a.cycleNumber ?? 0) - (b.cycleNumber ?? 0))[0];
  const nextPaymentDate = nextSchedule?.payoutDate
    ? new Date(nextSchedule.payoutDate as string).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "TBD";

  const totalContributed = contributions.reduce(
    (s, c) => s + Number(c.amount),
    0,
  );
  const statusBadge = circleStatusBadge((circle as any).status ?? "");

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/rosca")}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Growth & Activities
          </Text>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(v || "Overview")}
          variant="default"
          styles={{
            list: {
              display: "flex",
              flexWrap: "nowrap",
              overflowX: "auto",
              scrollbarWidth: "none",
            },
            tab: {
              flexShrink: 0,
              textAlign: "center",
              fontWeight: 500,
              fontSize: 13,
              padding: "10px 12px",
              color: "#9CA3AF",
              whiteSpace: "nowrap",
            },
          }}
        >
          <Tabs.List>
            {GROUP_TABS.map((tab) => (
              <Tabs.Tab key={tab} value={tab}>
                {tab}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

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
            nextPaymentDate={nextPaymentDate}
            contributions={contributions}
            setContributions={setContributions}
            contributionAmountKobo={circle.contributionAmount}
            circleId={id!}
            circleStatus={(circle as any).status ?? ""}
            nextCycleNumber={nextSchedule?.cycleNumber}
            nextDeadline={
              nextSchedule?.contributionDeadline as string | undefined
            }
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
