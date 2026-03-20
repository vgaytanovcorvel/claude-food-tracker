import { useQuery } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useDailyEntries(userId: string | null, date: string) {
  const { foodLogService } = useServices()

  return useQuery({
    queryKey: ['daily-entries', userId, date],
    queryFn: () => foodLogService.getDailyEntries(Number(userId), date),
    enabled: !!userId,
  })
}
