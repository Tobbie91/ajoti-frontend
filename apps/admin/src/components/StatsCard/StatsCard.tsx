import { Paper, Text, Box } from '@mantine/core'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  /** Renders the green decorative bar graphic on the right (like card 1 in the screenshot) */
  withBar?: boolean
}

const PRIMARY = '#0b6b55'

export function StatsCard({ title, value, subtitle, withBar = false }: StatsCardProps) {
  return (
    <Paper
      p="lg"
      radius="md"
      style={{
        background: 'white',
        border: '1px solid #e9ecef',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 110,
      }}
    >
      {/* Decorative green bar — right side (matches screenshot card 1) */}
      {withBar && (
        <Box
          style={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 5,
            height: 70,
          }}
        >
          {[40, 60, 50, 100, 70].map((h, i) => (
            <Box
              key={i}
              style={{
                width: 10,
                height: `${h}%`,
                background: i === 3 ? PRIMARY : `${PRIMARY}55`,
                borderRadius: 3,
              }}
            />
          ))}
        </Box>
      )}

      <Text fz="sm" c="dimmed" mb={6}>
        {title}
      </Text>

      <Text
        fz={32}
        fw={700}
        lh={1}
        mb={4}
        style={{ color: '#212529' }}
      >
        {value}
      </Text>

      {subtitle && (
        <Text fz="sm" c="dimmed">
          {subtitle}
        </Text>
      )}
    </Paper>
  )
}
