import { useEffect, useState } from "react";
import { Modal, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { getWalletBalance, makeContribution, type CircleContribution } from "@/utils/api";
import { formatNaira } from "./utils";

type Step = "idle" | "submitting" | "done" | "error";

export interface PayContributionModalProps {
  opened: boolean;
  onClose: () => void;
  circleId: string;
  nextCycleNumber?: number;
  contributionAmountKobo: string | number;
  nextDeadline?: string;
  nextPaymentFallback?: string;
  /** Fires with the fresh contribution the backend returned, for parent list refresh. */
  onPaid?: (contribution: CircleContribution) => void;
}

export function PayContributionModal({
  opened,
  onClose,
  circleId,
  nextCycleNumber,
  contributionAmountKobo,
  nextDeadline,
  nextPaymentFallback,
  onPaid,
}: PayContributionModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [walletAvailable, setWalletAvailable] = useState<number | null>(null);

  const amountKobo = Number(contributionAmountKobo);
  const hasSufficientFunds =
    walletAvailable !== null && walletAvailable >= amountKobo / 100;

  const deadlineFormatted = nextDeadline
    ? new Date(nextDeadline).toLocaleString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : nextPaymentFallback ?? "";

  // Reset to idle + fetch wallet whenever the modal opens.
  useEffect(() => {
    if (!opened) return;
    setStep("idle");
    setErrorMsg("");
    setWalletAvailable(null);
    getWalletBalance()
      .then((b) => setWalletAvailable(Number(b.available) / 100))
      .catch(() => setWalletAvailable(0));
  }, [opened]);

  async function handleConfirm() {
    if (nextCycleNumber == null) return;
    setStep("submitting");
    try {
      const contribution = await makeContribution(circleId, nextCycleNumber);
      if (onPaid) onPaid(contribution);
      setStep("done");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (step !== "submitting") onClose();
      }}
      title={step === "done" ? "Contribution Successful" : "Make Contribution"}
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
            onClick={onClose}
            className="mt-2 w-full cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Text size="sm" c="dimmed">
            You can pay this cycle before its deadline. Review the cycle and amount, then confirm to continue. Your next contribution will move to the following unpaid cycle after payment is recorded.
          </Text>
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <div className="flex justify-between py-1">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Cycle</Text>
              <Text fw={700} className="text-[13px] text-[#0F172A]">
                Cycle {nextCycleNumber ?? "—"}
              </Text>
            </div>
            <div className="flex justify-between py-1">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Amount</Text>
              <Text fw={700} className="text-[13px] text-[#0F172A]">
                {formatNaira(contributionAmountKobo)}
              </Text>
            </div>
            <div className="flex justify-between py-1">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Deadline</Text>
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
              onClick={onClose}
              disabled={step === "submitting"}
              className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                step === "submitting" ||
                nextCycleNumber == null ||
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
                onClose();
                navigate("/fund-wallet");
              }}
              className="cursor-pointer rounded-lg border border-[#02A36E] py-3 text-[13px] font-semibold text-[#02A36E]"
            >
              Fund Wallet
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
