import { useEffect, useState } from 'react'
import { Button, Select, Text } from '@mantine/core'
import { getContributionPaymentPreference, setContributionPaymentPreference, type ContributionPaymentMethod } from '@/utils/api/rosca'

export function ContributionPaymentPreference({ circleId }: { circleId: string }) {
  const [paymentPreference, setPaymentPreference] = useState<ContributionPaymentMethod | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [paymentPreferenceSaving, setPaymentPreferenceSaving] = useState(false)
  const [paymentPreferenceMessage, setPaymentPreferenceMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoaded(false)
    setLoading(true)
    setLoadError(false)
    setPaymentPreference(null)
    setPaymentPreferenceMessage(null)
    getContributionPaymentPreference(circleId)
      .then(value => {
        if (value !== 'MANUAL' && value !== 'AUTOMATIC') throw new Error('Unavailable preference')
        if (active) { setPaymentPreference(value); setLoaded(true) }
      })
      .catch(() => { if (active) setLoadError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [circleId, retry])

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <Text fw={600} size="sm" mb="xs">Contribution payment method</Text>
      <Select
        aria-label="Contribution payment method"
        value={paymentPreference}
        placeholder={loading ? 'Loading saved preference…' : loadError ? 'Unavailable' : 'Select a payment method'}
        disabled={!loaded || paymentPreferenceSaving}
        onChange={(value) => { if (value === 'AUTOMATIC' || value === 'MANUAL') setPaymentPreference(value) }}
        data={[
          { value: 'MANUAL', label: 'Manual: I will pay each contribution' },
          { value: 'AUTOMATIC', label: 'Automatic: deduct from my Ajoti wallet' },
        ]}
        allowDeselect={false}
      />
      <Text size="xs" c="dimmed" mt="xs">
        Automatic deductions use your Ajoti wallet before the contribution cutoff. Keep sufficient funds available.
      </Text>
      {loading && <Text role="status" size="sm" mt="xs">Loading saved preference…</Text>}
      {loadError && <Text role="alert" size="sm" c="red" mt="xs">Unable to load payment preference. <button type="button" className="font-semibold underline" onClick={() => setRetry(value => value + 1)}>Try again</button></Text>}
      <Button mt="sm" disabled={!loaded || !paymentPreference || paymentPreferenceSaving} loading={paymentPreferenceSaving} onClick={async () => {
        if (!circleId || !loaded || !paymentPreference) return
        setPaymentPreferenceSaving(true)
        setPaymentPreferenceMessage(null)
        try {
          const updated = await setContributionPaymentPreference(circleId, paymentPreference)
          if (updated !== 'MANUAL' && updated !== 'AUTOMATIC') throw new Error('The server returned an invalid payment preference.')
          setPaymentPreference(updated)
          setPaymentPreferenceMessage('Payment preference saved')
        } catch (error) {
          setPaymentPreferenceMessage(error instanceof Error ? error.message : 'Unable to save preference')
        } finally {
          setPaymentPreferenceSaving(false)
        }
      }}>Save payment preference</Button>
      {paymentPreferenceMessage && <Text role={paymentPreferenceMessage === 'Payment preference saved' ? 'status' : 'alert'} c={paymentPreferenceMessage === 'Payment preference saved' ? 'teal' : 'red'} size="sm" mt="xs">{paymentPreferenceMessage}</Text>}
    </div>
  )
}
