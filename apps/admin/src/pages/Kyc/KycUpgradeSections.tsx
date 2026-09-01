import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  Progress,
  Alert,
  Loader,
  Badge,
  Checkbox,
  Select,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconPhone,
  IconShieldCheck,
  IconAlertCircle,
  IconLock,
  IconArrowRight,
  IconClock,
  IconFingerprint,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  proveInitiate,
  submitNok,
  getKycStatus,
  resubmitKyc,
  type KycStatus,
} from "@/utils/api";
import { PhoneInputField } from "@/components";

import { LimitCard } from "./KycStatusSections";

const PROVE_PENDING_STEPS = new Set([
  "PROVE_PENDING",
  "PROVE_PENDING_L2",
  "PROVE_PENDING_L3",
]);

// ── Upgrade section (Level 2 or Level 3 via Mono Prove) ──────────────────────

export function UpgradeSection({
  targetLevel,
  rejectionReason,
  onProvePending,
}: {
  targetLevel: 2 | 3;
  rejectionReason?: string | null;
  onProvePending: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [documentType, setDocumentType] = useState<
    "drivers_license" | "international_passport" | null
  >(null);
  const [documentNumber, setDocumentNumber] = useState("");

  if (targetLevel === 3) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <IconLock size={16} color="#9CA3AF" />
          <Text fw={600} className="text-[14px] text-[#374151]">
            Level 3 verification unavailable
          </Text>
        </div>
        <Text fw={400} className="text-[13px] leading-[1.6] text-[#6B7280]">
          Level 3 identity verification isn't available right now. Your Level 2
          limits stay in effect in the meantime.
        </Text>
      </div>
    );
  }

  const documentReady =
    documentType !== null && documentNumber.trim().length >= 5;

  async function handleStart() {
    setError(null);
    if (!documentReady) {
      setError("Select an ID type and enter a valid document number.");
      return;
    }
    setStarting(true);
    try {
      if (rejectionReason) await resubmitKyc();
      await proveInitiate({
        documentType,
        documentNumber: documentNumber.trim().toUpperCase(),
      });
      onProvePending();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify your government ID. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {rejectionReason && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          radius="md"
          title="Previous verification rejected"
        >
          {rejectionReason}. Please check your document details and try again.
        </Alert>
      )}

      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
        <div className="flex items-center gap-2 mb-2">
          <IconLock size={16} color="#2563EB" />
          <Text fw={600} className="text-[14px] text-[#1E40AF]">
            Upgrade to Level 2
          </Text>
        </div>
        <Text fw={400} className="text-[13px] leading-[1.6] text-[#3B82F6]">
          After verification your limits increase to{" "}
          <strong>₦100,000</strong> per transaction and{" "}
          <strong>₦500,000</strong> daily.
        </Text>
      </div>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          radius="md"
          variant="light"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col gap-4">
        <Text fw={400} className="text-[14px] leading-[1.6] text-[#6B7280]">
          Choose a government-issued ID and enter its document number. Ajoti
          will verify it directly with Mono and compare it with your Level 1
          identity. No selfie or file upload is required.
        </Text>

        <Select
          label="Government ID type"
          placeholder="Select an ID type"
          value={documentType}
          onChange={(value) =>
            setDocumentType(
              value as "drivers_license" | "international_passport" | null,
            )
          }
          data={[
            { value: "drivers_license", label: "Driver's Licence" },
            { value: "international_passport", label: "International Passport" },
          ]}
          radius="md"
          required
        />

        <TextInput
          label={
            documentType === "international_passport"
              ? "Passport number"
              : "Driver's licence number"
          }
          placeholder="Enter the document number"
          value={documentNumber}
          onChange={(event) =>
            setDocumentNumber(
              event.currentTarget.value
                .replace(/[^A-Za-z0-9-]/g, "")
                .slice(0, 30),
            )
          }
          radius="md"
          minLength={5}
          maxLength={30}
          required
        />

        <Checkbox
          checked={confirmed}
          onChange={(e) => setConfirmed(e.currentTarget.checked)}
          label={
            <Text fw={400} className="text-[12px] leading-normal text-[#374151]">
              I consent to Ajoti verifying this document through Mono Lookup.
              I understand a provider charge may apply once verification starts.
            </Text>
          }
          styles={{ input: { borderColor: "#D1D5DB" } }}
        />

        <button
          onClick={handleStart}
          disabled={starting || !confirmed || !documentReady}
          className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
            !starting && confirmed && documentReady
              ? "cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]"
              : "cursor-not-allowed bg-[#9CA3AF]"
          }`}
        >
          {starting ? "Verifying document..." : "Verify & Upgrade to Level 2"}
        </button>
      </div>
    </div>
  );
}

// ── Prove pending screen ─────────────────────────────────────────────────────
// Shown after user opens Mono widget (any level). Polls until step leaves PROVE_PENDING*.

export function ProvePendingScreen({
  onVerified,
  onContinue,
  awaitingReview,
}: {
  onVerified: () => void;
  onContinue?: () => void;
  awaitingReview: boolean;
}) {
  const navigate = useNavigate();
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  useEffect(() => {
    let active = true;
    let checking = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      if (!active) return;
      const delay = attempts < 24 ? 2_500 : 10_000;
      timeoutId = setTimeout(check, delay);
    };

    async function check() {
      if (!active || checking) return;
      if (document.hidden) {
        scheduleNext();
        return;
      }

      checking = true;
      attempts += 1;
      try {
        const kyc = await getKycStatus();
        setConsecutiveErrors(0);
        if (!kyc.step || !PROVE_PENDING_STEPS.has(kyc.step)) {
          onVerified();
          return;
        }
      } catch {
        setConsecutiveErrors((count) => count + 1);
      } finally {
        checking = false;
      }

      scheduleNext();
    }

    const refreshOnReturn = () => {
      if (document.hidden || !active) return;
      if (timeoutId) clearTimeout(timeoutId);
      void check();
    };

    void check();
    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("focus", refreshOnReturn);
    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("focus", refreshOnReturn);
    };
  }, [onVerified]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-[480px]">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
      </div>
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
          <IconClock size={32} color="#3B82F6" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">
          {awaitingReview
            ? "Verification Under Review"
            : "Verification in Progress"}
        </Text>
        <Text
          fw={400}
          className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]"
        >
          {awaitingReview
            ? "Mono has received your identity check for manual review. You do not need to start again; this page will update when a final decision arrives."
            : onContinue
              ? "Your Mono session is still active. Continue the existing verification—starting another session is not necessary."
              : "Your verification is being processed by Mono. This page will update automatically when a final result arrives."}
        </Text>
        {consecutiveErrors >= 3 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="yellow"
            radius="md"
            className="mb-4 text-left"
          >
            We cannot refresh your verification status right now. Check your connection, then use
            Check Status below. Your verification progress has not been reset.
          </Alert>
        )}
        {!awaitingReview && (
          <Loader color="#02A36E" size="sm" className="mx-auto" />
        )}
        {onContinue && !awaitingReview && (
          <button
            onClick={onContinue}
            className="mt-6 w-full cursor-pointer rounded-xl bg-[#02A36E] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Continue Verification
          </button>
        )}
        <button
          onClick={onVerified}
          className="mt-3 w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
        >
          Check Status
        </button>
      </div>
    </div>
  );
}

// ── Upgrade page (Level 2 or Level 3) ────────────────────────────────────────

export function UpgradePage({
  kycLevel,
  rejectionReason,
  onProvePending,
}: {
  kycLevel: number;
  rejectionReason?: string | null;
  onProvePending: () => void;
}) {
  const navigate = useNavigate();
  const targetLevel = (kycLevel + 1) as 2 | 3;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          <button
            onClick={() => navigate("/home")}
            className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">
              KYC Upgrade
            </Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              Increase your transaction limits
            </Text>
          </div>
          <div className="w-[34px]" />
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-6 py-8 flex flex-col gap-5">
        <LimitCard level={kycLevel} />
        <UpgradeSection
          targetLevel={targetLevel}
          rejectionReason={rejectionReason}
          onProvePending={onProvePending}
        />
      </div>
    </div>
  );
}
