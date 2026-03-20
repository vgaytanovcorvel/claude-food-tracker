import { useQuery } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

export function useProfile(userId: string | null) {
  const { userProfileService } = useServices()

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userProfileService.getProfile(Number(userId)),
    enabled: !!userId,
  })
}
