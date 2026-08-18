import { useState } from 'react'
import { Alert, Button, Card, Group, Stack, Text, TextInput, Textarea, Title } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { getUserDetail, listUsers } from '@/utils/api'
import { updateUserContactDetails } from '@/utils/contact-details-api'

export function ContactDetailsCorrection() {
  const [lookupEmail, setLookupEmail] = useState('')
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

  function clearLoadedUser() {
    setUserId('')
    setName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setCity('')
    setState('')
    setLga('')
    setReason('')
  }

  async function loadUser() {
    const searchEmail = lookupEmail.trim().toLowerCase()
    if (!searchEmail) return

    setLoading(true)
    setError('')
    setSuccess('')
    clearLoadedUser()

    try {
      // Support staff know the user's email, not the internal UUID. Use the
      // existing user-directory search to resolve the exact account, then keep
      // the UUID internal for the detail/update APIs.
      const results = await listUsers({ search: searchEmail, limit: 20 })
      const exactMatches = results.data.filter(
        (user) => user.email.trim().toLowerCase() === searchEmail,
      )

      if (exactMatches.length === 0) {
        setError('No user found with that email address.')
        return
      }

      if (exactMatches.length > 1) {
        setError('More than one account matched that email. Escalate this before making a correction.')
        return
      }

      const resolvedUserId = exactMatches[0].id
      const detail = await getUserDetail(resolvedUserId)
      const user = detail.user as Record<string, unknown>
      const kyc = (user.kyc ?? {}) as Record<string, unknown>

      setUserId(resolvedUserId)
      setName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim())
      setEmail((user.email as string) ?? '')
      setPhone((user.phone as string) ?? '')
      setAddress((kyc.address as string) ?? '')
      setCity((kyc.city as string) ?? '')
      setState((kyc.state as string) ?? '')
      setLga((kyc.lga as string) ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load user')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (!userId) return setError('Load a user first.')
    if (reason.trim().length < 5) {
      return setError('Add the support/verification reason before saving.')
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateUserContactDetails(userId, {
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        lga: lga.trim(),
        reason: reason.trim(),
      })
      setSuccess('Contact details updated and recorded in the audit trail.')
      setLookupEmail(email.trim())
      setReason('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update contact details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack gap="lg" maw={760} mx="auto">
      <div>
        <Title order={2}>Contact Detail Correction</Title>
        <Text c="dimmed" fz="sm" mt={4}>
          For verified support requests only. Every change requires a reason and is audited.
        </Text>
      </div>

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group align="flex-end">
            <TextInput
              label="User email"
              type="email"
              placeholder="customer@example.com"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void loadUser()
              }}
              style={{ flex: 1 }}
            />
            <Button onClick={loadUser} loading={loading}>
              Load user
            </Button>
          </Group>

          {name && (
            <div>
              <Text fw={600}>{name}</Text>
              <Text c="dimmed" fz="xs">
                {lookupEmail}
              </Text>
            </div>
          )}

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert color="green" icon={<IconCheck size={16} />}>
              {success}
            </Alert>
          )}

          {name && (
            <>
              <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
              <TextInput
                label="Phone"
                description="International format, e.g. +2348012345678"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
              />
              <TextInput
                label="Residential address"
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
              />
              <Group grow align="flex-start">
                <TextInput label="City" value={city} onChange={(e) => setCity(e.currentTarget.value)} />
                <TextInput label="State" value={state} onChange={(e) => setState(e.currentTarget.value)} />
                <TextInput label="LGA" value={lga} onChange={(e) => setLga(e.currentTarget.value)} />
              </Group>
              <Textarea
                label="Reason / support verification reference"
                required
                minRows={3}
                placeholder="Why is this correction authorised? Include the support ticket/reference where available."
                value={reason}
                onChange={(e) => setReason(e.currentTarget.value)}
              />
              <Button onClick={save} loading={saving}>
                Save verified correction
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
