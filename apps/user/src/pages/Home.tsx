import { Title, Text, Card, Box, Container, Stack } from "@mantine/core";
import { useState } from "react";

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

import FixedSave from "@/assets/FixedSave.svg";
import Insurance from "@/assets/Insurance.svg";
import Invest from "@/assets/Invest.svg";
import Remittance from "@/assets/Remittance.svg";
import TargetSave from "@/assets/TargetSave.svg";
import Rosca from "@/assets/Rosca.svg";

export function Home() {
    const [showInvite, setShowInvite] = useState(true);

    // ====== GLOBAL TUNING KNOBS (these are your “manual adjust” spots) ======
    const PAGE_MAX_W = 1240; // overall page width
    const PAGE_PT = 0; // top padding
    const PAGE_PX = 24; // left/right padding

    const CARD_W = 378; // SummaryCard width
    const CARD_H = 206; // SummaryCard height (if your SummaryCard supports height)
    const SUMMARY_GAP = 20;

    const ACTIONS_GAP = 40; // gap between 4 icon buttons
    const SECTION_GAP = 28; // vertical spacing between sections

    const QUICK_TITLE_SIZE = 29; // "Quick Access" font size
    const QUICK_TITLE_MB = 18; // space under title
    const QUICK_GRID_GAP = 37; // spacing between small cards
    const QUICK_COL_W = 188; // width of each small quick card column
    const QUICK_GRID_W = 640; // total grid width (optional)

    return (
        <Container size={PAGE_MAX_W} px={PAGE_PX} pt={PAGE_PT}>
            <Stack gap={SECTION_GAP}>
                {/* Top dashboard */}
                <MyDashboard
                    userName="Osho"
                    tierLabel="Tier 2"
                    languageLabel="EN"
                    onFundWallet={() => console.log("Fund Wallet")}
                    onTransfer={() => console.log("Transfer")}
                    onChangeLanguage={(lang: string) => console.log("Language:", lang)}
                />

                {/* Summary + Transactions (two-column layout) */}
                <Box
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 467px", // left side flexible, right is fixed width
                        gap: 24,
                        alignItems: "start",
                    }}
                >
                    {/* LEFT: Summary cards + action buttons + quick access */}
                    <Stack gap={SECTION_GAP}>
                        {/* Summary row */}
                        <Box
                            style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(3, ${CARD_W}px)`,
                                gap: SUMMARY_GAP,
                                justifyContent: "start", // change to "center" if you want centered row
                            }}
                        >
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
                        </Box>

                        {/* Action buttons row */}
                        <Box style={{ display: "flex", gap: ACTIONS_GAP }}>
                            <IconButton
                                defaultIcon={addFunds}
                                pressedIcon={addFundsPressed}
                                alt="Add Funds"
                                onClick={() => console.log("Add Funds")}
                                width={105.94}
                                height={124.3}
                            />
                            <IconButton
                                defaultIcon={withdraw}
                                pressedIcon={withdrawPressed}
                                alt="Withdraw"
                                onClick={() => console.log("Withdraw")}
                                width={110.18}
                                height={124.3}
                            />
                            <IconButton
                                defaultIcon={explore}
                                pressedIcon={explorePressed}
                                alt="Explore"
                                onClick={() => console.log("Explore")}
                                width={111.59}
                                height={124.3}
                            />
                            <IconButton
                                defaultIcon={joinRosca}
                                pressedIcon={joinRoscaPressed}
                                alt="Join ROSCA"
                                onClick={() => console.log("Join ROSCA")}
                                width={113}
                                height={124.3}
                            />
                        </Box>


                        <InvitePopup
                            visible={showInvite}
                            onClose={() => setShowInvite(false)}
                        />
                        
                        {/* Quick Access */}
                        <Box>
                            <Text
                                style={{
                                    fontFamily: "Poppins, sans-serif",
                                    fontWeight: 500,
                                    fontSize: QUICK_TITLE_SIZE,
                                    lineHeight: "100%",
                                    color: "#0F172A",
                                }}
                                mb={QUICK_TITLE_MB}
                            >
                                Quick Access
                            </Text>

                            <Box
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(3, ${QUICK_COL_W}px)`,
                                    gap: QUICK_GRID_GAP,
                                    width: QUICK_GRID_W, // remove this line if you want it to stretch naturally
                                }}
                            >
                                <QuickCard
                                    title="ROSCA"
                                    desc="Join ROSCA to save with your peers"
                                    icon={<img src={Rosca} alt="" />}
                                />
                                <QuickCard
                                    title="Fixed Save"
                                    desc="Lock amount of money for a long period of time"
                                    icon={<img src={FixedSave} alt="" />}
                                />
                                <QuickCard
                                    title="Insurance"
                                    desc="Explore profitable opportunities with Suprebase"
                                    icon={<img src={Insurance} alt="" />}
                                />
                                <QuickCard
                                    title="Invest"
                                    desc="Explore profitable opportunities with Suprebase"
                                    icon={<img src={Invest} alt="" />}
                                />
                                <QuickCard
                                    title="Target Save"
                                    desc="Save towards a target with up to 10% return"
                                    icon={<img src={TargetSave} alt="" />}
                                />
                                <QuickCard
                                    title="Remittance"
                                    desc="Save towards a target with up to 10% return"
                                    icon={<img src={Remittance} alt="" />}
                                />
                            </Box>
                        </Box>
                    </Stack>

                    {/* RIGHT: Transactions card */}
                    <Card withBorder radius="md" style={{ height: 712 }}>
                        <Title order={4} mb="xs" style={{ fontSize: 20.84 }}>
                            Transactions
                        </Title>

                        <Box
                            style={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                paddingBottom: 60,
                            }}
                        >
                            <img src={transctionIcon} alt="transaction icon" />
                            <Title order={4} style={{ fontSize: 23.44 }}>
                                No Transactions yet
                            </Title>
                            <Text style={{ fontSize: 15.63, width: 343.85, textAlign: "center" }}>
                                Once you start making payments, you can keep track of your transactions here.
                            </Text>
                        </Box>
                    </Card>
                </Box>


            </Stack>
        </Container>
    );
}
