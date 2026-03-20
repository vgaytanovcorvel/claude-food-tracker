import { useQuery } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useWeeklyReport(userId: string | null, weekStart: string) {
  const { reportService } = useServices()

  return useQuery({
    queryKey: ['report-weekly', userId, weekStart],
    queryFn: () => reportService.getWeeklyReport(Number(userId), weekStart),
    enabled: !!userId,
  })
}
