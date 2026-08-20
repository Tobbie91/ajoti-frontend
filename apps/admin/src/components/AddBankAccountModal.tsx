import { useState, useEffect } from "react";
import { Modal, Text, Loader } from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconBackspace,
  IconLock,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  getBanks,
  resolveAccount,
  addBankAccount,
  getPinStatus,
  type SavedBankAccount,
  type BankOption,
} from "@/utils/api";

interface AddBankAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (account: SavedBankAccount) => void;
}

type ResolveState = "idle" | "loading" | "success" | "error";
type PinState = "checking" | "ready" | "missing" | "error";

export function AddBankAccountModal({
  opened,
  onClose,
  onSuccess,
}: AddBankAccountModalProps) {
  const navigate = useNavigate();
  const [pinState, setPinState] = useState<PinState>("checking");
  const [banks, setBanks] = useState<{ label: string; value: string }[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [newBankCode, setNewBankCode] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [resolveState, setResolveState] = useState<ResolveState>("idle");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function checkPin() {
    setPinState("checking");
    getPinStatus()
      .then(({ hasPin }) => setPinState(hasPin ? "ready" : "missing"))
      .catch(() => setPinState("error"));
  }

  useEffect(() => {
    if (!opened) return;
    checkPin();
  }, [opened]);

  useEffect(() => {
    if (!opened || pinState !== "ready") return;
    getBanks()
      .then((list) => {
        const seen = new Set<string>();
        const unique = list.filter((b: BankOption) => {
          if (seen.has(b.code)) return false;
          seen.add(b.code);
          return true;
        });
        setBanks(
          unique.map((b: BankOption) => ({ label: b.name, value: b.code })),
        );
      })
      .catch(() => {});
  }, [opened, pinState]);

  useEffect(() => {
    if (!opened) {
      setPinState("checking");
      setBankSearch("");
      setNewBankCode("");
      setNewAccountNumber("");
      setResolveState("idle");
      setResolvedName(null);
      setResolveError(null);
      setShowPin(false);
      setPin("");
      setSaveError(null);
    }
  }, [opened]);

  useEffect(() => {
    setResolvedName(null);
    setResolveError(null);

    if (
      pinState !== "ready" ||
      newAccountNumber.length !== 10 ||
      !newBankCode
    ) {
      setResolveState("idle");
      return;
    }

    setResolveState("loading");
    resolveAccount(newAccountNumber, newBankCode)
      .then((data) => {
        setResolvedName(data.accountName);
        setResolveState("success");
      })
      .catch((err: unknown) => {
        setResolveError(
          err instanceof Error ? err.message : "Could not verify account",
        );
        setResolveState("error");
      });
  }, [newAccountNumber, newBankCode, pinState]);

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) setTimeout(() => handleSave(next), 300);
    }
  }

  async function handleSave(enteredPin: string) {
    if (resolveState !== "success" || !resolvedName || !newBankCode) return;
    const bankLabel =
      banks.find((b) => b.value === newBankCode)?.label ?? newBankCode;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await addBankAccount(
        newBankCode,
        bankLabel,
        newAccountNumber,
        enteredPin,
      );
      onSuccess(res.data);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save account",
      );
      setPin("");
    } finally {
      setSaving(false);
    }
  }

  const filteredBanks = bankSearch
    ? banks.filter((b) =>
        b.label.toLowerCase().includes(bankSearch.toLowerCase()),
      )
    : banks;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} className="text-[18px] text-[#0F172A]">
          {showPin ? "Confirm with PIN" : "Add Bank Account"}
        </Text>
      }
      centered
      size="md"
      radius="lg"
      styles={{ body: { padding: "8px 16px 24px" } }}
    >
      {pinState === "checking" ? (
        <div className="flex items-center justify-center py-10">
          <Loader size="sm" color="#02A36E" />
        </div>
      ) : pinState === "missing" || pinState === "error" ? (
        <div className="flex flex-col items-center gap-4 py-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FDF4]">
            <IconLock size={22} color="#02A36E" />
          </div>
          <div>
            <Text fw={700} className="text-[16px] text-[#0F172A]">
              {pinState === "missing"
                ? "Transaction PIN required"
                : "Unable to check transaction PIN"}
            </Text>
            <Text fw={400} className="mt-1 text-[13px] text-[#6B7280]">
              {pinState === "missing"
                ? "Set a transaction PIN before adding a bank account."
                : "Please try the check again."}
            </Text>
          </div>
          <button
            onClick={() =>
              pinState === "missing"
                ? (onClose(), navigate("/set-pin"))
                : checkPin()
            }
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            {pinState === "missing" ? "Set Transaction PIN" : "Try Again"}
          </button>
        </div>
      ) : !showPin ? (
        <div className="flex flex-col gap-4">
          <Text fw={400} className="text-[13px] text-[#6B7280]">
            This account will be saved for future withdrawals.
          </Text>
          <div>
            <Text fw={500} className="mb-1.5 text-[13px] text-[#374151]">
              Bank
            </Text>
            <input
              type="text"
              placeholder="Search bank..."
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              className="h-[48px] w-full rounded-xl border border-[#E5E7EB] px-4 text-[14px] outline-none focus:border-[#02A36E]"
            />
            {bankSearch && (
              <div className="mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
                {filteredBanks.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-[#9CA3AF]">
                    No bank found
                  </div>
                ) : (
                  filteredBanks.slice(0, 20).map((b) => (
                    <button
                      key={b.value}
                      onClick={() => {
                        setNewBankCode(b.value);
                        setBankSearch(b.label);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-[13px] hover:bg-[#F9FAFB] ${newBankCode === b.value ? "font-medium text-[#02A36E]" : "text-[#0F172A]"}`}
                    >
                      {b.label}
                      {newBankCode === b.value && (
                        <IconCheck size={14} color="#02A36E" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
            {newBankCode && (
              <Text fw={400} className="mt-1 text-[12px] text-[#02A36E]">
                Selected: {banks.find((b) => b.value === newBankCode)?.label}
              </Text>
            )}
          </div>
          <div>
            <Text fw={500} className="mb-1.5 text-[13px] text-[#374151]">
              Account Number
            </Text>
            <input
              type="text"
              inputMode="numeric"
              placeholder="10-digit account number"
              value={newAccountNumber}
              onChange={(e) =>
                setNewAccountNumber(
                  e.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              maxLength={10}
              className="h-[48px] w-full rounded-xl border border-[#E5E7EB] px-4 text-[14px] outline-none focus:border-[#02A36E]"
            />
          </div>
          {resolveState === "loading" && (
            <div className="flex items-center gap-2 rounded-lg bg-[#F9FAFB] px-3 py-2.5">
              <Loader size={14} color="#02A36E" />
              <Text fw={400} className="text-[13px] text-[#6B7280]">
                Verifying account...
              </Text>
            </div>
          )}
          {resolveState === "success" && resolvedName && (
            <div className="flex items-center gap-2 rounded-lg bg-[#F0FDF4] px-3 py-2.5">
              <IconCheck size={16} color="#02A36E" />
              <div>
                <Text fw={600} className="text-[13px] text-[#02A36E]">
                  {resolvedName}
                </Text>
                <Text fw={400} className="text-[11px] text-[#6B7280]">
                  Account verified
                </Text>
              </div>
            </div>
          )}
          {resolveState === "error" && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5">
              <IconAlertCircle size={16} color="#EF4444" />
              <Text fw={400} className="text-[13px] text-red-500">
                {resolveError ?? "Could not verify account"}
              </Text>
            </div>
          )}
          {resolveState === "success" && (
            <button
              onClick={() => {
                setShowPin(true);
                setPin("");
                setSaveError(null);
              }}
              className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
            >
              Continue
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 pt-2">
          <Text fw={400} className="text-center text-[13px] text-[#6B7280]">
            Enter your transaction PIN to save this account
          </Text>
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 ${i < pin.length ? "border-[#02A36E] bg-[#F0FDF4]" : "border-[#E5E7EB] bg-white"}`}
              >
                {i < pin.length && (
                  <div className="h-2.5 w-2.5 rounded-full bg-[#02A36E]" />
                )}
              </div>
            ))}
          </div>
          {saving && (
            <div className="flex items-center gap-2">
              <Loader size={14} color="#02A36E" />
              <Text fw={400} className="text-[13px] text-[#6B7280]">
                Saving...
              </Text>
            </div>
          )}
          {saveError && (
            <Text fw={400} className="text-[13px] text-red-500">
              {saveError}
            </Text>
          )}
          <div className="grid w-[240px] grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"].map(
              (key) => {
                if (key === "") return <div key="empty" />;
                if (key === "back")
                  return (
                    <button
                      key="back"
                      onClick={() => setPin((p) => p.slice(0, -1))}
                      className="flex h-14 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]"
                    >
                      <IconBackspace size={20} color="#374151" />
                    </button>
                  );
                return (
                  <button
                    key={key}
                    onClick={() => handlePinDigit(key)}
                    disabled={saving}
                    className="flex h-14 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[18px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB] disabled:opacity-50"
                  >
                    {key}
                  </button>
                );
              },
            )}
          </div>
          <button
            onClick={() => {
              setShowPin(false);
              setPin("");
            }}
            className="cursor-pointer text-[13px] text-[#9CA3AF] hover:text-[#6B7280]"
          >
            Back
          </button>
        </div>
      )}
    </Modal>
  );
}
