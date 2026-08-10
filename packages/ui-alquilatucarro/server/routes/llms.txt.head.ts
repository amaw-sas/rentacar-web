/**
 * HEAD /llms.txt — nuxt-llms@0.1.3 only registers GET (`llms.txt.get`), so HEAD
 * returns 404. Agent discovery (isitagentready Link headers, cheap existence
 * probes) often uses HEAD first. Mirror GET status + Content-Type with no body.
 *
 * Keep Content-Type in sync with nuxt-llms GET handler:
 * `text/plain; charset=utf-8`.
 */
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseStatus(event, 200)
  return null
})
