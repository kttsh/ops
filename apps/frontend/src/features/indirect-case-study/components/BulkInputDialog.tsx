import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BulkInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fiscalYear: number
  fiscalYearOptions: number[]
  onApply: (year: number, headcount: number) => void
}

export function BulkInputDialog({
  open,
  onOpenChange,
  fiscalYear,
  fiscalYearOptions,
  onApply,
}: BulkInputDialogProps) {
  const [year, setYear] = useState(fiscalYear)
  const [headcount, setHeadcount] = useState(0)

  const handleApply = () => {
    onApply(year, headcount)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>一括入力</AlertDialogTitle>
          <AlertDialogDescription>
            選択した年度の全月（4月〜翌3月）に同じ人員数を設定します。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>対象年度</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fiscalYearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}年度
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>人員数</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={headcount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                setHeadcount(Number.isNaN(val) ? 0 : Math.max(0, val))
              }}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <Button onClick={handleApply}>設定</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
