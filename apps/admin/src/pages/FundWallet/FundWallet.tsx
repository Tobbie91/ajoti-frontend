import { useEffect, useState } from 'react'
import { Text, Skeleton, CopyButton, ActionIcon, Tooltip, Button } from '@mantine/core'
import { IconArrowLeft, IconCopy, IconCheck, IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getVirtualAccount, type VirtualAccount } from '@/utils/api'

export function FundWallet() {
  const navigate = useNavigate()
  const [account, setAccount] = useState<VirtualAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchAccount() {
    setLoading(true)
    setError(null)
    try {
      const va = await getVirtualAccount()
      setAccount(va)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAccount() }, [])

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={() => navigate('/my-wallet')}
        className="mb-6 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} />
        Back to wallet
      </button>

      <div className="mb-6">
        <Text fw={700} className="text-[24px] text-[#0F172A]">Fund Wallet</Text>
        <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">Transfer to your dedicated account to top up your NGN wallet</Text>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <IconAlertCircle size={16} color="#EF4444" />
            <Text fw={500} className="text-[14px] text-red-600">Could not load account details</Text>
          </div>
          <Text fw={400} className="mb-4 text-[13px] text-red-500">{error}</Text>
          {/BVN/i.test(error) && /verif/i.test(error) && (
            <div className="mb-4">
              <Text size="sm" mb="sm">Your BVN must be verified before this account can be created. Review your verification status. If it already shows approved, contact support to resolve the account setup.</Text>
              <div className="flex flex-wrap gap-2">
                <Button color="teal" onClick={() => navigate('/kyc')}>Review verification</Button>
                <Button variant="outline" color="teal" onClick={() => navigate('/support')}>Contact support</Button>
              </div>
            </div>
          )}
          <button
            onClick={fetchAccount}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-[13px] font-medium text-red-700 hover:bg-red-200"
          >
            <IconRefresh size={14} />
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-4 text-[13px] uppercase tracking-wide text-[#9CA3AF]">Your Dedicated Account</Text>

            <div className="mb-4">
              <Text fw={400} className="mb-1 text-[12px] text-[#6B7280]">Bank Name</Text>
              {loading ? (
                <Skeleton height={20} width={160} radius="sm" />
              ) : (
                <div className="flex items-center gap-2">
                  <Text fw={600} className="text-[15px] text-[#0F172A]">{account?.bankName}</Text>
                  <CopyButton value={account?.bankName ?? ''}>{({ copied, copy }) => <ActionIcon aria-label="Copy bank name" onClick={copy} variant="light" color={copied ? 'teal' : 'gray'}><IconCopy size={14} /></ActionIcon>}</CopyButton>
                </div>
              )}
            </div>

            <div className="mb-4">
              <Text fw={400} className="mb-1 text-[12px] text-[#6B7280]">Account Number</Text>
              {loading ? (
                <Skeleton height={36} width={200} radius="sm" />
              ) : (
                <div className="flex items-center gap-3">
                  <Text fw={700} className="font-mono text-[28px] tracking-widest text-[#0F172A]">
                    {account?.accountNumber}
                  </Text>
                  <CopyButton value={account?.accountNumber ?? ''} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
                        <ActionIcon
                          onClick={copy}
                          aria-label="Copy account number"
                          variant="light"
                          color={copied ? 'teal' : 'gray'}
                          size="sm"
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </div>
              )}
            </div>

            <div>
              <Text fw={400} className="mb-1 text-[12px] text-[#6B7280]">Account Name</Text>
              {loading ? (
                <Skeleton height={20} width={220} radius="sm" />
              ) : (
                <div className="flex items-center gap-2">
                  <Text fw={500} className="text-[14px] text-[#374151]">{account?.accountName}</Text>
                  <CopyButton value={account?.accountName ?? ''} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
                        <ActionIcon
                          onClick={copy}
                          aria-label="Copy account name"
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          size="xs"
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </div>
              )}
            </div>
          </div>

          {!loading && account && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
              <Text fw={600} size="sm" mb={6}>Can't find {account.bankName} in your bank app?</Text>
              <Text size="sm" c="dimmed">Search for the bank name shown above. If it is missing, contact Ajoti support with the name of the bank you are sending from so we can help resolve it.</Text>
              <Button color="teal" variant="light" mt="sm" onClick={() => navigate('/support')}>Get funding help</Button>
            </div>
          )}

          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
            <Text fw={600} className="mb-3 text-[13px] text-[#374151]">How it works</Text>
            <div className="flex flex-col gap-2.5">
              {[
                'Transfer any amount from your bank app to the account above',
                'Your Ajoti wallet is credited automatically within minutes',
                'This account is unique to you - transfers always go to your wallet',
                'To pay a group contribution, open the joined group and choose Make a contribution. Funding your wallet does not submit a group payment.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#02A36E] text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                  <Text fw={400} className="text-[13px] text-[#6B7280]">{step}</Text>
                </div>
              ))}
            </div>
          </div>

          <Text fw={400} className="text-center text-[11px] text-[#9CA3AF]">
            Secured · Funds are reflected within 1–5 minutes
          </Text>
        </div>
      )}
    </div>
  )
}
