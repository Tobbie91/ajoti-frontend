import { reportTable, reportMoney, reportValue, type ReportField, type ReportTable } from './report-export'

// Explicit field lists: never export provider payloads, credentials, or raw metadata.
const fields = {
  wallets: [['Name', 'user.firstName'], ['Surname', 'user.lastName'], ['Email', 'user.email'], ['Wallet ID', 'walletId'], ['Status', 'status'], ['Currency', 'currency'], ['Balance (NGN)', 'balanceKobo', 'money'], ['Reserved (NGN)', 'reservedKobo', 'money'], ['Available (NGN)', 'availableKobo', 'money'], ['Last activity', 'lastActivityAt', 'date']],
  ledger: [['Date', 'createdAt', 'date'], ['Reference', 'reference'], ['Entry', 'entryType'], ['Movement', 'movementType'], ['Source', 'sourceType'], ['Amount (NGN)', 'amount', 'money'], ['Balance after (NGN)', 'balanceAfter', 'money'], ['Email', 'wallet.user.email']],
  loans: [['ID', 'id'], ['First name', 'user.firstName'], ['Last name', 'user.lastName'], ['Email', 'user.email'], ['Circle', 'circle.name'], ['Advance (NGN)', 'loanAmount', 'money'], ['Fee (NGN)', 'companyFee', 'money'], ['Gross obligation (NGN)', 'grossAmount', 'money'], ['Status', 'status'], ['Stranded', 'stranded'], ['Applied', 'createdAt', 'date'], ['Repaid', 'repaidAt', 'date']],
  debts: [['ID', 'id'], ['First name', 'user.firstName'], ['Last name', 'user.lastName'], ['Email', 'user.email'], ['Circle', 'circleName'], ['Cycle', 'cycleNumber'], ['Category', 'categoryLabel'], ['Outstanding (NGN)', 'outstandingTotal', 'money'], ['Status', 'status'], ['Created', 'createdAt', 'date'], ['Settled', 'settledAt', 'date']],
  circles: [['Name', 'name'], ['Status', 'status'], ['Per-slot contribution (NGN)', 'contributionAmount', 'money'], ['Frequency', 'frequency'], ['Cycle', 'currentCycle'], ['Duration', 'durationCycles'], ['Members', 'memberCount'], ['Admin email', 'admin.email']],
  defaulters: [['User ID', 'userId'], ['First name', 'user.firstName'], ['Last name', 'user.lastName'], ['Email', 'user.email'], ['Circle', 'circle.name'], ['Circle ID', 'circleId'], ['Owed (NGN)', 'amountOwedKobo', 'money'], ['Missed cycles', 'missedCycles']],
  trust: [['First name', 'user.firstName'], ['Last name', 'user.lastName'], ['Email', 'user.email'], ['Display score', 'displayScore'], ['Trust score', 'trustScore'], ['Expected payments', 'totalExpectedPayments'], ['On time', 'totalOnTimePayments'], ['Late', 'totalLatePayments'], ['Missed', 'totalMissedPayments'], ['Defaults', 'totalDefaults'], ['Updated', 'lastUpdated', 'date']],
  kyc: [['First name', 'user.firstName'], ['Last name', 'user.lastName'], ['Email', 'user.email'], ['Level', 'kycLevel'], ['Status', 'status'], ['Step', 'step'], ['Submitted', 'submittedAt', 'date'], ['Reviewed', 'reviewedAt', 'date'], ['Issue type', 'issueType']],
  savings: [['Name', 'name'], ['Owner email', 'owner.email'], ['Type', 'type'], ['Status', 'status'], ['Currency', 'currency'], ['Members', 'memberCount'], ['Total saved (NGN)', 'totalSavedKobo', 'money'], ['Effective target (NGN)', 'effectiveTargetAmountKobo', 'money'], ['Maturity', 'maturityDate', 'date'], ['Investment lifecycle', 'investment.lifecycleStatus']],
  support: [['Ticket ID', 'id'], ['Subject', 'subject'], ['Category', 'category'], ['Status', 'status'], ['Customer email', 'user.email'], ['Assigned first name', 'assignedTo.firstName'], ['Assigned last name', 'assignedTo.lastName'], ['Messages', '_count.messages'], ['Opened', 'createdAt', 'date'], ['Updated', 'updatedAt', 'date']],
  audit: [['Date', 'createdAt', 'date'], ['Actor ID', 'actorId'], ['Actor', 'actorLabel'], ['Actor type', 'actorType'], ['Action', 'action'], ['Entity type', 'entityType'], ['Entity ID', 'entityId'], ['Reason', 'reason']],
  staff: [['First name', 'firstName'], ['Last name', 'lastName'], ['Email', 'email'], ['Staff role', 'staffRole'], ['Status', 'status'], ['Created', 'createdAt', 'date']],
  closures: [['Request ID', 'id'], ['First name', 'user.firstName'], ['Last name', 'user.lastName'], ['Email', 'user.email'], ['Status', 'status'], ['Provider cleanup', 'providerCleanupStatus'], ['Empty account', 'isEmptyAccount'], ['Reason', 'reason'], ['Requested', 'requestedAt', 'date']],
  accounts: [['Account type', 'type'], ['Wallet ID', 'walletId'], ['Status', 'status'], ['Balance (NGN)', 'balanceKobo', 'money'], ['Provider environment', 'providerAccount.environment'], ['Provider status', 'providerAccount.status'], ['Created', 'createdAt', 'date']],
  expenses: [['Date', 'incurredAt', 'date'], ['Description', 'description'], ['Category', 'category.name'], ['Amount (NGN)', 'amountKobo', 'money'], ['Payment method', 'paymentMethod'], ['Reference', 'externalReference'], ['Source', 'source.name'], ['Voided', 'voidedAt', 'date']],
  campaigns: [['Source', 'sourceName'], ['Tracking code', 'trackingCode'], ['Spend (NGN)', 'spendKobo', 'money'], ['Registrations', 'registrations'], ['Verified registrations', 'verifiedRegistrations'], ['Registration CAC (NGN)', 'registrationCacKobo', 'money'], ['Verified CAC (NGN)', 'verifiedCacKobo', 'money']],
} satisfies Record<string, readonly ReportField[]>
export function buildReport(kind: keyof typeof fields, rows: readonly unknown[], title: string): ReportTable { return reportTable(title, rows, fields[kind]) }
export function metricReport(title: string, value: unknown, selected: readonly ReportField[]): ReportTable {
  const table = reportTable(title, [value], selected)
  return { title, columns: ['Metric', 'Value'], rows: table.columns.map((label, index) => [label, table.rows[0][index]]) }
}
export function settingsReport(title: string, value: unknown): ReportTable {
  if (!value || typeof value !== 'object') throw new Error('Settings are not available yet.')
  return { title, columns: ['Setting', 'Saved value', 'Updated by', 'Updated at'], rows: Object.entries(value).filter(([key, item]) => key !== 'meta' && (typeof item === 'number' || typeof item === 'boolean')).map(([key, item]) => {
    const meta = (value as { meta?: Record<string, { updatedByLabel?: string; updatedAt?: string }> }).meta?.[key]
    const label = key.replace(/([A-Z])/g, ' $1').replace(/Kobo$/, '(NGN)').replace(/Bps$/, '(basis points)')
    return [label, key.endsWith('Kobo') ? reportMoney(item) : reportValue(item), meta?.updatedByLabel ?? '—', meta?.updatedAt ?? '—']
  }) }
}
