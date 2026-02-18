import { useState } from 'react'
import { Text, TextInput, Badge } from '@mantine/core'
import {
  IconSearch,
  IconClock,
  IconUsers,
  IconShieldCheck,
  IconCash,
  IconArrowRight,
  IconCalendarEvent,
  IconAlertTriangle,
  IconTrendingUp,
  IconHelpCircle,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { ARTICLES, type Article, type Category } from '@/data/articles'

type FilterCategory = 'All' | Category

const CATEGORIES: FilterCategory[] = ['All', 'Getting Started', 'Features', 'Safety', 'FAQs']

const ICON_MAP: Record<string, (size: number) => React.ReactNode> = {
  users: (s) => <IconUsers size={s} color="white" stroke={1.5} />,
  'arrow-right': (s) => <IconArrowRight size={s} color="white" stroke={1.5} />,
  'calendar-event': (s) => <IconCalendarEvent size={s} color="white" stroke={1.5} />,
  'shield-check': (s) => <IconShieldCheck size={s} color="white" stroke={1.5} />,
  'shield-check-green': (s) => <IconShieldCheck size={s} color="white" stroke={1.5} />,
  'alert-triangle': (s) => <IconAlertTriangle size={s} color="white" stroke={1.5} />,
  'trending-up': (s) => <IconTrendingUp size={s} color="white" stroke={1.5} />,
  cash: (s) => <IconCash size={s} color="white" stroke={1.5} />,
  'help-circle': (s) => <IconHelpCircle size={s} color="white" stroke={1.5} />,
}

const categoryBadgeColors: Record<Category, { bg: string; color: string }> = {
  'Getting Started': { bg: '#D1FAE5', color: '#065F46' },
  Features: { bg: '#DBEAFE', color: '#1E40AF' },
  Safety: { bg: '#FEE2E2', color: '#991B1B' },
  FAQs: { bg: '#EDE9FE', color: '#5B21B6' },
}

function getIcon(article: Article, size = 24) {
  const renderer = ICON_MAP[article.iconName]
  return renderer ? renderer(size) : <IconHelpCircle size={size} color="white" stroke={1.5} />
}

export function HowItWorks() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All')
  const [search, setSearch] = useState('')

  const filtered = ARTICLES.filter((a) => {
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featured = ARTICLES.find((a) => a.featured)
  const rest = filtered.filter((a) => !a.featured || activeCategory !== 'All')

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
      <div className="flex flex-col gap-8">
        {/* Page Title */}
        <div>
          <Text fw={800} className="text-[32px] text-[#0F172A]">
            Learn & Grow
          </Text>
          <Text fw={500} className="mt-1 text-[15px] text-[#6B7280]">
            Everything you need to know about ROSCA savings on Ajoti
          </Text>
        </div>

        {/* Featured Article */}
        {activeCategory === 'All' && featured && (
          <div
            onClick={() => navigate(`/rosca/how-it-works/${featured.id}`)}
            className="relative cursor-pointer overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${featured.coverGradient[0]}, ${featured.coverGradient[1]})`,
            }}
          >
            <div className="flex items-center">
              <div className="relative z-10 flex-1 p-10">
                <Badge
                  size="sm"
                  radius="xl"
                  styles={{
                    root: {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 11,
                    },
                  }}
                >
                  Featured
                </Badge>
                <Text fw={700} className="mt-4 text-[26px] leading-tight text-white">
                  {featured.title}
                </Text>
                <Text fw={400} className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-white/85">
                  {featured.excerpt}
                </Text>
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <IconClock size={14} color="rgba(255,255,255,0.7)" />
                    <Text fw={500} className="text-[12px] text-white/70">
                      {featured.readTime}
                    </Text>
                  </div>
                  <Badge
                    size="sm"
                    radius="xl"
                    styles={{
                      root: {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: '#FFFFFF',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: 11,
                      },
                    }}
                  >
                    {featured.category}
                  </Badge>
                </div>
                <button className="mt-6 cursor-pointer rounded-lg bg-white px-6 py-2.5 text-[13px] font-semibold text-[#0F172A] shadow-sm">
                  Read Article →
                </button>
              </div>

              {/* Decorative side */}
              <div className="relative flex h-full w-[280px] flex-shrink-0 items-center justify-center">
                <div className="absolute right-8 h-48 w-48 rounded-full bg-white/10" />
                <div className="absolute right-24 top-6 h-20 w-20 rounded-full bg-white/5" />
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  {getIcon(featured, 48)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filters row */}
        <div className="flex items-center gap-4">
          <TextInput
            placeholder="Search articles..."
            leftSection={<IconSearch size={18} color="#9CA3AF" />}
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="w-[300px]"
            styles={{
              input: { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
            }}
          />
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#02A36E] text-white'
                    : 'border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {rest.length > 0 ? (
          <div className="grid grid-cols-3 gap-6">
            {rest.map((article) => (
              <div
                key={article.id}
                onClick={() => navigate(`/rosca/how-it-works/${article.id}`)}
                className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Cover Image */}
                <div
                  className="relative flex h-[160px] items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${article.coverGradient[0]}, ${article.coverGradient[1]})`,
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
                  <div className="absolute right-12 bottom-4 h-10 w-10 rounded-full bg-white/5" />

                  {/* Icon */}
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    {getIcon(article, 32)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  {/* Category + Read time */}
                  <div className="flex items-center gap-2">
                    <Badge
                      size="sm"
                      radius="xl"
                      styles={{
                        root: {
                          backgroundColor: categoryBadgeColors[article.category].bg,
                          color: categoryBadgeColors[article.category].color,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: 11,
                        },
                      }}
                    >
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <IconClock size={12} color="#9CA3AF" />
                      <Text fw={500} className="text-[11px] text-[#9CA3AF]">
                        {article.readTime}
                      </Text>
                    </div>
                  </div>

                  {/* Title */}
                  <Text fw={700} className="mt-3 text-[15px] leading-snug text-[#0F172A]">
                    {article.title}
                  </Text>

                  {/* Excerpt */}
                  <Text fw={400} className="mt-2 flex-1 text-[13px] leading-relaxed text-[#6B7280]">
                    {article.excerpt}
                  </Text>

                  {/* Read more */}
                  <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                    <Text fw={600} className="text-[13px] text-[#02A36E]">
                      Read article →
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Text fw={600} className="text-[#374151]">
              No articles found
            </Text>
            <Text size="sm" className="mt-1 text-[#9CA3AF]">
              Try adjusting your search or category filter.
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
