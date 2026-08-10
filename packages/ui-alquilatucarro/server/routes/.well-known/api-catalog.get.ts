/**
 * RFC 9727 API Catalog — application/linkset+json for public discovery.
 * Lists only read-only public surfaces (no admin/SEO/write reservation APIs).
 */
export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin

  setHeader(
    event,
    'Content-Type',
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
  )
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  // HEAD / GET both get Link relation per RFC 9727 §2
  setHeader(event, 'Link', `</.well-known/api-catalog>; rel="api-catalog"`)

  return {
    linkset: [
      {
        anchor: `${origin}/api/rentacar-data`,
        'service-desc': [
          {
            href: `${origin}/openapi.json`,
            type: 'application/json',
          },
        ],
        'service-doc': [
          {
            href: `${origin}/llms.txt`,
            type: 'text/plain',
          },
        ],
        status: [
          {
            href: `${origin}/api/rentacar-data`,
            type: 'application/json',
          },
        ],
      },
      {
        anchor: `${origin}/api/city-testimonials`,
        'service-desc': [
          {
            href: `${origin}/openapi.json`,
            type: 'application/json',
          },
        ],
        'service-doc': [
          {
            href: `${origin}/llms.txt`,
            type: 'text/plain',
          },
        ],
      },
      {
        anchor: `${origin}/llms.txt`,
        'service-desc': [
          {
            href: `${origin}/openapi.json`,
            type: 'application/json',
          },
        ],
        'service-doc': [
          {
            href: `${origin}/`,
            type: 'text/html',
          },
        ],
      },
    ],
  }
})
