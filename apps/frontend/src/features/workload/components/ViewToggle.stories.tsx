import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ViewToggle } from './ViewToggle'

const meta = {
  title: 'Features/Workload/ViewToggle',
  component: ViewToggle,
  tags: ['autodocs'],
} satisfies Meta<typeof ViewToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Both: Story = {
  args: { value: 'both', onChange: fn() },
}

export const ChartOnly: Story = {
  args: { value: 'chart', onChange: fn() },
}

export const TableOnly: Story = {
  args: { value: 'table', onChange: fn() },
}
