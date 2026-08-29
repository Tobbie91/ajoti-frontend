import { PendingReviewScreen, FullyVerifiedScreen } from "./KycStatusSections";
import { ProvePendingScreen, UpgradePage } from "./KycUpgradeSections";
import { OnboardingFlow, OnboardingDoneScreen } from "./KycOnboardingSections";
import { useCallback, useEffect, useState } from "react";
import { Loader } from "@mantine/core";
import {
  submitNok,
  getKycStatus,
  resubmitKyc,
  type KycStatus,
} from "@/utils/api";

type PageView =
  | "loading"
  | "onboarding"
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

  if (step && PROVE_PENDING_STEPS.has(step)) return "prove-pending";
  if (step === "PHOTO_REQUIRED" && status === "REJECTED") return "rejected-l2";
  if (step === "PHOTO_REQUIRED") return "pending-l2";
  return "upgrade-l2";
}

export function Kyc() {
  const [view, setView] = useState<PageView>("loading");
  const [kycData, setKycData] = useState<KycStatus | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      let kyc = await getKycStatus();

      if (kyc.kycLevel === 0 && kyc.status === "REJECTED") {
        try {
          kyc = await resubmitKyc();
        } catch {
          setView("onboarding");
          return;
        }
      }

      if (
        kyc.kycLevel === 0 &&
        kyc.step === "NOK_REQUIRED" &&
        kyc.nextOfKinName &&
        kyc.nextOfKinRelationship &&
        kyc.nextOfKinPhone
      ) {
        kyc = await submitNok({
          nextOfKinName: kyc.nextOfKinName,
          nextOfKinRelationship: kyc.nextOfKinRelationship,
          nextOfKinPhone: kyc.nextOfKinPhone,
        });
        setKycData(kyc);
        setView("onboarding-done");
        return;
      }

      setKycData(kyc);
      setView(resolveView(kyc));
    } catch {
      setView("onboarding");
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
