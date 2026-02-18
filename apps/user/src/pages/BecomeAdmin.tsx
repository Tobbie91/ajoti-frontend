import { useState } from 'react'
import { Text, Textarea, Checkbox } from '@mantine/core'
import { IconArrowLeft, IconCircleCheck } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

const VERIFICATION_ITEMS = [
  'Verified Phone Number',
  'Valid ID',
  'At least 1 successful ROSCA membership',
  'No flagged activity on account',
]

export function BecomeAdmin() {
  const navigate = useNavigate()
  const [reason, setReason] = useState('')
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="mx-auto w-full max-w-[680px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rosca')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Apply to Become a ROSCA Admin
          </Text>
        </div>

        {/* Application Section */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="text-[16px] text-[#0F172A]">
            Application
          </Text>

          <div className="mt-5">
            <Text fw={600} className="mb-2 text-[13px] text-[#374151]">
              Why do you want to be a ROSCA Admin?
            </Text>
            <Textarea
              placeholder="Tell us why you'd like to manage a ROSCA group..."
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              minRows={5}
              radius="md"
              styles={{
                input: {
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: 13,
                  '&:focus': {
                    borderColor: '#02A36E',
                  },
                },
              }}
            />
          </div>

          <Checkbox
            label="I agree to comply with ROSCA group policies."
            checked={agreed}
            onChange={(e) => setAgreed(e.currentTarget.checked)}
            className="mt-5"
            styles={{
              input: {
                borderColor: '#D1D5DB',
                '&:checked': {
                  backgroundColor: '#02A36E',
                  borderColor: '#02A36E',
                },
              },
              label: {
                fontSize: 13,
                fontWeight: 500,
                color: '#374151',
              },
            }}
          />
        </div>

        {/* Verification Requirements */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Text fw={700} className="text-[16px] text-[#0F172A]">
            Verification Requirements
          </Text>

          <div className="mt-5 flex flex-col gap-4">
            {VERIFICATION_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <IconCircleCheck size={22} color="#02A36E" />
                <Text fw={500} className="text-[13px] text-[#374151]">
                  {item}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          disabled={!reason.trim() || !agreed}
          className={`w-full cursor-pointer rounded-lg py-3.5 text-[14px] font-semibold text-white ${
            reason.trim() && agreed
              ? 'bg-[#02A36E]'
              : 'cursor-not-allowed bg-[#9CA3AF]'
          }`}
        >
          Submit Request
        </button>
      </div>
    </div>
  )
}
