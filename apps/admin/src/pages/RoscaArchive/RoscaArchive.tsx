import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Group,
  Loader,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { IconArrowLeft, IconArchive, IconSearch } from '@tabler/icons-react'
import { listAllRoscaCircles, type RoscaCircle } from '@/utils/api'

const PRIMARY = '#0b6b55'
const PAGE_SIZE = 10

export function RoscaArchive() {
  const navigate = useNavigate()
  const [circles, setCircles] = useState<RoscaCircle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    listAllRoscaCircles()
      .then((res) => {
        const all = Array.isArray(res)
          ? res
          : ((res as Record<string, unknown>)?.data ??
              (res as Record<string, unknown>)?.circles ?? []) as RoscaCircle[]
        setCircles(
          all.filter((circle) => (circle.status ?? '').toUpperCase() === 'CANCELLED'),
        )
      })
      .catch((err) => console.error('Failed to load archived ROSCA circles:', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => circles.filter((circle) =>
      (circle.name ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
    [circles, search],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 300 }}>
        <Loader size={40} color={PRIMARY} />
        <Text fz="sm" c="dimmed">Loading archive...</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <Group gap="sm">
          <Button
            variant="subtle"
            color="gray"
            px="xs"
            onClick={() => navigate('/rosca/groups')}
          >
            <IconArrowLeft size={18} />
          </Button>
          <div>
            <Group gap={8}>
              <IconArchive size={20} color="#6b7280" />
              <Text fz={22} fw={700}>Group Archive</Text>
            </Group>
            <Text fz="sm" c="dimmed">
              Cancelled groups are kept here for reference and no longer appear in the main group list.
            </Text>
          </div>
        </Group>
      </Group>

      <TextInput
        label="Search archive"
        placeholder="Search cancelled groups..."
        leftSection={<IconSearch size={15} stroke={1.5} color="#868e96" />}
        radius="md"
        size="sm"
        value={search}
        onChange={(event) => {
          setSearch(event.currentTarget.value)
          setPage(1)
        }}
        style={{ maxWidth: 520 }}
      />

      <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
        <div style={{ overflowX: 'auto' }}>
          <Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 700 }}>
            <Table.Thead>
              <Table.Tr style={{ background: '#495057' }}>
                <Table.Th style={{ color: 'white' }}>Group Name</Table.Th>
                <Table.Th style={{ color: 'white' }}>Members</Table.Th>
                <Table.Th style={{ color: 'white' }}>Contribution</Table.Th>
                <Table.Th style={{ color: 'white' }}>Frequency</Table.Th>
                <Table.Th style={{ color: 'white' }}>Status</Table.Th>
                <Table.Th style={{ color: 'white' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginated.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="xl" fz="sm">
                      {circles.length === 0 ? 'No cancelled groups in the archive.' : 'No archived groups match your search.'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : paginated.map((circle) => {
                const filled = circle.filledSlots ?? 0
                const total = circle.maxSlots ?? circle.totalSlots ?? 0
                const amount = Number(circle.contributionAmount ?? 0) / 100
                return (
                  <Table.Tr key={circle.id}>
                    <Table.Td><Text fw={600} fz="sm">{circle.name || 'Unnamed'}</Text></Table.Td>
                    <Table.Td><Text fz="sm">{filled}/{total}</Text></Table.Td>
                    <Table.Td>
                      <Text fz="sm">
                        ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </Text>
                    </Table.Td>
                    <Table.Td><Text fz="sm">{circle.frequency || '-'}</Text></Table.Td>
                    <Table.Td>
                      <Badge color="gray" variant="light" size="sm">Cancelled</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        size="xs"
                        color="gray"
                        onClick={() => navigate(`/rosca/groups/${circle.id}`)}
                      >
                        View
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </div>

        <Group justify="space-between" align="center" px="lg" py="md" style={{ borderTop: '1px solid #e9ecef' }}>
          <Text fz="xs" c="dimmed">
            Showing {filtered.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} archived groups
          </Text>
          <Pagination
            total={totalPages}
            value={Math.min(page, totalPages)}
            onChange={setPage}
            size="sm"
            radius="md"
            color="gray"
          />
        </Group>
      </Paper>
    </Stack>
  )
}
