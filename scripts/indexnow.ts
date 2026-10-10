/**
 * Manual IndexNow submissions (Bing and partners; Google does not use it).
 *
 *   pnpm indexnow --brand=alquilame --sitemap              # every URL in the live sitemap
 *   pnpm indexnow --brand=alquilame --url=https://alquilame.co/bogota [--url=...]
 *
 * Articles published with `pnpm blog:publish` are submitted automatically.
 */
import {
  INDEXNOW_SITES,
  isIndexNowBrand,
  sitemapLocs,
  submitToIndexNow,
} from '../packages/logic/src/utils/indexNow'

async function main() {
  const args = process.argv.slice(2)
  const values = (name: string) => args.filter(a => a.startsWith(`--${name}=`)).map(a => a.slice(name.length + 3))
  const brand = values('brand')[0] ?? ''

  if (!isIndexNowBrand(brand)) {
    console.error(`❌ --brand debe ser una de: ${Object.keys(INDEXNOW_SITES).join(', ')}`)
    process.exit(1)
  }

  let urls = values('url')
  if (args.includes('--sitemap')) {
    const sitemap = `https://${INDEXNOW_SITES[brand].host}/sitemap.xml`
    const response = await fetch(sitemap)
    if (!response.ok) {
      console.error(`❌ ${sitemap} respondió ${response.status}`)
      process.exit(1)
    }
    urls = [...urls, ...sitemapLocs(await response.text())]
  }

  if (!urls.length) {
    console.error('❌ nada que enviar: usa --sitemap o --url=<url>')
    process.exit(1)
  }

  const result = await submitToIndexNow(brand, urls)
  console.log(`${result.ok ? '✅' : '❌'} IndexNow ${result.status} · ${result.submitted.length} URL(s) de ${INDEXNOW_SITES[brand].host}`)
  if (!result.ok) process.exit(1)
}

main()
