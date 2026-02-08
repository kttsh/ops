import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator } from './separator'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <div className="space-y-1">
          <h4 className="text-sm font-medium leading-none">タイトル</h4>
          <p className="text-sm text-muted-foreground">説明テキスト</p>
        </div>
        <Story />
        <div className="space-y-1 pt-2">
          <h4 className="text-sm font-medium leading-none">タイトル2</h4>
          <p className="text-sm text-muted-foreground">説明テキスト2</p>
        </div>
      </div>
    ),
  ],
}

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  decorators: [
    (Story) => (
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>項目A</div>
        <Story />
        <div>項目B</div>
        <Story />
        <div>項目C</div>
      </div>
    ),
  ],
}
