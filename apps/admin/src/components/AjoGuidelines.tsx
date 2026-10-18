import { Text } from "@mantine/core";

const GROUND = "#0F3D2E";
const ACCENT = "#E8B23A";
const PAPER = "#F6F1E7";
const INK = "#1B1B18";

export interface AjoGuidelinesProps {
  circleName: string;
  contributionAmount: number;
  frequency?: string | null;
  durationCycles: number;
  payoutTime?: string | null;
  initialContributionDeadline?: string | null;
  collateralPercentage?: number;
  latePenaltyPercent?: number;
  payoutFeeAmount?: number;
  adminName?: string;
  lateGraceDays?: number;
  escalatedLatePercent?: number;
}

function naira(n: number): string {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

function cadenceLabel(freq?: string | null): string {
  switch ((freq ?? "").toUpperCase()) {
    case "DAILY": return "Every day";
    case "WEEKLY": return "Every week";
    case "BI_WEEKLY": return "Every 2 weeks";
    case "MONTHLY": return "Every month";
    default: return "Each cycle";
  }
}

function formatPayoutTime(raw?: string | null): string {
  if (!raw) return "On payment day";
  const match = /^(\d{1,2}):(\d{2})/.exec(raw.trim());
  if (!match) return raw;
  const h = Number(match[1]);
  const m = match[2];
  const hour12 = ((h + 11) % 12) + 1;
  const suffix = h >= 12 ? "pm" : "am";
  return `${hour12}:${m}${suffix}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "To be confirmed";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return "To be confirmed";
  }
}

export function AjoGuidelines({
  circleName,
  contributionAmount,
  frequency,
  durationCycles,
  payoutTime,
  initialContributionDeadline,
  collateralPercentage = 100,
  latePenaltyPercent = 1.5,
  payoutFeeAmount = 1000,
  adminName,
  lateGraceDays = 7,
  escalatedLatePercent = 4,
}: AjoGuidelinesProps) {
  const contributionNaira = contributionAmount / 100;
  const depositNaira = contributionNaira * (collateralPercentage / 100);
  const payoutLabel = formatPayoutTime(payoutTime);
  const firstPaymentLabel = formatDate(initialContributionDeadline);

  return (
    <div
      className="overflow-hidden rounded-3xl"
      style={{ background: PAPER, color: INK, fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* ─── Dark green header ──────────────────────────────────────── */}
      <header
        className="flex flex-col gap-6 px-6 py-8 sm:gap-8 sm:px-14 sm:py-14"
        style={{ background: GROUND, color: PAPER }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text
            fw={700}
            style={{
              fontSize: 14,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: ACCENT,
            }}
          >
            Dear members
          </Text>
          <Text style={{ fontSize: 14, color: PAPER, opacity: 0.8 }}>
            Please read before joining {circleName}
          </Text>
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 7vw, 88px)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          Our Ajo Group<br />Guidelines
        </h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Fact label={cadenceLabel(frequency)} value={naira(contributionNaira)} />
          <Fact label="Number of rounds" value={String(durationCycles || "—")} />
          <Fact label="Payout time" value={payoutLabel} small="WAT, on payment day" />
        </div>

        <Text style={{ fontSize: 15, lineHeight: 1.5, color: PAPER }}>
          First payment date: <strong style={{ color: ACCENT }}>{firstPaymentLabel}</strong>.
          {" "}We will let everyone know as soon as it is confirmed.
        </Text>
      </header>

      {/* ─── Numbered guideline cards ───────────────────────────────── */}
      <main className="grid grid-cols-1 gap-4 px-6 py-8 sm:grid-cols-2 sm:gap-5 sm:px-14 sm:py-11">
        <GuidelineCard
          num="01"
          title="Security deposit"
          paragraphs={[
            <>When you send a request to join, a deposit of <strong>{naira(depositNaira)}</strong> will be held from your wallet.</>,
            <>It will be returned to you if you leave before we start, if your request isn’t accepted, if the group is cancelled, or once the group is complete.</>,
          ]}
        />
        <GuidelineCard
          num="02"
          title="If you need to leave"
          paragraphs={[
            <>We understand things can change. If you leave after the group has started, your <strong>remaining deposit (100%)</strong> will be shared among the members still in the group.</>,
            <>If no other members remain, your deposit will be returned to you.</>,
          ]}
        />
        <GuidelineCard
          num="03"
          title="Late payment"
          paragraphs={[
            <>We kindly ask everyone to pay on time. If a payment is missed, a late fee of <strong>{latePenaltyPercent}%</strong> will be added.</>,
            <>After <strong>{lateGraceDays} days</strong>, this becomes <strong>{escalatedLatePercent}%</strong> instead (you won’t pay both).</>,
            <>Any unpaid late fee may be taken from your deposit, and any balance will be recorded as a debt.</>,
          ]}
        />
        <GuidelineCard
          num="04"
          title="Payout fee"
          paragraphs={[
            <>A small fee of <strong>{naira(payoutFeeAmount)}</strong> is deducted from each payout.</>,
            <>This is only charged when there is enough money in the group to cover it.</>,
          ]}
        />
        <GuidelineCard
          num="05"
          title="One-time support"
          paragraphs={[
            <>If a payment is missed, Ajoti may cover it at {payoutLabel} so the rest of the group is not affected.</>,
            <>The amount, plus the late fee, would then need to be repaid to Ajoti. This support is available <strong>only once</strong> per account.</>,
          ]}
        />
        <GuidelineCard
          num="06"
          title="While a balance is owed"
          paragraphs={[
            <>Joining another group won’t be possible, and withdrawals will be paused from 12 noon. You can still receive money as normal.</>,
            <>Payouts will continue on schedule, though they may be smaller if some payments are outstanding.</>,
          ]}
        />
      </main>

      {/* ─── Gold footer ────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8 sm:px-14 sm:py-10"
        style={{ background: ACCENT }}
      >
        <Text
          style={{
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(20px, 3vw, 30px)",
            lineHeight: 1.1,
            color: INK,
          }}
        >
          Thank you for paying on time and helping everyone receive their full payout.
        </Text>
      </footer>
    </div>
  );
}

function Fact({ label, value, small }: { label: string; value: string; small?: string }) {
  return (
    <div
      style={{
        background: "rgba(246,241,231,0.08)",
        border: "2px solid rgba(246,241,231,0.18)",
        borderRadius: 20,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13, color: PAPER, opacity: 0.75 }}>{label}</Text>
      <Text
        style={{
          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
          fontWeight: 800,
          fontSize: "clamp(22px, 3.5vw, 36px)",
          color: ACCENT,
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        {value}
      </Text>
      {small && <Text style={{ fontSize: 12, color: PAPER, opacity: 0.75 }}>{small}</Text>}
    </div>
  );
}

function GuidelineCard({
  num,
  title,
  paragraphs,
}: {
  num: string;
  title: string;
  paragraphs: React.ReactNode[];
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Text
        style={{
          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
          fontWeight: 800,
          fontSize: 18,
          color: GROUND,
          letterSpacing: "0.02em",
        }}
      >
        {num}
      </Text>
      <Text
        style={{
          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          lineHeight: 1.1,
          color: INK,
          margin: 0,
        }}
      >
        {title}
      </Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={{ fontSize: 14.5, lineHeight: 1.55, color: INK, margin: 0 }}>
          {p}
        </Text>
      ))}
    </section>
  );
}
