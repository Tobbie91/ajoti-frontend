export type ReportTable = { title: string; columns: string[]; rows: string[][] }
export type ReportField = readonly [label: string, path: string, format?: 'money' | 'date']
export type ReportFilters = Record<string, string | number | boolean | null | undefined>
export const REPORT_LIMIT = 25000

export function reportValue(value: unknown): string {
  return value == null ? '—' : typeof value === 'string' || typeof value === 'number' ? String(value) : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : '—'
}
export function reportMoney(value: unknown): string {
  if (!((typeof value === 'string' && /^-?\d+$/.test(value)) || (typeof value === 'number' && Number.isSafeInteger(value)))) return 'Unavailable'
  const amount = BigInt(value), absolute = amount < 0n ? -amount : amount
  return `${amount < 0n ? '-' : ''}${(absolute / 100n).toLocaleString('en-NG')}.${String(absolute % 100n).padStart(2, '0')}`
}
export function reportTable(title: string, items: readonly unknown[], fields: readonly ReportField[]): ReportTable {
  return { title, columns: fields.map(field => field[0]), rows: items.map(item => fields.map(([, path, format]) => {
    const value = path.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, item)
    if (format === 'money') return reportMoney(value)
    if (format === 'date' && value) return Number.isFinite(Date.parse(String(value))) ? new Date(String(value)).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' }) + ' WAT' : 'Unavailable'
    return reportValue(value)
  })) }
}
export function filterSummary(filters: ReportFilters = {}) {
  return Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== false).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'All records'
}
export async function collectReportPages<T>(fetchPage: (page: number, limit: number) => Promise<{ data: T[]; meta: { total: number; totalPages: number } }>): Promise<T[]> {
  const rows: T[] = [], seen = new Set<string>()
  let total: number | undefined
  for (let page = 1; page <= REPORT_LIMIT; page++) {
    const response = await fetchPage(page, 100)
    if (!Array.isArray(response.data) || !response.meta || !Number.isSafeInteger(response.meta.total) || response.meta.total < 0 || !Number.isSafeInteger(response.meta.totalPages) || response.meta.totalPages < 0) throw new Error('The report response is incomplete. Please retry.')
    if (response.meta.total > REPORT_LIMIT) throw new Error('Narrow your filters to 25,000 records or fewer.')
    if (total !== undefined && total !== response.meta.total) throw new Error('The results changed during export. Please retry.')
    total = response.meta.total
    for (const row of response.data) {
      const record = row as Record<string, unknown>
      const id = record?.id ?? record?.walletId ?? (record?.userId == null ? undefined : `${record.userId}:${record.circleId ?? ''}`)
      if (id != null) {
        if (seen.has(String(id))) throw new Error('The results changed during export. Please retry.')
        seen.add(String(id))
      }
      rows.push(row)
    }
    if (rows.length > REPORT_LIMIT) throw new Error('Narrow your filters to 25,000 records or fewer.')
    if (page >= response.meta.totalPages) {
      if (rows.length !== total) throw new Error('The report could not load every matching record. Please retry.')
      return rows
    }
    if (!response.data.length) throw new Error('The report could not load every matching record. Please retry.')
  }
  throw new Error('Narrow your filters and retry.')
}
export function csvCell(value: string) {
  const safe = /^\s*[=+@-]|^[\t\r\n]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}
export function downloadReportCsv(tables: ReportTable[], filename: string) {
  const lines = tables.flatMap(table => tables.length === 1 ? [table.columns, ...table.rows] : [[table.title], table.columns, ...table.rows, []])
  const csv = '\uFEFF' + lines.map(row => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  if (blob.size > 10 * 1024 * 1024) throw new Error('Narrow your filters to keep the report below 10 MB.')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `${filename}.csv`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function downloadReportPdf(tables: ReportTable[], title: string, filters: string, filename: string) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const response = await fetch('/favicon.png')
  if (!response.ok) throw new Error('Unable to load the Ajoti logo. Please retry.')
  const logo = await createImageBitmap(await response.blob()), canvas = document.createElement('canvas')
  canvas.width = logo.width; canvas.height = logo.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to prepare the report logo.')
  context.drawImage(logo, 0, 0); logo.close()
  const logoData = canvas.toDataURL('image/png'), doc = new jsPDF({ orientation: 'landscape' })
  const generated = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })
  const summary: string[] = doc.splitTextToSize(filters.slice(0, 1800), 265)
  const top = 54 + summary.length * 4
  const header = () => {
    doc.setFillColor(255, 250, 234); doc.rect(0, 0, 297, 25, 'F')
    doc.addImage(logoData, 'PNG', 14, 5, 15, 15)
    doc.setTextColor(11, 81, 64); doc.setFontSize(22); doc.text('ajoti', 33, 16)
    doc.setFontSize(15); doc.text(title.slice(0, 100), 14, 35)
    doc.setFontSize(8); doc.text(`Generated ${generated} WAT | ${tables.reduce((sum, table) => sum + table.rows.length, 0).toLocaleString()} records`, 14, 42)
    doc.text(summary, 14, 49)
    doc.setDrawColor(223, 231, 220); doc.line(14, 195, 283, 195)
    doc.text('Ajoti | Confidential - staff use only', 14, 201)
  }
  for (let index = 0; index < tables.length; index++) {
    if (index) doc.addPage()
    const table = tables[index]
    autoTable(doc, {
      head: [table.columns], body: table.rows,
      margin: { top: top + (tables.length > 1 ? 8 : 0), bottom: 18, left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', textColor: [24, 54, 45] },
      headStyles: { fillColor: [11, 81, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 247, 240] },
      didDrawPage: () => { header(); if (tables.length > 1) { doc.setFontSize(10); doc.text(table.title, 14, top + 3) } },
    })
  }
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); doc.setFontSize(8)
    doc.text(`Page ${page} of ${doc.getNumberOfPages()}`, 283, 201, { align: 'right' })
  }
  doc.save(`${filename}.pdf`)
}
