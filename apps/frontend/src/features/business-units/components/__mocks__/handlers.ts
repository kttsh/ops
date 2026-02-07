import { http, HttpResponse } from 'msw'
import { mockBusinessUnits } from './data'

export const businessUnitsHandlers = [
  http.get('/api/business-units', () => {
    return HttpResponse.json({
      data: mockBusinessUnits,
      meta: { total: mockBusinessUnits.length, page: 1, pageSize: 20 },
    })
  }),
  http.get('/api/business-units/select', () => {
    return HttpResponse.json({
      data: mockBusinessUnits.map((bu) => ({
        value: bu.businessUnitCode,
        label: bu.name,
      })),
    })
  }),
  http.get('/api/business-units/:code', ({ params }) => {
    const unit = mockBusinessUnits.find(
      (u) => u.businessUnitCode === params.code,
    )
    return unit
      ? HttpResponse.json({ data: unit })
      : new HttpResponse(null, { status: 404 })
  }),
]
