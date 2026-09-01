import { useEffect, useState } from "react";
import {
  Text,
  Checkbox,
  Loader,
  Alert,
} from "@mantine/core";
import { IconArrowLeft, IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCircleRules,
  getWalletBalance,
  joinRoscaCircle,
  listRoscaCircles,
} from "@/utils/api";

export function RequestToJoin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [requirementsLoaded, setRequirementsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [contributionKobo, setContributionKobo] = useState(0);
  const [collateralPercent, setCollateralPercent] = useState(0);
  const [availableKobo, setAvailableKobo] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([listRoscaCircles(), getCircleRules(), getWalletBalance()])
      .then(([circles, rules, balance]) => {
        if (!active) return;
        const circle = circles.find((item) => item.id === id);
        if (!circle) throw new Error("Group not found.");
        setContributionKobo(Number(circle.contributionAmount));
        setCollateralPercent(rules.data.collateralRatioPercent);
        setAvailableKobo(Number(balance.available ?? balance.total ?? 0));
        setRequirementsLoaded(true);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load joining requirements.");
        }
      })
      .finally(() => {
        if (active) setDetailsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const requiredCollateralKobo = Math.floor(
    (contributionKobo * collateralPercent) / 100,
  );
  const shortfallKobo = Math.max(requiredCollateralKobo - availableKobo, 0);
  const hasSufficientBalance =
    requirementsLoaded && availableKobo >= requiredCollateralKobo;
  const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSubmit = async () => {
    if (!agreed) {
      setAgreementError("You must agree to the group rules and payout structure.");
      return;
    }
    if (!hasSufficientBalance) {
      setError(
        `Insufficient available balance. You need ${formatNaira(requiredCollateralKobo)}, have ${formatNaira(availableKobo)}, and are short by ${formatNaira(shortfallKobo)}.`,
      );
      return;
    }
    setAgreementError(null);
    setError(null);
    setLoading(true);
    try {
      await joinRoscaCircle(id!);
      navigate(`/rosca/${id}/summary`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group.");
      setLoading(false);
    }
  };

  if (detailsLoading || loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-5">
        <Loader size={48} color="#02A36E" />
        <div className="text-center">
          <Text fw={700} className="text-[20px] text-[#0F172A]">
            {loading ? "Sending your request..." : "Loading joining requirements..."}
          </Text>
          <Text fw={400} className="mt-2 text-[14px] text-[#6B7280]">
            Please wait
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
            >
              <IconArrowLeft size={18} color="#374151" />
            </button>
            <Text fw={700} className="text-[22px] text-[#0F172A]">
              Request to Join Group
            </Text>
          </div>
          <Text fw={400} className="mt-2 ml-12 text-[14px] text-[#6B7280]">
            Fill the form to join the group.
          </Text>
        </div>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            radius="md"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {/* Form */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-[#BFEBD1] bg-[#F0FDF4] px-5 py-4">
            <Text fw={700} className="text-[15px] text-[#0F172A]">
              Refundable collateral required: {formatNaira(requiredCollateralKobo)}
            </Text>
            <Text fw={400} className="mt-1 text-[13px] text-[#4B5563]">
              This is {collateralPercent}% of the {formatNaira(contributionKobo)} contribution. It will be reserved while your request is reviewed and returned if the request is rejected or cancelled.
            </Text>
            <div className="mt-3 flex flex-col gap-1 text-[13px]">
              <Text>Available balance: <strong>{formatNaira(availableKobo)}</strong></Text>
              {shortfallKobo > 0 && (
                <Text c="red" fw={600}>You need {formatNaira(shortfallKobo)} more to continue.</Text>
              )}
            </div>
          </div>

          <Text fw={400} className="text-[13px] text-[#6B7280]">
            A flat fee also applies to each payout you receive from this group.
          </Text>

          <Checkbox
            label="I agree to the group rules and payout structure."
            checked={agreed}
            onChange={(event) => {
              setAgreed(event.currentTarget.checked);
              if (event.currentTarget.checked) setAgreementError(null);
            }}
            error={agreementError}
            styles={{
              label: { fontSize: 13, color: "#374151", fontWeight: 500 },
              input: {
                borderColor: "#D1D5DB",
                "&:checked": {
                  backgroundColor: "#02A36E",
                  borderColor: "#02A36E",
                },
              },
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={!hasSufficientBalance}
            className="mt-2 w-full rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
          >
            Request to Join
          </button>
        </div>
      </div>
    </div>
  );
}
