import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { businessUnitsQueryOptions } from '@/features/workload/api/queries'

interface BusinessUnitSelectorProps {
  selectedCodes: string[]
  onChange: (codes: string[]) => void
}

export function BusinessUnitSelector({
  selectedCodes,
  onChange,
}: BusinessUnitSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const { data: buData } = useQuery(businessUnitsQueryOptions())
  const businessUnits = useMemo(() => buData?.data ?? [], [buData?.data])

  const filteredUnits = useMemo(() => {
    if (!searchText.trim()) return businessUnits
    const lower = searchText.toLowerCase()
    return businessUnits.filter(
      (bu) =>
        bu.name.toLowerCase().includes(lower) ||
        bu.businessUnitCode.toLowerCase().includes(lower),
    )
  }, [businessUnits, searchText])

  const toggleUnit = useCallback(
    (code: string) => {
      const next = selectedCodes.includes(code)
        ? selectedCodes.filter((c) => c !== code)
        : [...selectedCodes, code]
      onChange(next)
    },
    [selectedCodes, onChange],
  )

  const selectAll = useCallback(() => {
    onChange(businessUnits.map((bu) => bu.businessUnitCode))
  }, [businessUnits, onChange])

  const clearAll = useCallback(() => {
    onChange([])
  }, [onChange])

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(!open)}
      >
        <Building2 className="h-4 w-4" />
        <span>BU</span>
        {selectedCodes.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {selectedCodes.length}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-popover p-3 shadow-lg">
            {/* 検索 */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="検索..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>

            {/* 全選択/全解除 */}
            <div className="mb-2 flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                全選択
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                全解除
              </Button>
            </div>

            {/* リスト */}
            <div className="max-h-48 overflow-y-auto">
              {filteredUnits.map((bu) => {
                const selected = selectedCodes.includes(bu.businessUnitCode)
                return (
                  <button
                    key={bu.businessUnitCode}
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => toggleUnit(bu.businessUnitCode)}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1 truncate">{bu.name}</span>
                    <span className="text-xs text-muted-foreground">{bu.businessUnitCode}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
