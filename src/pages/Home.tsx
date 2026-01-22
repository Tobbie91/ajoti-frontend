import { Title, Text, Card, Group, Button, Stack } from '@mantine/core'

import addFunds from "@/assets/AddFunds_default.svg"
import addFundsPressed from "@/assets/AddFunds_press.svg"
import explore from "@/assets/Explore_default.svg"
import explorePressed from "@/assets/Explore_press.svg"
import withdraw from "@/assets/Withdraw_default.svg"
import withdrawPressed from "@/assets/Withdraw_press.svg"
import joinRosca from "@/assets/JoinROSCA_default.svg"
import joinRoscaPressed from "@/assets/JoinROSCA_press.svg"
import IconButton from '@/components'



export function Home() {
  return (
    <div className="mx-auto max-w-4xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Welcome to Ajoti</Title>
          <Text c="dimmed" mt="xs">
            Your fintech application is ready to be built.
          </Text>
        </div>

        <Card withBorder>
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
        </Card>
      <div className= "absolute top-[534px] left-[124px] flex flex-row gap-[40px]"
          // style={{
          //   position: "absolute",
          //   top: "534px",
          //   left: "124px",
          //   gap: "40px",
          // }}
      >
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
        
        {/* <div className="grid gap-4 md:grid-cols-2">
          <Card withBorder>
            <Title order={4} mb="xs">
              Mantine UI
            </Title>
            <Text size="sm" c="dimmed">
              A fully featured React component library with hooks and utilities.
            </Text>
          </Card>

          <Card withBorder>
            <Title order={4} mb="xs">
              Tailwind CSS
            </Title>
            <Text size="sm" c="dimmed">
              Utility-first CSS framework for rapid UI development.
            </Text>
          </Card>
        </div> */}
      </Stack>
    </div>
  )
}
