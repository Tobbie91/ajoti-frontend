import { useState } from 'react'
import { Text, TextInput, Textarea, Checkbox, Loader } from '@mantine/core'
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'

export function RequestToJoin() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      navigate(`/rosca/${id}/summary`)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-5">
        <Loader size={48} color="#02A36E" />
        <div className="text-center">
          <Text fw={700} className="text-[20px] text-[#0F172A]">
            Sending your request...
          </Text>
          <Text fw={400} className="mt-2 text-[14px] text-[#6B7280]">
            Please wait
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
            >
              <IconArrowLeft size={18} color="#374151" />
            </button>
            <Text fw={700} className="text-[22px] text-[#0F172A]">
              Request to Join Group
            </Text>
          </div>
          <Text fw={400} className="mt-2 ml-12 text-[14px] text-[#6B7280]">
            Fill the form to join the group.
          </Text>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-[#F0FDF4] px-5 py-4">
          <IconInfoCircle size={20} color="#02A36E" className="mt-0.5 flex-shrink-0" />
          <Text fw={500} className="text-[13px] leading-relaxed text-[#166534]">
            You are about to request access. 4 new members have joined this group today.
          </Text>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">
          <Textarea
            label="Why would you like to join?"
            placeholder="Enter your reason..."
            minRows={4}
            radius="md"
            styles={{
              label: { fontWeight: 600, fontSize: 14, color: '#0F172A', marginBottom: 6 },
              input: { borderColor: '#E5E7EB', fontSize: 14 },
            }}
          />

          <TextInput
            label="Referral code (Optional)"
            placeholder="Enter referral code"
            radius="md"
            styles={{
              label: { fontWeight: 600, fontSize: 14, color: '#0F172A', marginBottom: 6 },
              input: { borderColor: '#E5E7EB', fontSize: 14 },
            }}
          />

          <Checkbox
            label="I agree to the group rules and payout structure."
            styles={{
              label: { fontSize: 13, color: '#374151', fontWeight: 500 },
              input: {
                borderColor: '#D1D5DB',
                '&:checked': { backgroundColor: '#02A36E', borderColor: '#02A36E' },
              },
            }}
          />

          <button
            onClick={handleSubmit}
            className="mt-2 w-full rounded-xl bg-[#02A36E] py-4 text-[15px] font-semibold text-white"
          >
            Request to Join
          </button>
        </div>
      </div>
    </div>
  )
}
