export interface PayoutSettlementDisplay {
  label: string
  color: string
}

/** Display the backend's member-safe settlement state without inferring payment from a stored amount. */
export function payoutSettlementDisplay(
  settlementStatus: string | null | undefined,
  amountPaidOut: string | null | undefined,
  fallbackStatus?: string | null,
): PayoutSettlementDisplay {
  const status = (settlementStatus ?? fallbackStatus ?? '').toUpperCase()

  if (status === 'FAILED') return { label: 'Failed', color: 'red' }
  if (status === 'UNDER_REVIEW') return { label: 'Under review', color: 'yellow' }
  if (status === 'PENDING') return { label: 'Pending', color: 'yellow' }
  if (status === 'PROCESSING') return { label: 'Processing', color: 'yellow' }
  if (status === 'COMPLETED') {
    return amountPaidOut == null
      ? { label: 'Not settled', color: 'yellow' }
      : { label: 'Settled', color: 'teal' }
  }
  if (amountPaidOut != null && status === '') return { label: 'Settled', color: 'teal' }
  if (status === 'UPCOMING') return { label: 'Upcoming', color: 'gray' }
  if (!status) return { label: 'Not settled', color: 'gray' }

  return { label: status.charAt(0) + status.slice(1).toLowerCase().replaceAll('_', ' '), color: 'gray' }
}
