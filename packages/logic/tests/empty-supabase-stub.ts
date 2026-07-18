import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * The apps fail loudly when their catalog dependency is unavailable. These
 * SEO tests do not need catalog rows, so provide an empty PostgREST boundary
 * instead of depending on repository secrets or an external service.
 */
export async function startEmptySupabaseStub() {
  const server = createServer((request, response) => {
    response.setHeader('content-type', 'application/json')

    if (!request.url?.startsWith('/rest/v1/')) {
      response.statusCode = 404
      response.end(JSON.stringify({ message: 'Not found' }))
      return
    }

    if (request.headers.accept?.includes('application/vnd.pgrst.object+json')) {
      response.statusCode = 406
      response.end(
        JSON.stringify({
          code: 'PGRST116',
          details: 'The result contains 0 rows',
          hint: null,
          message: 'JSON object requested, multiple (or no) rows returned',
        }),
      )
      return
    }

    response.setHeader('content-range', '*/0')
    response.end('[]')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}
