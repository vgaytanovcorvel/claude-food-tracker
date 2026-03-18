const IDENTITY_KEY = 'misteryapp:userId'

export function useIdentity(): { userId: string | null; setUserId: (id: string) => void; clearIdentity: () => void } {
  const userId = localStorage.getItem(IDENTITY_KEY)

  function setUserId(id: string) {
    localStorage.setItem(IDENTITY_KEY, id)
  }

  function clearIdentity() {
    localStorage.removeItem(IDENTITY_KEY)
  }

  return { userId, setUserId, clearIdentity }
}
