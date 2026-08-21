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
import { formatNaira, getRatingColor } from "./utils";

// ── Growth & Activities Tab ───────────────────────────────────────────────────

export function GrowthTab({
  trustPercent,
  trustScore,
  nextPaymentDate,
  contributions,
  setContributions,
  contributionAmountKobo,
  circleId,
  circleStatus,
  nextCycleNumber,
  nextDeadline,
}: {
  trustPercent: number;
  trustScore: number;
  nextPaymentDate: string;
  contributions: CircleContribution[];
  setContributions: (
    fn: (prev: CircleContribution[]) => CircleContribution[],
  ) => void;
  contributionAmountKobo: string | number;
  circleId: string;
  circleStatus: string;
  nextCycleNumber?: number;
  nextDeadline?: string;
}) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [walletAvailable, setWalletAvailable] = useState<number | null>(null);
  const [step, setStep] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const isActive = circleStatus.toUpperCase() === "ACTIVE";
  const alreadyContributed =
    nextCycleNumber != null &&
    contributions.some((c) => c.cycleNumber === nextCycleNumber);
  const canContribute =
    isActive && nextCycleNumber != null && !alreadyContributed;

  const amountKobo = Number(contributionAmountKobo);

  function openModal() {
    setStep("idle");
    setErrorMsg("");
    setWalletAvailable(null);
    setModalOpen(true);
    getWalletBalance()
      .then((b) => setWalletAvailable(Number(b.available) / 100))
      .catch(() => setWalletAvailable(0));
  }

  async function handleConfirm() {
    if (nextCycleNumber == null) return;
    setStep("submitting");
    try {
      const contribution = await makeContribution(circleId, nextCycleNumber);
      setContributions((prev) => [contribution, ...prev]);
      setStep("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    }
  }

  const deadlineFormatted = nextDeadline
    ? new Date(nextDeadline).toLocaleString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : nextPaymentDate;

  const hasSufficientFunds =
    walletAvailable !== null && walletAvailable >= amountKobo / 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Contribution Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          if (step !== "submitting") setModalOpen(false);
        }}
        title={
          step === "done" ? "Contribution Successful" : "Make Contribution"
        }
        centered
        radius="md"
      >
        {step === "done" ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
              <IconCheck size={32} color="#02A36E" />
            </div>
            <Text fw={700} className="text-[18px] text-[#0F172A]">
              Payment confirmed!
            </Text>
            <Text fw={400} className="text-center text-[13px] text-[#6B7280]">
              Your contribution for Cycle {nextCycleNumber} has been recorded.
            </Text>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-2 w-full cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="flex justify-between py-1">
                <Text fw={500} className="text-[13px] text-[#6B7280]">
                  Cycle
                </Text>
                <Text fw={700} className="text-[13px] text-[#0F172A]">
                  Cycle {nextCycleNumber}
                </Text>
              </div>
              <div className="flex justify-between py-1">
                <Text fw={500} className="text-[13px] text-[#6B7280]">
                  Amount
                </Text>
                <Text fw={700} className="text-[13px] text-[#0F172A]">
                  {formatNaira(contributionAmountKobo)}
                </Text>
              </div>
              <div className="flex justify-between py-1">
                <Text fw={500} className="text-[13px] text-[#6B7280]">
                  Deadline
                </Text>
                <Text fw={700} className="text-[13px] text-[#0F172A]">
                  {deadlineFormatted}
                </Text>
              </div>
              <div className="mt-1 border-t border-[#E5E7EB] pt-2">
                <div className="flex justify-between py-1">
                  <Text fw={500} className="text-[13px] text-[#6B7280]">
                    Wallet Balance
                  </Text>
                  <Text
                    fw={700}
                    className={`text-[13px] ${walletAvailable === null ? "text-[#9CA3AF]" : hasSufficientFunds ? "text-[#02A36E]" : "text-[#EF4444]"}`}
                  >
                    {walletAvailable === null
                      ? "Loading…"
                      : `₦${walletAvailable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                  </Text>
                </div>
              </div>
            </div>

            {!hasSufficientFunds && walletAvailable !== null && (
              <div className="flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                <Text fw={500} className="text-[12px] text-[#991B1B]">
                  Insufficient balance. Please fund your wallet first.
                </Text>
              </div>
            )}

            {step === "error" && (
              <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                <Text fw={500} className="text-[12px] text-[#991B1B]">
                  {errorMsg}
                </Text>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                disabled={step === "submitting"}
                className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  step === "submitting" ||
                  !hasSufficientFunds ||
                  walletAvailable === null
                }
                className="flex-1 cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === "submitting" ? "Processing…" : "Confirm & Pay"}
              </button>
            </div>

            {!hasSufficientFunds && walletAvailable !== null && (
              <button
                onClick={() => {
                  setModalOpen(false);
                  navigate("/wallet/fund");
                }}
                className="cursor-pointer rounded-lg border border-[#02A36E] py-3 text-[13px] font-semibold text-[#02A36E]"
              >
                Fund Wallet
              </button>
            )}
          </div>
        )}
      </Modal>

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
            {nextPaymentDate}
          </Text>
          <Text fw={600} className="text-[14px] text-[#0F172A]">
            Next Payment
          </Text>
          <button
            onClick={() => navigate("/wallet/fund")}
            className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            <IconWallet size={16} />
            Fund Wallet
          </button>
        </div>
      </div>

      {/* Make Contribution CTA */}
      {canContribute && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text fw={700} className="text-[14px] text-[#15803D]">
              Cycle {nextCycleNumber} contribution due
            </Text>
            <Text fw={500} className="text-[12px] text-[#166534]">
              {formatNaira(contributionAmountKobo)} · Deadline{" "}
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
            Cycle {nextCycleNumber} contribution received - you&rsquo;re all
            set!
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
          Late-payment fees are paid to your circle admin.{" "}
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
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
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
                  Penalty
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
                          {penalty > 0 ? formatNaira(c.penaltyAmount) : "-"}
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
