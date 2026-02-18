import type { ReactNode } from 'react'
import { Text } from '@mantine/core'
import { IconArrowLeft, IconSearch } from '@tabler/icons-react'
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
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6">
          {/* Left: Back + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/rosca')}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-[#F3F4F6]"
            >
              <IconArrowLeft size={18} color="#374151" />
            </button>
            <NavLink to="/rosca/how-it-works" className="no-underline">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#02A36E]">
                  <Text fw={800} className="text-[14px] text-white">
                    A
                  </Text>
                </div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  Ajoti Blog
                </Text>
              </div>
            </NavLink>
          </div>

          {/* Center: Nav Links */}
          <nav className="flex items-center gap-6">
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

          {/* Right: Back to App */}
          <button
            onClick={() => navigate('/rosca')}
            className="cursor-pointer rounded-lg bg-[#02A36E] px-4 py-2 text-[13px] font-semibold text-white"
          >
            Back to ROSCA
          </button>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  )
}
