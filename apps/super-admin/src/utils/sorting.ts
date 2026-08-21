// Shared client-side sorting helpers for superadmin data tables.
//
// Superadmin list endpoints don't support `sortBy`/`sortOrder` query params today
// (checked all `apps/super-admin/src/utils/api.ts` list functions and the backend
// `superadmin-*.controller.ts` files - none accept sort params), so sorting here is
// client-side over whatever page of rows is currently loaded. That's the right
// tradeoff for these screens: pages are 20 rows, and re-sorting only the visible
// page (not the full dataset) matches how the rest of these tables already behave
// (e.g. KYC search is also client-side over the loaded page).

import { useState, useCallback } from 'react'

export type SortDir = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K | null
  dir: SortDir
}

export function useSortState<K extends string>(initial?: SortState<K>) {
  const [sort, setSort] = useState<SortState<K>>(initial ?? { key: null, dir: 'asc' })

  const toggleSort = useCallback((key: K) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }, [])

  return { sort, toggleSort, setSort }
}

type Accessor<T> = (row: T) => string | number | null | undefined

export function sortRows<T, K extends string>(
  rows: T[],
  sort: SortState<K>,
  accessors: Record<K, Accessor<T>>,
): T[] {
  if (!sort.key) return rows
  const accessor = accessors[sort.key]
  if (!accessor) return rows
  const dirMul = sort.dir === 'asc' ? 1 : -1

  return [...rows].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1 // nulls/undefined always sort last, regardless of direction
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dirMul
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dirMul
  })
}

// Row position that respects current pagination - page 2 at page size 20 continues
// 21, 22... instead of restarting at 1.
export function rowNumber(page: number, pageSize: number, index: number): number {
  return (page - 1) * pageSize + index + 1
}
