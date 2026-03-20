import { useMutation } from '@tanstack/react-query'
import { useServices } from '../../../core/providers'

interface AnalyseFoodArgs {
  entryId: number
  signal?: AbortSignal
}

export function useAnalyseFood() {
  const { foodLogService } = useServices()

  return useMutation({
    mutationFn: (args: AnalyseFoodArgs) => foodLogService.analyseEntry(args.entryId, args.signal),
  })
}
