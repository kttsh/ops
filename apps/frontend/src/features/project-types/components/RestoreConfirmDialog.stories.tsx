import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { RestoreConfirmDialog } from './RestoreConfirmDialog'

const meta = {
  title: 'Features/ProjectTypes/RestoreConfirmDialog',
  component: RestoreConfirmDialog,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    isLoading: false,
  },
} satisfies Meta<typeof RestoreConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Loading: Story = {
  args: { isLoading: true },
}
