import { useQuery } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useMonthlyReport(userId: string | null, monthStart: string) {
  const { reportService } = useServices()

  return useQuery({
    queryKey: ['report-monthly', userId, monthStart],
    queryFn: () => reportService.getMonthlyReport(Number(userId), monthStart),
    enabled: !!userId,
  })
}
