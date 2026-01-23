import { AppShell, Burger, Group, Text, UnstyledButton, SimpleGrid, Paper, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ReactNode } from 'react'

const colors = {
  primary: '#066F5B',
  secondary: '#10B981',
  accentGreen: '#00C853',
  accentRed: '#EE0F0F',
  accentYellow: '#FFE500',
};


interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={600} size="lg">
              Ajoti
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <NavLink label="Home" href="/" />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">

          {/* Wallet Card - Primary to Secondary Gradient */}
          <Paper p="xl" radius="lg" style={{
            background: `linear-gradient(135deg, #1F4037 0%, #99F2C8 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stack gap={0} style={{ zIndex: 2, position: 'relative' }}>
              <Text size="sm" opacity={0.8}>Wallet Balance</Text>
              <Text size="32px" fw={700}>₦0.00</Text>
            </Stack>
            {/* Decorative shapes using 24% and 10% transparency of Primary */}
            <CardWaves />

          </Paper>

          {/* Savings Card - Secondary Color base */}
          <Paper p="xl" radius="lg" style={{
            background: `linear-gradient(135deg, #9EB6E5 0%, #D6E4FF 100%)`,
            color: colors.primary,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stack gap={0} style={{ zIndex: 2, position: 'relative' }}>
              <Text size="sm" fw={500}>My Savings</Text>
              <Text size="32px" fw={700}>₦0.00</Text>
            </Stack>
            <CardWaves />

          </Paper>

          {/* Goals Card - Accent Green base */}
          <Paper p="xl" radius="lg" style={{
            background: `linear-gradient(135deg, #A8D8B9 0%, #DFF3E7 100%)`,
            color: colors.primary,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stack gap={0} style={{ zIndex: 2, position: 'relative' }}>
              <Text size="sm" fw={500}>My Goals</Text>
              <Text size="32px" fw={700}>₦0.00</Text>
            </Stack>
            <CardWaves />

          </Paper>
        </SimpleGrid>

        {children}
      </AppShell.Main>
    </AppShell>
  )
}

interface NavLinkProps {
  label: string
  href: string
}
function CardWaves() {
  return (
    <>
      {/* Big bottom wave */}
      <svg
        viewBox="0 0 378 104"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -6,          // push slightly down so it hugs the rounded corner
          width: '100%',
          height: '70%',       // controls “how tall” the wave feels
          zIndex: 1,
          pointerEvents: 'none',
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.6822 65.6863L3.02749 71.5075C-2.94354 73.8793 -6.86328 79.654 -6.86328 86.0788C-6.86328 94.5066 -0.200881 101.427 8.22083 101.746L378.194 115.79C426.968 117.642 464.051 72.4474 452.71 24.9737L451.096 18.2184C450.828 17.0941 450.692 15.9421 450.692 14.7862C450.692 4.36488 440.191 -2.77987 430.498 1.04553L405.377 10.9587C396.864 14.3183 391.269 22.5406 391.269 31.693C391.269 40.5468 386.029 48.5613 377.918 52.1122L366.327 57.187C361.237 59.4154 355.74 60.5658 350.184 60.5658C341.008 60.5658 332.108 57.4307 324.958 51.68L301.464 32.7843C295.598 28.0667 289.138 24.1417 282.248 21.1101L267.543 14.6402C256.655 9.84913 244.888 7.37499 232.992 7.37499H220.181C205.348 7.37499 190.768 11.2209 177.865 18.5372L101.088 62.0711C86.0578 70.5936 68.1572 72.4714 51.6854 67.2536L43.7961 64.7545C35.2443 62.0455 26.0191 62.3747 17.6822 65.6863Z"
          fill="white"
          fillOpacity="0.30"
        />
      </svg>

      {/* Side shape */}
      <svg
        viewBox="0 0 156.361 202.468"
        preserveAspectRatio="xMaxYMin meet"
        style={{
          position: 'absolute',
          top: 0,
          right: -18,
          height: '100%',
          width: 'auto',
          transform: 'translateX(37%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M49.0755 126.667L12.2309 157.285C1.63114 167.519 -5.52027 183.643 5.59505 193.315C8.30507 195.673 11.3936 197.634 14.6311 199.113C29.3458 205.836 47.1925 200.079 63.3464 200.957L91.1592 202.468C127.622 200.869 156.361 170.842 156.361 134.344V16.9205C156.361 7.57556 148.785 0 139.44 0C138.142 0 136.848 0.149385 135.584 0.445208L129.22 1.93465C101.455 8.43284 79.9512 30.3984 74.0437 58.295L65.6749 97.8143C64.0011 105.718 60.6225 113.162 55.7749 119.625C53.8243 122.226 51.5758 124.59 49.0755 126.667Z"
          fill="rgba(255,255,255,0.3)"
        />
      </svg>


    </>
  )
}






function NavLink({ label, href }: NavLinkProps) {
  return (
    <UnstyledButton
      component="a"
      href={href}
      className="block w-full rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100"
    >
      {label}
    </UnstyledButton>
  )
}
