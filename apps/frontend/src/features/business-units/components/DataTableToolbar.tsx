import { Link } from '@tanstack/react-router'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface DataTableToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  includeDisabled: boolean
  onIncludeDisabledChange: (value: boolean) => void
}

export function DataTableToolbar({
  search,
  onSearchChange,
  includeDisabled,
  onIncludeDisabledChange,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="コードまたは名称で検索..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="include-disabled"
            checked={includeDisabled}
            onCheckedChange={onIncludeDisabledChange}
          />
          <Label htmlFor="include-disabled" className="text-sm text-muted-foreground whitespace-nowrap">
            削除済みを含む
          </Label>
        </div>
      </div>
      <Button asChild>
        <Link to="/master/business-units/new">
          <Plus className="h-4 w-4" />
          新規登録
        </Link>
      </Button>
    </div>
  )
}
