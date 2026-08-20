import { useState, useEffect } from "react";
import { Text, Loader } from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconBackspace,
  IconAlertCircle,
  IconClock,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  ApiError,
  getWallet,
  initializeWithdrawal,
  listBankAccounts,
  removeBankAccount,
  type PendingWithdrawal,
  type SavedBankAccount,
} from "@/utils/api";
import { AddBankAccountModal } from "@/components";

type Step =
  | "select-account"
  | "amount"
  | "pin"
  | "processing"
  | "success"
  | "error";

function fmtKobo(kobo: string) {
  return (Number(kobo) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  });
}

const MIN_WITHDRAWAL_NAIRA = 100;

export function WithdrawFunds() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-account");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Saved accounts
  const [savedAccounts, setSavedAccounts] = useState<SavedBankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] =
    useState<SavedBankAccount | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  // Amount
  const [amount, setAmount] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);

  // Stage 11: a withdrawal already in flight blocks starting another
  const [pendingWithdrawal, setPendingWithdrawal] =
    useState<PendingWithdrawal | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // PIN
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function loadWallet() {
    setLoadingWallet(true);
    getWallet()
      .then((data) => {
        setAvailableBalance(Number(data.balance?.available ?? 0) / 100);
        setPendingWithdrawal(data.pendingWithdrawal ?? null);
      })
      .catch(() => setAvailableBalance(0))
      .finally(() => setLoadingWallet(false));
  }

  useEffect(() => {
    loadWallet();
    loadAccounts();
  }, []);

  function loadAccounts() {
    setLoadingAccounts(true);
    listBankAccounts()
      .then((res) => setSavedAccounts(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
  }

  async function handleRemoveAccount(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRemoving(id);
    try {
      await removeBankAccount(id);
      setSavedAccounts((prev) => prev.filter((a) => a.id !== id));
      if (selectedAccount?.id === id) setSelectedAccount(null);
    } catch {
      // ignore
    } finally {
      setRemoving(null);
    }
  }

  const numericAmount = parseInt(amount.replace(/,/g, ""), 10) || 0;

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString();
  }

  const canProceedToPin =
    numericAmount >= MIN_WITHDRAWAL_NAIRA &&
    numericAmount <= availableBalance &&
    selectedAccount !== null;

  async function submitWithdrawal(enteredPin: string) {
    if (!selectedAccount) return;
    setStep("processing");
    setError(null);
    try {
      await initializeWithdrawal({
        amount: numericAmount,
        accountNumber: selectedAccount.accountNumber,
        accountName: selectedAccount.accountName,
        bankCode: selectedAccount.bankCode,
        bankName: selectedAccount.bankName,
        narration: `Withdrawal of NGN ${amount}`,
        transactionPin: enteredPin,
      });
      setStep("success");
    } catch (err) {
      // 409: a withdrawal is already in progress (started elsewhere, e.g. another
      // tab/device, between this page loading and submitting) — refresh wallet
      // state so the blocked-state screen shows instead of letting the user retry
      // into the same error again.
      if (err instanceof ApiError && err.code === 409) {
        loadWallet();
      }
      setError(
        err instanceof Error
          ? err.message
          : "Withdrawal failed. Please try again.",
      );
      setStep("error");
    }
  }

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => submitWithdrawal(newPin), 300);
      }
    }
  }

  // ==================== PROCESSING ====================
  if (step === "processing") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
        <Text fw={500} className="text-[14px] text-[#6B7280]">
          Processing your withdrawal...
        </Text>
      </div>
    );
  }

  // ==================== SUCCESS ====================
  if (step === "success") {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center gap-6 px-4 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
            <IconCheck size={32} color="white" strokeWidth={3} />
          </div>
        </div>
        <div className="text-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Withdrawal Successful
          </Text>
          <Text
            fw={400}
            className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]"
          >
            Your withdrawal of ₦{amount} has been initiated successfully.
          </Text>
        </div>
        <div className="mt-4 flex w-full max-w-[300px] flex-col gap-3">
          <button
            onClick={() => navigate("/home")}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Done
          </button>
          <button
            onClick={() => navigate("/transactions")}
            className="w-full cursor-pointer rounded-xl border border-[#02A36E] bg-white py-3.5 text-[14px] font-semibold text-[#02A36E] hover:bg-[#F0FDF4]"
          >
            View Transactions
          </button>
        </div>
      </div>
    );
  }

  // ==================== ERROR ====================
  if (step === "error") {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center gap-6 px-4 pt-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500">
            <IconAlertCircle size={32} color="white" />
          </div>
        </div>
        <div className="text-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Withdrawal Failed
          </Text>
          <Text
            fw={400}
            className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]"
          >
            {error}
          </Text>
        </div>
        <div className="flex w-full max-w-[300px] flex-col gap-3">
          {/* A withdrawal already in progress can't be retried immediately —
              only offer "Try Again" when that's not why this failed. */}
          {!pendingWithdrawal && (
            <button
              onClick={() => {
                setPin("");
                setStep("pin");
              }}
              className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => {
              setPin("");
              setStep("select-account");
            }}
            className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] py-3.5 text-[14px] font-semibold text-[#374151]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AddBankAccountModal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={(acc) => {
          setSavedAccounts((prev) => [...prev, acc]);
          setSelectedAccount(acc);
          setAddModalOpen(false);
        }}
      />

      <div className="mx-auto w-full max-w-[600px] px-4 py-6 sm:px-6 sm:py-8">
        {/* ==================== STEP: SELECT ACCOUNT ==================== */}
        {step === "select-account" && (
          <div className="flex flex-col gap-5">
            <button
              onClick={() => navigate(-1)}
              className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
            >
              <IconArrowLeft size={18} /> Back
            </button>

            <div>
              <Text fw={700} className="text-[24px] text-[#0F172A]">
                Withdraw Funds
              </Text>
              <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
                Available: ₦
                {availableBalance.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </div>

            {/* Stage 11: a pending withdrawal blocks starting another (and every
                other debit on the wallet) until it settles. */}
            {!loadingWallet && pendingWithdrawal && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <IconClock size={18} color="#B45309" />
                </div>
                <div className="flex-1">
                  <Text fw={600} className="text-[14px] text-[#92400E]">
                    A withdrawal is already in progress
                  </Text>
                  <Text
                    fw={400}
                    className="mt-1 text-[13px] leading-[1.5] text-[#92400E]"
                  >
                    ₦{fmtKobo(pendingWithdrawal.amountKobo)} initiated{" "}
                    {new Date(pendingWithdrawal.initiatedAt).toLocaleString(
                      "en-NG",
                    )}
                    . Please wait for it to complete before starting another —
                    your balance is safe and this usually resolves within a few
                    minutes.
                  </Text>
                  <button
                    onClick={loadWallet}
                    className="mt-2 cursor-pointer text-[13px] font-semibold text-[#B45309] hover:underline"
                  >
                    Check again
                  </button>
                </div>
              </div>
            )}

            <div
              className={`rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5 ${pendingWithdrawal ? "pointer-events-none opacity-50" : ""}`}
            >
              <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
                Select Recipient Account
              </Text>

              {loadingAccounts ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader size={16} color="#02A36E" />
                  <Text className="text-[13px] text-[#6B7280]">
                    Loading accounts...
                  </Text>
                </div>
              ) : savedAccounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4 py-6 text-center">
                  <Text fw={400} className="text-[13px] text-[#6B7280]">
                    No saved accounts yet.
                  </Text>
                  <Text fw={400} className="text-[13px] text-[#6B7280]">
                    Add an account to withdraw funds.
                  </Text>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                        selectedAccount?.id === acc.id
                          ? "border-[#02A36E] bg-[#F0FDF4]"
                          : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <div>
                        <Text fw={600} className="text-[14px] text-[#0F172A]">
                          {acc.accountName}
                        </Text>
                        <Text fw={400} className="text-[12px] text-[#6B7280]">
                          {acc.accountNumber} · {acc.bankName}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        {acc.isDefault && (
                          <span className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-medium text-[#02A36E]">
                            Default
                          </span>
                        )}
                        {removing === acc.id ? (
                          <Loader size={14} color="#9CA3AF" />
                        ) : (
                          <button
                            onClick={(e) => handleRemoveAccount(acc.id, e)}
                            className="cursor-pointer rounded-lg p-1.5 text-[#9CA3AF] hover:bg-red-50 hover:text-red-500"
                          >
                            <IconTrash size={15} />
                          </button>
                        )}
                        {selectedAccount?.id === acc.id && (
                          <IconCheck size={16} color="#02A36E" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setAddModalOpen(true)}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#02A36E] bg-[#F0FDF4] py-3 text-[13px] font-medium text-[#02A36E] hover:bg-[#dcfce7]"
              >
                <IconPlus size={15} /> Add New Account
              </button>
            </div>

            {/* Amount */}
            {selectedAccount && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
                <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
                  Enter Amount
                </Text>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-[#0F172A]">
                    ₦
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(formatAmount(e.target.value))}
                    placeholder="0"
                    className="h-[52px] w-full rounded-xl border border-[#E5E7EB] pl-8 pr-4 text-[20px] font-semibold text-[#0F172A] outline-none focus:border-[#02A36E]"
                  />
                </div>
                {numericAmount > 0 && numericAmount < MIN_WITHDRAWAL_NAIRA && (
                  <Text fw={400} className="mt-2 text-[12px] text-red-500">
                    Minimum withdrawal is ₦{MIN_WITHDRAWAL_NAIRA}
                  </Text>
                )}
                {numericAmount > availableBalance && numericAmount > 0 && (
                  <Text fw={400} className="mt-2 text-[12px] text-red-500">
                    Amount exceeds available balance
                  </Text>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {["5,000", "10,000", "50,000", "100,000"].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        amount === val
                          ? "border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]"
                          : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      ₦{val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep("pin")}
              disabled={!canProceedToPin}
              className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${
                canProceedToPin
                  ? "cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]"
                  : "cursor-not-allowed bg-[#9CA3AF]"
              }`}
            >
              Proceed
            </button>
          </div>
        )}

        {/* ==================== STEP: PIN ENTRY ==================== */}
        {step === "pin" && (
          <div className="flex flex-col items-center gap-8 pt-8">
            <button
              onClick={() => {
                setStep("select-account");
                setPin("");
              }}
              className="mr-auto flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
            >
              <IconArrowLeft size={18} /> Back
            </button>

            {/* Summary */}
            <div className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-center">
              <Text fw={400} className="text-[13px] text-[#6B7280]">
                Withdrawing
              </Text>
              <Text fw={700} className="mt-1 text-[28px] text-[#0F172A]">
                ₦{amount}
              </Text>
              <Text fw={600} className="mt-1 text-[14px] text-[#0F172A]">
                {selectedAccount?.accountName}
              </Text>
              <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                {selectedAccount?.accountNumber} · {selectedAccount?.bankName}
              </Text>
            </div>

            <div className="text-center">
              <Text fw={700} className="text-[22px] text-[#0F172A]">
                Enter Your PIN
              </Text>
              <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
                Enter your 4-digit transaction PIN to confirm
              </Text>
            </div>

            {/* PIN dots */}
            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${
                    i < pin.length
                      ? "border-[#02A36E] bg-[#F0FDF4]"
                      : "border-[#E5E7EB] bg-white"
                  }`}
                >
                  {i < pin.length && (
                    <div className="h-3 w-3 rounded-full bg-[#02A36E]" />
                  )}
                </div>
              ))}
            </div>

            <button className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline">
              Forgot PIN?
            </button>

            {/* Number pad */}
            <div className="grid w-[280px] grid-cols-3 gap-3">
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "",
                "0",
                "back",
              ].map((key) => {
                if (key === "") return <div key="empty" />;
                if (key === "back") {
                  return (
                    <button
                      key="back"
                      onClick={() => setPin((p) => p.slice(0, -1))}
                      className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]"
                    >
                      <IconBackspace size={22} color="#374151" />
                    </button>
                  );
                }
                return (
                  <button
                    key={key}
                    onClick={() => handlePinDigit(key)}
                    className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[20px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB]"
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
