import { useState } from 'react'
import { Alert, Button, Card, Group, Stack, Text, TextInput, Textarea, Title } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { getUserDetail, listUsers } from '@/utils/api'
import { updateUserContactDetails } from '@/utils/contact-details-api'

const MINIMUM_USER_AGE = 18

function latestAllowedDob() {
  const today = new Date()
  const max = new Date(today.getFullYear() - MINIMUM_USER_AGE, today.getMonth(), today.getDate())
  return [max.getFullYear(), String(max.getMonth() + 1).padStart(2, '0'), String(max.getDate()).padStart(2, '0')].join('-')
}

function toDateOnly(value: unknown) {
  if (!value) return ''
  const text = String(value)
  return text.length >= 10 ? text.slice(0, 10) : text
}

export function ContactDetailsCorrection() {
  const [lookupEmail, setLookupEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
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
    setFirstName('')
    setLastName('')
    setDob('')
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
      const loadedFirstName = (user.firstName as string) ?? ''
      const loadedLastName = (user.lastName as string) ?? ''

      setUserId(resolvedUserId)
      setFirstName(loadedFirstName)
      setLastName(loadedLastName)
      setName(`${loadedFirstName} ${loadedLastName}`.trim())
      setDob(toDateOnly(user.dob))
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
    if (!firstName.trim() || !lastName.trim()) {
      return setError('First name and last name are required.')
    }
    if (!dob) {
      return setError('Date of birth is required.')
    }
    if (dob > latestAllowedDob()) {
      return setError(`The corrected date of birth must make the user at least ${MINIMUM_USER_AGE} years old.`)
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateUserContactDetails(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        lga: lga.trim(),
        reason: reason.trim(),
      })
      setName(`${firstName.trim()} ${lastName.trim()}`)
      setSuccess('User details updated and recorded in the audit trail.')
      setLookupEmail(email.trim())
      setReason('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update user details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack gap="lg" maw={760} mx="auto">
      <div>
        <Title order={2}>Verified User Detail Correction</Title>
        <Text c="dimmed" fz="sm" mt={4}>
          For verified support requests only. Identity and contact corrections require a reason and are audited.
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
              <Text fw={600} fz="sm">Identity details</Text>
              <Group grow align="flex-start">
                <TextInput label="First name" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} />
                <TextInput label="Last name" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} />
              </Group>
              <TextInput
                label="Date of birth"
                type="date"
                max={latestAllowedDob()}
                description="User must be at least 18 years old"
                value={dob}
                onChange={(e) => setDob(e.currentTarget.value)}
              />

              <Text fw={600} fz="sm" mt="xs">Contact details</Text>
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
