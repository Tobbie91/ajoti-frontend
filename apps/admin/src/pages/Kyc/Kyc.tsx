import { PendingReviewScreen, FullyVerifiedScreen } from "./KycStatusSections";
import { ProvePendingScreen, UpgradePage } from "./KycUpgradeSections";
import { OnboardingFlow, OnboardingDoneScreen } from "./KycOnboardingSections";
import { useCallback, useEffect, useState } from "react";
import { Loader } from "@mantine/core";
import { getKycStatus, resubmitKyc, type KycStatus } from "@/utils/api";

type PageView =
  | "loading"
  | "onboarding"
  | "rejected-l1"
  | "error"
  | "prove-pending"
  | "onboarding-done"
  | "upgrade-l2"
  | "pending-l2"
  | "rejected-l2"
  | "upgrade-l3"
  | "pending-l3"
  | "rejected-l3"
  | "fully-verified";

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
    if (status === "REJECTED") return "rejected-l1";
    return "onboarding";
  }

  if (kycLevel >= 3) return "fully-verified";

  if (kycLevel === 2) {
    if (step && PROVE_PENDING_STEPS.has(step)) return "prove-pending";
    if (status === "REJECTED") return "rejected-l3";
    if (step === "PROOF_OF_ADDRESS_REQUIRED" && status === "REJECTED")
      return "rejected-l3";
    if (step === "PROOF_OF_ADDRESS_REQUIRED") return "pending-l3";
    return "upgrade-l3";
  }

  if (step && PROVE_PENDING_STEPS.has(step)) return "prove-pending";
  if (status === "REJECTED") return "rejected-l2";
  if (step === "PHOTO_REQUIRED" && status === "REJECTED") return "rejected-l2";
  if (step === "PHOTO_REQUIRED") return "pending-l2";
  return "upgrade-l2";
}

export function Kyc() {
  const [view, setView] = useState<PageView>("loading");
  const [kycData, setKycData] = useState<KycStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoadError(null);
      const kyc = await getKycStatus();

      setKycData(kyc);
      setView(resolveView(kyc));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load your KYC status.");
      setView("error");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      window.history.replaceState({}, "", "/kyc");
    }
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (view !== "prove-pending") return;

    const refreshOnReturn = () => {
      if (!document.hidden) void loadStatus();
    };

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [loadStatus, view]);

  if (view === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <Loader color="#02A36E" size="md" />
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-6">
        <div className="w-full max-w-[440px] rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#0F172A]">We couldn't load your verification</h1>
          <p className="mt-3 text-sm text-[#6B7280]">
            {loadError} Your saved progress has not been changed.
          </p>
          <button
            onClick={() => void loadStatus()}
            className="mt-6 w-full rounded-xl bg-[#02A36E] px-6 py-3 font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (view === "rejected-l1") {
    const restart = async () => {
      setRestarting(true);
      try {
        const kyc = await resubmitKyc();
        setKycData(kyc);
        setView("onboarding");
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to restart verification.");
        setView("error");
      } finally {
        setRestarting(false);
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-6">
        <div className="w-full max-w-[440px] rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#0F172A]">Verification unsuccessful</h1>
          <p className="mt-3 text-sm text-[#6B7280]">
            {kycData?.rejectionReason ?? "Your identity verification could not be completed."}
          </p>
          <p className="mt-2 text-xs text-[#9CA3AF]">
            Restarting will clear the previous identity submission so you can enter it again.
          </p>
          <button
            disabled={restarting}
            onClick={() => void restart()}
            className="mt-6 w-full rounded-xl bg-[#02A36E] px-6 py-3 font-semibold text-white disabled:bg-[#9CA3AF]"
          >
            {restarting ? "Preparing..." : "Try Verification Again"}
          </button>
        </div>
      </div>
    );
  }

  if (view === "prove-pending") {
    return (
      <ProvePendingScreen
        awaitingReview={kycData?.providerStatus === "ambiguous"}
        onContinue={
          kycData?.monoUrl
            ? () => window.location.assign(kycData.monoUrl as string)
            : undefined
        }
        onVerified={loadStatus}
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
        verificationSummary={kycData?.verificationSummary}
      />
    );
  }

  if (view === "pending-l2") {
    return (
      <PendingReviewScreen
        forLevel={2}
        onRefresh={loadStatus}
        verificationData={kycData?.verificationSummary}
      />
    );
  }

  if (view === "pending-l3") {
    return (
      <PendingReviewScreen
        forLevel={3}
        onRefresh={loadStatus}
        verificationData={kycData?.verificationSummary}
      />
    );
  }

  if (view === "fully-verified") {
    return <FullyVerifiedScreen />;
  }

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
