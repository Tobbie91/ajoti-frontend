import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  Progress,
  Alert,
  Loader,
  Badge,
  Checkbox,
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

  const nextLimits =
    targetLevel === 2
      ? { single: "₦100,000", daily: "₦500,000" }
      : { single: "₦5,000,000", daily: "₦25,000,000" };

  const docDescription =
    targetLevel === 2
      ? "government-issued photo ID and a short liveness check"
      : "proof of address document and a liveness check";

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      // No payload needed - backend reads NIN/BVN from DB for level upgrades
      const result = await proveInitiate({});

      if (result.monoUrl) {
        sessionStorage.setItem("kyc_widget_opened", "true");
        window.open(result.monoUrl, "_blank", "noopener,noreferrer");
        onProvePending();
      } else {
        // Test bypass - skip widget
        onProvePending();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start verification. Please try again.",
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
          {rejectionReason}. Please start the verification again.
        </Alert>
      )}

      {/* Info card */}
      <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
        <div className="flex items-center gap-2 mb-2">
          <IconLock size={16} color="#2563EB" />
          <Text fw={600} className="text-[14px] text-[#1E40AF]">
            Upgrade to Level {targetLevel}
          </Text>
        </div>
        <Text
          fw={400}
          className="mb-3 text-[13px] leading-[1.6] text-[#3B82F6]"
        >
          After approval your limits increase to{" "}
          <strong>{nextLimits.single}</strong> per transaction and{" "}
          <strong>{nextLimits.daily}</strong> daily.
        </Text>
        <div className="flex items-center gap-1 text-[12px] text-[#3B82F6]">
          <IconClock size={14} />
          <span>Review typically takes 24–48 hours</span>
        </div>
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
          To upgrade to Level {targetLevel}, you'll complete a quick identity
          verification powered by Mono. You'll need your {docDescription}.
        </Text>
        <Text fw={400} className="text-[13px] leading-[1.6] text-[#9CA3AF]">
          The verification widget will open in a new tab. Return to this page
          after completing it - your status will update automatically.
        </Text>

        <Checkbox
          checked={confirmed}
          onChange={(e) => setConfirmed(e.currentTarget.checked)}
          label={
            <Text
              fw={400}
              className="text-[12px] leading-normal text-[#374151]"
            >
              I'm ready to complete this now - I understand starting the check
              can't be refunded if I don't finish it.
            </Text>
          }
          styles={{ input: { borderColor: "#D1D5DB" } }}
        />

        <button
          onClick={handleStart}
          disabled={starting || !confirmed}
          className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${
            !starting && confirmed
              ? "cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]"
              : "cursor-not-allowed bg-[#9CA3AF]"
          }`}
        >
          {starting
            ? "Opening verification..."
            : `Start Level ${targetLevel} Verification`}
        </button>
      </div>
    </div>
  );
}

// ── Prove pending screen ─────────────────────────────────────────────────────
// Shown after user opens Mono widget (any level). Polls until step leaves PROVE_PENDING*.

export function ProvePendingScreen({
  onVerified,
  onRestart,
}: {
  onVerified: () => void;
  onRestart: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      if (document.hidden) return;
      try {
        const kyc = await getKycStatus();
        if (!kyc.step || !PROVE_PENDING_STEPS.has(kyc.step)) {
          onVerified();
        }
      } catch {
        /* ignore */
      }
    }

    const id = setInterval(check, 10_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
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
          Verification in Progress
        </Text>
        <Text
          fw={400}
          className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]"
        >
          Complete the identity check in the Mono window you just opened. This
          page will update automatically once your verification is confirmed.
        </Text>
        <Loader color="#02A36E" size="sm" className="mx-auto" />
        <Text fw={400} className="mt-4 text-[12px] text-[#9CA3AF]">
          Closed the window by mistake?{" "}
          <button
            onClick={onRestart}
            className="cursor-pointer text-[#02A36E] underline"
          >
            Refresh to restart
          </button>
        </Text>
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
