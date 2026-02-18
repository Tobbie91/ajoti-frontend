import { Button, Card, Group, PasswordInput, Text, TextInput, Select } from '@mantine/core'
import { Link } from 'react-router-dom'

export function Signup() {
  return (
    <div className="min-h-screen bg-[#F7FBF9]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:px-6 lg:py-12">
        <div className="order-2 flex flex-col justify-between rounded-3xl bg-[#0B6B55] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10 lg:order-1 lg:px-10 lg:py-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Text fw={700} size="xl" className="tracking-wide">
                AJOTI
              </Text>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs">
                Admin · Portal
              </span>
            </div>

            <div className="space-y-4">
              <Text fw={700} size="xl">
                Start managing your group
              </Text>
              <Text size="sm" className="text-white/90">
                Create an admin account and bring your savings group online.
              </Text>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Easy setup
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Digitize your existing savings group in minutes.
                </Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Full control
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Manage members, payouts, and contributions from one place.
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm">
            <span>Already have an account?</span>
            <Link to="/login" className="font-semibold text-white">
              Log in
            </Link>
          </div>
        </div>

        <div className="order-1 flex items-center lg:order-2">
          <Card withBorder radius="xl" className="w-full border-[#E6F4EF] bg-white p-6 shadow-lg sm:p-8">
            <div className="space-y-6">
              <div>
                <Text fw={700} size="lg" className="text-[#0F172A]">
                  Create admin account
                </Text>
                <Text size="sm" className="text-[#6B7280]">
                  Get your savings group online.
                </Text>
              </div>

              <TextInput
                label="Full name"
                placeholder="Your name"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />
              <TextInput
                label="Email"
                placeholder="you@example.com"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />
              <TextInput
                label="Phone number"
                placeholder="+234 800 000 0000"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />
              <Group grow gap="sm">
                <TextInput
                  label="Date of birth"
                  placeholder="DD/MM/YYYY"
                  type="date"
                  radius="md"
                  styles={{
                    input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                  }}
                />
                <Select
                  label="Gender"
                  placeholder="Select"
                  data={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                  radius="md"
                  styles={{
                    input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                  }}
                  allowDeselect={false}
                />
              </Group>

              <Select
                label="Role"
                placeholder="Select role"
                defaultValue="admin"
                data={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'user', label: 'User' },
                ]}
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
                allowDeselect={false}
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />

              <Group justify="space-between" className="text-xs text-[#6B7280]">
                <Text component="span">Already have an account?</Text>
                <Link to="/login" className="text-[#0B6B55]">
                  Log in
                </Link>
              </Group>

              <Button
                component={Link}
                to="/verify-otp"
                fullWidth
                radius="md"
                className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
              >
                Create account
              </Button>

              <Text size="xs" className="text-center text-[#6B7280]">
                By creating an account, you agree to our Terms and Privacy Policy.
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
