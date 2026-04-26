import type { ReactNode } from 'react'
import { Text } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'

interface BlogLayoutProps {
  children: ReactNode
}

export function BlogLayout({ children }: BlogLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const isArticlePage = location.pathname.split('/').length > 3

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Blog Header */}
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
        {/* Top row: back arrow + logo + "Back to ROSCA" */}
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/rosca')}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-[#F3F4F6]"
            >
              <IconArrowLeft size={18} color="#374151" />
            </button>
            <NavLink to="/rosca/how-it-works" className="no-underline">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02A36E]">
                  <Text fw={800} className="text-[14px] text-white">A</Text>
                </div>
                <Text fw={700} className="text-[15px] text-[#0F172A]">Ajoti Blog</Text>
              </div>
            </NavLink>
          </div>

          {/* Desktop center nav — only on lg+ so it doesn't crowd at mid widths */}
          <nav className="hidden items-center gap-5 lg:flex">
            {[
              { label: 'All Articles', path: '/rosca/how-it-works' },
              { label: 'Getting Started', path: '/rosca/how-it-works?cat=Getting+Started' },
              { label: 'Features', path: '/rosca/how-it-works?cat=Features' },
              { label: 'Safety', path: '/rosca/how-it-works?cat=Safety' },
              { label: 'FAQs', path: '/rosca/how-it-works?cat=FAQs' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`cursor-pointer border-0 bg-transparent text-[13px] font-medium transition-colors hover:text-[#02A36E] ${
                  !isArticlePage && location.pathname + location.search === item.path
                    ? 'text-[#02A36E]'
                    : 'text-[#6B7280]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => navigate('/rosca')}
            className="cursor-pointer rounded-lg bg-[#02A36E] px-3 py-1.5 text-[12px] font-semibold text-white sm:px-4 sm:py-2 sm:text-[13px]"
          >
            Back to ROSCA
          </button>
        </div>

        {/* Category scroll row — visible below lg */}
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 lg:hidden" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'All Articles', path: '/rosca/how-it-works' },
            { label: 'Getting Started', path: '/rosca/how-it-works?cat=Getting+Started' },
            { label: 'Features', path: '/rosca/how-it-works?cat=Features' },
            { label: 'Safety', path: '/rosca/how-it-works?cat=Safety' },
            { label: 'FAQs', path: '/rosca/how-it-works?cat=FAQs' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex-shrink-0 cursor-pointer border-0 bg-transparent pb-1 text-[13px] font-medium transition-colors ${
                !isArticlePage && location.pathname + location.search === item.path
                  ? 'border-b-2 border-[#02A36E] text-[#02A36E]'
                  : 'text-[#6B7280]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  )
}
