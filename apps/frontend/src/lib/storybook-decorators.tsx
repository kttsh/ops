import type { Decorator } from '@storybook/react-vite'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import React from 'react'

export const withRouter: Decorator = (Story) => {
  const rootRoute = createRootRoute({
    component: Story,
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return React.createElement(RouterProvider, { router })
}
