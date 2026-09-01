import { useState, useEffect } from 'react'
import { Group, Select, TextInput } from '@mantine/core'
import { PHONE_RULES, validatePhone } from '../validation'

const COUNTRIES = [
  { value: '+234', label: '🇳🇬 +234' },
  { value: '+1',   label: '🇺🇸 +1'   },
  { value: '+44',  label: '🇬🇧 +44'  },
  { value: '+233', label: '🇬🇭 +233' },
  { value: '+254', label: '🇰🇪 +254' },
  { value: '+27',  label: '🇿🇦 +27'  },
]

function parsePhone(full: string): { code: string; local: string } {
  for (const c of COUNTRIES) {
    if (full.startsWith(c.value)) return { code: c.value, local: full.slice(c.value.length) }
  }
  return { code: '+234', local: full.replace(/\D/g, '') }
}

interface PhoneInputFieldProps {
  value: string
  onChange: (fullPhone: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  radius?: string
  size?: string
  styles?: { input?: React.CSSProperties }
  error?: React.ReactNode
  onBlur?: () => void
  onValidityChange?: (isValid: boolean) => void
}

export function PhoneInputField({
  value,
  onChange,
  label,
  placeholder = '8012345678',
  required,
  disabled,
  radius = 'md',
  size,
  styles,
  error,
  onBlur,
  onValidityChange,
}: PhoneInputFieldProps) {
  const initial = parsePhone(value || '')
  const [countryCode, setCountryCode] = useState(initial.code)
  const [local, setLocal] = useState(initial.local)

  useEffect(() => {
    if (!value) {
      setLocal('')
      return
    }
    const p = parsePhone(value)
    if (value !== `${countryCode}${local}`) {
      setCountryCode(p.code)
      setLocal(p.local)
    }
  }, [value])

  useEffect(() => {
    onValidityChange?.(!validatePhone(value))
  }, [onValidityChange, value])

  function handleLocalChange(raw: string) {
    const maxLength = PHONE_RULES[countryCode]?.nationalLength ?? 15
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, maxLength)
    setLocal(digits)
    onChange(`${countryCode}${digits}`)
  }

  function handleCodeChange(code: string | null) {
    const c = code ?? '+234'
    setCountryCode(c)
    onChange(`${c}${local}`)
  }

  return (
    <div>
      {label && (
        <div style={{ marginBottom: 5, fontSize: 14, fontWeight: 500, color: '#374151' }}>
          {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </div>
      )}
      <Group gap={6} wrap="nowrap" align="flex-start">
        <Select
          data={COUNTRIES}
          value={countryCode}
          onChange={handleCodeChange}
          w={115}
          radius={radius}
          size={size}
          disabled={disabled}
          styles={styles}
          comboboxProps={{ withinPortal: true }}
        />
        <TextInput
          style={{ flex: 1 }}
          value={local}
          onChange={(e) => handleLocalChange(e.currentTarget.value)}
          placeholder={placeholder}
          radius={radius}
          size={size}
          disabled={disabled}
          styles={styles}
          inputMode="numeric"
          maxLength={PHONE_RULES[countryCode]?.nationalLength}
          description={PHONE_RULES[countryCode] ? `${PHONE_RULES[countryCode].nationalLength} digits after ${countryCode}` : undefined}
          error={error}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
        />
      </Group>
    </div>
  )
}
