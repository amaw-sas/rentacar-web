export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // Reemplazar lang="en" con lang="es" en el tag HTML
    // htmlAttrs puede ser array o objeto según versión de Nitro
    if (Array.isArray(html.htmlAttrs)) {
      html.htmlAttrs = html.htmlAttrs.map((attr: string) => {
        return attr.replace(/lang="en"/, 'lang="es"')
      })
    } else if (html.htmlAttrs && typeof html.htmlAttrs === 'object') {
      html.htmlAttrs = { ...html.htmlAttrs, lang: 'es' }
    }
  })
})
