import { useEffect, useState } from 'react'
import { Alert, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { sendCircleInvite } from '@/utils/api'

interface InviteMemberModalProps {
  opened: boolean
  groupId: string | null
  groupName?: string | null
  onClose: () => void
}

export function InviteMemberModal({ opened, groupId, groupName, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!opened) return
    setEmail('')
    setError(null)
    setSent(false)
    setSending(false)
  }, [opened, groupId])

  async function handleSend() {
    const normalizedEmail = email.trim().toLowerCase()
    if (!groupId || !normalizedEmail || sending) return

    setSending(true)
    setError(null)
    setSent(false)
    try {
      await sendCircleInvite(groupId, { email: normalizedEmail })
      setSent(true)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="md"
      title={<Text fw={700}>Invite Member{groupName ? ` to ${groupName}` : ''}</Text>}
    >
      <Stack gap="md">
        <Text fz="sm" c="dimmed">
          Enter the email address of the person you want to invite. They will receive Ajoti's existing secure circle invitation link.
        </Text>

        {sent && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            Invite sent successfully.
          </Alert>
        )}
        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <TextInput
          label="Email address"
          type="email"
          placeholder="member@example.com"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void handleSend()
          }}
          autoFocus
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Close</Button>
          <Button
            onClick={() => void handleSend()}
            loading={sending}
            disabled={!email.trim()}
            style={{ background: '#0b6b55' }}
          >
            Send Invite
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
