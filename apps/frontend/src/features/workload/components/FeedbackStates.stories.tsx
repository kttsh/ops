import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import React from 'react'
import {
  SkeletonChart,
  SkeletonTable,
  EmptyState,
  BuEmptyState,
  NoDataState,
  NoSearchResults,
  ErrorState,
  OverlaySpinner,
} from './FeedbackStates'

// SkeletonChart
const skeletonChartMeta = {
  title: 'Features/Workload/FeedbackStates/SkeletonChart',
  component: SkeletonChart,
  tags: ['autodocs'],
} satisfies Meta<typeof SkeletonChart>

export default skeletonChartMeta
type SkeletonChartStory = StoryObj<typeof skeletonChartMeta>

export const SkeletonChartDefault: SkeletonChartStory = {}

// To show all feedback states in one file, we use named exports.
// Storybook CSF3 requires one default export per file.
// Additional components are shown via render functions.

export const SkeletonTableDefault: StoryObj = {
  render: () => React.createElement(SkeletonTable),
}

export const EmptyStateDefault: StoryObj = {
  render: () =>
    React.createElement(EmptyState, {
      message: 'データがありません',
      description: '条件を変更してお試しください',
    }),
}

export const BuEmptyStateDefault: StoryObj = {
  render: () => React.createElement(BuEmptyState),
}

export const NoDataStateDefault: StoryObj = {
  render: () => React.createElement(NoDataState),
}

export const NoSearchResultsDefault: StoryObj = {
  render: () => React.createElement(NoSearchResults),
}

export const ErrorStateDefault: StoryObj = {
  render: () =>
    React.createElement(ErrorState, {
      message: 'データの取得に失敗しました',
      onRetry: fn(),
    }),
}

export const OverlaySpinnerDefault: StoryObj = {
  render: () =>
    React.createElement(
      'div',
      { className: 'relative h-64 w-full border rounded' },
      React.createElement('p', { className: 'p-4' }, 'コンテンツの上にオーバーレイ'),
      React.createElement(OverlaySpinner),
    ),
}
