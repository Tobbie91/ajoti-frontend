import { useState } from 'react'
import { Alert, Button, Card, Group, Stack, Text, TextInput, Textarea, Title } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { getUserDetail } from '@/utils/api'
import { updateUserContactDetails } from '@/utils/contact-details-api'

export function ContactDetailsCorrection() {
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')
  const [reason, setReason] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadUser() {
    if (!userId.trim()) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const detail = await getUserDetail(userId.trim())
      const user = detail.user as Record<string, unknown>
      const kyc = (user.kyc ?? {}) as Record<string, unknown>
      setName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim())
      setEmail((user.email as string) ?? '')
      setPhone((user.phone as string) ?? '')
      setAddress((kyc.address as string) ?? '')
      setCity((kyc.city as string) ?? '')
      setState((kyc.state as string) ?? '')
      setLga((kyc.lga as string) ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load user')
    } finally { setLoading(false) }
  }

  async function save() {
    if (!userId.trim()) return setError('Load a user first.')
    if (reason.trim().length < 5) return setError('Add the support/verification reason before saving.')
    setSaving(true); setError(''); setSuccess('')
    try {
      await updateUserContactDetails(userId.trim(), {
        email: email.trim(), phone: phone.trim(), address: address.trim(), city: city.trim(), state: state.trim(), lga: lga.trim(), reason: reason.trim(),
      })
      setSuccess('Contact details updated and recorded in the audit trail.')
      setReason('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update contact details')
    } finally { setSaving(false) }
  }

  return (
    <Stack gap="lg" maw={760} mx="auto">
      <div>
        <Title order={2}>Contact Detail Correction</Title>
        <Text c="dimmed" fz="sm" mt={4}>For verified support requests only. Every change requires a reason and is audited.</Text>
      </div>

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group align="flex-end">
            <TextInput label="User ID" placeholder="Paste the user ID" value={userId} onChange={(e) => setUserId(e.currentTarget.value)} style={{ flex: 1 }} />
            <Button onClick={loadUser} loading={loading}>Load user</Button>
          </Group>
          {name && <Text fw={600}>{name}</Text>}
          {error && <Alert color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}
          {success && <Alert color="green" icon={<IconCheck size={16} />}>{success}</Alert>}

          {name && (
            <>
              <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
              <TextInput label="Phone" description="International format, e.g. +2348012345678" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
              <TextInput label="Residential address" value={address} onChange={(e) => setAddress(e.currentTarget.value)} />
              <Group grow align="flex-start">
                <TextInput label="City" value={city} onChange={(e) => setCity(e.currentTarget.value)} />
                <TextInput label="State" value={state} onChange={(e) => setState(e.currentTarget.value)} />
                <TextInput label="LGA" value={lga} onChange={(e) => setLga(e.currentTarget.value)} />
              </Group>
              <Textarea label="Reason / support verification reference" required minRows={3} placeholder="Why is this correction authorised? Include the support ticket/reference where available." value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
              <Button onClick={save} loading={saving}>Save verified correction</Button>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
