/** Exact integer-kobo arithmetic. Unsafe numeric inputs and malformed amounts are unavailable. */
export function kobo(value: unknown): bigint | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? BigInt(value) : null
  return typeof value === 'string' && /^-?\d+$/.test(value) ? BigInt(value) : null
}
export function formatKobo(value: unknown): string {
  const amount = kobo(value)
  if (amount === null) return 'Unavailable'
  const absolute = amount < 0n ? -amount : amount
  return `${amount < 0n ? '-' : ''}₦${(absolute / 100n).toLocaleString('en-NG')}.${String(absolute % 100n).padStart(2, '0')}`
}
export function sumKobo(values: unknown[]): bigint | null {
  let sum = 0n
  for (const value of values) { const amount = kobo(value); if (amount === null) return null; sum += amount }
  return sum
}
export function koboPercent(collected: unknown, expected: unknown): number | null {
  const col = kobo(collected), exp = kobo(expected)
  return col === null || exp === null || exp <= 0n ? null : Number(col * 10000n / exp) / 100
}
