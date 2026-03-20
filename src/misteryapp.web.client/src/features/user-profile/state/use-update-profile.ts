import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'
import type { DietStyle } from '../../../domain/models'

export function useUpdateProfile(userId: string | null) {
  const { userProfileService } = useServices()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dietStyle: DietStyle) => {
      if (!userId) return Promise.reject(new Error('No user session'))
      return userProfileService.updateProfile(Number(userId), dietStyle)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })
}
