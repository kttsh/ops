import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import React from 'react'
import { SidePanel } from './SidePanel'

const meta = {
  title: 'Features/Workload/SidePanel',
  component: SidePanel,
  tags: ['autodocs'],
  args: {
    tab: 'projects',
    onTabChange: fn(),
    projectsContent: React.createElement('div', { className: 'p-4' }, 'プロジェクト一覧'),
    indirectContent: React.createElement('div', { className: 'p-4' }, '間接業務設定'),
    settingsContent: React.createElement('div', { className: 'p-4' }, '設定パネル'),
    children: React.createElement('div', { className: 'p-8' }, 'メインコンテンツ'),
  },
} satisfies Meta<typeof SidePanel>

export default meta
type Story = StoryObj<typeof meta>

export const ProjectsTab: Story = {
  args: { tab: 'projects' },
}

export const IndirectTab: Story = {
  args: { tab: 'indirect' },
}

export const SettingsTab: Story = {
  args: { tab: 'settings' },
}
