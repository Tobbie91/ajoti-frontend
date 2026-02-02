import { Text, Button, Group, Avatar } from '@mantine/core'
import { useAuth } from '@/utils/auth'

export function Home() {
  const { user } = useAuth()
  const displayName = user?.name || 'there'
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ME'
  const tabs = ['All Groups', 'Open Groups', 'Invite-Only', 'Request Groups', 'Joined']
  const cards = [
    { title: 'Monthly 50K Squad', duration: '6 months · 4 Slots', tag: 'Open', tagColor: '#4ADE80' },
    {
      title: 'Hustle, Grind & Win',
      duration: '10 months · 7 Slots',
      tag: 'Invite Only',
      tagColor: '#FBBF24',
    },
    { title: 'Monthly 50K Squad', duration: '6 months · 4 Slots', tag: 'Request', tagColor: '#60A5FA' },
    { title: 'Monthly 50K Squad', duration: '6 months · 4 Slots', tag: 'Open', tagColor: '#4ADE80' },
    {
      title: 'Hustle, Grind & Win',
      duration: '10 months · 7 Slots',
      tag: 'Invite Only',
      tagColor: '#FBBF24',
    },
    { title: 'Monthly 50K Squad', duration: '6 months · 4 Slots', tag: 'Request', tagColor: '#60A5FA' },
  ]

  return (
    <div className="mx-auto max-w-[1192px] space-y-6 px-4 pb-10 sm:px-6 lg:px-0">
      <div
        className="relative flex min-h-[220px] w-full flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl px-6 py-6 sm:min-h-[220px] sm:px-8 sm:py-8 lg:h-[217px] lg:flex-row lg:items-center lg:gap-0 lg:px-10"
        style={{
          background: '#0B6B55',
          boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="max-w-xl text-white">
          <Text size="xl" fw={700} className="mb-3">
            Welcome, {displayName}
          </Text>
          <Text size="md" className="text-white/90">
            Join trusted savings groups and grow your money.
          </Text>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center lg:w-auto">
          <div className="hidden h-[140px] w-[220px] rounded-2xl bg-white/10 sm:block lg:h-[160px] lg:w-[260px]" />
          <Button
            radius="xl"
            size="md"
            color="gray"
            variant="white"
            className="w-full text-[#0B6B55] sm:w-auto"
          >
            How it Works
          </Button>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <div className="flex min-w-max items-center gap-6 border-b border-gray-100 px-4 text-sm sm:px-0">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`relative whitespace-nowrap pb-3 transition-colors ${
                index === 0 ? 'text-[#0B6B55]' : 'text-gray-400'
              }`}
              type="button"
            >
              {tab}
              {index === 0 ? (
                <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#0B6B55]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#C9F7D8] px-6 py-5 sm:px-8 sm:py-6 md:flex-row md:items-center">
        <div>
          <Text fw={700} className="text-[#0F172A]">
            Become a ROSCA Admin
          </Text>
          <Text size="sm" className="text-[#1F2937]">
            Manage your own savings group. Apply in 2 mins.
          </Text>
        </div>
        <Button radius="xl" size="sm" className="bg-[#0B6B55] text-white hover:bg-[#095C49]">
          Request Access
        </Button>
      </div>

      <div className="relative">
        <input
          className="w-full rounded-lg border border-gray-100 bg-white px-10 py-3 text-sm text-gray-600 shadow-sm"
          placeholder="Search"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon />
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <div
            key={`${card.title}-${index}`}
            className="overflow-hidden rounded-2xl bg-[#C9F7D8] shadow-sm"
          >
            <div className="space-y-2 px-5 py-5">
              <Text fw={700} className="text-[#0F172A]">
                {card.title}
              </Text>
              <Text size="sm" c="dimmed">
                {card.duration}
              </Text>
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-white"
                style={{ background: card.tagColor }}
              >
                {card.tag}
              </span>
            </div>
            <div className="flex flex-col gap-3 bg-[#0BBE5E] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Group gap={8}>
                <Avatar size={28} radius="xl" src={user?.picture} color="green">
                  {user?.picture ? null : initials}
                </Avatar>
                <div className="leading-tight">
                  <Text size="xs" c="white">
                    {user?.name || 'Member'}
                  </Text>
                  <Text size="xs" c="white">
                    {user?.email || 'Signed in'}
                  </Text>
                </div>
              </Group>
              <Button size="xs" radius="md" variant="white" className="w-full text-[#0B6B55] sm:w-auto">
                Join
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="outline" radius="md" className="border-[#0B6B55] text-[#0B6B55]">
          Show More
        </Button>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
