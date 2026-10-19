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
} from "@mantine/core";
import {
  IconInfoCircle,
  IconMessageCircle,
  IconCalendar,
  IconShieldCheck,
  IconCheck,
  IconCash,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  leaveRoscaCircle,
  messageAdmin,
  submitPeerReview,
  type CircleContribution,
  type CircleMember,
} from "@/utils/api";
import { formatNaira, getRatingColor } from "./utils";
import { PayContributionModal } from "./PayContributionModal";

// ── Growth & Activities Tab ───────────────────────────────────────────────────

export function GrowthTab({
  trustPercent,
  trustScore,
  nextContributionDate,
  contributions,
  setContributions,
  contributionAmountKobo,
  circleId,
  circleStatus,
  currentCycleNumber,
  onContributionPaid,
  nextCycleNumber,
  nextDeadline,
  autoOpenPay = false,
  openContributionOnLoad = false,
}: {
  trustPercent: number;
  trustScore: number;
  nextContributionDate: string;
  contributions: CircleContribution[];
  setContributions: (
    fn: (prev: CircleContribution[]) => CircleContribution[],
  ) => void;
  contributionAmountKobo: string | number;
  circleId: string;
  circleStatus: string;
  currentCycleNumber: number;
  onContributionPaid: () => void;
  nextCycleNumber?: number;
  nextDeadline?: string;
  autoOpenPay?: boolean;
  openContributionOnLoad?: boolean;
}) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const isActive = circleStatus.toUpperCase() === "ACTIVE";
  const contributedAmount = nextCycleNumber == null
    ? 0
    : contributions
        .filter((c) => c.cycleNumber === nextCycleNumber)
        .reduce((sum, c) => sum + Number(c.amount), 0);
  const remainingAmountKobo = Math.max(0, Number(contributionAmountKobo) - contributedAmount);
  const alreadyContributed = remainingAmountKobo === 0;
  const isEarlyPayment = nextCycleNumber != null && nextCycleNumber > currentCycleNumber;
  const canContribute =
    isActive && nextCycleNumber != null && !alreadyContributed;
  const deadlineFormatted = nextDeadline
    ? new Date(nextDeadline).toLocaleString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : nextContributionDate;

  function openModal() {
    setModalOpen(true);
  }

  // Deep-link entry: when ?pay=1 (or legacy ?action=contribute) arrives, auto-open
  // the shared pay modal once we know the user is actually allowed to contribute.
  // Fires exactly once per mount thanks to the state guard.
  const [autoPayFired, setAutoPayFired] = useState(false);
  useEffect(() => {
    if (autoPayFired || !canContribute) return;
    if (!autoOpenPay && !openContributionOnLoad) return;
    setAutoPayFired(true);
    openModal();
  }, [autoOpenPay, openContributionOnLoad, autoPayFired, canContribute]);

  return (
    <div className="flex flex-col gap-6">
      {/* Contribution Modal (shared with the Ajo joined-card Pay button) */}
      <PayContributionModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        circleId={circleId}
        currentCycleNumber={currentCycleNumber}
        nextCycleNumber={nextCycleNumber}
        contributionAmountKobo={remainingAmountKobo}
        amountAlreadyPaidKobo={contributedAmount}
        nextDeadline={nextDeadline}
        nextPaymentFallback={nextContributionDate}
        onPaid={(contribution) => {
          setContributions((prev) => [
            contribution,
            ...prev.filter((existing) => existing.id !== contribution.id),
          ]);
          onContributionPaid();
        }}
      />


      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Trust Score */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconShieldCheck size={28} color="#02A36E" />
          </div>
          <Text fw={800} className="mt-3 text-[32px] text-[#02A36E]">
            {trustScore}
          </Text>
          <Text fw={600} className="text-[14px] text-[#0F172A]">
            Trust Score
          </Text>
          <Text fw={500} className="mt-1 text-[12px] text-[#6B7280]">
            {trustPercent >= 80
              ? "Excellent"
              : trustPercent >= 60
                ? "Good"
                : trustPercent >= 40
                  ? "Fair"
                  : "Poor"}
          </Text>
        </div>

        {/* Next Payment */}
        <div className="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3C7]">
            <IconCalendar size={28} color="#F59E0B" />
          </div>
          <Text
            fw={700}
            className="mt-3 text-center text-[18px] text-[#0F172A]"
          >
            {nextContributionDate}
          </Text>
          <Text fw={600} className="text-[14px] text-[#0F172A]">
            Next Contribution
          </Text>
          {canContribute && (
            <button
              type="button"
              onClick={openModal}
              className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              <IconCash size={16} />
              {isEarlyPayment ? `Pay Cycle ${nextCycleNumber} Early` : "Pay contribution"}
            </button>
          )}
        </div>
      </div>

      {/* Make Contribution CTA */}
      {canContribute && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text fw={700} className="text-[14px] text-[#15803D]">
              {isEarlyPayment ? `Cycle ${nextCycleNumber} contribution · pay early` : `Cycle ${nextCycleNumber} contribution`}
            </Text>
            <Text fw={500} className="text-[12px] text-[#166534]">
              {formatNaira(remainingAmountKobo)} remaining · Deadline{" "}
              {deadlineFormatted}
            </Text>
          </div>
          <button
            onClick={openModal}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white sm:w-auto"
          >
            <IconCash size={16} />
            Pay Now
          </button>
        </div>
      )}

      {alreadyContributed && isActive && nextCycleNumber != null && (
        <div className="flex items-center gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4">
          <IconCheck size={20} color="#16a34a" />
          <Text fw={600} className="text-[13px] text-[#15803D]">
            Cycle {nextCycleNumber} contribution received - you&rsquo;re all set!
          </Text>
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4">
        <IconInfoCircle
          size={20}
          color="#0284C7"
          className="mt-0.5 flex-shrink-0"
        />
        <Text fw={500} className="text-[13px] leading-relaxed text-[#0C4A6E]">
          Your trust score is based on your payment history. Consistent on-time
          payments increase your score. Late or missed payments reduce it.
          Late contributions after the deadline incur a 1.5% fee. If a missed
          contribution remains unpaid after 23:59 WAT, its outstanding principal
          is recalculated at 4%; this replaces the 1.5% and does not stack. Fees
          go to Ajoti platform revenue.{" "}
          <button
            onClick={() => navigate("/debts")}
            className="cursor-pointer font-semibold underline"
          >
            View my debts
          </button>
        </Text>
      </div>

      {/* Payment History */}
      <div>
        <Text fw={700} className="mb-4 text-[16px] text-[#0F172A]">
          Payment History
        </Text>

        {/* Mobile: card list */}
        <div className="flex flex-col gap-2 sm:hidden">
          {contributions.length === 0 ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
              No contributions recorded yet.
            </div>
          ) : (
            contributions.map((c) => {
              const penalty = Number(c.penaltyAmount ?? 0);
              const date = c.paidAt
                ? new Date(c.paidAt).toLocaleDateString("en-NG", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                : "-";
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Text fw={700} className="text-[14px] text-[#0F172A]">
                      Cycle {c.cycleNumber}
                    </Text>
                    <Badge
                      size="sm"
                      radius="xl"
                      styles={{
                        root: {
                          backgroundColor: "#D1FAE5",
                          color: "#065F46",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: 11,
                        },
                      }}
                    >
                      Paid
                    </Badge>
                  </div>
                  <Text className="mt-1 text-[12px] text-[#6B7280]">
                    {date}
                  </Text>
                  <Text fw={700} className="mt-2 text-[15px] text-[#0F172A]">
                    {formatNaira(c.amount)}
                  </Text>
                  {penalty > 0 && (
                    <Text className="mt-1 text-[12px] text-[#EF4444]">
                      Late fee: {formatNaira(c.penaltyAmount)}
                      <span className="ml-1 text-[10.5px] text-[#6B7280]">(1.5% after deadline)</span>
                    </Text>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white sm:block">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                  Cycle
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                  Date Paid
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                  Amount
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                  Late fee
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]"
                  >
                    No contributions recorded yet.
                  </td>
                </tr>
              ) : (
                contributions.map((c) => {
                  const penalty = Number(c.penaltyAmount ?? 0);
                  const date = c.paidAt
                    ? new Date(c.paidAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[#F3F4F6] last:border-b-0"
                    >
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text fw={600} className="text-[13px] text-[#0F172A]">
                          Cycle {c.cycleNumber}
                        </Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text fw={500} className="text-[13px] text-[#6B7280]">
                          {date}
                        </Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text fw={600} className="text-[13px] text-[#0F172A]">
                          {formatNaira(c.amount)}
                        </Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Text
                          fw={500}
                          className={`text-[13px] ${penalty > 0 ? "text-[#EF4444]" : "text-[#6B7280]"}`}
                        >
                          {penalty > 0 ? (
                            <>
                              {formatNaira(c.penaltyAmount)}
                              <span className="mt-0.5 block text-[10px] text-[#6B7280]">1.5% after deadline</span>
                            </>
                          ) : "-"}
                        </Text>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <Badge
                          size="sm"
                          radius="xl"
                          styles={{
                            root: {
                              backgroundColor: "#D1FAE5",
                              color: "#065F46",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: 11,
                            },
                          }}
                        >
                          Paid
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
