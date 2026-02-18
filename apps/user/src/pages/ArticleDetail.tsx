import { Text, Badge } from '@mantine/core'
import {
  IconArrowLeft,
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
import { useNavigate, useParams } from 'react-router-dom'
import { ARTICLES, type Article, type BodyBlock } from '@/data/articles'

const categoryBadgeColors: Record<string, { bg: string; color: string }> = {
  'Getting Started': { bg: '#D1FAE5', color: '#065F46' },
  Features: { bg: '#DBEAFE', color: '#1E40AF' },
  Safety: { bg: '#FEE2E2', color: '#991B1B' },
  FAQs: { bg: '#EDE9FE', color: '#5B21B6' },
}

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

function getIcon(article: Article, size = 48) {
  const renderer = ICON_MAP[article.iconName]
  return renderer ? renderer(size) : <IconHelpCircle size={size} color="white" stroke={1.5} />
}

function renderBlock(block: BodyBlock, index: number) {
  switch (block.type) {
    case 'heading':
      return (
        <Text key={index} fw={700} className="mt-8 text-[20px] text-[#0F172A]">
          {block.text}
        </Text>
      )
    case 'subheading':
      return (
        <Text key={index} fw={600} className="mt-6 text-[16px] text-[#0F172A]">
          {block.text}
        </Text>
      )
    case 'paragraph':
      return (
        <Text key={index} fw={400} className="mt-3 text-[15px] leading-[1.8] text-[#374151]">
          {block.text}
        </Text>
      )
    case 'list':
      return (
        <ul key={index} className="mt-3 flex flex-col gap-2 pl-5">
          {block.items.map((item, i) => (
            <li key={i} className="list-disc text-[15px] leading-[1.7] text-[#374151]">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'numbered':
      return (
        <ol key={index} className="mt-3 flex flex-col gap-2 pl-5">
          {block.items.map((item, i) => (
            <li key={i} className="list-decimal text-[15px] leading-[1.7] text-[#374151]">
              {item}
            </li>
          ))}
        </ol>
      )
    case 'callout':
      return (
        <div
          key={index}
          className="mt-4 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-5 py-4"
        >
          <Text fw={500} className="text-[14px] leading-[1.7] text-[#0C4A6E]">
            {block.text}
          </Text>
        </div>
      )
    case 'quote':
      return (
        <div
          key={index}
          className="mt-4 border-l-4 border-[#02A36E] bg-[#F0FDF4] px-5 py-4"
        >
          <Text fw={500} className="italic text-[15px] leading-[1.7] text-[#374151]">
            {block.text}
          </Text>
        </div>
      )
    default:
      return null
  }
}

export function ArticleDetail() {
  const navigate = useNavigate()
  const { articleId } = useParams()

  const article = ARTICLES.find((a) => a.id === articleId)

  if (!article) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-6 py-12">
        <div className="flex flex-col items-center">
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            Article Not Found
          </Text>
          <Text fw={400} className="mt-2 text-[15px] text-[#6B7280]">
            This article doesn't exist or has been removed.
          </Text>
          <button
            onClick={() => navigate('/rosca/how-it-works')}
            className="mt-6 cursor-pointer rounded-lg bg-[#02A36E] px-6 py-2.5 text-[13px] font-semibold text-white"
          >
            Back to Articles
          </button>
        </div>
      </div>
    )
  }

  const badge = categoryBadgeColors[article.category]

  // Find related articles (same category, different id)
  const related = ARTICLES.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 2)

  return (
    <div>
      {/* Hero Cover */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${article.coverGradient[0]}, ${article.coverGradient[1]})`,
        }}
      >
        <div className="mx-auto max-w-[760px] px-6 py-12">
          {/* Back */}
          <button
            onClick={() => navigate('/rosca/how-it-works')}
            className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-white/80 hover:text-white"
          >
            <IconArrowLeft size={16} />
            Back to articles
          </button>

          {/* Meta */}
          <div className="mt-6 flex items-center gap-3">
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
              {article.category}
            </Badge>
            <div className="flex items-center gap-1.5">
              <IconClock size={13} color="rgba(255,255,255,0.7)" />
              <Text fw={500} className="text-[12px] text-white/70">
                {article.readTime}
              </Text>
            </div>
          </div>

          {/* Title */}
          <Text fw={800} className="mt-4 max-w-[600px] text-[32px] leading-tight text-white">
            {article.title}
          </Text>

          {/* Excerpt */}
          <Text fw={400} className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-white/80">
            {article.excerpt}
          </Text>
        </div>

        {/* Decorative */}
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-28 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute right-48 top-8 h-20 w-20 rounded-full bg-white/5" />

        {/* Icon */}
        <div className="absolute right-16 bottom-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          {getIcon(article, 40)}
        </div>
      </div>

      {/* Article Content */}
      <div className="mx-auto max-w-[760px] px-6 py-10">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 -mt-6 relative z-10 shadow-sm">
          {article.body.map((block, i) => renderBlock(block, i))}
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-10">
            <Text fw={700} className="text-[18px] text-[#0F172A]">
              Related Articles
            </Text>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {related.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/rosca/how-it-works/${rel.id}`)}
                  className="flex cursor-pointer overflow-hidden rounded-xl border border-[#E5E7EB] bg-white transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex w-[80px] flex-shrink-0 items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${rel.coverGradient[0]}, ${rel.coverGradient[1]})`,
                    }}
                  >
                    {getIcon(rel, 28)}
                  </div>
                  <div className="flex-1 p-4">
                    <Text fw={600} className="text-[13px] leading-snug text-[#0F172A]">
                      {rel.title}
                    </Text>
                    <div className="mt-2 flex items-center gap-1.5">
                      <IconClock size={12} color="#9CA3AF" />
                      <Text fw={500} className="text-[11px] text-[#9CA3AF]">
                        {rel.readTime}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-8 flex items-center justify-between border-t border-[#E5E7EB] pt-6">
          <button
            onClick={() => navigate('/rosca/how-it-works')}
            className="cursor-pointer text-[13px] font-semibold text-[#02A36E] hover:underline"
          >
            ← Browse all articles
          </button>
          <button
            onClick={() => navigate('/rosca')}
            className="cursor-pointer rounded-lg bg-[#02A36E] px-6 py-2.5 text-[13px] font-semibold text-white"
          >
            Go to ROSCA
          </button>
        </div>
      </div>
    </div>
  )
}
