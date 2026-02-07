import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { WorkTypeForm } from './WorkTypeForm'

const meta = {
  title: 'Features/WorkTypes/WorkTypeForm',
  component: WorkTypeForm,
  tags: ['autodocs'],
} satisfies Meta<typeof WorkTypeForm>

export default meta
type Story = StoryObj<typeof meta>

export const CreateMode: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    isSubmitting: false,
  },
}

export const EditMode: Story = {
  args: {
    mode: 'edit',
    defaultValues: {
      workTypeCode: 'WT001',
      name: '基本設計',
      displayOrder: 1,
      color: '#3b82f6',
    },
    onSubmit: fn(),
    isSubmitting: false,
  },
}
