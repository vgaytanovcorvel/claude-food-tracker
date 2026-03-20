import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'
import type { FoodEntrySource } from '../../../domain/models'

interface LogFoodArgs {
  userId: number
  foodName: string
  estimatedCalories: number
  source: FoodEntrySource
  imageBase64?: string | null
}

export function useLogFood(userId: string | null) {
  const { foodLogService } = useServices()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: LogFoodArgs) =>
      foodLogService.createEntry(args.userId, args.foodName, args.estimatedCalories, args.source, args.imageBase64),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-entries', userId] })
      queryClient.invalidateQueries({ queryKey: ['daily-summary', userId] })
    },
  })
}
