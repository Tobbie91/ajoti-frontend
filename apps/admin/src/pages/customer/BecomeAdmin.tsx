import { useEffect, useState } from "react";
import { Text, Checkbox, Loader } from "@mantine/core";
import { IconArrowLeft, IconCircleCheck } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { requestAdminAccess, getKycStatus, ApiError } from "@/utils/api";

export function BecomeAdmin() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);
  const [kycLevel, setKycLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getKycStatus()
      .then((kyc) => setKycLevel(kyc.kycLevel ?? 0))
      .catch(() => setKycLevel(null));
  }, []);

  const kycReady = kycLevel !== null && kycLevel >= 1;
  const verificationItems = [
    { label: "Complete KYC Level 1", complete: kycReady },
    { label: "Active Ajoti member account", complete: true },
    { label: "Agreement to ajo group policies", complete: agreed },
  ];
  const pendingCount = verificationItems.filter((item) => !item.complete).length;

  async function handleSubmit() {
    if (!agreed || submitting || !kycReady) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestAdminAccess();
      setSessionRefreshed(result.sessionRefreshed);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[680px] px-6 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/rosca")}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Become an Ajo Admin
          </Text>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="text-[16px] text-[#0F172A]">
            Admin Access
          </Text>

          <Checkbox
            label="I agree to comply with ajo group policies."
            checked={agreed}
            onChange={(e) => setAgreed(e.currentTarget.checked)}
            className="mt-5"
            styles={{
              input: {
                borderColor: "#D1D5DB",
                "&:checked": {
                  backgroundColor: "#02A36E",
                  borderColor: "#02A36E",
                },
              },
              label: {
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
              },
            }}
          />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="text-[16px] text-[#0F172A]">
            Verification Requirements
          </Text>

          <div className="mt-5 flex flex-col gap-4">
            {verificationItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.complete ? (
                  <IconCircleCheck size={22} color="#02A36E" />
                ) : (
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[#9CA3AF] text-[10px] font-bold text-[#9CA3AF]">
                    ···
                  </span>
                )}
                <Text
                  fw={500}
                  className={
                    item.complete
                      ? "text-[13px] text-[#374151]"
                      : "text-[13px] text-[#4B5563]"
                  }
                >
                  {item.label}
                </Text>
              </div>
            ))}
          </div>

          {pendingCount > 0 && (
            <div className="mt-6 border-t border-[#E5E7EB] pt-5">
              <Text className="text-[13px] text-[#6B7280]">
                {pendingCount} {pendingCount === 1 ? "requirement" : "requirements"} pending to activate access.
              </Text>

              {kycLevel === null ? (
                <Text className="mt-3 text-[12px] text-[#6B7280]">
                  Checking your KYC status...
                </Text>
              ) : !kycReady ? (
                <button
                  onClick={() => navigate("/kyc")}
                  className="mt-3 cursor-pointer rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white"
                >
                  Complete KYC Level 1 →
                </button>
              ) : !agreed ? (
                <Text className="mt-3 text-[12px] text-[#6B7280]">
                  Agree to the ajo group policies above to continue.
                </Text>
              ) : null}
            </div>
          )}
        </div>

        {submitted ? (
          <div className="flex flex-col items-center rounded-2xl border border-[#D1FAE5] bg-[#F0FDF4] p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
              <IconCircleCheck size={36} color="#02A36E" />
            </div>
            <Text fw={700} className="mt-4 text-[18px] text-[#0F172A]">
              Admin access activated
            </Text>
            <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
              {sessionRefreshed
                ? "You can now create and manage ajo groups."
                : "Your access is active. Sign in again to load your new permissions."}
            </Text>
            <button
              onClick={() => navigate(sessionRefreshed ? "/dashboard" : "/login")}
              className="mt-5 cursor-pointer rounded-lg bg-[#02A36E] px-6 py-3 text-[13px] font-semibold text-white"
            >
              {sessionRefreshed ? "Open Admin Dashboard" : "Sign In Again"}
            </button>
          </div>
        ) : (
          <>
            {error && (
              <Text className="text-[13px] text-[#EF4444]">{error}</Text>
            )}
            <button
              disabled={!agreed || submitting || !kycReady}
              onClick={handleSubmit}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[14px] font-semibold text-white ${
                agreed && !submitting && kycReady
                  ? "cursor-pointer bg-[#02A36E]"
                  : "cursor-not-allowed bg-[#9CA3AF]"
              }`}
            >
              {submitting && <Loader size="xs" color="white" />}
              {submitting ? "Activating..." : "Activate Admin Access"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
