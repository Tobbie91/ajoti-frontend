import { useRef, useState } from 'react'
import { Alert, Button, Card, Group, Text } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'
import { downloadReportCsv, downloadReportPdf, filterSummary, REPORT_LIMIT, type ReportFilters, type ReportTable } from '@/utils/report-export'

type Props = { title: string; filename: string; load: () => ReportTable[] | Promise<ReportTable[]>; filters?: ReportFilters; disabled?: boolean; scope?: string; allowed?: boolean }
export function ReportDownloads({ title, filename, load, filters = {}, disabled = false, scope = 'All matching records across every page.', allowed = true }: Props) {
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const locked = useRef(false)
  if (!allowed) return null
  async function download(format: 'csv' | 'pdf') {
    if (locked.current) return
    locked.current = true; setBusy(format); setError(null)
    const summary = filterSummary(filters)
    try {
      const tables = await load()
      const count = tables.reduce((sum, table) => sum + table.rows.length, 0)
      if (!count) throw new Error('No records match the selected filters.')
      if (count > REPORT_LIMIT) throw new Error('Narrow your filters to 25,000 records or fewer.')
      const name = `ajoti-${filename}-${new Date().toISOString().slice(0, 10)}`
      if (format === 'csv') downloadReportCsv(tables, name)
      else await downloadReportPdf(tables, title, `${scope} ${summary}`, name)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to download this report.') }
    finally { locked.current = false; setBusy(null) }
  }
  return <Card withBorder radius="md" p="md" mb="md" style={{ background: '#f4f8ef', borderColor: '#d9e8cf' }}>
    <Group justify="space-between" align="center" wrap="wrap">
      <div><Text fw={700} c="#0b5140">Download {title.toLowerCase()}</Text><Text size="sm" c="dimmed">{scope}</Text><Text size="xs" c="dimmed">PDF with Ajoti logo and colours · CSV for spreadsheets · Up to 25,000 records</Text></div>
      <Group gap="sm"><Button color="#0b5140" variant="outline" leftSection={<IconDownload size={16} />} loading={busy === 'csv'} disabled={disabled || busy !== null} onClick={() => download('csv')}>Download CSV</Button><Button color="#0b5140" leftSection={<IconDownload size={16} />} loading={busy === 'pdf'} disabled={disabled || busy !== null} onClick={() => download('pdf')}>Download PDF</Button></Group>
    </Group>
    {error && <Alert color="red" role="alert" mt="sm">{error}</Alert>}
  </Card>
}
