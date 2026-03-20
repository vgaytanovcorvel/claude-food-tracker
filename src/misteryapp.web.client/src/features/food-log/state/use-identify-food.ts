import { useMutation } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

interface IdentifyFoodArgs {
  image: File
  userId: number
  signal?: AbortSignal
}

export function useIdentifyFood() {
  const { foodLogService } = useServices()

  return useMutation({
    mutationFn: (args: IdentifyFoodArgs) => foodLogService.identifyFood(args.image, args.userId, args.signal),
  })
}
