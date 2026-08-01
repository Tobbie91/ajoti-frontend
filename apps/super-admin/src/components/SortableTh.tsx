import { Table, Group, Text } from '@mantine/core'
import { IconArrowsSort, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import type { SortState } from '@/utils/sorting'

// Clickable, sort-indicating table header cell. Styled to match the dark-green
// header row used across superadmin tables (KycApprovals.tsx, SystemAccounts.tsx, etc).
export function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  width,
  align = 'left',
  dark = true,
}: {
  label: string
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  width?: number
  align?: 'left' | 'right' | 'center'
  // Most superadmin tables use a solid dark-green header row (white text).
  // A few (e.g. StaffManagement) use Mantine's default plain header — pass
  // dark={false} there so text stays legible against the light background.
  dark?: boolean
}) {
  const active = sort.key === sortKey
  const textColor = dark ? 'white' : undefined

  return (
    <Table.Th
      style={{ color: textColor, width, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(sortKey)}
    >
      <Group gap={4} wrap="nowrap" justify={align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'}>
        <Text fz="sm" fw={600} c={textColor} span>
          {label}
        </Text>
        {active ? (
          sort.dir === 'asc' ? <IconArrowUp size={13} stroke={2.25} /> : <IconArrowDown size={13} stroke={2.25} />
        ) : (
          <IconArrowsSort size={13} style={{ opacity: 0.55 }} />
        )}
      </Group>
    </Table.Th>
  )
}
