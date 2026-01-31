import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { BusinessUnit } from '@/features/business-units/types'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function createColumns(options: {
  onRestore?: (code: string) => void
}): ColumnDef<BusinessUnit>[] {
  return [
    {
      accessorKey: 'businessUnitCode',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          コード
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          to="/master/business-units/$businessUnitCode"
          params={{ businessUnitCode: row.original.businessUnitCode }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.businessUnitCode}
        </Link>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          名称
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          表示順
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
    },
    {
      id: 'status',
      header: 'ステータス',
      cell: ({ row }) => {
        const isDeleted = !!row.original.deletedAt
        return isDeleted ? (
          <Badge variant="destructive">削除済み</Badge>
        ) : (
          <Badge variant="success">アクティブ</Badge>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          更新日時
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => formatDateTime(row.original.updatedAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isDeleted = !!row.original.deletedAt
        if (!isDeleted || !options.onRestore) return null
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              options.onRestore!(row.original.businessUnitCode)
            }}
          >
            復元
          </Button>
        )
      },
    },
  ]
}
