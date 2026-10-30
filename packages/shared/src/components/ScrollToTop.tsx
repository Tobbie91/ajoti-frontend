import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Start page navigation at the top; explicit anchors retain their own navigation. */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  useLayoutEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, hash])
  return null
}
