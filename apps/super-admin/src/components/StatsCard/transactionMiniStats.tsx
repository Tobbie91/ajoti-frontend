import { SimpleGrid, Paper, Text, Stack } from '@mantine/core';

const miniStats = [
  { label: 'Transactions Entries', value: '12,357', active: false },
  { label: 'Pending Transactions', value: '5', active: true },
  { label: 'Failed Transactions', value: '3', active: false },
];

export function TransactionMiniStats() {
  return (
    <SimpleGrid 
      mb="xl"
      cols={{ base: 1, sm: 3 }}
      spacing="xl"
    >
      {miniStats.map((stat) => (
        <Paper
          key={stat.label}
          px="xl"
          py="lg"
          radius="xs"
          withBorder={!stat.active}
          className={stat.active ? 'bg-[#36695C] shadow-md' : 'bg-white shadow-sm'}
        >
          <Stack gap={4}>
            <Text
              size="xl"
              fw={700}
              className={stat.active ? 'text-white' : 'text-black'}
            >
              {stat.value}
            </Text>
            <Text
              size="sm"
              className={stat.active ? 'text-white/90' : 'text-gray-600'}
            >
              {stat.label}
            </Text>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
