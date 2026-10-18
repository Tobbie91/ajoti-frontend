import { useEffect, useState } from 'react'
import { Button, Select, Text } from '@mantine/core'
import { getContributionPaymentPreference, setContributionPaymentPreference, type ContributionPaymentMethod } from '@/utils/api/rosca'

export function ContributionPaymentPreference({ circleId }: { circleId: string }) {
  const [paymentPreference, setPaymentPreference] = useState<ContributionPaymentMethod>('MANUAL')
  const [loaded, setLoaded] = useState(false)
  const [paymentPreferenceSaving, setPaymentPreferenceSaving] = useState(false)
  const [paymentPreferenceMessage, setPaymentPreferenceMessage] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setLoaded(false)
    getContributionPaymentPreference(circleId)
      .then(value => {
        if (value !== 'MANUAL' && value !== 'AUTOMATIC') throw new Error('Unavailable preference')
        if (active) { setPaymentPreference(value); setLoaded(true) }
      })
      .catch(() => { if (active) setPaymentPreferenceMessage('Unable to load payment preference') })
    return () => { active = false }
  }, [circleId])
  return (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <Text fw={600} size="sm" mb="xs">Contribution payment method</Text>
                <Select
                  aria-label="Contribution payment method"
                  value={paymentPreference}
                  onChange={(value) => setPaymentPreference(value === 'AUTOMATIC' ? 'AUTOMATIC' : 'MANUAL')}
                  data={[
                    { value: 'MANUAL', label: 'Manual: I will pay each contribution' },
                    { value: 'AUTOMATIC', label: 'Automatic: deduct from my Ajoti wallet' },
                  ]}
                  allowDeselect={false}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  Automatic deductions use your Ajoti wallet before the contribution cutoff. Keep sufficient funds available.
                </Text>
                <Button mt="sm" disabled={!loaded} loading={paymentPreferenceSaving} onClick={async () => {
                  if (!circleId) return;
                  setPaymentPreferenceSaving(true);
                  setPaymentPreferenceMessage(null);
                  try {
                    const updated = await setContributionPaymentPreference(circleId, paymentPreference);
                    setPaymentPreference(updated);
                    setPaymentPreferenceMessage('Payment preference saved');
                  } catch (error) {
                    setPaymentPreferenceMessage(error instanceof Error ? error.message : 'Unable to save preference');
                  } finally {
                    setPaymentPreferenceSaving(false);
                  }
                }}>Save payment preference</Button>
                {paymentPreferenceMessage && <Text size="sm" mt="xs">{paymentPreferenceMessage}</Text>}
              </div>
  )
}
