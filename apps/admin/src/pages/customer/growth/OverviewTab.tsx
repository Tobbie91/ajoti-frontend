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
  leaveRoscaCircle,
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
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const canLeave = circleStatus === "DRAFT";

  async function handleLeave() {
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveRoscaCircle(circleId);
      navigate("/rosca");
    } catch (err) {
      setLeaveError(
        err instanceof Error ? err.message : "Failed to leave circle",
      );
      setLeaving(false);
    }
  }

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
            : `Your ajo is getting started. Your first payout is scheduled for ${nextPaymentDate}.`}
          {nextPaymentDate !== "TBD" && completedCycles > 0
            ? ` Your next payout is scheduled for ${nextPaymentDate}.`
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

      {canLeave && !leaveConfirm && (
        <button
          onClick={() => setLeaveConfirm(true)}
          className="w-full cursor-pointer rounded-xl border-2 border-[#EF4444] py-4 text-[15px] font-semibold text-[#EF4444] hover:bg-red-50"
        >
          Leave Circle
        </button>
      )}

      {canLeave && leaveConfirm && (
        <div className="rounded-2xl border-2 border-[#EF4444] bg-red-50 p-5">
          <Text fw={600} className="text-[15px] text-[#EF4444]">
            Leave this circle?
          </Text>
          <Text fw={400} className="mt-1 text-[13px] text-[#6B7280]">
            Your collateral will be returned to your wallet immediately. This
            cannot be undone.
          </Text>
          {leaveError && (
            <Text fw={400} className="mt-2 text-[12px] text-red-600">
              {leaveError}
            </Text>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="flex-1 cursor-pointer rounded-xl bg-[#EF4444] py-3 text-[14px] font-semibold text-white disabled:opacity-60"
            >
              {leaving ? "Leaving..." : "Yes, Leave"}
            </button>
            <button
              onClick={() => {
                setLeaveConfirm(false);
                setLeaveError(null);
              }}
              disabled={leaving}
              className="flex-1 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white py-3 text-[14px] font-semibold text-[#374151]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
