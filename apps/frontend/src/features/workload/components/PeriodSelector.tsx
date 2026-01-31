import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PeriodSelectorProps {
  from: string | undefined
  months: number
  onChange: (from: string | undefined, months: number) => void
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

function getFiscalYearStart(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const fiscalYear = month >= 4 ? year : year - 1
  return `${fiscalYear}04`
}

function computeEndYearMonth(from: string, months: number): string {
  const startY = parseInt(from.slice(0, 4), 10)
  const startM = parseInt(from.slice(4, 6), 10)
  let endM = startM + months - 1
  let endY = startY
  while (endM > 12) {
    endM -= 12
    endY++
  }
  return `${endY}${String(endM).padStart(2, '0')}`
}

export function PeriodSelector({ from, months, onChange }: PeriodSelectorProps) {
  const defaultFrom = getFiscalYearStart()
  const effectiveFrom = from ?? defaultFrom

  const [fromInput, setFromInput] = useState(formatForDisplay(effectiveFrom))
  const [monthsInput, setMonthsInput] = useState(String(months))
  const [error, setError] = useState<string | null>(null)

  const endYearMonth = useMemo(
    () => computeEndYearMonth(effectiveFrom, months),
    [effectiveFrom, months],
  )

  const apply = useCallback(() => {
    const parsedFrom = parseFromDisplay(fromInput)
    const parsedMonths = parseInt(monthsInput, 10)

    if (!parsedFrom) {
      setError('開始年月をYYYY/MM形式で入力してください')
      return
    }
    if (isNaN(parsedMonths) || parsedMonths < 1 || parsedMonths > 60) {
      setError('期間は1〜60ヶ月で指定してください')
      return
    }
    setError(null)
    onChange(parsedFrom, parsedMonths)
  }, [fromInput, monthsInput, onChange])

  const handleReset = useCallback(() => {
    const defFrom = getFiscalYearStart()
    setFromInput(formatForDisplay(defFrom))
    setMonthsInput('36')
    setError(null)
    onChange(defFrom, 36)
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
          <Label className="text-xs">期間（ヶ月）</Label>
          <Input
            type="number"
            min={1}
            max={60}
            placeholder="36"
            value={monthsInput}
            onChange={(e) => setMonthsInput(e.target.value)}
            onBlur={apply}
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        終了年月: {formatForDisplay(endYearMonth)}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleReset}>
          リセット
        </Button>
      </div>
    </div>
  )
}