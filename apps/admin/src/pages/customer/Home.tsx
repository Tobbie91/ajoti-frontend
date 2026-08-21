import { Title, Text, Card, Box } from "@mantine/core";
import { useState, useEffect } from "react";
import { IconArrowDownLeft, IconArrowUpRight, IconCash, IconLock } from "@tabler/icons-react";
import addFunds from "@/assets/AddFunds_default.svg";
import addFundsPressed from "@/assets/AddFunds_press.svg";
import explore from "@/assets/Explore_default.svg";
import explorePressed from "@/assets/Explore_press.svg";
import withdraw from "@/assets/Withdraw_default.svg";
import withdrawPressed from "@/assets/Withdraw_press.svg";
import joinRosca from "@/assets/JoinROSCA_default.svg";
import joinRoscaPressed from "@/assets/JoinROSCA_press.svg";
import IconButton from "@/components/Icon";
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
} from "@/utils/api";
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
    ]);
  }, []);
  const legacyMoney = (n: number) =>
    `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          <SummaryCard
            title="Total Balance"
            amount={walletBalance ? money(walletBalance.total) : "-"}
            gradient="linear-gradient(135deg,#1F4037 0%,#99F2C8 100%)"
            hideable
            hidden={hidden}
            onToggleHidden={toggle}
          />
          <SummaryCard
            title="Available"
            amount={walletBalance ? money(walletBalance.available) : "-"}
            gradient="linear-gradient(135deg,#9EB6E5 0%,#D6E4FF 100%)"
            hidden={hidden}
          />
          <SummaryCard
            title="Reserved"
            amount={walletBalance ? money(walletBalance.reserved) : "-"}
            gradient="linear-gradient(135deg,#A8D8B9 0%,#DFF3E7 100%)"
            hidden={hidden}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <TrustScoreCard
            score={trustScore}
            breakdown={trustData?.atiBreakdown ?? null}
          />
          <CreditScoreCard score={creditScore ?? 0} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-7">
            <div className="grid grid-cols-4 gap-3 sm:flex sm:gap-8">
              <IconButton
                defaultIcon={addFunds}
                pressedIcon={addFundsPressed}
                alt="Add Funds"
                onClick={() => navigate("/create-wallet")}
                width={100}
                height={118}
              />
              <IconButton
                defaultIcon={withdraw}
                pressedIcon={withdrawPressed}
                alt="Withdraw"
                onClick={() => navigate("/withdraw")}
                width={104}
                height={118}
              />
              <IconButton
                defaultIcon={explore}
                pressedIcon={explorePressed}
                alt="Explore"
                onClick={() => navigate("/rosca/how-it-works")}
                width={106}
                height={118}
              />
              <IconButton
                defaultIcon={joinRosca}
                pressedIcon={joinRoscaPressed}
                alt="Join an ajo"
                onClick={() => navigate("/rosca")}
                width={107}
                height={118}
              />
            </div>
            <div>
              <Text fw={500} fz={24} mb={16}>
                Quick Access
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
    </div>
  );
}
function GroupTxStyled({ tx }: { tx: WalletTransaction }) {
  const entry = tx.entryType ?? tx.type ?? "";
  const credit = entry === "CREDIT";
  const amt = Number(tx.amount) / 100;
  const movement = tx.movementType ?? tx.description ?? entry;
  const label = movement
    ? movement.charAt(0) + movement.slice(1).toLowerCase()
    : "Transaction";
  const date = new Date(tx.createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="mx-3 flex items-center justify-between border-t border-[#F3F4F6] px-1 py-3 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${credit ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"}`}>
          {credit ? <IconArrowDownLeft size={18} color="#02A36E" /> : <IconArrowUpRight size={18} color="#EF4444" />}
        </div>
        <div className="min-w-0">
          <Text size="sm" fw={600} truncate>{label}</Text>
          <Text size="xs" c="dimmed">{entry} / {date}</Text>
        </div>
      </div>
      <Text size="sm" fw={600} c={credit ? "#02A36E" : "#EF4444"} className="ml-3 shrink-0">
        {credit ? "+" : "-"}{String.fromCharCode(0x20a6)}{amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </Text>
      <Text size="sm" fw={600} c={credit ? "#02A36E" : "#EF4444"} className="ml-3 shrink-0" style={{ display: "none" }}>
        {credit ? "+" : "-"}₦{amt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </Text>
    </div>
  );
}
