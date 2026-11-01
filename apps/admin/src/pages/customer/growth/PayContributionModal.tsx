import { kobo, formatKobo } from "@/utils/kobo";
import { useEffect, useState } from "react";
import { Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { getWalletBalance, makeContribution, type CircleContribution, type DebtRecoverySummary } from "@/utils/api";
import { formatNaira } from "./utils";

type Step = "idle" | "submitting" | "done" | "debt" | "pending" | "error";

export interface PayContributionModalProps {
  opened: boolean;
  onClose: () => void;
  circleId: string;
  currentCycleNumber?: number;
  nextCycleNumber?: number;
  contributionAmountKobo: string | number;
  amountAlreadyPaidKobo?: string | number;
  nextDeadline?: string;
  nextPaymentFallback?: string;
  /** Fires with the fresh contribution the backend returned, for parent list refresh. */
  onPaid?: (contribution: CircleContribution) => void;
  /** Refreshes account data after committed debt recovery, without inventing a contribution. */
  onBalanceChanged?: () => void;
}

export function PayContributionModal({
  opened,
  onClose,
  circleId,
  currentCycleNumber,
  nextCycleNumber,
  contributionAmountKobo,
  amountAlreadyPaidKobo = 0,
  nextDeadline,
  nextPaymentFallback,
  onPaid,
  onBalanceChanged,
}: PayContributionModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingMsg, setPendingMsg] = useState("");
  const [debtRecovery, setDebtRecovery] = useState<DebtRecoverySummary | null>(null);
  const [walletAvailable, setWalletAvailable] = useState<bigint | null>(null);
  const [submittedCycleNumber, setSubmittedCycleNumber] = useState<number | null>(null);

  const [walletError, setWalletError] = useState(false);
  const recoveryBlocked = Boolean(debtRecovery?.blockedReason) && (kobo(debtRecovery?.repaidAmount) ?? 0n) === 0n;
  const amountKobo = kobo(contributionAmountKobo);
  const hasAvailableFunds =
    walletAvailable !== null && amountKobo !== null && amountKobo > 0n && walletAvailable > 0n;
  const isEarlyPayment = nextCycleNumber != null && currentCycleNumber != null && nextCycleNumber > currentCycleNumber;
  const displayedCycleNumber = step === "done" ? submittedCycleNumber ?? nextCycleNumber : nextCycleNumber;

  const deadlineFormatted = nextDeadline
    ? new Date(nextDeadline).toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
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
    setDebtRecovery(null);
    setSubmittedCycleNumber(null);
    setWalletAvailable(null);
    setWalletError(false);
    getWalletBalance()
      .then((b) => { const available = kobo(b.available); if (available === null) throw new Error('Unavailable'); setWalletAvailable(available); })
      .catch(() => setWalletError(true));
  }, [opened]);

  async function handleConfirm() {
    if (nextCycleNumber == null || !hasAvailableFunds || walletError) return;
    const cycleBeingPaid = nextCycleNumber;
    setSubmittedCycleNumber(cycleBeingPaid);
    setStep("submitting");
    try {
      const contribution = await makeContribution(circleId, cycleBeingPaid);
      const status = String(contribution.status ?? "").toUpperCase();
      const recovery = contribution.debtRecovery;
      setDebtRecovery(recovery ?? null);
      if (status === "DEBT_REPAYMENT" || (kobo(recovery?.repaidAmount) ?? 0n) > 0n) {
        onBalanceChanged?.();
        // The repayment is committed even if the subsequent cycle transfer is pending.
        getWalletBalance().then(balance => setWalletAvailable(kobo(balance.available))).catch(() => setWalletError(true));
      }
      if (status === "DEBT_REPAYMENT") {
        setStep("debt");
        return;
      }
      if (status === "FAILED") {
        setErrorMsg("The payment failed. Check your wallet and contribution history before trying again.");
        setStep("error");
        return;
      }
      if (status === "PENDING" || (status && !["SUCCESSFUL", "SETTLED", "COMPLETED"].includes(status))) {
        setPendingMsg("Your cycle contribution is awaiting confirmation. Any debt repayment shown above is already recorded. Do not submit another payment for this cycle while it is being checked.");
        setStep("pending");
        return;
      }
      if (!("id" in contribution)) throw new Error("Check your payment history before trying again.");
      if (recovery && (kobo(recovery.repaidAmount) ?? 0n) > 0n) {
        notifications.show({ title: "Debt repayment recorded", message: `Debt repaid: ${formatKobo(recovery.repaidAmount)}. Remaining debt: ${formatKobo(recovery.remainingDebt)}.`, color: "green" });
      }
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
      title={step === "debt" ? recoveryBlocked ? "Debt repayment needs attention" : "Debt repayment recorded" : step === "done" ? "Contribution Successful" : step === "pending" ? "Payment Pending" : isEarlyPayment ? `Pay Cycle ${nextCycleNumber} Early` : "Make Contribution"}
      centered
      radius="md"
    >
      {debtRecovery && <Text role="status" size="sm" mb="sm">Debt repaid: {formatKobo(debtRecovery.repaidAmount)}. Remaining debt: {formatKobo(debtRecovery.remainingDebt)}.</Text>}
      {step === "debt" ? (
        <div className="flex flex-col gap-4 py-4">
          <Text>{recoveryBlocked ? "No cycle contribution was recorded. Automatic debt repayment could not proceed; view your debts or contact support." : `No contribution was recorded for Cycle ${submittedCycleNumber}. Your available money was applied to your outstanding debts first.`}</Text>
          {debtRecovery?.blockedReason && !recoveryBlocked && <Text size="sm">Further repayment needs attention. View your debts or contact support before trying again.</Text>}
          <button onClick={onClose} className="w-full rounded-lg bg-[#02A36E] py-3 text-sm font-semibold text-white">Done</button>
        </div>
      ) : step === "pending" ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <Text fw={700} className="text-[16px] text-[#92400E]">Payment not confirmed yet</Text>
          <Text role="status" className="text-center text-[13px] text-[#6B7280]">{pendingMsg}</Text>
          <button onClick={onClose} className="mt-2 w-full cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]">Close</button>
        </div>
      ) : step === "done" ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
            <IconCheck size={32} color="#02A36E" />
          </div>
          <Text fw={700} className="text-[18px] text-[#0F172A]">
            Payment confirmed!
          </Text>
          <Text fw={400} className="text-center text-[13px] text-[#6B7280]">
            Your contribution for Cycle {displayedCycleNumber} has been recorded.
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
            {isEarlyPayment
              ? `Cycle ${currentCycleNumber} is fully paid. Debts across all your circles are repaid first. Only the remaining available money can go toward Cycle ${nextCycleNumber}, possibly partially; its deadline and payout order will not change.`
              : `Debts across all your circles are repaid first. Only the remaining available money can go toward Cycle ${nextCycleNumber ?? "—"}, possibly partially. If debt uses the available money, no cycle contribution is recorded.`}
          </Text>
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <div className="flex justify-between py-1">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Cycle</Text>
              <Text fw={700} className="text-[13px] text-[#0F172A]">
                Cycle {nextCycleNumber ?? "—"}
              </Text>
            </div>
            <div className="flex justify-between py-1">
              <Text fw={500} className="text-[13px] text-[#6B7280]">Remaining cycle contribution</Text>
              <Text fw={700} className="text-[13px] text-[#0F172A]">
                {formatNaira(contributionAmountKobo)}
              </Text>
            </div>
            {(kobo(amountAlreadyPaidKobo) ?? 0n) > 0n && (
              <div className="flex justify-between py-1">
                <Text fw={500} className="text-[13px] text-[#6B7280]">Already paid toward this cycle</Text>
                <Text fw={700} className="text-[13px] text-[#0F172A]">
                  {formatNaira(amountAlreadyPaidKobo)}
                </Text>
              </div>
            )}
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
                  className={`text-[13px] ${walletAvailable === null ? "text-[#9CA3AF]" : hasAvailableFunds ? "text-[#02A36E]" : "text-[#EF4444]"}`}
                >
                  {walletError ? "Unavailable" : walletAvailable === null ? "Loading…" : formatKobo(walletAvailable.toString())}
                </Text>
              </div>
            </div>
          </div>

          {hasAvailableFunds && <Text size="sm">Confirming uses your available wallet money to repay debts first, then pays up to the remaining cycle contribution.</Text>}

          {walletError && <Text role="alert" c="red">Unable to load wallet balance. Close and reopen to try again.</Text>}
          {!hasAvailableFunds && walletAvailable !== null && (
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
                !hasAvailableFunds ||
                walletAvailable === null
              }
              className="flex-1 cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === "submitting" ? "Processing…" : "Confirm & Pay"}
            </button>
          </div>

          {walletError && <Text role="alert" c="red">Unable to load wallet balance. Close and reopen to try again.</Text>}
          {!hasAvailableFunds && walletAvailable !== null && (
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
