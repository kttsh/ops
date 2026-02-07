import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PeriodSelector } from './PeriodSelector'

const meta = {
  title: 'Features/Workload/PeriodSelector',
  component: PeriodSelector,
  tags: ['autodocs'],
} satisfies Meta<typeof PeriodSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    from: '202501',
    months: 36,
    onChange: fn(),
  },
}

export const NoFrom: Story = {
  args: {
    from: undefined,
    months: 12,
    onChange: fn(),
  },
}
