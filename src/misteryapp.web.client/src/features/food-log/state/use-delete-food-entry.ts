import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useDeleteFoodEntry(userId: string | null) {
  const { foodLogService } = useServices()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => foodLogService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-entries', userId] })
      queryClient.invalidateQueries({ queryKey: ['daily-summary', userId] })
    },
  })
}
