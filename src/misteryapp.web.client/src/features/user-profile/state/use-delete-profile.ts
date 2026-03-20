import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useDeleteProfile() {
  const { userProfileService } = useServices()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => userProfileService.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
