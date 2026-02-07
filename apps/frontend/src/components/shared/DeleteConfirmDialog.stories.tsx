import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

const meta = {
  title: 'Shared/DeleteConfirmDialog',
  component: DeleteConfirmDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    entityLabel: 'ビジネスユニット',
    entityName: 'エンジニアリング事業部',
    isDeleting: false,
  },
} satisfies Meta<typeof DeleteConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Deleting: Story = {
  args: { isDeleting: true },
}
