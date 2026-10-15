import { Title, Text, Card, Box, Modal, Paper, SimpleGrid, UnstyledButton } from "@mantine/core";
import { useState, useEffect, useRef } from "react";
import { IconAlertTriangle, IconArrowDownLeft, IconArrowRight, IconArrowUpRight, IconCash, IconCompass, IconGauge, IconLock, IconLockOpen, IconPlus, IconShieldCheck, IconTarget, IconUsersGroup } from "@tabler/icons-react";
import transctionIcon from "@/assets/Transaction_Icon.svg";
import { MyDashboard } from "@/components/MyDashBoard/MyDashboard";
import { QuickCard } from "@/components/QuickCard";
import { SummaryCard } from "@/components/SumaryCard";
import { TrustScoreCard, CreditScoreCard } from "@/components/ScoreCards";
import Rosca from "@/assets/Rosca.svg";
import { useNavigate } from "react-router-dom";
import {
  getWalletBalance,
  getWalletTransactions,
  getTrustScore,
  getCreditScore,
  getMyParticipations,
  type RoscaCircle,
} from "@/utils/api";
import { getMyTargetSavings, type TargetSavingsPlan } from "@/utils/targetSavingsApi";
import type { WalletTransaction, TrustScore } from "@/utils/api";
import { useWalletPrivacy } from "@/hooks/useWalletPrivacy";

export function Home() {
  const navigate = useNavigate();
  const { hidden, toggle } = useWalletPrivacy();
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const userName = user?.firstName ?? "there";
  const [walletBalance, setWalletBalance] = useState<{
    total: number;
    reserved: number;
    available: number;
  } | null>(null);
  const [recentTxns, setRecentTxns] = useState<WalletTransaction[]>([]);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [trustData, setTrustData] = useState<TrustScore | null>(null);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [participations, setParticipations] = useState<RoscaCircle[]>([]);
  const [trustOpen, setTrustOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [targetPlans, setTargetPlans] = useState<TargetSavingsPlan[]>([]);
  useEffect(() => {
    Promise.allSettled([
      getWalletBalance()
        .then((d) =>
          setWalletBalance({
            total: Number(d.total ?? 0) / 100,
            reserved: Number(d.reserved ?? 0) / 100,
            available: Number(d.available ?? 0) / 100,
          }),
        )
        .catch(() => setWalletBalance({ total: 0, reserved: 0, available: 0 })),
      getWalletTransactions()
        .then((t) => setRecentTxns(t.slice(0, 5)))
        .catch(() => {}),
      getTrustScore()
        .then((r) => {
          setTrustScore(Number(r.trustScore ?? 0));
          setTrustData(r);
        })
        .catch(() => {
          setTrustScore(0);
          setTrustData(null);
        }),
      getCreditScore()
        .then((r) =>
          setCreditScore(
            Number(r.finalScore ?? r.compositeScore ?? r.score ?? 0),
          ),
        )
        .catch(() => setCreditScore(0)),
      getMyParticipations()
        .then((rows) => setParticipations(Array.isArray(rows) ? rows : []))
        .catch(() => setParticipations([])),
      getMyTargetSavings()
        .then((rows) => setTargetPlans(Array.isArray(rows) ? rows : []))
        .catch(() => setTargetPlans([])),
    ]);
  }, []);

  // ─── Stat tile derivations ─────────────────────────────────────────
  const stats = (() => {
    const joined = participations.length;
    let active = 0;
    let completed = 0;
    let nextPayment: { date: Date; name: string } | null = null;
    for (const c of participations) {
      const status = (c.status ?? "").toUpperCase();
      if (status === "COMPLETED") completed += 1;
      else if (status === "ACTIVE" || status === "STARTED") active += 1;
      const deadline = c.nextContributionDeadline;
      if (deadline) {
        const d = new Date(deadline);
        if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
          if (!nextPayment || d < nextPayment.date) {
            nextPayment = { date: d, name: c.name ?? "Circle" };
          }
        }
      }
    }
    let nextTarget: Date | null = null;
    for (const p of targetPlans) {
      const status = (p.status ?? "").toUpperCase();
      if (status === "COMPLETED" || status === "MATURED") continue;
      if (!p.maturityDate) continue;
      const d = new Date(p.maturityDate);
      if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
        if (!nextTarget || d < nextTarget) nextTarget = d;
      }
    }
    const fmtShort = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
    return {
      joined: String(joined),
      active: String(active),
      completed: String(completed),
      nextPayment: nextPayment ? fmtShort(nextPayment.date) : "—",
      nextPaymentSub: nextPayment?.name,
      nextTarget: nextTarget ? fmtShort(nextTarget) : "—",
    };
  })();
  const money = (n: number) =>
    `${String.fromCharCode(0x20a6)}${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 sm:gap-7">
        <MyDashboard
          userName={userName}
          onFundWallet={() => navigate("/create-wallet")}
          onTransfer={() => navigate("/withdraw")}
        />

        {/* ─── Wallet trio (matches admin Dashboard) ───────────────────── */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <SummaryCard
            title="Total Balance"
            amount={walletBalance ? money(walletBalance.total) : "-"}
            gradient="linear-gradient(135deg, #1F4037 0%, #99F2C8 100%)"
            hideable
            hidden={hidden}
            onToggleHidden={toggle}
          />
          <SummaryCard
            title="Available"
            amount={walletBalance ? money(walletBalance.available) : "-"}
            gradient="linear-gradient(135deg, #9EB6E5 0%, #D6E4FF 100%)"
            hidden={hidden}
          />
          <SummaryCard
            title="Reserved"
            amount={walletBalance ? money(walletBalance.reserved) : "-"}
            gradient="linear-gradient(135deg, #A8D8B9 0%, #DFF3E7 100%)"
            hidden={hidden}
          />
        </SimpleGrid>

        {/* ─── Quick action icon strip (matches admin Dashboard) ───── */}
        <div className="hidden flex-wrap gap-3 sm:flex sm:gap-5">
          <HomeQuickTile
            icon={<IconPlus size={22} />}
            label="Add funds"
            onClick={() => navigate("/create-wallet")}
          />
          <HomeQuickTile
            icon={<IconArrowUpRight size={22} />}
            label="Withdraw"
            onClick={() => navigate("/withdraw")}
          />
          <HomeQuickTile
            icon={<IconCompass size={22} />}
            label="Explore"
            onClick={() => navigate("/rosca/how-it-works")}
          />
          <HomeQuickTile
            icon={<IconUsersGroup size={22} />}
            label="Ajo"
            onClick={() => navigate("/rosca")}
          />
          <HomeQuickTile
            icon={<IconTarget size={22} />}
            label="Target Savings"
            onClick={() => navigate("/target-savings")}
          />
          <HomeQuickTile
            icon={<IconLock size={22} />}
            label="Where it's reserved"
            onClick={() => navigate("/wallet/reservations")}
          />
          <HomeQuickTile
            icon={<IconCash size={22} />}
            label="Early Payout"
            onClick={() => navigate("/loans")}
          />
          <HomeQuickTile
            icon={<IconAlertTriangle size={22} />}
            label="Debts"
            onClick={() => navigate("/debts")}
          />
          <HomeQuickTile
            icon={<IconShieldCheck size={22} />}
            label="Trust score"
            badge={trustScore !== null ? String(trustScore) : undefined}
            onClick={() => setTrustOpen(true)}
          />
          <HomeQuickTile
            icon={<IconGauge size={22} />}
            label="Credit score"
            badge={creditScore !== null ? String(creditScore) : undefined}
            onClick={() => setCreditOpen(true)}
          />
        </div>

        {/* ─── At-a-glance stats row ──────────────────────────────────── */}
        <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="xs">
          <HomeStatTile label="Joined groups" value={stats.joined} />
          <HomeStatTile label="Next payment" value={stats.nextPayment} sub={stats.nextPaymentSub} />
          <HomeStatTile label="Active" value={stats.active} />
          <HomeStatTile label="Completed" value={stats.completed} />
          <HomeStatTile label="Next target due" value={stats.nextTarget} />
        </SimpleGrid>

        {/* ─── Advert board — rotates between 3 slides ────────────────── */}
        <AdvertRotator
          slides={[
            {
              icon: <IconUsersGroup size={28} />,
              title: "Ready to run your own ajo?",
              body: "Become an Ajo admin to create groups, invite members, and manage contributions.",
              cta: "Become an Ajo admin",
              to: "/rosca/become-admin",
              gradient: "linear-gradient(135deg,#043F32 0%,#02A36E 100%)",
            },
            {
              icon: <IconTarget size={28} />,
              title: "Save towards a goal",
              body: "Lock in funds for school fees, rent, or that holiday. Earn as you save.",
              cta: "Open Target Savings",
              to: "/target-savings",
              gradient: "linear-gradient(135deg,#1E3A8A 0%,#3B82F6 100%)",
            },
            {
              icon: <IconCash size={28} />,
              title: "Need cash sooner?",
              body: "Request an early payout from your active ajo circle, with no paperwork.",
              cta: "Request an early payout",
              to: "/loans",
              gradient: "linear-gradient(135deg,#7C2D12 0%,#F97316 100%)",
            },
          ]}
          onCta={(to) => navigate(to)}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-7">
            <div>
              <Text fw={500} fz={24} mb={16}>
                What would you like to do?
              </Text>
              <div className="grid grid-cols-2 gap-4 sm:gap-5">
                <QuickCard
                  title="Ajo"
                  desc="Join an ajo to save with your peers"
                  icon={<img src={Rosca} alt="" />}
                  onClick={() => navigate("/rosca")}
                />
                <QuickCard
                  title="Target Savings"
                  desc="Save towards personal or shared goals"
                  icon={
                    <div
                      style={{
                        width: 51,
                        height: 51,
                        borderRadius: "50%",
                        background: "#02A36E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconCash size={26} color="white" />
                    </div>
                  }
                  onClick={() => navigate("/target-savings")}
                />
                <QuickCard
                  title="Loans"
                  desc="Get your ajo payout early"
                  icon={
                    <div
                      style={{
                        width: 51,
                        height: 51,
                        borderRadius: "50%",
                        background: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconCash size={26} color="white" />
                    </div>
                  }
                  onClick={() => navigate("/loans")}
                />
              </div>
            </div>
          </div>
          <Card
            withBorder
            radius="xl"
            className="min-h-[300px] cursor-pointer border-[#E5E7EB] bg-white p-1 shadow-sm lg:min-h-[500px]"
            onClick={() => navigate("/transactions")}
          >
            <div className="flex items-center justify-between px-4 pb-3 pt-3">
              <Title order={4}>Transactions</Title>
              <Text size="sm" fw={600} c="#02A36E">View all</Text>
            </div>
            {hidden ? (
              <Box
                style={{
                  height: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconLock
                  size={25}
                  color="#667085"
                  aria-label="Transaction history hidden"
                />
              </Box>
            ) : recentTxns.length === 0 ? (
              <Box
                style={{
                  height: 260,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <img src={transctionIcon} alt="transaction icon" />
                <Title order={4}>No Transactions yet</Title>
                <Text size="sm">
                  Once you start making payments, you can keep track of your
                  transactions here.
                </Text>
              </Box>
            ) : (
              recentTxns.map((tx) => <GroupTxStyled key={tx.id} tx={tx} />)
            )}
          </Card>
        </div>

      </div>

      {/* ─── Score modals (open from the icon strip) ─────────────────── */}
      <Modal
        opened={trustOpen}
        onClose={() => setTrustOpen(false)}
        title="Trust Score"
        size="lg"
        centered
      >
        <TrustScoreCard
          score={trustScore}
          breakdown={trustData?.atiBreakdown ?? null}
        />
      </Modal>
      <Modal
        opened={creditOpen}
        onClose={() => setCreditOpen(false)}
        title="Credit Score"
        size="lg"
        centered
      >
        <CreditScoreCard score={creditScore ?? 0} />
      </Modal>
    </div>
  );
}

// ─── Home-only helpers ───────────────────────────────────────────────

function HomeQuickTile({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      aria-label={label}
      style={{
        width: 106,
        height: 118,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 6,
        borderRadius: 12,
        background: "#F8FAF9",
        border: "1px solid #E7F4EE",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#E7F4EE")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#F8FAF9")}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#E7F4EE",
          color: "#0B6B55",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <Text size="xs" fw={600} ta="center" style={{ color: "#0F172A", lineHeight: 1.25 }}>
        {label}
      </Text>
      {badge && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            minWidth: 22,
            height: 18,
            padding: "0 6px",
            borderRadius: 9,
            background: "#02A36E",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badge}
        </span>
      )}
    </UnstyledButton>
  );
}

function HomeStatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Paper withBorder radius="md" p="xs" style={{ background: "#FFFFFF" }}>
      <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#64748B" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginTop: 3, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Text>
      {sub && (
        <Text truncate style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 2 }}>
          {sub}
        </Text>
      )}
    </Paper>
  );
}

interface AdvertSlide {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  to: string;
  gradient: string;
}

function AdvertRotator({ slides, onCta }: { slides: AdvertSlide[]; onCta: (to: string) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slides.length]);

  const slide = slides[index];
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex flex-col gap-4 overflow-hidden rounded-2xl p-6 text-white shadow-sm transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-8"
        style={{ background: slide.gradient, minHeight: 140 }}
      >
        <div className="flex items-start gap-4 sm:items-center">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
            aria-hidden
          >
            {slide.icon}
          </div>
          <div>
            <Text fw={700} className="text-[20px] sm:text-[24px] text-white">
              {slide.title}
            </Text>
            <Text size="sm" className="mt-1 max-w-[620px] text-white/85">
              {slide.body}
            </Text>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCta(slide.to)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[13.5px] font-semibold text-[#026A4B] shadow-sm sm:w-auto"
        >
          {slide.cta}
          <IconArrowRight size={16} />
        </button>
      </div>
      <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="Advert slides">
        {slides.map((_, i) => {
          const active = i === index;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className="cursor-pointer rounded-full transition-all"
              style={{
                width: active ? 20 : 6,
                height: 6,
                background: active ? "#0B6B55" : "#CBD5E1",
                border: 0,
                padding: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
function GroupTxStyled({ tx }: { tx: WalletTransaction }) {
  const entry = tx.entryType ?? tx.type ?? "";
  const credit = entry === "CREDIT";
  const reservation = tx.bucketType === "ROSCA" && ["RESERVE", "RELEASE"].includes(entry);
  const reservationRelease = reservation && entry === "RELEASE";
  const amt = Number(tx.amount) / 100;
  const movement = tx.movementType ?? tx.description ?? entry;
  const label = tx.description ?? (movement
    ? movement.charAt(0) + movement.slice(1).toLowerCase()
    : "Transaction");
  const date = new Date(tx.createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="mx-3 flex items-center justify-between border-t border-[#F3F4F6] px-1 py-3 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${reservation ? "bg-[#E7F4EE]" : credit ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"}`}>
          {reservation
            ? reservationRelease
              ? <IconLockOpen size={18} color="#0B6B55" />
              : <IconLock size={18} color="#0B6B55" />
            : credit
              ? <IconArrowDownLeft size={18} color="#02A36E" />
              : <IconArrowUpRight size={18} color="#EF4444" />}
        </div>
        <div className="min-w-0">
          <Text size="sm" fw={600} truncate>{label}</Text>
          <Text size="xs" c="dimmed">{entry} / {date}</Text>
        </div>
      </div>
      <Text size="sm" fw={600} c={reservation ? "#0B6B55" : credit ? "#02A36E" : "#EF4444"} className="ml-3 shrink-0">
        {reservation ? "" : credit ? "+" : "-"}{String.fromCharCode(0x20a6)}{amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </Text>
      <Text size="sm" fw={600} c={reservation ? "#0B6B55" : credit ? "#02A36E" : "#EF4444"} className="ml-3 shrink-0" style={{ display: "none" }}>
        {reservation ? "" : credit ? "+" : "-"}₦{amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </Text>
    </div>
  );
}
