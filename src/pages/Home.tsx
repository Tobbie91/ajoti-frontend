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

export function Home() {
    const [showInvite, setShowInvite] = useState(true);


    return (
        <div className="relative mx-auto max-w-4xl">
            {/* // <div className="relative min-h-screen">  */}
            {/* <div className="mx-auto max-w-4xl"> */}
            <Stack gap="lg">

                <Box style={{ width: 'fit-content', marginLeft: 124, marginTop: 120 }}>
                    <Group gap={17} wrap="nowrap">
                        {/* Box 1 */}
                        <Paper w={378} h={206} radius={13.73} p="xl">
                            <Stack gap={6}>
                                <Text fw={600} fz={16}>
                                    Wallet Balance
                                </Text>
                                <Text fw={800} fz={28} lh={1}>
                                    ₦ 0.00
                                </Text>
                            </Stack>
                        </Paper>


                        {/* Box 2 */}
                        <Paper
                            w={378}
                            h={206}
                            radius={13.73}
                            p="xl"
                        >
                            <Text fw={500}>My Savings</Text>
                            <Text fw={700} fz={28}>₦ 0.00</Text>
                        </Paper>

                        {/* Box 3 */}
                        <Paper
                            w={378}
                            h={206}
                            radius={13.73}
                            p="xl"
                        >
                            <Text fw={500}>My Goals</Text>
                            <Text fw={700} fz={28}>₦ 0.00</Text>
                        </Paper>
                    </Group>
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

                {/* LEFT: Quick Access */}
                <Box style={{ width: 'fit-content', marginInline: 'auto' }}>
                    <Text fw={600} fz={28} mb={24}>
                        Quick Access
                    </Text>

                    {/* Hug container */}
                    <Box style={{ width: 640.36 }}>
                        <SimpleGrid
                            cols={3}
                            spacing={37}
                            style={{
                                width: 640.36,
                                justifyItems: 'start',
                            }}
                        >
                            <QuickCard title="ROSCA" desc="Join ROSCA to save with your peers." iconBg="#10B981" icon={<QuickIcon />} />
                            <QuickCard title="Fixed Save" desc="Lock amount of money for a long period of time." iconBg="#1E3A8A" icon={<QuickIcon />} />
                            <QuickCard title="Insurance" desc="Explore profitable opportunities with Superbase." iconBg="#6D28D9" icon={<QuickIcon />} />
                            <QuickCard title="Invest" desc="Explore profitable opportunities with Superbase." iconBg="#059669" icon={<QuickIcon />} />
                            <QuickCard title="Target Save" desc="Save towards a target with up to 10% return." iconBg="#F59E0B" icon={<QuickIcon />} />
                            <QuickCard title="Remittance" desc="Save towards a target with up to 10%." iconBg="#3B82F6" icon={<QuickIcon />} />
                        </SimpleGrid>
                    </Box>
                </Box>



            </Stack>
        </div>
    )
}


function CardWaves() {
    return (
        <>
            <svg
                viewBox="0 0 378 104"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -6,
                    width: '100%',
                    height: '70%',
                    opacity: 0.24,
                }}
            >
                <path
                    d="M0 74.5C59 39.5 103.5 116 178.5 74.5C253.5 33 282.5 60 378 24.5V104H0V74.5Z"
                    fill="currentColor"
                />
            </svg>

            <svg
                viewBox="0 0 378 104"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -10,
                    width: '100%',
                    height: '60%',
                    opacity: 0.1,
                }}
            >
                <path
                    d="M0 90C58 62 116 105 187 78C258 51 300 62 378 40V104H0V90Z"
                    fill="currentColor"
                />
            </svg>
        </>
    )
}

function QuickIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25.5" cy="25.5" r="25.5" fill="currentColor" opacity="0.2" />
            <path d="M17 26H34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M25.5 17V34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

