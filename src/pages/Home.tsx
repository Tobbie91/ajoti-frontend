import { Title, Text, Card, Group, Button, Stack } from '@mantine/core'
import { useState } from "react";

import addFunds from "@/assets/AddFunds_default.svg"
import addFundsPressed from "@/assets/AddFunds_press.svg"
import explore from "@/assets/Explore_default.svg"
import explorePressed from "@/assets/Explore_press.svg"
import withdraw from "@/assets/Withdraw_default.svg"
import withdrawPressed from "@/assets/Withdraw_press.svg"
import joinRosca from "@/assets/JoinROSCA_default.svg"
import joinRoscaPressed from "@/assets/JoinROSCA_press.svg"
import IconButton from '@/components/Icon'
import InvitePopup from '@/components/InvitePopup'
import transctionIcon from '@/assets/Transaction_Icon.svg'
import { SimpleGrid, Box } from '@mantine/core'
import { Paper } from '@mantine/core'
import { QuickCard } from '@/components/QuickCard'
import { SummaryCard } from '@/components/SumaryCard'
// import rosca from '@/assets/icons/rosca.svg'
// import fixedSave from '@/assets/icons/fixed-save.svg'
// import insurance from '@/assets/icons/insurance.svg'
// import invest from '@/assets/icons/invest.svg'
// import targetSave from '@/assets/icons/target-save.svg'
// import remittance from '@/assets/icons/remittance.svg'
// import Icon from '@/components/Icon'



export function Home() {
    const [showInvite, setShowInvite] = useState(true);


 const CARD_W = 378
  const GAP = 20
  const ROW_W = CARD_W * 3 + GAP * 2 // 1174px

    return (
        <div className="relative mx-auto max-w-4xl">
            {/* // <div className="relative min-h-screen">  */}
            {/* <div className="mx-auto max-w-4xl"> */}

            <Box
                style={{
                    maxWidth: 1200,
                    marginInline: 'auto',
                    paddingInline: 0,
                    paddingTop: 300,
                    paddingLeft: 120,
                }}
            >
                <Box style={{ width: ROW_W, marginBottom: 28 }}>
                    <Box
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(3, ${CARD_W}px)`,
                            columnGap: GAP,
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
                </Box>




                {/* <div>
            <Title order={1}>Welcome to Ajoti</Title>
            <Text c="dimmed" mt="xs">
                Your fintech application is ready to be built.
            </Text>
            </div> */}

                {/* <Card withBorder>
            <Stack gap="md">
                <Title order={3}>Getting Started</Title>
                <Text size="sm">
                This is a minimal boilerplate with React, TypeScript, Mantine UI, and Tailwind CSS.
                Start building your features by adding components and pages.
                </Text>
                <Group>
                <Button variant="filled">Primary Action</Button>
                <Button variant="outline">Secondary Action</Button>
                </Group>
            </Stack>
            </Card> */}
                <div className="absolute top-[534px] left-[830px] rounded-[15.63px]">
                    <Card withBorder className="shadow-none  w-[467px] h-[712px]">
                        <Title order={4} mb="xs" size="20.84px" className="absolute top-[47px] left-[35px]"  >
                            Transactions
                        </Title>
                        <div className="flex flex-col items-center justify-center h-full">

                            <img src={transctionIcon} alt="transcatioIcon" />
                            <Title order={4} mb="xs" size="23.44px" className="top-[0.47px] left-[35px] gap"  >
                                No Transactions yet
                            </Title>

                            <Text className="text-[15.63px] w-[343.85px] h-[58.61px]">
                                Once you start making payments, you can keep track of your transactions here.
                            </Text>
                        </div>
                    </Card>
                </div>

                <div className="absolute top-[534px] left-[124px] flex flex-row gap-[40px]">
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
                        alt="Add Funds"
                        onClick={() => console.log("Add Funds")}
                        width={110.18}
                        height={124.3}
                    />

                    <IconButton
                        defaultIcon={explore}
                        pressedIcon={explorePressed}
                        alt="Add Funds"
                        onClick={() => console.log("Add Funds")}
                        width={111.59}
                        height={124.3}
                    />

                    <IconButton
                        defaultIcon={joinRosca}
                        pressedIcon={joinRoscaPressed}
                        alt="Add Funds"
                        onClick={() => console.log("Add Funds")}
                        width={113}
                        height={124.3}
                    />
                </div>
                <InvitePopup
                    visible={showInvite}
                    onClose={() => setShowInvite(false)}
                />

                <div style={{ height: 534 }} />

                {/* Quick Access */}
            
        </Box>
        </div >
    )
}






