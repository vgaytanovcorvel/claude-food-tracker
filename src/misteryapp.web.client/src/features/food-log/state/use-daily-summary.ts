import { useQuery } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useDailySummary(userId: string | null, date: string) {
  const { foodLogService } = useServices()

  return useQuery({
    queryKey: ['daily-summary', userId, date],
    queryFn: () => foodLogService.getDailySummary(Number(userId), date),
    enabled: !!userId,
  })
}
