import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import React from 'react'
import { WorkloadChart } from './WorkloadChart'
import { mockMonthlyDataPoints, mockSeriesConfig } from './__mocks__/data'

const meta = {
  title: 'Features/Workload/WorkloadChart',
  component: WorkloadChart,
  tags: ['autodocs'],
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        { style: { width: '100%', height: 500 } },
        React.createElement(Story),
      ),
  ],
} satisfies Meta<typeof WorkloadChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: mockMonthlyDataPoints,
    seriesConfig: mockSeriesConfig,
    activeMonth: null,
    dispatch: fn(),
  },
}

export const WithActiveMonth: Story = {
  args: {
    data: mockMonthlyDataPoints,
    seriesConfig: mockSeriesConfig,
    activeMonth: '202506',
    dispatch: fn(),
  },
}

export const Fetching: Story = {
  args: {
    data: mockMonthlyDataPoints,
    seriesConfig: mockSeriesConfig,
    activeMonth: null,
    dispatch: fn(),
    isFetching: true,
  },
}

export const Empty: Story = {
  args: {
    data: [],
    seriesConfig: { areas: [], lines: [] },
    activeMonth: null,
    dispatch: fn(),
  },
}
