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
  IconInfoCircle,
  IconMessageCircle,
  IconCalendar,
  IconShieldCheck,
  IconWallet,
  IconCheck,
  IconCash,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  messageAdmin,
  makeContribution,
  getWalletBalance,
  submitPeerReview,
  type CircleContribution,
  type CircleMember,
} from "@/utils/api";
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
}) {
  const navigate = useNavigate();
  const canRequestExit = userStatus === "ACTIVE" && (circleStatus === "DRAFT" || circleStatus === "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
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
        <IconInfoCircle
          size={20}
          color="#0284C7"
          className="mt-0.5 flex-shrink-0"
        />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          {completedCycles > 0
            ? `${completedCycles} of ${totalCycles} cycles completed. Keep up the great work!`
            : circleStatus === 'DRAFT' ? 'The organiser must fill all member slots and start the group before contributions begin.' : 'Your ajo is getting started.'}
          {!["Schedule unavailable", "All payouts completed"].includes(nextPaymentDate) && completedCycles > 0
            ? ` The next group payout is scheduled for ${nextPaymentDate}.`
            : ""}
        </Text>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Contributed",
            value: formatNaira(totalContributedKobo),
          },
          {
            label: `${frequency || "Per Cycle"} Due`,
            value: formatNaira(contributionAmountKobo),
          },
          { label: "Frequency", value: frequency },
          {
            label: "Your Status",
            value: userStatus === "ACTIVE" ? "Active" : userStatus,
            isGreen: userStatus === "ACTIVE",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#E5E7EB] bg-white p-4"
          >
            <Text fw={500} className="text-[12px] text-[#6B7280]">
              {item.label}
            </Text>
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
        {/* Donut */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Payout Timeline
          </Text>
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
                <Text fw={500} className="text-[12px] text-[#6B7280]">
                  Complete
                </Text>
              </div>
            }
          />
          <Text fw={500} className="mt-4 text-[13px] text-[#6B7280]">
            {completedCycles} of {totalCycles} cycles completed
          </Text>
        </div>

        {/* Cycle List */}
        <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
            Cycle Progress
          </Text>
          {cycles.length === 0 ? (
            <Text fw={400} className="text-[13px] text-[#9CA3AF]">
              No cycles scheduled yet.
            </Text>
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
                    {cycle.status === "Completed" ? (
                      <IconCheck size={16} stroke={2.5} />
                    ) : (
                      cycle.cycle
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text
                      fw={600}
                      className="truncate text-[13px] text-[#0F172A]"
                    >
                      {cycle.recipientName}
                    </Text>
                  </div>
                  <Badge
                    size="sm"
                    radius="xl"
                    styles={{
                      root: {
                        backgroundColor:
                          cycle.status === "Completed"
                            ? "#D1FAE5"
                            : cycle.status === "Current"
                              ? "#FEF3C7"
                              : "#F3F4F6",
                        color:
                          cycle.status === "Completed"
                            ? "#065F46"
                            : cycle.status === "Current"
                              ? "#92400E"
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

      {canRequestExit && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <Text size="sm" c="dimmed">To leave this group, contact Support. The team will review your request before making membership or collateral changes.</Text>
          <button type="button" onClick={() => navigate(`/support?category=ROSCA&subject=${encodeURIComponent(`Group exit request: ${circleName}`)}&body=${encodeURIComponent(`Group ID: ${circleId}\nReason for requesting to leave: `)}`)} className="mt-3 cursor-pointer text-sm font-semibold text-[#02A36E]">Contact Support</button>
        </div>
      )}
    </div>
  );
}
