/**
 * Minimal OpenAPI 3.1 for public read-only catalog endpoints agents may call.
 * Intentionally omits admin/SEO and write/reservation endpoints.
 */
export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin

  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')

  return {
    openapi: '3.1.0',
    info: {
      title: 'Alquilatucarro public API',
      version: '1.0.0',
      description:
        'Read-only catalog surfaces for car rental search context in Colombia. Reservations are completed on the website form, not via this API.',
      contact: { url: origin },
    },
    servers: [{ url: origin }],
    paths: {
      '/api/rentacar-data': {
        get: {
          operationId: 'getRentacarData',
          summary: 'Fleet catalog, cities, branches, extras and FAQs',
          description:
            'JSON catalog used by the booking UI. Categories, branches, cities, extras and FAQs for the current brand franchise.',
          responses: {
            '200': {
              description: 'Catalog snapshot',
              content: {
                'application/json': {
                  schema: { type: 'object', additionalProperties: true },
                },
              },
            },
            '504': { description: 'Upstream catalog timeout' },
          },
        },
      },
      '/api/city-testimonials': {
        get: {
          operationId: 'getCityTestimonials',
          summary: 'Testimonials for a city landing',
          parameters: [
            {
              name: 'city',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'City slug (e.g. bogota)',
            },
          ],
          responses: {
            '200': {
              description: 'Testimonial list',
              content: {
                'application/json': {
                  schema: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
      },
      '/llms.txt': {
        get: {
          operationId: 'getLlmsTxt',
          summary: 'LLM-oriented site overview (llmstxt.org)',
          responses: {
            '200': {
              description: 'Plain-text / markdown-ish site map for agents',
              content: { 'text/plain': { schema: { type: 'string' } } },
            },
          },
        },
      },
    },
  }
})
