import { useState, useEffect } from 'react'

const IDENTITY_KEY = 'misteryapp:userId'

export function useIdentity(): { userId: string | null; setUserId: (id: string) => void; clearIdentity: () => void } {
  const [userId, setUserIdState] = useState<string | null>(() => localStorage.getItem(IDENTITY_KEY))

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === IDENTITY_KEY) setUserIdState(e.newValue)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function setUserId(id: string) {
    localStorage.setItem(IDENTITY_KEY, id)
    setUserIdState(id)
  }

  function clearIdentity() {
    localStorage.removeItem(IDENTITY_KEY)
    setUserIdState(null)
  }

  return { userId, setUserId, clearIdentity }
}
