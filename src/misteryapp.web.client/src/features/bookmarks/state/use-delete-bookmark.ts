import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useDeleteBookmark(userId: string | null) {
  const { bookmarkService } = useServices()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => bookmarkService.deleteBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] })
    },
  })
}
