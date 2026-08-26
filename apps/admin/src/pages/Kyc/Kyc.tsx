import { PendingReviewScreen, FullyVerifiedScreen } from "./KycStatusSections";
import { ProvePendingScreen, UpgradePage } from "./KycUpgradeSections";
import { OnboardingFlow, OnboardingDoneScreen } from "./KycOnboardingSections";
import { useState, useEffect } from "react";
import { Loader } from "@mantine/core";
import {
  proveInitiate,
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

  async function loadStatus() {
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

      // New Level 1 flow collects NOK before Mono. Mono still moves successful
      // legacy/new Level 1 sessions to NOK_REQUIRED, so if NOK is already stored
      // we finalise it immediately without asking the user to enter it twice.
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
        sessionStorage.removeItem("kyc_widget_opened");
        setView("onboarding-done");
        return;
      }

      setKycData(kyc);
      const resolved = resolveView(kyc);

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
        setView("onboarding");
        return;
      }
      try {
        const result = await proveInitiate({});
        if (result.monoUrl) {
          sessionStorage.setItem("kyc_widget_opened", "true");
          window.open(result.monoUrl, "_blank", "noopener,noreferrer");
        }
      } catch {
        /* stay on pending */
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
