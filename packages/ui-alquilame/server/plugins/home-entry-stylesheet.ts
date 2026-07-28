import { getRequestURL } from 'h3'
import { rewriteHomeEntryStylesheets } from '../utils/home-entry-stylesheet'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    html.head = rewriteHomeEntryStylesheets(getRequestURL(event).pathname, html.head)
  })
})
