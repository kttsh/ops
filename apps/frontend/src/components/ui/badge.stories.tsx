import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'デフォルト', variant: 'default' },
}

export const Secondary: Story = {
  args: { children: 'セカンダリ', variant: 'secondary' },
}

export const Destructive: Story = {
  args: { children: '破壊的', variant: 'destructive' },
}

export const Outline: Story = {
  args: { children: 'アウトライン', variant: 'outline' },
}

export const Success: Story = {
  args: { children: '成功', variant: 'success' },
}
