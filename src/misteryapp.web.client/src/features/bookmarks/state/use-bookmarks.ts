import { useQuery } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useBookmarks(userId: string | null) {
  const { bookmarkService } = useServices()

  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: () => bookmarkService.getBookmarks(Number(userId)),
    enabled: !!userId,
  })
}
