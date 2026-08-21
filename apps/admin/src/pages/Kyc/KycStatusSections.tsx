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

// ── Level badge ───────────────────────────────────────────────────────────────

export function LevelBadge({ level }: { level: number }) {
  const colors = ["gray", "teal", "blue", "green"];
  const labels = ["Unverified", "Level 1", "Level 2", "Level 3"];
  return (
    <Badge color={colors[level] ?? "gray"} variant="filled" size="md">
      {labels[level] ?? `Level ${level}`}
    </Badge>
  );
}

export function LimitCard({ level }: { level: number }) {
  const limits: Record<number, { single: string; daily: string }> = {
    0: { single: "₦0", daily: "₦0" },
    1: { single: "₦50,000", daily: "₦300,000" },
    2: { single: "₦100,000", daily: "₦500,000" },
    3: { single: "₦5,000,000", daily: "₦25,000,000" },
  };
  const l = limits[level] ?? limits[0];
  return (
    <div className="rounded-xl bg-[#F9FAFB] p-4">
      <div className="flex items-center gap-2 mb-3">
        <LevelBadge level={level} />
        <Text fw={500} className="text-[13px] text-[#6B7280]">
          - Your current KYC tier
        </Text>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Text fw={400} className="text-[11px] text-[#9CA3AF]">
            Single transaction limit
          </Text>
          <Text fw={700} className="text-[15px] text-[#0F172A]">
            {l.single}
          </Text>
        </div>
        <div>
          <Text fw={400} className="text-[11px] text-[#9CA3AF]">
            Daily limit
          </Text>
          <Text fw={700} className="text-[15px] text-[#0F172A]">
            {l.daily}
          </Text>
        </div>
      </div>
    </div>
  );
}

// ── Mono verification result card ────────────────────────────────────────────

export function VerificationDataCard({
  data,
}: {
  data: Record<string, unknown> | null | undefined;
}) {
  if (!data) return null;

  // Mono stores the full webhook body: { event, data: { customer, kyc_level, ... } }
  const inner = (data.data ?? data) as Record<string, any>;
  const customer = inner?.customer as Record<string, any> | undefined;
  const name: string | undefined = customer?.name;
  const phone: string | undefined = customer?.phone;
  const identityType: string | undefined =
    customer?.identity?.type?.toUpperCase();
  const tier: string | undefined = (inner?.kyc_level as string)?.replace(
    "_",
    " ",
  );
  const verifiedAt: string | undefined =
    inner?.updated_at ?? inner?.created_at ?? inner?.verified_at;

  const rows: { label: string; value: string }[] = [
    ...(name ? [{ label: "Verified Name", value: name }] : []),
    ...(phone ? [{ label: "Phone", value: phone }] : []),
    ...(identityType ? [{ label: "Identity Type", value: identityType }] : []),
    ...(tier
      ? [
          {
            label: "KYC Tier",
            value: tier.charAt(0).toUpperCase() + tier.slice(1),
          },
        ]
      : []),
    ...(verifiedAt
      ? [
          {
            label: "Verified At",
            value: new Date(verifiedAt).toLocaleString("en-NG", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]
      : []),
  ];

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4 text-left">
      <div className="flex items-center gap-2 mb-3">
        <IconFingerprint size={16} color="#02A36E" />
        <Text fw={600} className="text-[13px] text-[#065F46]">
          Verified by Mono
        </Text>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <Text fw={400} className="text-[11px] text-[#6B7280]">
              {label}
            </Text>
            <Text fw={600} className="text-[13px] text-[#0F172A]">
              {value}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pending review screen ─────────────────────────────────────────────────────

export function PendingReviewScreen({
  forLevel,
  onRefresh,
  verificationData,
}: {
  forLevel: 2 | 3;
  onRefresh: () => void;
  verificationData?: Record<string, unknown> | null;
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3C7]">
          <IconClock size={32} color="#D97706" />
        </div>
        <Text fw={700} className="mb-2 text-[20px] text-[#0F172A]">
          Under Review
        </Text>
        <Text
          fw={400}
          className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]"
        >
          Your Level {forLevel} verification has been submitted and is currently
          being reviewed by our compliance team. This typically takes 24–48
          hours.
        </Text>
        <LimitCard level={forLevel - 1} />
        <VerificationDataCard data={verificationData} />
        <Text fw={400} className="mt-4 text-[13px] text-[#9CA3AF]">
          You can continue using the app with your current Level {forLevel - 1}{" "}
          limits while we complete the review.
        </Text>
        <button
          onClick={onRefresh}
          className="mt-6 w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
        >
          Check Status
        </button>
      </div>
    </div>
  );
}

// ── Fully verified screen ────────────────────────────────────────────────────

export function FullyVerifiedScreen() {
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
          Fully Verified
        </Text>
        <Text
          fw={400}
          className="mb-6 text-[14px] leading-[1.6] text-[#6B7280]"
        >
          Your identity has been fully verified at Level 3. You have access to
          the highest transaction limits on Ajoti.
        </Text>
        <LimitCard level={3} />
        <button
          onClick={() => navigate("/home")}
          className="mt-6 w-full cursor-pointer rounded-xl bg-[#02A36E] px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
