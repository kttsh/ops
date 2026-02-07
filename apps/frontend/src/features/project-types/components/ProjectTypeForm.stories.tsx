import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ProjectTypeForm } from './ProjectTypeForm'

const meta = {
  title: 'Features/ProjectTypes/ProjectTypeForm',
  component: ProjectTypeForm,
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectTypeForm>

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
      projectTypeCode: 'PT001',
      name: '設計',
      displayOrder: 1,
    },
    onSubmit: fn(),
    isSubmitting: false,
  },
}
