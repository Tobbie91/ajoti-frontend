import { Paper, Stack, Text, Group, UnstyledButton, Box } from '@mantine/core'

type Props = {
  code: string          // NGN / USD / GBP
  symbol: string        // ₦ / $ / £
  amount: string        // "0.00"
  active?: boolean
  onClick?: () => void
  iconSrc?: string
}

export function CurrencyCard({
  code,
  symbol,
  amount,
  active = false,
  onClick,
  iconSrc,
}: Props) {
  return (
    <UnstyledButton onClick={onClick} style={{ width: '100%' }}>
      <Paper
        radius={13.73}
        style={{
          height: 120,
          padding: 16,
          background: '#ffffff',
          position: 'relative',
          cursor: 'pointer',
          transition: 'none', // match SummaryCard (instant)
          border: active
            ? '1.5px solid #9CB8B0'
            : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Stack gap={10}>
          {/* -------- top row -------- */}
          <Group gap={10} align="center">
            {iconSrc ? (
              <img
                src={iconSrc}
                alt=""
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <Box
                w={28}
                h={28}
                style={{
                  borderRadius: 999,
                  background: '#EEF2F1',
                }}
              />
            )}

            <Text fz={14} fw={500}>
              {code}
            </Text>
          </Group>

          {/* -------- amount -------- */}
          <Text fz={24} fw={600} lh={1}>
            {symbol}
            {amount}
          </Text>


        </Stack>

        {/* -------- active indicator (subtle, SummaryCard-style) -------- */}
        {active && (
          <Box
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#9CB8B0',
            }}
          />
        )}
      </Paper>
    </UnstyledButton>
  )
}
