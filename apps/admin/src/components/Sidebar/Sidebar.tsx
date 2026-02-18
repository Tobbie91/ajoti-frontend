import { useState } from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { NavLink, Stack, Box, Divider } from '@mantine/core'
import {
  IconLayoutDashboard,
  IconTopologyRing,
  IconWallet,
  IconCash,
  IconUserCircle,
} from '@tabler/icons-react'

const roscaChildren = [
  { label: 'Groups', path: '/rosca/groups' },
]

export function Sidebar() {
  const location = useLocation()
  const [roscaOpened, setRoscaOpened] = useState(
    location.pathname.startsWith('/rosca'),
  )

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Nav links */}
      <Stack gap={2} px="xs" py="md" style={{ flex: 1 }}>
        <NavLink
          component={RouterNavLink}
          to="/dashboard"
          label="Dashboard"
          leftSection={<IconLayoutDashboard size={19} stroke={1.5} />}
          active={location.pathname === '/dashboard'}
          styles={{
            root: {
              borderRadius: 8,
              fontWeight: location.pathname === '/dashboard' ? 600 : 400,
            },
          }}
        />

        <NavLink
          label="ROSCA"
          leftSection={<IconTopologyRing size={19} stroke={1.5} />}
          childrenOffset={24}
          opened={roscaOpened}
          onChange={() => setRoscaOpened((o) => !o)}
          active={location.pathname.startsWith('/rosca')}
          styles={{ root: { borderRadius: 8 } }}
        >
          {roscaChildren.map((child) => (
            <NavLink
              key={child.path}
              component={RouterNavLink}
              to={child.path}
              label={child.label}
              active={location.pathname === child.path}
              styles={{ root: { borderRadius: 8 } }}
            />
          ))}
        </NavLink>

        <NavLink
          component={RouterNavLink}
          to="/my-wallet"
          label="My Wallet"
          leftSection={<IconWallet size={19} stroke={1.5} />}
          active={isActive('/my-wallet')}
          styles={{
            root: {
              borderRadius: 8,
              fontWeight: isActive('/my-wallet') ? 600 : 400,
            },
          }}
        />

        <NavLink
          component={RouterNavLink}
          to="/loans"
          label="Loans"
          leftSection={<IconCash size={19} stroke={1.5} />}
          active={isActive('/loans')}
          styles={{
            root: {
              borderRadius: 8,
              fontWeight: isActive('/loans') ? 600 : 400,
            },
          }}
        />

        <Divider my="xs" />

        <NavLink
          component={RouterNavLink}
          to="/my-profile"
          label="My Profile"
          leftSection={<IconUserCircle size={19} stroke={1.5} />}
          active={isActive('/my-profile')}
          styles={{
            root: {
              borderRadius: 8,
              fontWeight: isActive('/my-profile') ? 600 : 400,
            },
          }}
        />
      </Stack>
    </Box>
  )
}
