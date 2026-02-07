import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import { withRouter } from '@/lib/storybook-decorators'
import { AppShell } from './AppShell'

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  decorators: [withRouter],
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: React.createElement(
      'div',
      { className: 'p-8' },
      React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'ページタイトル'),
      React.createElement('p', { className: 'text-muted-foreground' }, 'メインコンテンツ領域のプレースホルダー'),
    ),
  },
}
