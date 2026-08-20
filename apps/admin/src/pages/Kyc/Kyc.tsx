import { PendingReviewScreen, FullyVerifiedScreen } from "./KycStatusSections";
import { ProvePendingScreen, UpgradePage } from "./KycUpgradeSections";
import { OnboardingFlow, OnboardingDoneScreen } from "./KycOnboardingSections";
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

// ── Types ─────────────────────────────────────────────────────────────────────

type OnboardingStep = 1 | 2; // Prove (NIN+BVN) → NOK

type PageView =
  | "loading"
  | "onboarding" // Level 0: Prove widget → NOK flow
  | "prove-pending" // Mono widget opened, waiting for webhook (any level)
  | "onboarding-done" // Just completed Level 1 (auto-approved)
  | "upgrade-l2" // Level 1 approved, ready to upgrade
  | "pending-l2" // Level 2 under superadmin review
  | "rejected-l2" // Level 2 rejected
  | "upgrade-l3" // Level 2 approved, ready to upgrade
  | "pending-l3" // Level 3 under superadmin review
  | "rejected-l3" // Level 3 rejected
  | "fully-verified"; // Level 3 approved

const PROVE_PENDING_STEPS = new Set([
  "PROVE_PENDING",
  "PROVE_PENDING_L2",
  "PROVE_PENDING_L3",
]);

function resolveView(kyc: KycStatus | null): PageView {
  if (!kyc) return "onboarding";
  const { kycLevel, status, step } = kyc;

  if (kycLevel === 0) {
    if (step && PROVE_PENDING_STEPS.has(step)) return "prove-pending";
    return "onboarding";
  }

  if (kycLevel >= 3) return "fully-verified";

  if (kycLevel === 2) {
    if (step && PROVE_PENDING_STEPS.has(step)) return "prove-pending";
    if (step === "PROOF_OF_ADDRESS_REQUIRED" && status === "REJECTED")
      return "rejected-l3";
    if (step === "PROOF_OF_ADDRESS_REQUIRED") return "pending-l3";
    return "upgrade-l3";
  }

  // kycLevel === 1
  if (step && PROVE_PENDING_STEPS.has(step)) return "prove-pending";
  if (step === "PHOTO_REQUIRED" && status === "REJECTED") return "rejected-l2";
  if (step === "PHOTO_REQUIRED") return "pending-l2";
  return "upgrade-l2";
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Kyc() {
  const [view, setView] = useState<PageView>("loading");
  const [kycData, setKycData] = useState<KycStatus | null>(null);

  async function loadStatus() {
    try {
      const kyc = await getKycStatus();
      setKycData(kyc);
      if (kyc.kycLevel === 0 && kyc.status === "REJECTED") {
        try {
          await resubmitKyc();
        } catch {
          /* ignore */
        }
        setView("onboarding");
        return;
      }
      const resolved = resolveView(kyc);
      // Only show the pending screen if the widget was actually opened this session.
      // Without this, navigating back to /kyc after calling initiate (but before opening
      // the widget) lands on the blocking pending screen instead of the form.
      if (
        resolved === "prove-pending" &&
        sessionStorage.getItem("kyc_widget_opened") !== "true"
      ) {
        setView(
          kyc.kycLevel === 0
            ? "onboarding"
            : kyc.kycLevel === 1
              ? "upgrade-l2"
              : "upgrade-l3",
        );
        return;
      }
      setView(resolved);
    } catch {
      setView("onboarding");
    }
  }

  useEffect(() => {
    // Mono redirects back to /kyc?status=success&reason=... after widget completion.
    // This can land in a new tab (since we open the widget with window.open), so
    // sessionStorage won't carry the flag from the original tab. Set it here so
    // loadStatus() correctly shows the pending screen instead of the form.
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      sessionStorage.setItem("kyc_widget_opened", "true");
      window.history.replaceState({}, "", "/kyc");
    }
    loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (view === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader color="#02A36E" size="md" />
      </div>
    );
  }

  if (view === "prove-pending") {
    const isUpgrade = (kycData?.kycLevel ?? 0) >= 1;

    async function handleRestart() {
      sessionStorage.removeItem("kyc_widget_opened");
      if (!isUpgrade) {
        // Level 0: go back to onboarding form so user can re-enter NIN/BVN
        setView("onboarding");
        return;
      }
      // Level upgrade: re-call initiate and reopen the widget
      try {
        const result = await proveInitiate({});
        if (result.monoUrl) {
          sessionStorage.setItem("kyc_widget_opened", "true");
          window.open(result.monoUrl, "_blank", "noopener,noreferrer");
        }
      } catch {
        /* ignore, stay on pending */
      }
    }

    return (
      <ProvePendingScreen
        onVerified={() => {
          sessionStorage.removeItem("kyc_widget_opened");
          loadStatus();
        }}
        onRestart={handleRestart}
      />
    );
  }

  if (view === "onboarding") {
    return (
      <OnboardingFlow
        rejectionReason={
          kycData?.kycLevel === 0 ? (kycData.rejectionReason ?? null) : null
        }
        onComplete={() => setView("onboarding-done")}
        onProvePending={() => setView("prove-pending")}
        identityVerified={
          (kycData?.ninVerified && kycData?.bvnVerified) ?? false
        }
      />
    );
  }

  if (view === "onboarding-done") {
    return (
      <OnboardingDoneScreen
        onContinue={() => setView("upgrade-l2")}
        verificationData={kycData?.verificationData}
      />
    );
  }

  if (view === "pending-l2") {
    return (
      <PendingReviewScreen
        forLevel={2}
        onRefresh={loadStatus}
        verificationData={kycData?.verificationData}
      />
    );
  }

  if (view === "pending-l3") {
    return (
      <PendingReviewScreen
        forLevel={3}
        onRefresh={loadStatus}
        verificationData={kycData?.verificationData}
      />
    );
  }

  if (view === "fully-verified") {
    return <FullyVerifiedScreen />;
  }

  // upgrade-l2, upgrade-l3, rejected-l2, rejected-l3
  const kycLevel = kycData?.kycLevel ?? 1;
  const rejectionReason =
    view === "rejected-l2" || view === "rejected-l3"
      ? (kycData?.rejectionReason ?? null)
      : null;

  return (
    <UpgradePage
      kycLevel={kycLevel}
      rejectionReason={rejectionReason}
      onProvePending={() => setView("prove-pending")}
    />
  );
}
