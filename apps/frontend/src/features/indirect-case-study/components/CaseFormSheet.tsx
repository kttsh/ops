import { useForm } from '@tanstack/react-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'


type CaseFormValues = {
  caseName: string
  description: string
  isPrimary: boolean
}

interface CaseFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  caseType: 'headcountPlan' | 'indirectWork'
  defaultValues?: CaseFormValues
  onSubmit: (values: CaseFormValues) => Promise<void>
  isSubmitting: boolean
}

function getErrorMessage(errors: unknown[]): string | undefined {
  if (errors.length === 0) return undefined
  const first = errors[0]
  if (typeof first === 'string') return first
  if (first && typeof first === 'object' && 'message' in first) {
    return String((first as { message: string }).message)
  }
  return String(first)
}

const CASE_TYPE_LABELS = {
  headcountPlan: '人員計画ケース',
  indirectWork: '間接作業ケース',
} as const

export function CaseFormSheet({
  open,
  onOpenChange,
  mode,
  caseType,
  defaultValues,
  onSubmit,
  isSubmitting,
}: CaseFormSheetProps) {
  const label = CASE_TYPE_LABELS[caseType]

  const form = useForm({
    defaultValues: defaultValues ?? {
      caseName: '',
      description: '',
      isPrimary: false,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
      onOpenChange(false)
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? `${label}を作成` : `${label}を編集`}
          </SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? `新しい${label}を作成します。`
              : `${label}の情報を編集します。`}
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6 mt-6"
        >
          <form.Field
            name="caseName"
            validators={{
              onChange: ({ value }) => {
                if (!value || value.length === 0) return '名前を入力してください'
                if (value.length > 100) return '名前は100文字以内で入力してください'
                return undefined
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  ケース名
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="例: 標準ケース"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {getErrorMessage(field.state.meta.errors)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="description" validators={{
              onChange: ({ value }) => {
                if (value && value.length > 500) return '説明は500文字以内で入力してください'
                return undefined
              },
            }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>説明</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="任意の説明"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {getErrorMessage(field.state.meta.errors)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="isPrimary">
            {(field) => (
              <div className="flex items-center gap-3">
                <Switch
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
                <Label htmlFor={field.name}>プライマリ</Label>
              </div>
            )}
          </form.Field>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? '作成' : '保存'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
