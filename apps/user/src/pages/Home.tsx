import { Title, Text, Card, Box } from "@mantine/core";
import { useState, useEffect } from "react";
import { IconCash } from "@tabler/icons-react";

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
import { getWalletBalanceNaira, getWalletTransactions, getTrustScore } from "@/utils/api";
import type { WalletTransaction } from "@/utils/api";

export function Home() {
    const navigate = useNavigate();

    const stored = localStorage.getItem('user')
    const user = stored ? JSON.parse(stored) : null
    const userName = user?.firstName ?? 'there'

    const [walletBalance, setWalletBalance] = useState<number | null>(null)
    const [recentTxns, setRecentTxns] = useState<WalletTransaction[]>([])
    const [trustScore, setTrustScore] = useState<number | null>(null)

    useEffect(() => {
        getWalletBalanceNaira()
            .then((res) => {
                const bal = res.balance ?? res.nairaBalance ?? res.amount ?? res.availableBalance ?? 0
                setWalletBalance(Number(bal))
            })
            .catch(() => setWalletBalance(0))

        getWalletTransactions()
            .then((txns) => setRecentTxns(txns.slice(0, 5)))
            .catch(() => {})

        getTrustScore()
            .then((res) => {
                const score = res.score ?? 0
                setTrustScore(Number(score))
            })
            .catch(() => setTrustScore(0))
    }, [])

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 sm:gap-7">
                {/* Top dashboard */}
                <MyDashboard
                    userName={userName}
                    onFundWallet={() => navigate("/create-wallet")}
                    onTransfer={() => navigate("/withdraw")}
                />

                {/* Summary cards row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                    <SummaryCard
                        title="Wallet Balance"
                        amount={walletBalance !== null ? `₦ ${walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '₦ —'}
                        gradient="linear-gradient(135deg, #1F4037 0%, #99F2C8 100%)"
                        to="/transactions"
                    />
                    <SummaryCard
                        title="My Savings"
                        amount="₦ 0.00"
                        gradient="linear-gradient(135deg, #9EB6E5 0%, #D6E4FF 100%)"
                        to="/transactions"
                    />
                    <SummaryCard
                        title="My Goals"
                        amount="₦ 0.00"
                        gradient="linear-gradient(135deg, #A8D8B9 0%, #DFF3E7 100%)"
                        to="/transactions"
                    />
                </div>

                {/* Trust & Credit Score cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <TrustScoreCard score={trustScore} />
                    <CreditScoreCard score={685} />
                </div>

                {/* Two-column layout: left content + right sidebar */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-7">
                        {/* Action buttons row */}
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
                                alt="Join ROSCA"
                                onClick={() => navigate("/rosca")}
                                width={107}
                                height={118}
                            />
                        </div>

                        {/* Quick Access */}
                        <div>
                            <Text
                                style={{
                                    fontFamily: "Poppins, sans-serif",
                                    fontWeight: 500,
                                    fontSize: 24,
                                    lineHeight: "100%",
                                    color: "#0F172A",
                                }}
                                mb={16}
                            >
                                Quick Access
                            </Text>

                            <div className="grid grid-cols-2 gap-4 sm:gap-5">
                                <QuickCard
                                    title="ROSCA"
                                    desc="Join ROSCA to save with your peers"
                                    icon={<img src={Rosca} alt="" />}
                                    onClick={() => navigate("/rosca")}
                                />
                                <QuickCard
                                    title="Loans"
                                    desc="Get your ROSCA payout early"
                                    icon={
                                        <div style={{ width: 51, height: 51, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IconCash size={26} color="white" />
                                        </div>
                                    }
                                    onClick={() => navigate("/loans")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-6">
                        {/* Transactions card */}
                        <Card
                            withBorder
                            radius="md"
                            className="min-h-[300px] cursor-pointer lg:min-h-[500px]"
                            onClick={() => navigate("/transactions")}
                        >
                            <Title order={4} mb="xs" style={{ fontSize: 20 }}>
                                Transactions
                            </Title>

                            {recentTxns.length === 0 ? (
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
                                    <Title order={4} style={{ fontSize: 20 }}>
                                        No Transactions yet
                                    </Title>
                                    <Text className="max-w-[300px] text-center" style={{ fontSize: 14 }}>
                                        Once you start making payments, you can keep track of your transactions here.
                                    </Text>
                                </Box>
                            ) : (
                                <div className="flex flex-col gap-2 pt-2">
                                    {recentTxns.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between rounded-lg border border-[#F3F4F6] px-3 py-2">
                                            <div>
                                                <Text fw={500} className="text-[13px] text-[#0F172A]">
                                                    {tx.description || tx.type}
                                                </Text>
                                                <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </Text>
                                            </div>
                                            <Text fw={600} className={`text-[13px] ${tx.type === 'CREDIT' ? 'text-[#02A36E]' : 'text-[#EF4444]'}`}>
                                                {tx.type === 'CREDIT' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
