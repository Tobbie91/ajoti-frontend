import { Title, Text, Card, Box } from "@mantine/core";
import { useState } from "react";
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
import InvitePopup from "@/components/InvitePopup";
import transctionIcon from "@/assets/Transaction_Icon.svg";
import { MyDashboard } from "@/components/MyDashBoard/MyDashboard";

import { QuickCard } from "@/components/QuickCard";
import { SummaryCard } from "@/components/SumaryCard";
import { TrustScoreCard, CreditScoreCard } from "@/components/ScoreCards";

import Rosca from "@/assets/Rosca.svg";
import { useNavigate } from "react-router-dom";

export function Home() {
    const [showInvite, setShowInvite] = useState(true);
    const navigate = useNavigate();

    return (
        <div className="mx-auto w-full max-w-[1200px] px-6 py-6">
            <div className="flex flex-col gap-7">
                {/* Top dashboard */}
                <MyDashboard
                    userName="Osho"
                    onFundWallet={() => navigate("/create-wallet")}
                    onTransfer={() => navigate("/withdraw")}
                />

                {/* Summary cards row - full width */}
                <div className="grid grid-cols-3 gap-5">
                    <SummaryCard
                        title="Wallet Balance"
                        amount="₦ 0.00"
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
                <div className="grid grid-cols-2 gap-5">
                    <TrustScoreCard score={72} />
                    <CreditScoreCard score={685} />
                </div>

                {/* Two-column layout: left content + right sidebar */}
                <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-7">
                        {/* Action buttons row */}
                        <div className="flex gap-8">
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

                        {/* Invite banner */}
                        <InvitePopup
                            visible={showInvite}
                            onClose={() => setShowInvite(false)}
                        />

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

                            <div className="grid grid-cols-2 gap-5">
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
                            className="min-h-[500px] cursor-pointer"
                            onClick={() => navigate("/transactions")}
                        >
                            <Title order={4} mb="xs" style={{ fontSize: 20 }}>
                                Transactions
                            </Title>

                            <Box
                                style={{
                                    height: 400,
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
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
