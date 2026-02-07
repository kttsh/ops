import { http, HttpResponse } from 'msw'
import { mockWorkTypes } from './data'

export const workTypesHandlers = [
  http.get('/api/work-types', () => {
    return HttpResponse.json({
      data: mockWorkTypes,
    })
  }),
]
