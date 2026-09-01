import { useEffect, useState } from "react";
import { Text, TextInput, Progress, Alert, Checkbox } from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconShieldCheck,
  IconAlertCircle,
  IconArrowRight,
  IconFingerprint,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  getUserProfile,
  proveInitiate,
  preSubmitNok,
  submitNok,
} from "@/utils/api";
import { ApiError } from "@/utils/api";
import { PhoneInputField } from "@/components";
import { normalizePhoneForComparison, PERSON_NAME_REGEX, validatePhone } from "@ajoti/shared";

import { LimitCard, VerificationDataCard } from "./KycStatusSections";

type OnboardingStep = 1 | 2 | 3;

const inputStyles = {
  input: { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" },
  label: { fontWeight: 500, fontSize: 14, color: "#374151", marginBottom: 4 },
};

const ONBOARDING_LABELS = ["Identity", "Next of Kin", "Verify"];
export function OnboardingFlow({
  rejectionReason,
  onComplete,
  identityVerified = false,
}: {
  rejectionReason?: string | null;
  onComplete: () => void;
  identityVerified?: boolean;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>(identityVerified ? 2 : 1);
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [kinFullName, setKinFullName] = useState("");
  const [kinRelationship, setKinRelationship] = useState("");
  const [kinPhone, setKinPhone] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [identityAttempted, setIdentityAttempted] = useState(false);
  const [nokAttempted, setNokAttempted] = useState(false);
  const [kinPhoneServerError, setKinPhoneServerError] = useState<string>();

  const [accountPhone] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem("user") ?? "{}") as { phone?: string }).phone;
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    getUserProfile()
      .then((profile) => setRegisteredPhone(profile.phone?.trim() ?? ""))
      .catch(() => setRegisteredPhone(""));
  }, []);

  const progressValue = (step / 3) * 100;
  function identityReady() {
    return nin.length === 11 && bvn.length === 11;
  }
  const normalizedKinName = kinFullName.trim().replace(/\s+/g, " ");
  const normalizedRelationship = kinRelationship.trim().replace(/\s+/g, " ");
  const normalizedKinPhone = kinPhone.trim();
  const kinNameValid =
    normalizedKinName.length >= 2 &&
    normalizedKinName.length <= 100 &&
    PERSON_NAME_REGEX.test(normalizedKinName);
  const relationshipValid =
    normalizedRelationship.length >= 2 &&
    normalizedRelationship.length <= 50 &&
    PERSON_NAME_REGEX.test(normalizedRelationship);
  const phoneError =
    validatePhone(normalizedKinPhone) ??
    ((registeredPhone || accountPhone) &&
    normalizePhoneForComparison(registeredPhone || accountPhone || "") ===
      normalizePhoneForComparison(normalizedKinPhone)
      ? "Use a different number from your Ajoti account."
      : undefined) ??
    kinPhoneServerError;
  const phoneValid = !phoneError;
  function nokReady() {
    return kinNameValid && relationshipValid && phoneValid;
  }

  async function handleSubmitNok() {
    setNokAttempted(true);
    setError(null);
    if (!nokReady()) {
      setError(
        "Please correct the highlighted Next of Kin details before continuing.",
      );
      return;
    }
    setSubmitting(true);
    const payload = {
      nextOfKinName: normalizedKinName,
      nextOfKinRelationship: normalizedRelationship,
      nextOfKinPhone: normalizedKinPhone,
    };
    try {
      if (identityVerified) {
        await submitNok(payload);
        onComplete();
        return;
      }
      await preSubmitNok(payload);
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.nextOfKinPhone?.length) {
        setKinPhoneServerError(err.fieldErrors.nextOfKinPhone.join(" "));
      }
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save Next of Kin. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProveInitiate() {
    setError(null);
    setInitiating(true);
    try {
      const result = await proveInitiate({ nin: nin.trim(), bvn: bvn.trim() });
      if (result.monoUrl) {
        window.location.assign(result.monoUrl);
        return;
      } else {
        await submitNok({
          nextOfKinName: normalizedKinName,
          nextOfKinRelationship: normalizedRelationship,
          nextOfKinPhone: normalizedKinPhone,
        });
        onComplete();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start verification. Please try again.",
      );
    } finally {
      setInitiating(false);
    }
  }

  function handleIdentityContinue() {
    setIdentityAttempted(true);
    if (!identityReady()) {
      setError("NIN and BVN must each contain exactly 11 digits.");
      return;
    }
    setError(null);
    setStep(2);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-[600px] items-center gap-4 px-6 py-4">
          <button
            onClick={() =>
              step > 1 && !identityVerified
                ? setStep((step - 1) as OnboardingStep)
                : navigate(-1)
            }
            className="flex cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2 hover:bg-[#F9FAFB]"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <div className="flex-1 text-center">
            <Text fw={700} className="text-[18px] text-[#0F172A]">
              Identity Verification
            </Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              Step {step} of 3 - {ONBOARDING_LABELS[step - 1]}
            </Text>
          </div>
          <div className="w-[34px]" />
        </div>
        <div className="mx-auto max-w-[600px] px-6 pb-4">
          <Progress
            value={progressValue}
            size="sm"
            radius="xl"
            color="#02A36E"
          />
        </div>
      </div>
      <div className="mx-auto max-w-[600px] px-6 py-8">
        {rejectionReason && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            radius="md"
            mb="lg"
            title="Previous submission was rejected"
          >
            {rejectionReason}
          </Alert>
        )}
        <div className="mb-8 flex items-center justify-center gap-8 sm:gap-12">
          {ONBOARDING_LABELS.map((label, i) => {
            const n = i + 1;
            const isActive = n === step;
            const isDone = n < step || (identityVerified && n === 1);
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${isDone ? "bg-[#02A36E] text-white" : isActive ? "border-2 border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]" : "border-2 border-[#E5E7EB] bg-white text-[#9CA3AF]"}`}
                >
                  {isDone ? <IconCheck size={16} /> : n}
                </div>
                <Text
                  fw={isActive ? 600 : 400}
                  className={`text-[10px] ${isActive ? "text-[#02A36E]" : "text-[#9CA3AF]"}`}
                >
                  {label}
                </Text>
              </div>
            );
          })}
        </div>
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            radius="md"
            variant="light"
            className="mb-4"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                <IconShieldCheck size={20} color="#3B82F6" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Identity Details
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Enter your NIN and BVN. We will verify them after your Next of
                  Kin details.
                </Text>
              </div>
            </div>
            <TextInput
              label="National Identification Number (NIN)"
              placeholder="11-digit NIN"
              radius="md"
              value={nin}
              onChange={(e) =>
                setNin(e.currentTarget.value.replace(/\D/g, "").slice(0, 11))
              }
              styles={inputStyles}
              maxLength={11}
              error={identityAttempted && nin.length !== 11 ? "NIN must contain exactly 11 digits." : undefined}
              description={`${nin.length}/11 digits`}
              required
              rightSection={
                nin.length === 11 ? (
                  <IconCheck size={16} color="#02A36E" />
                ) : null
              }
            />
            <TextInput
              label="Bank Verification Number (BVN)"
              placeholder="11-digit BVN"
              radius="md"
              value={bvn}
              onChange={(e) =>
                setBvn(e.currentTarget.value.replace(/\D/g, "").slice(0, 11))
              }
              styles={inputStyles}
              maxLength={11}
              error={identityAttempted && bvn.length !== 11 ? "BVN must contain exactly 11 digits." : undefined}
              description={`${bvn.length}/11 digits`}
              required
              rightSection={
                bvn.length === 11 ? (
                  <IconCheck size={16} color="#02A36E" />
                ) : null
              }
            />
            <div className="flex flex-col gap-1 rounded-xl bg-[#F9FAFB] p-4">
              <Text fw={500} className="text-[12px] text-[#374151]">
                Where to find these?
              </Text>
              <Text
                fw={400}
                className="text-[12px] leading-[1.6] text-[#6B7280]"
              >
                <strong>NIN:</strong> on your National ID card or dial *346#
              </Text>
              <Text
                fw={400}
                className="text-[12px] leading-[1.6] text-[#6B7280]"
              >
                <strong>BVN:</strong> dial *565*0# or check your bank app
              </Text>
            </div>
            <button
              onClick={handleIdentityContinue}
              className="w-full cursor-pointer rounded-xl bg-[#02A36E] px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
            >
              Continue to Next of Kin
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7]">
                <IconUser size={20} color="#D97706" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Next of Kin
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Provide your next of kin details before verifying your identity.
                </Text>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <TextInput
                label="Full Name"
                placeholder="Enter next of kin's full name"
                radius="md"
                value={kinFullName}
                onChange={(e) => setKinFullName(e.currentTarget.value)}
                error={
                  (nokAttempted || kinFullName.length > 0) && !kinNameValid
                    ? "Enter a valid name using letters, spaces, hyphens or apostrophes."
                    : undefined
                }
                styles={inputStyles}
                maxLength={100}
                required
              />
              <TextInput
                label="Relationship"
                placeholder="e.g. Spouse, Parent, Sibling"
                radius="md"
                value={kinRelationship}
                onChange={(e) => setKinRelationship(e.currentTarget.value)}
                error={
                  (nokAttempted || kinRelationship.length > 0) && !relationshipValid
                    ? "Enter a valid relationship using letters only."
                    : undefined
                }
                styles={inputStyles}
                maxLength={50}
                required
              />
              <div>
                <PhoneInputField
                  value={kinPhone}
                  onChange={(value) => { setKinPhone(value); setKinPhoneServerError(undefined); }}
                  label="Phone Number"
                  required
                  styles={inputStyles}
                  error={nokAttempted || kinPhone.length > 0 ? phoneError : undefined}
                />
              </div>
            </div>
            <button
              onClick={handleSubmitNok}
              disabled={submitting}
              className={`mt-6 w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${!submitting ? "cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]" : "cursor-not-allowed bg-[#9CA3AF]"}`}
            >
              {submitting
                ? "Saving..."
                : identityVerified
                  ? "Submit & Complete Level 1"
                  : "Save & Continue to Verification"}
            </button>
          </div>
        )}
        {step === 3 && !identityVerified && (
          <div className="flex flex-col gap-5 rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5]">
                <IconFingerprint size={20} color="#02A36E" />
              </div>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Verify Identity
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  We will verify your BVN, NIN, and date of birth with Mono.
                </Text>
              </div>
            </div>
            <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
              <Text
                fw={400}
                className="text-[13px] leading-[1.6] text-[#1E40AF]"
              >
                Ajoti will securely send the BVN and NIN you entered to Mono and compare the returned identity with your account details. No selfie is required.
              </Text>
            </div>
            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.currentTarget.checked)}
              label={
                <Text
                  fw={400}
                  className="text-[12px] leading-normal text-[#374151]"
                >
                  I consent to Ajoti verifying the BVN, NIN, and date of birth I provided through Mono Lookup.
                </Text>
              }
              styles={{ input: { borderColor: "#D1D5DB" } }}
            />
            <button
              onClick={handleProveInitiate}
              disabled={!confirmed || initiating}
              className={`w-full rounded-xl px-6 py-3.5 text-[14px] font-semibold text-white ${confirmed && !initiating ? "cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]" : "cursor-not-allowed bg-[#9CA3AF]"}`}
            >
              {initiating
                ? "Verifying identity..."
                : "Verify Identity"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OnboardingDoneScreen({
  onContinue,
  verificationSummary,
}: {
  onContinue: () => void;
  verificationSummary?: {
    name?: string;
    phone?: string;
    identityType?: string;
    tier?: string;
    verifiedAt?: string;
  } | null;
}) {
  const navigate = useNavigate();
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
          <IconShieldCheck size={32} color="#02A36E" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">
          Level 1 Verified!
        </Text>
        <Text
          fw={400}
          className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]"
        >
          Your basic identity has been verified. You can now send and receive
          money on Ajoti.
        </Text>
        <LimitCard level={1} />
        <VerificationDataCard data={verificationSummary} />
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#02A36E] px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Upgrade to Level 2<IconArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate("/home")}
            className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
