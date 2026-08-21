import { ActionIcon, Paper, Stack, Text } from '@mantine/core'
import { IconEye, IconEyeOff, IconLock } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import waveBottom from '@/assets/waveBottom.svg'
import waveSide from '@/assets/waveSide.svg'

interface SummaryCardProps {
  title: string
  amount: string
  gradient: string
  to?: string
  hideable?: boolean
  hidden?: boolean
  onToggleHidden?: () => void
}

export function SummaryCard({
  title,
  amount,
  gradient,
  to = '/transactions',
  hideable = false,
  hidden = false,
  onToggleHidden,
}: SummaryCardProps) {
  const navigate = useNavigate()
  const displayAmount = /\d/.test(amount) ? amount : '-'

  return (
    <Paper
      radius={13.73}
      onClick={() => navigate(to)}
      style={{
        width: '100%',
        height: 206,
        background: gradient,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <Stack gap={6} style={{ padding: 24, position: 'relative', zIndex: 2 }}>
        <div className="flex items-center gap-2">
          <Text fz={18} fw={100} opacity={0.9}>
            {title}
          </Text>
          {hideable && onToggleHidden && (
            <ActionIcon
              variant="subtle"
              aria-label={hidden ? 'Show wallet balance and transactions' : 'Hide wallet balance and transactions'}
              title={hidden ? 'Show wallet balance and transactions' : 'Hide wallet balance and transactions'}
              onClick={(event) => {
                event.stopPropagation()
                onToggleHidden()
              }}
              style={{ color: 'rgba(255,255,255,.9)' }}
            >
              {hidden ? <IconEye size={20} /> : <IconEyeOff size={20} />}
            </ActionIcon>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Text fz={30} fw={600} lh={1}>
            {hidden ? (
              <IconLock size={26} aria-label="Wallet balance hidden" />
            ) : (
              displayAmount
            )}
          </Text>
        </div>
      </Stack>
      <img
        src={waveBottom}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -6.86,
          top: 105,
          bottom: -20,
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <img
        src={waveSide}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 12.58,
          right: -45,
          height: 202.47,
          width: 160.72,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </Paper>
  )
}
