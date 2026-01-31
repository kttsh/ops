import { useState, useCallback } from 'react'
import { calculateCapacity } from '@/features/indirect-case-study/api/capacity-scenario-client'
import type {
  CalculateCapacityParams,
  CalculateCapacityResult,
} from '@/features/indirect-case-study/types'

export function useCapacityCalculation() {
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<CalculateCapacityResult | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const calculate = useCallback(async (params: CalculateCapacityParams) => {
    setIsCalculating(true)
    setError(null)
    try {
      const response = await calculateCapacity(params)
      setResult(response.data)
      return response.data
    } catch (err) {
      const e = err instanceof Error ? err : new Error('計算に失敗しました')
      setError(e)
      throw e
    } finally {
      setIsCalculating(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { calculate, isCalculating, result, error, reset }
}
