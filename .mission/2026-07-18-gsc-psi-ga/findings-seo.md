# A2 — SEO / Google Search Console repo + live audit

Audit date: 2026-07-18  
Live target: `https://alquilatucarro.com`  
Repo revision audited: `d697bc5` (`audit-seo` worktree)  
Scope: the three Nuxt brand packages plus shared `packages/logic`, with live `curl`/SSR evidence.

## Executive summary

No P0 was found: the live primary domain is crawlable, uses apex/HTTPS redirects, emits self-canonicals on city pages, and returns real 404s for unknown city/blog URLs. I found **13 actionable findings: 8 P1 and 5 P2**.

The strongest candidates for the existing GSC buckets are:

- **14 soft-404:** arbitrary `/reservado/{anything}` URLs return a convincing 200 confirmation page (F4).
- **179 pages with redirect:** client CTAs deliberately generate obsolete branch-code/time URLs that redirect before resolving (F3), in addition to the known slash variants (F2).
- **82 crawled, not indexed:** inconsistent prices (F5), semantic/unsupported schema claims (F6), and highly similar metro-pair landing pages (F8) are quality-risk candidates.
- **303 alternate pages with proper canonical:** dated search-result URLs intentionally canonicalize to the city landing page. That behavior is internally consistent and should not be “fixed” without changing the product/indexing strategy.

The GSC URL exports were not available to A2, so the bucket associations above are evidence-backed hypotheses, not claims that every URL in a bucket has been identified. Cross-match F3/F4/F8 against `findings-console.md` when the console export is available.

## Findings

### F1 — The sitemap advertises two pages that explicitly say `noindex`

**Severity: P1**

Nuxt Sitemap route discovery adds page routes beyond the static `urls` list. The live sitemap therefore includes `/chat` and `/tiktok`, even though both pages emit `noindex, nofollow`. This is a direct contradictory crawl signal and explains why at least one noindex URL can be submitted/discovered through the sitemap.

**Evidence — command and output**

```text
$ curl -sS https://alquilatucarro.com/sitemap.xml | tr '>' '>\n' | rg -o '<loc>[^<]+/(chat|tiktok)</loc>'
<loc>https://alquilatucarro.com/chat</loc>
<loc>https://alquilatucarro.com/tiktok</loc>

$ for p in /chat /tiktok; do curl -sS "https://alquilatucarro.com$p" | rg -o '<meta[^>]+name="robots"[^>]+>'; done
<meta name="robots" content="noindex, nofollow">
<meta name="robots" content="noindex, nofollow">

$ rg -n "exclude:|robots: 'noindex" packages/ui-alquilatucarro/{nuxt.config.ts,app/pages/chat.vue,app/pages/tiktok.vue}
packages/ui-alquilatucarro/nuxt.config.ts:731:    exclude: ['/pendiente', '/sindisponibilidad', '/reservado/**', '/*/buscar-vehiculos/**', '/seo/**'],
packages/ui-alquilatucarro/app/pages/chat.vue:17:useSeoMeta({ title: 'Chat', robots: 'noindex, nofollow' })
packages/ui-alquilatucarro/app/pages/tiktok.vue:101:  robots: 'noindex, nofollow',
```

**Exact proposed fix (file + change)**

- `packages/ui-alquilatucarro/nuxt.config.ts`: add `'/chat'` and `'/tiktok'` to `sitemap.exclude`.
- `packages/ui-alquilame/nuxt.config.ts` and `packages/ui-alquicarros/nuxt.config.ts`: add `'/chat'` to `sitemap.exclude`; both packages contain the same noindex chat page.
- Add a sitemap test that builds/reads the generated XML and asserts every sitemap URL is 200, canonical, and does not contain an HTML `noindex` directive.

### F2 — Slash and slashless city URLs are both indexable 200 responses

**Severity: P1**

The canonical tag limits index duplication, but it does not prevent Google from crawling both URL forms. The right fix is an edge-level permanent redirect. On Vercel, `trailingSlash: false` produces a permanent 308 for trailing-slash paths; 308 is preferable to a function 301 because it preserves the request method/body.

**Evidence — command and output**

```text
$ for u in https://alquilatucarro.com/bogota https://alquilatucarro.com/bogota/; do curl -sSI "$u" | rg -i '^(HTTP/|location:|x-robots-tag:)'; done
HTTP/2 200
x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
HTTP/2 200
x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1

$ curl -sS https://alquilatucarro.com/bogota/ | rg -o '<link[^>]+rel="canonical"[^>]+>' | head -1
<link rel="canonical" href="https://alquilatucarro.com/bogota">

$ rg --files -g 'vercel.json'; rg -n 'trailingSlash' packages/*/nuxt.config.ts
# no output
```

**Exact proposed fix (file + change)**

Create `vercel.json` in each Vercel project root (`packages/ui-alquilatucarro/vercel.json`, `packages/ui-alquilame/vercel.json`, and `packages/ui-alquicarros/vercel.json` if those directories are the configured Vercel roots):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "trailingSlash": false
}
```

Confirm the actual Root Directory in each Vercel project before placing the file. Verify on preview that `/bogota/` returns `308 Location: /bogota` and preserves query strings. Do not implement this as a Nuxt function middleware. Reference: [Vercel project configuration — trailingSlash](https://vercel.com/docs/project-configuration/vercel-json).

### F3 — Shared city CTAs generate obsolete URLs that immediately redirect

**Severity: P1**

`buildCityReservationURL` serializes the internal branch code and raw `12:00` hour. The live resolver then changes the code to the public slug and the hour to `12:00pm`, producing an avoidable 302. The same shared helper is used by Alquilame and Alquicarros even though those brands explicitly redirect the entire legacy `/{city}/buscar-vehiculos/**` surface to `/reservas/**`. JS-capable crawlers can discover these dated deep links, creating a large redirect/canonical crawl space.

**Evidence — command and output**

```text
$ rg -n 'branch.code|return `/' packages/logic/src/utils/buildCityReservationURL.ts
47:  const code = branch.code.toLowerCase();
48:  return `/${city.id}/buscar-vehiculos/lugar-recogida/${code}/lugar-devolucion/${code}/.../hora-recogida/${dates.initHour}/hora-devolucion/${dates.endHour}`;

$ curl -sSIL 'https://alquilatucarro.com/bogota/buscar-vehiculos/lugar-recogida/aabot/lugar-devolucion/aabot/fecha-recogida/2026-08-20/fecha-devolucion/2026-08-23/hora-recogida/12:00/hora-devolucion/12:00' | rg -i '^(HTTP/|location:)'
HTTP/2 302
location: /bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-08-20/fecha-devolucion/2026-08-23/hora-recogida/12:00pm/hora-devolucion/12:00pm
HTTP/2 200

$ rg -n 'target =|sendRedirect' packages/ui-{alquilame,alquicarros}/server/middleware/redirect-buscar-vehiculos.ts
packages/ui-alquilame/server/middleware/redirect-buscar-vehiculos.ts:24:  const target = `/reservas${rest ? `/${rest}` : ''}${search}`
packages/ui-alquilame/server/middleware/redirect-buscar-vehiculos.ts:25:  return sendRedirect(event, target, 301)
packages/ui-alquicarros/server/middleware/redirect-buscar-vehiculos.ts:24:  const target = `/reservas${rest ? `/${rest}` : ''}${search}`
packages/ui-alquicarros/server/middleware/redirect-buscar-vehiculos.ts:25:  return sendRedirect(event, target, 301)
```

**Exact proposed fix (file + change)**

- `packages/logic/src/utils/buildCityReservationURL.ts`: serialize `branch.slug` (fall back to the code only if no slug exists), normalize hours to the route's final representation, and accept a route-surface option such as `'city-search' | 'reservas'`.
- `packages/ui-alquilatucarro/app/layouts/default.vue` and `app/pages/tiktok.vue`: request the `city-search` surface.
- `packages/ui-alquilame/app/layouts/default.vue` and `packages/ui-alquicarros/app/layouts/default.vue`: request the `/reservas` surface directly; do not generate a URL that their own middleware redirects.
- Update `packages/logic/src/utils/__tests__/buildCityReservationURL.test.ts` to expect public slugs, normalized hours, and both brand route surfaces. Keep the legacy redirect middleware only for old external links.

### F4 — Any reservation code returns a 200 “confirmed” page

**Severity: P1**

This is a concrete soft-404 generator. An arbitrary string returns 200 and a success H1; the page merely echoes `route.params.reserveCode` and performs no SSR validation. Although the HTML contains `noindex`, the HTTP header simultaneously says `index, follow` (also covered by F10). Search engines can generate an effectively unbounded set of thin, duplicate success URLs.

**Evidence — command and output**

```text
$ curl -sS -o /tmp/page.html -w '%{http_code}\n' https://alquilatucarro.com/reservado/CODIGO-INEXISTENTE-XYZ
200
$ curl -sSI https://alquilatucarro.com/reservado/CODIGO-INEXISTENTE-XYZ | rg -i '^(HTTP/|x-robots-tag:)'
HTTP/2 200
x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
$ rg -o '<h1[^>]*>[^<]+' /tmp/page.html
<h1 class="text-3xl font-bold mb-4">¡Tu reserva está confirmada!

$ rg -n 'reserveCode|createError|useFetch|useAsyncData' packages/ui-alquilatucarro/app/pages/reservado/'[reserveCode]'/index.vue
15:    <p class="text-4xl font-bold mb-8">{{ reserveCode }}</p>
56:const reserveCode = route.params.reserveCode;
# no createError/useFetch/useAsyncData validation
```

**Exact proposed fix (file + change)**

- In all three `packages/ui-*/app/pages/reservado/[reserveCode]/index.vue` files, validate the code server-side before rendering. Reject malformed codes immediately, then perform a privacy-safe server lookup that returns only whether the reservation exists.
- For nonexistent or expired codes, `throw createError({ statusCode: 404, statusMessage: 'Reserva no encontrada' })` (or 410 for intentionally expired URLs); never render the confirmation H1.
- For valid confirmations, add the noindex HTTP route rule specified in F10. Add SSR tests for malformed, well-formed-but-missing, and valid codes.

### F5 — Price claims contradict one another on the same city page

**Severity: P1**

The Bogotá title claims “from $32/day,” the search description calls that `USD`, the visible FAQ says `110,000 COP/day`, and JSON-LD Products start at `220,000 COP/day`. This weakens page trust and makes the Product markup inconsistent with the visible content.

**Evidence — command and output**

```text
$ curl -sS https://alquilatucarro.com/bogota | rg -o '<title>[^<]+' | head -1
<title>Alquiler de Carros en Bogotá desde $32&#x2F;día | Alquilatucarro

$ URL='https://alquilatucarro.com/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-08-20/fecha-devolucion/2026-08-23/hora-recogida/12:00pm/hora-devolucion/12:00pm'
$ curl -sS "$URL" | rg -o '<meta[^>]+name="description"[^>]+>'
<meta name="description" content="Busca y compara vehículos disponibles en Bogotá. Sedanes, compactos, SUVs y camionetas con precios desde $32 USD/día.">

$ node --input-type=module <<'NODE'
const h=await(await fetch('https://alquilatucarro.com/bogota')).text()
const g=JSON.parse([...h.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)][0][1])['@graph']
for(const n of g.filter(n=>n['@type']==='Product')) console.log(`Product ${n.name}: ${n.offers.price} ${n.offers.priceCurrency} ${n.offers.availability}`)
const faq=g.find(n=>n['@type']==='FAQPage').mainEntity.find(q=>q.name.includes('Cuánto cuesta'))
console.log('FAQ='+JSON.stringify(faq))
NODE
Product Alquiler Económico en Bogotá: 220000 COP https://schema.org/InStock
Product Alquiler Sedán Automático en Bogotá: 300000 COP https://schema.org/InStock
FAQ={"name":"¿Cuánto cuesta alquilar un carro en Bogotá?","acceptedAnswer":{"text":"Los precios en Bogotá inician desde $110.000 COP/día ..."}}

$ rg -n '\$32|110\.000|one_day_price' packages/logic/src/composables/{useCityPageSEO.ts,useSearchPageSEO.ts,useCityFAQs.ts,useCityProductSchema.ts}
packages/logic/src/composables/useCityPageSEO.ts:34:        ? `Alquiler de Carros en ${city.name} desde $32/día`
packages/logic/src/composables/useSearchPageSEO.ts:19:        ? `... precios desde $32 USD/día.`
packages/logic/src/composables/useCityFAQs.ts:28:            content: 'Los precios en Bogotá inician desde $110.000 COP/día ...'
packages/logic/src/composables/useCityProductSchema.ts:58:    const dailyPrice = priceRow.one_day_price
```

**Exact proposed fix (file + change)**

- Immediate safe change in `useCityPageSEO.ts`, `useSearchPageSEO.ts`, and the price answers in `useCityFAQs.ts`: remove numeric “from” prices until a city/date-valid value is available; use copy such as “compara tarifas disponibles”.
- Durable change: add a shared SSR price-claim composable backed by the same availability/category-pricing result used by checkout. It must return currency, amount, city applicability, and validity; use that single value in title/description, visible FAQ, and schema.
- If no city-valid price exists, omit the numeric claim and omit the corresponding schema Offer. Do not convert a global category price into a city availability claim.

### F6 — JSON-LD is syntactically valid, but Product and AutoRental semantics are not supported by the page/business model

**Severity: P2**

All sitemap JSON-LD blocks parse, so this is not a JSON syntax defect. The semantic problem is that every page declares the digital intermediary as `AutoRental`, while a city-page comment explicitly says the business is an aggregator and removes LocalBusiness. City pages also emit four `Product`/`InStock` offers whose exact prices are absent from the visible `<main>` and are not city/date inventory.

**Evidence — command and output**

```text
$ node --input-type=module <<'NODE'
const x=await(await fetch('https://alquilatucarro.com/sitemap.xml')).text()
const urls=[...x.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]); let blocks=0,errors=[]
for(const u of urls){const h=await(await fetch(u)).text();for(const m of h.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)){blocks++;try{JSON.parse(m[1])}catch(e){errors.push(`${u}: ${e.message}`)}}}
console.log(`urls=${urls.length} jsonld_blocks=${blocks} parse_errors=${errors.length}`)
NODE
urls=42 jsonld_blocks=42 parse_errors=0

$ node --input-type=module <<'NODE'
const h=await(await fetch('https://alquilatucarro.com/bogota')).text()
const blocks=[...h.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]))
const nodes=blocks.flatMap(x=>x['@graph']||[x])
console.log(`/bogota blocks=${blocks.length} valid_json=yes nodes=${nodes.length} types=${nodes.map(n=>n['@type']).filter(Boolean).join(',')}`)
for(const n of nodes.filter(n=>n['@type']==='Product')) console.log(`Product ${n.name}: ${n.offers.price} ${n.offers.priceCurrency} ${n.offers.availability}`)
NODE
/bogota blocks=1 valid_json=yes nodes=17 types=WebSite,WebPage,Organization,AutoRental,BreadcrumbList,FAQPage,Product,Product,Product,Product,ImageObject,Organization,ImageObject,ImageObject,ImageObject,ImageObject,ImageObject
Product Alquiler Económico en Bogotá: 220000 COP https://schema.org/InStock
Product Alquiler Sedán Automático en Bogotá: 300000 COP https://schema.org/InStock
Product Alquiler Camioneta SUV en Bogotá: 550000 COP https://schema.org/InStock
Product Alquiler Camioneta Premium en Bogotá: 570000 COP https://schema.org/InStock

$ node --input-type=module <<'NODE'
const h=await(await fetch('https://alquilatucarro.com/bogota')).text(); const main=(h.match(/<main[^>]*>([\s\S]*?)<\/main>/)||[])[1]||''
for(const token of ['220000','300000','550000','570000']) console.log(`${token}: main=${main.includes(token)} full_html=${h.includes(token)}`)
NODE
220000: main=false full_html=true
300000: main=false full_html=true
550000: main=false full_html=true
570000: main=false full_html=true
550000: main=false full_html=true
570000: main=false full_html=true

$ rg -n 'AutoRental|LocalBusiness removido|availability:' packages/logic/src/composables/{useBaseSEO.ts,useCityPageSEO.ts,useCityProductSchema.ts}
packages/logic/src/composables/useBaseSEO.ts:50:        <AutoRental>{
packages/logic/src/composables/useCityPageSEO.ts:73:        // LocalBusiness removido: modelo de negocio es agregador digital, no sedes físicas
packages/logic/src/composables/useCityProductSchema.ts:84:        availability: 'https://schema.org/InStock',
```

**Exact proposed fix (file + change)**

- `packages/logic/src/composables/useBaseSEO.ts`: remove the page-wide `AutoRental` node if AMAW is the booking intermediary rather than the direct rental business. Model the offer as a `Service` provided/brokered by the canonical `Organization`; retain `ReserveAction` on `Service` or `WebSite`.
- `packages/logic/src/composables/useCityProductSchema.ts`: remove generic city `Product` nodes until the SSR-visible page shows the same category, price, currency, validity, and availability. Prefer `Service` + real `Offer` for a rental service. Never hardcode `InStock` without city/date inventory.
- Validate the resulting graph in Schema.org/Rich Results tooling on a Vercel preview. Syntax success alone is insufficient.

### F7 — Structured identity fields create an incorrect WebPage title and untyped brand relationships

**Severity: P2**

The live WebPage graph has the correct `name` from the page meta but an extra `title: "AMAW SAS"`. TypeScript casts for `Brand` do not serialize an `@type`, and `subOrganization` is populated with bare brand-name objects rather than Organizations.

**Evidence — command and output**

```text
$ node --input-type=module <<'NODE'
const h=await(await fetch('https://alquilatucarro.com/bogota')).text()
const graph=JSON.parse([...h.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)][0][1])['@graph']
const w=graph.find(n=>n['@type']==='WebPage'); console.log(JSON.stringify({type:w['@type'],name:w.name,title:w.title,url:w.url}))
NODE
{"type":"WebPage","name":"Alquiler de Carros en Bogotá desde $32/día","title":"AMAW SAS","url":"https://alquilatucarro.com/bogota"}

$ sed -n '33,52p' packages/logic/src/composables/useBaseSEO.ts
    useSchemaOrg([
        defineWebSite({ inLanguage: "es" }),
        defineWebPage({
            title: organization.name,
        }),
        defineOrganization({
            name: "AMAW SAS",
            ...
            brand: <Brand>{ name: organization.brand },
            subOrganization: organization.otherbrands.map((brand: string) => (<Brand>{
                name: brand
            }))
```

**Exact proposed fix (file + change)**

- `packages/logic/src/composables/useBaseSEO.ts`: call `defineWebPage()` without the organization title and allow the page head to supply its name/title.
- Emit runtime objects with `{'@type': 'Brand', name, url}`; a TypeScript cast alone has no runtime effect.
- Remove brands from `subOrganization`. Use a `brand` relationship for brands, or emit actual `Organization` nodes with stable `@id`/URL only if they truly are subsidiaries. Give AMAW and each public brand one stable canonical entity ID and reuse it from seller/provider references.

### F8 — City pages are not thin globally, but three metro pairs have high template overlap

**Severity: P1**

The requested 19-city duplicate audit found **zero exact duplicate titles and zero exact duplicate descriptions**, and each page has substantial SSR-visible content. The quality risk is localized: Bucaramanga/Floridablanca and Barranquilla/Soledad share 31.7% and 25.0% of their five-word shingles respectively, with Cali/Palmira next at 18.7%. Each smaller city has a real branch, so blanket noindex or canonicalization to its metro is not justified; the page needs distinct user value instead of more templated prose.

**Evidence — command and output**

```text
$ node --input-type=module <<'NODE'
const cities=['armenia','barranquilla','bogota','bucaramanga','cali','cartagena','cucuta','floridablanca','ibague','manizales','medellin','monteria','neiva','palmira','pereira','santa-marta','soledad','valledupar','villavicencio']
const decode=s=>s.replaceAll('&#x2F;','/').replaceAll('&amp;','&').replace(/&[^;]+;/g,' '); const rows=[]
for(const city of cities){const html=await(await fetch('https://alquilatucarro.com/'+city)).text();const title=decode((html.match(/<title>(.*?)<\/title>/s)||[])[1]||''),desc=decode((html.match(/<meta name="description" content="(.*?)"/s)||[])[1]||'');const main=decode((html.match(/<main[^>]*>(.*?)<\/main>/s)||[])[1]||'').replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').toLowerCase();const words=main.match(/[\p{L}\p{N}]+/gu)||[],sh=new Set();for(let i=0;i+4<words.length;i++)sh.add(words.slice(i,i+5).join(' '));rows.push({city,title,desc,words:words.length,sh})}
console.log(`cities=${rows.length} duplicate_titles=${rows.length-new Set(rows.map(x=>x.title)).size} duplicate_descriptions=${rows.length-new Set(rows.map(x=>x.desc)).size}`)
console.log(`title_length=${Math.min(...rows.map(x=>x.title.length))}-${Math.max(...rows.map(x=>x.title.length))} description_length=${Math.min(...rows.map(x=>x.desc.length))}-${Math.max(...rows.map(x=>x.desc.length))} main_visible_words=${Math.min(...rows.map(x=>x.words))}-${Math.max(...rows.map(x=>x.words))}`)
const pairs=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){const a=rows[i].sh,b=rows[j].sh;let n=0;for(const x of a)if(b.has(x))n++;pairs.push({p:`${rows[i].city}/${rows[j].city}`,j:n/(a.size+b.size-n)})}pairs.sort((a,b)=>b.j-a.j);console.log(`5word_jaccard_pairs=${pairs.length} avg=${(pairs.reduce((s,x)=>s+x.j,0)/pairs.length).toFixed(3)} max=${pairs[0].j.toFixed(3)} min=${pairs.at(-1).j.toFixed(3)}`);console.log(pairs.slice(0,4).map(x=>`${x.p}=${x.j.toFixed(3)}`).join('\n'))
NODE
cities=19 duplicate_titles=0 duplicate_descriptions=0
title_length=57-66 description_length=147-157 main_visible_words=737-852
5word_jaccard_pairs=171 avg=0.145 max=0.317 min=0.116
bucaramanga/floridablanca=0.317
barranquilla/soledad=0.250
cali/palmira=0.187
cucuta/valledupar=0.175

$ node --input-type=module <<'NODE'
const d=await(await fetch('https://alquilatucarro.com/api/rentacar-data')).json()
for(const city of ['bucaramanga','floridablanca','barranquilla','soledad','cali','palmira']) console.log(city,d.branches.filter(b=>b.city===city).length)
NODE
bucaramanga 1
floridablanca 1
barranquilla 2
soledad 1
cali 3
palmira 1

$ printf 'city content keys='; rg -c "^    '[^']+': \{" packages/logic/src/composables/useCityContent.ts
city content keys=19
$ printf 'city FAQ keys='; rg -c "^    '[^']+': \[" packages/logic/src/composables/useCityFAQs.ts
city FAQ keys=19
```

**Exact proposed fix (file + change)**

- Prioritize `Bucaramanga/Floridablanca`, `Barranquilla/Soledad`, and `Cali/Palmira` in `packages/logic/src/composables/useCityContent.ts` and `useCityFAQs.ts`.
- Replace shared tourist boilerplate with data-backed local value: that city's actual pickup branch name/address/hours, city-specific current categories/availability, delivery radius/policies, distinct route/toll/parking guidance, and unique local proof/testimonials. Render those facts SSR in the city page.
- Add a content audit test/tool alongside the city-content tests that asserts all 19 mapped cities have content/FAQ data, flags exact meta duplicates, and reports main-content similarity above an agreed threshold. Do not solve this by merely increasing word count.

### F9 — City snippets are templated/long, and several non-city titles duplicate the brand suffix

**Severity: P2**

There are no exact title/description duplicates across the 19 city pages, but all titles use the same price template; 10 of 19 exceed 60 characters. The truncation helper accepts 155 characters and then appends `...`, producing descriptions up to 157 characters. Separately, page files include the brand in their title even though Nuxt's global title template adds it again.

**Evidence — command and output**

```text
$ node --input-type=module <<'NODE'
const cities=['armenia','barranquilla','bogota','bucaramanga','cali','cartagena','cucuta','floridablanca','ibague','manizales','medellin','monteria','neiva','palmira','pereira','santa-marta','soledad','valledupar','villavicencio']
for(const c of cities){const h=await(await fetch('https://alquilatucarro.com/'+c)).text();const t=((h.match(/<title>(.*?)<\/title>/s)||[])[1]||'').replace('&#x2F;','/'),d=(h.match(/<meta name="description" content="(.*?)"/s)||[])[1]||'';console.log(`${c} title=${t.length} desc=${d.length}`)}
NODE
armenia title=60 desc=157
barranquilla title=65 desc=155
bucaramanga title=64 desc=156
floridablanca title=66 desc=153
villavicencio title=66 desc=155
# output excerpt; aggregate is title=57-66, description=147-157; 10 titles are >60

$ for p in /politica-privacidad /terminos-condiciones /blog /gana /tiktok; do curl ...; done
/politica-privacidad  Política de Privacidad | Alquilatucarro | Alquilatucarro
/terminos-condiciones Términos y Condiciones | Alquilatucarro | Alquilatucarro
/blog                 Blog - Guías y Tips de Alquiler de Carros | alquilatucarro | Alquilatucarro
/gana                 Programa de Referidos - Gana Comisiones | alquilatucarro | Alquilatucarro
/tiktok               Alquila tu carro en tu ciudad | Alquilatucarro | Alquilatucarro

$ rg -n 'title:.*franchise|title:.*Alquilatucarro' packages/ui-alquilatucarro/app/pages/{blog/index.vue,politica-privacidad.vue,terminos-condiciones.vue,gana/index.vue,tiktok.vue}
packages/ui-alquilatucarro/app/pages/blog/index.vue:375:  title: `Blog - Guías y Tips de Alquiler de Carros | ${franchise.shortname}`,
packages/ui-alquilatucarro/app/pages/politica-privacidad.vue:129:  title: 'Política de Privacidad | Alquilatucarro',
packages/ui-alquilatucarro/app/pages/terminos-condiciones.vue:175:  title: 'Términos y Condiciones | Alquilatucarro',
packages/ui-alquilatucarro/app/pages/gana/index.vue:209:  title: `Programa de Referidos - Gana Comisiones | ${franchise.shortname}`,
packages/ui-alquilatucarro/app/pages/tiktok.vue:99:  title: 'Alquila tu carro en tu ciudad | Alquilatucarro',
```

**Exact proposed fix (file + change)**

- `packages/logic/src/composables/useCityPageSEO.ts`: after resolving F5, use a shorter bare page title and let the global template append the brand. Fix `truncateForSEO` to reserve the ellipsis (`maxLength - 3`) or use a word-boundary helper whose final output never exceeds its budget.
- `packages/logic/src/composables/useSearchPageSEO.ts`: use the bare title `Buscar vehículos en ${city.name}` rather than embedding the full `franchise.title` before the global suffix.
- Across all three `packages/ui-*/app/pages` copies of blog, legal, referral, status, and chat pages, remove manually embedded `| ${franchise.shortname}`/brand strings. Keep one central Nuxt title template. Add SSR head tests asserting one brand occurrence and practical title/description budgets.

### F10 — HTML noindex pages receive an `index, follow` HTTP header

**Severity: P2**

Google generally honors the more restrictive directive, but the response is internally contradictory. This affects `/chat`, `/tiktok`, and reservation/status pages. It also makes the sitemap contradiction in F1 more severe.

**Evidence — command and output**

```text
$ for p in /chat /tiktok /reservado/CODIGO-INEXISTENTE-XYZ; do curl -sSI "https://alquilatucarro.com$p" | rg -i '^(HTTP/|x-robots-tag:)'; curl -sS "https://alquilatucarro.com$p" | rg -o '<meta[^>]+name="robots"[^>]+>'; done
HTTP/2 200
x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
<meta name="robots" content="noindex, nofollow">
HTTP/2 200
x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
<meta name="robots" content="noindex, nofollow">
HTTP/2 200
x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
<meta name="robots" content="noindex, nofollow">
```

**Exact proposed fix (file + change)**

- In each brand's `nuxt.config.ts` Nitro `routeRules`, add `headers: { 'x-robots-tag': 'noindex, nofollow' }` for `/chat`, `/pendiente`, `/sindisponibilidad`, and `/reservado/**`; add `/tiktok` for Alquilatucarro.
- Keep these routes excluded from sitemap generation (complete F1 for chat/tiktok). Preview-test the final response header because `@nuxtjs/robots` also emits a default index header.
- The `/seo` admin area is already blocked in `robots.txt`, omitted from the sitemap, and sends noindex; leave it private. If GSC's single noindex row is an `/seo` URL already known to Google, use URL removal/serve 404 rather than exposing admin content merely for recrawl.

### F11 — The indexable referral landing page is absent from the sitemap

**Severity: P2**

`/gana` is a self-canonical, 200 marketing page, but it is absent from the live sitemap and from all three static sitemap URL lists. Its legal children may intentionally stay out; the main acquisition page should be submitted if it is intended for organic discovery.

**Evidence — command and output**

```text
$ p=/gana; curl -sS https://alquilatucarro.com/sitemap.xml | rg -q "<loc>https://alquilatucarro.com${p}</loc>"; echo "sitemap=$?"; curl -sS -o /tmp/gana.html -w 'status=%{http_code}\n' "https://alquilatucarro.com$p"; rg -o '<link[^>]+rel="canonical"[^>]+>' /tmp/gana.html
sitemap=1
status=200
<link rel="canonical" href="https://alquilatucarro.com/gana">

$ rg -n "'/gana'" packages/ui-{alquilatucarro,alquilame,alquicarros}/nuxt.config.ts
# no output
```

**Exact proposed fix (file + change)**

Add `{ loc: '/gana', changefreq: 'monthly', priority: 0.7 }` to `sitemap.urls` in all three brand `nuxt.config.ts` files if referral acquisition is intended to rank. Make an explicit separate decision for `/gana/terminos-condiciones` and `/gana/politicas-privacidad`: either include them as indexable legal pages or mark/exclude them consistently; sitemap inclusion is not required merely because they exist.

### F12 — Canonical-domain redirect behavior differs by brand; copying the old middleware back would regress POSTs

**Severity: P1 (prelaunch)**

Alquilatucarro intentionally removed its function-level www redirect because Vercel already performs a 308. Alquilame and Alquicarros still run a 301 middleware. A 301 can change POST semantics, and this behavior will diverge at launch. The primary package's missing file is deliberate, not an omission.

**Evidence — command and output**

```text
$ for brand in ui-alquilatucarro ui-alquilame ui-alquicarros; do test -f packages/$brand/server/middleware/canonical-redirect.ts && echo "$brand present" || echo "$brand absent"; done
ui-alquilatucarro absent
ui-alquilame present
ui-alquicarros present

$ rg -n 'sendRedirect' packages/ui-{alquilame,alquicarros}/server/middleware/canonical-redirect.ts
packages/ui-alquilame/server/middleware/canonical-redirect.ts:18:    return sendRedirect(event, canonicalUrl, 301)
packages/ui-alquicarros/server/middleware/canonical-redirect.ts:18:    return sendRedirect(event, canonicalUrl, 301)

$ git show -s --format='%h %s%n%b' 6749472
6749472 chore(alquilatucarro): drop redundant canonical-redirect server middleware
Vercel domain config now handles www → apex with a 308 (preserves
POST method + body); the function-level 301 middleware was both
redundant and breaking POSTs through edge.

$ curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' 'https://www.alquilatucarro.com/bogota?utm_source=audit'
308 https://alquilatucarro.com/bogota?utm_source=audit
```

**Exact proposed fix (file + change)**

- Do **not** restore `packages/ui-alquilatucarro/server/middleware/canonical-redirect.ts`.
- Configure Alquilame's Vercel primary domain as apex `alquilame.co`, with www as a 308 alias, matching `packages/ui-alquilame/nuxt.config.ts` and `app/app.config.ts`; then delete `packages/ui-alquilame/server/middleware/canonical-redirect.ts`.
- Decide Alquicarros' primary domain before launch. The repo declares apex in `packages/ui-alquicarros/nuxt.config.ts:526` and `app/app.config.ts:34`; the current live domain redirects apex to www. Default fix: make apex primary, www a 308 alias, then delete `packages/ui-alquicarros/server/middleware/canonical-redirect.ts`. If www is the product decision, first update every site/franchise URL and canonical test to www instead.
- Preview-test GET and POST with query/body preservation after the infrastructure change.

### F13 — The secondary domains are not serving their current Nuxt applications

**Severity: P1 (prelaunch blocker)**

Both secondary roots return 200 holding pages, but city routes, robots, and sitemap return 404. Alquicarros also redirects apex to www, contrary to the repo's apex site URL. This is not a source-code SEO bug; the wrong/old deployment is attached to each production domain.

**Evidence — command and output**

```text
$ for base in https://alquilame.co https://alquicarros.com https://www.alquicarros.com; do for p in / /bogota /robots.txt /sitemap.xml; do curl -sS -o /dev/null -w "$base$p -> %{http_code} %{redirect_url}\n" "$base$p"; done; done
https://alquilame.co/ -> 200
https://alquilame.co/bogota -> 404
https://alquilame.co/robots.txt -> 404
https://alquilame.co/sitemap.xml -> 404
https://alquicarros.com/ -> 308 https://www.alquicarros.com/
https://alquicarros.com/bogota -> 308 https://www.alquicarros.com/bogota
https://www.alquicarros.com/ -> 200
https://www.alquicarros.com/bogota -> 404
https://www.alquicarros.com/robots.txt -> 404
https://www.alquicarros.com/sitemap.xml -> 404

$ rg -n '^    url:' packages/ui-{alquilame,alquicarros}/nuxt.config.ts
packages/ui-alquilame/nuxt.config.ts:524:    url: 'https://alquilame.co',
packages/ui-alquicarros/nuxt.config.ts:526:    url: 'https://alquicarros.com',
```

**Exact proposed fix (file + change)**

- File change: none required to explain the current 404s; the checked-in packages already define city routes, sitemap, and robots.
- In Vercel project settings, set the correct monorepo Root Directory (`packages/ui-alquilame` / `packages/ui-alquicarros`), pnpm install/build commands, and production branch; deploy current main to preview first.
- After resolving F12's primary-domain decision, attach the production domain to that deployment. Gate launch on `/`, `/bogota`, `/blog`, `/robots.txt`, and `/sitemap.xml` returning the expected status/content, plus a full sitemap status/canonical audit.

## Verified controls / non-findings

### Robots is not globally blocking the primary site

```text
$ curl -sS https://alquilatucarro.com/robots.txt
# START nuxt-robots (indexable)
User-agent: *
Allow: /
Disallow: /seo
Disallow: /seo/*

User-agent: OAI-SearchBot
User-agent: PerplexityBot
User-agent: Applebot-Extended
Allow: /

Sitemap: https://alquilatucarro.com/sitemap.xml
# END nuxt-robots
```

This is valid for the public site. `/seo` is an authenticated admin surface and is also excluded from the sitemap. Public noindex response inconsistency is handled separately in F10.

### Sitemap response and canonical coverage are otherwise sound

```text
$ node --input-type=module <<'NODE'
const x=await(await fetch('https://alquilatucarro.com/sitemap.xml')).text(),urls=[...x.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);let statuses={},one=0,none=0,multi=0,mismatch=0,index=0,noindex=0
for(const url of urls){const r=await fetch(url),h=await r.text();statuses[r.status]=(statuses[r.status]||0)+1;const c=[...h.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map(m=>m[1]);c.length===1?one++:c.length?multi++:none++;if(c.length===1&&c[0]!==url)mismatch++;const robot=(h.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/)||[])[1]||'';/noindex/i.test(robot)?noindex++:index++}
console.log(`sitemap_urls=${urls.length} statuses=${JSON.stringify(statuses)}`);console.log(`sitemap_urls=${urls.length} one_canonical=${one} no_canonical=${none} multiple_canonical=${multi} canonical_mismatch=${mismatch}`);console.log(`html_indexable=${index} html_noindex=${noindex}`)
NODE
sitemap_urls=42 statuses={"200":42}
sitemap_urls=42 one_canonical=42 no_canonical=0 multiple_canonical=0 canonical_mismatch=1
html_indexable=40 html_noindex=2
```

The single canonical string mismatch is only root `/` canonicalizing to the equivalent apex without `/`. The two noindex entries are exactly F1's `/chat` and `/tiktok`.

### Canonical host/protocol redirects work on Alquilatucarro

```text
$ curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://alquilatucarro.com/bogota
308 https://alquilatucarro.com/bogota
$ curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' 'https://www.alquilatucarro.com/bogota?utm_source=audit'
308 https://alquilatucarro.com/bogota?utm_source=audit
```

`useCityPageSEO.ts` emits slashless self-canonicals. `useSearchPageSEO.ts` intentionally canonicalizes dated search results back to the city landing page; a live result was 200/index-follow with canonical `/bogota`. This is consistent with GSC's large “alternate page with proper canonical” bucket, not a canonical defect by itself.

### Unknown public routes return real 404s

```text
$ for p in /ciudad-inexistente-a2 /blog/post-inexistente-a2 /bogota/ruta-inexistente-a2 /Bogota; do curl -sS -o /dev/null -w "$p -> %{http_code} %{content_type}\n" "https://alquilatucarro.com$p"; done
/ciudad-inexistente-a2 -> 404 application/json
/blog/post-inexistente-a2 -> 404 text/html;charset=utf-8
/bogota/ruta-inexistente-a2 -> 404 application/json
/Bogota -> 404 application/json
```

The observed soft-404 risk is therefore the reservation-confirmation route in F4, not the generic city/blog 404 handling.

### Hreflang absence is not currently a defect

The three sites are separate brands aimed at the same language/country, not localized language/region variants of one entity. `hreflang` should not be added merely to connect same-language brand clones. If the product later defines them as true regional alternates, add reciprocal, self-referencing clusters only after equivalent pages on all domains are live; F13 currently makes such a cluster invalid anyway.

## Recommended implementation order

1. F4 and F10: close the infinite 200 confirmation space and align HTTP noindex.
2. F1 and F2: remove contradictory sitemap entries and enforce slashless URLs at the edge.
3. F3: stop generating redirecting URLs; preserve legacy redirects only for historical links.
4. F5, F6, and F7: establish one truthful price/service/entity schema model.
5. F8 and F9: improve metro-pair differentiation and title/meta hygiene.
6. F11: submit the intended referral landing page.
7. F12 and F13: resolve domain ownership/config and deploy the two prelaunch brands.
