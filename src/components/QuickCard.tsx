import { Paper, Text, Stack, Box } from '@mantine/core';

export function QuickCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper
      radius={14}
      style={{
        width: 188,              // ⬅ exact card width
        height: 195,             // ⬅ exact card height
        padding: 20,
        background: '#FFFFFF',
        boxShadow: '0px 6px 16px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'flex-start',
      }}
    >
      <Stack gap={10}>
        {/* Icon container */}
        <Box
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>

        {/* Title */}
        <Text fw={600} fz={14}>
          {title}
        </Text>

        {/* Description */}
        <Text
          fz={12}
          fw={400}
          lh={1.3}
          style={{
            color: '#000000',
          }}
        >
          {desc}
        </Text>
      </Stack>
    </Paper>
  );
}
