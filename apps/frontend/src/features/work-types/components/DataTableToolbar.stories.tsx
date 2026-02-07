import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { withRouter } from '@/lib/storybook-decorators'
import { DataTableToolbar } from './DataTableToolbar'

const meta = {
  title: 'Features/WorkTypes/DataTableToolbar',
  component: DataTableToolbar,
  tags: ['autodocs'],
  decorators: [withRouter],
  args: {
    search: '',
    onSearchChange: fn(),
    includeDisabled: false,
    onIncludeDisabledChange: fn(),
  },
} satisfies Meta<typeof DataTableToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithSearch: Story = {
  args: { search: '基本' },
}
