import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ajoti:wallet-balance-hidden'
const CHANGE_EVENT = 'ajoti:wallet-privacy-change'

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

function subscribe(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
  }
}

export function useWalletPrivacy() {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const toggle = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, String(!getSnapshot()))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { hidden, toggle }
}
