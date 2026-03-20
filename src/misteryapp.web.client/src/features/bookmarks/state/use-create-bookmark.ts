import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

interface CreateBookmarkArgs {
  userId: number
  alternativeFoodName: string
  imageBase64: string | null
  mimeType: string | null
}

export function useCreateBookmark(userId: string | null) {
  const { bookmarkService } = useServices()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: CreateBookmarkArgs) =>
      bookmarkService.createBookmark(args.userId, args.alternativeFoodName, args.imageBase64, args.mimeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] })
    },
  })
}
