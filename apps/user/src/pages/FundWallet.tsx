import { useState } from 'react'
import { Text, TextInput } from '@mantine/core'
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconCreditCard,
  IconBuildingBank,
  IconCheck,
  IconBackspace,
  IconPlus,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type Step = 'form' | 'confirm' | 'pin' | 'processing' | 'success'

export function FundWallet() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')

  // Form
  const [amount, setAmount] = useState('')
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [showNewCardForm, setShowNewCardForm] = useState(false)
  const [newCardNumber, setNewCardNumber] = useState('')
  const [newCardExpiry, setNewCardExpiry] = useState('')
  const [newCardCvv, setNewCardCvv] = useState('')

  // PIN
  const [pin, setPin] = useState('')

  const transactionFee = 100
  const numericAmount = parseInt(amount.replace(/,/g, ''), 10) || 0
  const totalCharge = numericAmount + transactionFee

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString()
  }

  function handleProceedForm() {
    if (numericAmount > 0 && selectedCard) {
      setStep('confirm')
    }
  }

  function handleProceedConfirm() {
    setStep('pin')
  }

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => {
          setStep('processing')
          setTimeout(() => {
            setStep('success')
          }, 2500)
        }, 300)
      }
    }
  }

  function handlePinBackspace() {
    setPin(pin.slice(0, -1))
  }

  // Mock saved cards
  const [savedCards, setSavedCards] = useState([
    { id: '1', last4: '6275', brand: 'Visa', expiry: '09/26' },
    { id: '2', last4: '4421', brand: 'Mastercard', expiry: '12/25' },
  ])

  return (
    <div className="mx-auto w-full max-w-[600px] px-6 py-8">
      {/* Back button */}
      {step === 'form' && (
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
      )}

      {/* ==================== STEP 1: FORM ==================== */}
      {step === 'form' && (
        <div className="flex flex-col gap-6">
          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">
              Fund Wallet
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Add funds to your NGN wallet
            </Text>
          </div>

          {/* Amount */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <Text fw={600} className="mb-3 text-[14px] text-[#374151]">
              Enter Amount
            </Text>
            <TextInput
              placeholder="0"
              radius="md"
              size="lg"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.currentTarget.value))}
              leftSection={
                <Text fw={600} className="text-[16px] text-[#0F172A]">
                  ₦
                </Text>
              }
              styles={{
                input: {
                  borderColor: '#E5E7EB',
                  fontSize: 20,
                  fontWeight: 600,
                  height: 52,
                },
              }}
            />
            {/* Quick amounts */}
            <div className="mt-3 flex gap-2">
              {['5,000', '10,000', '50,000', '100,000'].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    amount === val
                      ? 'border-[#02A36E] bg-[#F0FDF4] text-[#02A36E]'
                      : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB]'
                  }`}
                >
                  ₦{val}
                </button>
              ))}
            </div>
          </div>

          {/* Via Bank Transfer */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white">
            <button
              onClick={() => {
                setShowBankDetails(!showBankDetails)
                setShowCards(false)
                setShowNewCardForm(false)
              }}
              className="flex w-full cursor-pointer items-center justify-between p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <IconBuildingBank size={20} color="#3B82F6" />
                </div>
                <div className="text-left">
                  <Text fw={600} className="text-[14px] text-[#0F172A]">
                    Via Bank Transfer
                  </Text>
                  <Text fw={400} className="text-[12px] text-[#6B7280]">
                    Transfer to your dedicated account
                  </Text>
                </div>
              </div>
              {showBankDetails ? (
                <IconChevronUp size={18} color="#9CA3AF" />
              ) : (
                <IconChevronDown size={18} color="#9CA3AF" />
              )}
            </button>

            {showBankDetails && (
              <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-4">
                <div className="rounded-xl bg-[#F9FAFB] p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between">
                      <Text fw={400} className="text-[13px] text-[#6B7280]">
                        Bank Name
                      </Text>
                      <Text fw={600} className="text-[13px] text-[#0F172A]">
                        Wema Bank
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text fw={400} className="text-[13px] text-[#6B7280]">
                        Account Number
                      </Text>
                      <Text fw={600} className="text-[13px] text-[#0F172A]">
                        0124589632
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text fw={400} className="text-[13px] text-[#6B7280]">
                        Account Name
                      </Text>
                      <Text fw={600} className="text-[13px] text-[#0F172A]">
                        Ajoti/Osho Michael
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Select Cards */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white">
            <button
              onClick={() => {
                setShowCards(!showCards)
                setShowBankDetails(false)
                setShowNewCardForm(false)
              }}
              className="flex w-full cursor-pointer items-center justify-between p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4]">
                  <IconCreditCard size={20} color="#02A36E" />
                </div>
                <div className="text-left">
                  <Text fw={600} className="text-[14px] text-[#0F172A]">
                    Select Card
                  </Text>
                  <Text fw={400} className="text-[12px] text-[#6B7280]">
                    {selectedCard
                      ? `**** ${savedCards.find((c) => c.id === selectedCard)?.last4}`
                      : 'Choose a saved card'}
                  </Text>
                </div>
              </div>
              {showCards ? (
                <IconChevronUp size={18} color="#9CA3AF" />
              ) : (
                <IconChevronDown size={18} color="#9CA3AF" />
              )}
            </button>

            {showCards && (
              <div className="border-t border-[#E5E7EB] px-5 pb-5 pt-4">
                <Text fw={500} className="mb-3 text-[12px] text-[#6B7280]">
                  Saved Cards
                </Text>
                <div className="flex flex-col gap-2">
                  {savedCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        setSelectedCard(card.id)
                        setShowCards(false)
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                        selectedCard === card.id
                          ? 'border-[#02A36E] bg-[#F0FDF4]'
                          : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E5E7EB]">
                        <IconCreditCard size={16} color="#374151" />
                      </div>
                      <div className="flex-1 text-left">
                        <Text fw={600} className="text-[13px] text-[#0F172A]">
                          {card.brand} •••• {card.last4}
                        </Text>
                        <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                          Expires {card.expiry}
                        </Text>
                      </div>
                      {selectedCard === card.id && <IconCheck size={16} color="#02A36E" />}
                    </button>
                  ))}

                  {/* Add new card */}
                  {!showNewCardForm ? (
                    <button
                      onClick={() => setShowNewCardForm(true)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#D1D5DB] p-3 text-left hover:bg-[#F9FAFB]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6]">
                        <IconPlus size={16} color="#6B7280" />
                      </div>
                      <Text fw={500} className="text-[13px] text-[#6B7280]">
                        Add New Card
                      </Text>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-[#02A36E] bg-[#F0FDF4] p-4">
                      <Text fw={600} className="mb-3 text-[13px] text-[#0F172A]">
                        New Card Details
                      </Text>
                      <div className="flex flex-col gap-3">
                        <TextInput
                          placeholder="Card Number"
                          radius="md"
                          size="sm"
                          value={newCardNumber}
                          onChange={(e) => {
                            const digits = e.currentTarget.value.replace(/\D/g, '').slice(0, 16)
                            const formatted = digits.replace(/(.{4})/g, '$1 ').trim()
                            setNewCardNumber(formatted)
                          }}
                          leftSection={<IconCreditCard size={16} color="#6B7280" />}
                          styles={{ input: { borderColor: '#E5E7EB', fontSize: 13 } }}
                        />
                        <div className="flex gap-3">
                          <TextInput
                            placeholder="MM/YY"
                            radius="md"
                            size="sm"
                            value={newCardExpiry}
                            onChange={(e) => {
                              let val = e.currentTarget.value.replace(/\D/g, '').slice(0, 4)
                              if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2)
                              setNewCardExpiry(val)
                            }}
                            styles={{ input: { borderColor: '#E5E7EB', fontSize: 13 } }}
                            className="flex-1"
                          />
                          <TextInput
                            placeholder="CVV"
                            radius="md"
                            size="sm"
                            value={newCardCvv}
                            onChange={(e) =>
                              setNewCardCvv(e.currentTarget.value.replace(/\D/g, '').slice(0, 3))
                            }
                            styles={{ input: { borderColor: '#E5E7EB', fontSize: 13 } }}
                            className="flex-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const digits = newCardNumber.replace(/\s/g, '')
                              if (digits.length === 16 && newCardExpiry.length === 5 && newCardCvv.length === 3) {
                                const last4 = digits.slice(-4)
                                const newId = String(savedCards.length + 1)
                                setSavedCards((prev) => [
                                  ...prev,
                                  { id: newId, last4, brand: 'Card', expiry: newCardExpiry },
                                ])
                                setSelectedCard(newId)
                                setNewCardNumber('')
                                setNewCardExpiry('')
                                setNewCardCvv('')
                                setShowNewCardForm(false)
                              }
                            }}
                            disabled={
                              newCardNumber.replace(/\s/g, '').length !== 16 ||
                              newCardExpiry.length !== 5 ||
                              newCardCvv.length !== 3
                            }
                            className={`flex-1 rounded-lg py-2 text-[13px] font-semibold text-white ${
                              newCardNumber.replace(/\s/g, '').length === 16 &&
                              newCardExpiry.length === 5 &&
                              newCardCvv.length === 3
                                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                                : 'cursor-not-allowed bg-[#9CA3AF]'
                            }`}
                          >
                            Add Card
                          </button>
                          <button
                            onClick={() => {
                              setShowNewCardForm(false)
                              setNewCardNumber('')
                              setNewCardExpiry('')
                              setNewCardCvv('')
                            }}
                            className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] bg-white py-2 text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Proceed */}
          <button
            onClick={handleProceedForm}
            disabled={numericAmount <= 0 || !selectedCard}
            className={`w-full rounded-xl py-3.5 text-[14px] font-semibold text-white ${
              numericAmount > 0 && selectedCard
                ? 'cursor-pointer bg-[#02A36E] hover:bg-[#028a5b]'
                : 'cursor-not-allowed bg-[#9CA3AF]'
            }`}
          >
            Proceed
          </button>
        </div>
      )}

      {/* ==================== STEP 2: CONFIRMATION ==================== */}
      {(step === 'confirm' || step === 'processing') && (
        <div className="flex flex-col gap-6">
          {step === 'confirm' && (
            <button
              onClick={() => setStep('form')}
              className="mb-2 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
            >
              <IconArrowLeft size={18} />
              Back
            </button>
          )}

          <div>
            <Text fw={700} className="text-[24px] text-[#0F172A]">
              Confirm Payment
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Review the details below before proceeding
            </Text>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  Amount
                </Text>
                <Text fw={700} className="text-[18px] text-[#0F172A]">
                  ₦{amount}
                </Text>
              </div>
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  Payment Method
                </Text>
                <Text fw={600} className="text-[14px] text-[#0F172A]">
                  •••••{savedCards.find((c) => c.id === selectedCard)?.last4}
                </Text>
              </div>
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
                <Text fw={400} className="text-[14px] text-[#6B7280]">
                  Transaction Fee
                </Text>
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  ₦{transactionFee.toLocaleString()}
                </Text>
              </div>
              <div className="flex items-center justify-between">
                <Text fw={600} className="text-[14px] text-[#0F172A]">
                  Total Charge
                </Text>
                <Text fw={700} className="text-[18px] text-[#02A36E]">
                  ₦{totalCharge.toLocaleString()}
                </Text>
              </div>
            </div>
          </div>

          {step === 'confirm' && (
            <button
              onClick={handleProceedConfirm}
              className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
            >
              Proceed
            </button>
          )}

          {/* Processing overlay */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#02A36E]" />
              <Text fw={500} className="text-[14px] text-[#6B7280]">
                Processing your payment...
              </Text>
            </div>
          )}
        </div>
      )}

      {/* ==================== STEP 3: PIN ENTRY ==================== */}
      {step === 'pin' && (
        <div className="flex flex-col items-center gap-8 pt-8">
          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">
              Enter Your PIN
            </Text>
            <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
              Enter your 4-digit transaction PIN
            </Text>
          </div>

          {/* PIN dots */}
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${
                  i < pin.length
                    ? 'border-[#02A36E] bg-[#F0FDF4]'
                    : 'border-[#E5E7EB] bg-white'
                }`}
              >
                {i < pin.length && (
                  <div className="h-3 w-3 rounded-full bg-[#02A36E]" />
                )}
              </div>
            ))}
          </div>

          {/* Forgot PIN */}
          <button className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline">
            Forgot PIN?
          </button>

          {/* Number pad */}
          <div className="grid w-[280px] grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => {
              if (key === '') return <div key="empty" />
              if (key === 'back') {
                return (
                  <button
                    key="back"
                    onClick={handlePinBackspace}
                    className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB]"
                  >
                    <IconBackspace size={22} color="#374151" />
                  </button>
                )
              }
              return (
                <button
                  key={key}
                  onClick={() => handlePinDigit(key)}
                  className="flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-[#F9FAFB] text-[20px] font-semibold text-[#0F172A] hover:bg-[#E5E7EB]"
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================== STEP 5: SUCCESS ==================== */}
      {step === 'success' && (
        <div className="flex flex-col items-center gap-6 pt-16">
          {/* Green check */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D1FAE5]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
              <IconCheck size={32} color="white" strokeWidth={3} />
            </div>
          </div>

          <div className="text-center">
            <Text fw={700} className="text-[22px] text-[#0F172A]">
              Payment Successful
            </Text>
            <Text fw={400} className="mt-2 max-w-[320px] text-[14px] leading-[1.6] text-[#6B7280]">
              ₦{amount} has been added to your NGN wallet
            </Text>
          </div>

          <button
            onClick={() => navigate('/home')}
            className="mt-4 w-full max-w-[300px] cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
