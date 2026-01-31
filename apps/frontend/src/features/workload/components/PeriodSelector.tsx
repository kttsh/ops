import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PeriodSelectorProps {
  from: string | undefined
  to: string | undefined
  onChange: (from: string | undefined, to: string | undefined) => void
}

function formatForDisplay(ym: string | undefined): string {
  if (!ym || ym.length !== 6) return ''
  return `${ym.slice(0, 4)}/${ym.slice(4, 6)}`
}

function parseFromDisplay(value: string): string | undefined {
  const cleaned = value.replace(/[^0-9]/g, '')
  if (cleaned.length === 6) return cleaned
  return undefined
}

function validatePeriod(from: string | undefined, to: string | undefined): string | null {
  if (from && !/^\d{6}$/.test(from)) return 'YYYY/MM形式で入力してください'
  if (to && !/^\d{6}$/.test(to)) return 'YYYY/MM形式で入力してください'
  if (from && to && from > to) return '開始年月は終了年月以前である必要があります'
  if (from && to) {
    const startYear = parseInt(from.slice(0, 4), 10)
    const startMonth = parseInt(from.slice(4, 6), 10)
    const endYear = parseInt(to.slice(0, 4), 10)
    const endMonth = parseInt(to.slice(4, 6), 10)
    const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1
    if (months > 60) return '表示期間は60ヶ月以内で指定してください'
  }
  return null
}

export function PeriodSelector({ from, to, onChange }: PeriodSelectorProps) {
  const [fromInput, setFromInput] = useState(formatForDisplay(from))
  const [toInput, setToInput] = useState(formatForDisplay(to))
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(() => {
    const parsedFrom = parseFromDisplay(fromInput)
    const parsedTo = parseFromDisplay(toInput)
    const validationError = validatePeriod(parsedFrom, parsedTo)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onChange(parsedFrom, parsedTo)
  }, [fromInput, toInput, onChange])

  const handlePreset = useCallback(
    (months: number) => {
      const now = new Date()
      const startYear = now.getFullYear()
      const startMonth = now.getMonth() + 1
      const start = `${startYear}${String(startMonth).padStart(2, '0')}`

      let endYear = startYear
      let endMonth = startMonth + months - 1
      while (endMonth > 12) {
        endMonth -= 12
        endYear++
      }
      const end = `${endYear}${String(endMonth).padStart(2, '0')}`

      setFromInput(formatForDisplay(start))
      setToInput(formatForDisplay(end))
      setError(null)
      onChange(start, end)
    },
    [onChange],
  )

  const handleReset = useCallback(() => {
    setFromInput('')
    setToInput('')
    setError(null)
    onChange(undefined, undefined)
  }, [onChange])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">開始年月</Label>
          <Input
            placeholder="YYYY/MM"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            onBlur={apply}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">終了年月</Label>
          <Input
            placeholder="YYYY/MM"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            onBlur={apply}
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePreset(12)}>
          12ヶ月
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePreset(24)}>
          24ヶ月
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePreset(36)}>
          36ヶ月
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleReset}>
          リセット
        </Button>
      </div>
    </div>
  )
}
