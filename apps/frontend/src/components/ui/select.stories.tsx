import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

const SelectExample = (props: { disabled?: boolean; defaultValue?: string }) => (
  <Select disabled={props.disabled} defaultValue={props.defaultValue}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="選択してください" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">オプション1</SelectItem>
      <SelectItem value="option2">オプション2</SelectItem>
      <SelectItem value="option3">オプション3</SelectItem>
    </SelectContent>
  </Select>
)

const meta = {
  title: 'UI/Select',
  component: SelectExample,
  tags: ['autodocs'],
} satisfies Meta<typeof SelectExample>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithSelected: Story = {
  args: { defaultValue: 'option1' },
}

export const Disabled: Story = {
  args: { disabled: true },
}
