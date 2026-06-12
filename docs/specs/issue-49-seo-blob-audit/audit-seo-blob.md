# Auditoría SEO — impacto del source Vercel Blob en JSON-LD y og:image

**Issue:** #49 · **Fecha:** 2026-06-12 · **Marca de referencia:** alquilatucarro.com (única en prod sobre la app nueva)

## Veredicto

El riesgo que motivó el issue (que el cutover a Vercel Blob rompiera el JSON-LD o el og:image de páginas indexables) **no se materializó**. Todas las URLs de Blob en el JSON-LD renderizado resuelven HTTP 200, y el og:image de las páginas de marketing son assets estáticos de marca que el cutover no tocó.

La auditoría sí encontró un gap preexistente, sin relación con Blob: las páginas de ciudad no emitían ningún `og:image` ni `twitter:image`. Se corrige en este mismo cambio.

## Qué se revisó

Las imágenes de modelo viajan así hacia el JSON-LD: admin API / Supabase → `transformers.ts` (`image_url` → `image`) → `useProductSchema` / `useCityProductSchema` → grafo de nuxt-schema-org. El og:image es una vía separada: assets estáticos por marca (`franchise.ogImage`), absolutizados por nuxt-seo vía `site.url`.

Validación sobre HTML **renderizado** (no sobre el source), que es lo que ve un crawler.

## Hallazgos

| Check del issue | Estado | Evidencia |
|---|---|---|
| URLs de imagen legacy hardcodeadas | ✅ Cero | grep sin resultados; los `googleapis.com` son OAuth de GSC |
| JSON-LD model images (Blob) | ✅ Resuelven | `/bogota` ImageObject → Blob, HEAD 200 `image/jpeg`+`image/avif` |
| og:image páginas de marketing | ✅ Intacto | `/img/og-*.jpg`, absoluto, 200, ajeno a Blob |
| og:image páginas de ciudad | 🔴→✅ Corregido | `useCityPageSEO` no emitía og:image; ahora sí |
| GSC 404 re-validation | ⏳ Manual | requiere OAuth de Search Console |
| FB / X card validators | ⚠️ Sustituido | validadores nativos no viables; ver abajo |

### El gap de og:image y su corrección

`useCityPageSEO` —compartido por las 3 marcas vía el layer `logic`— seteaba `ogDescription` y `twitterDescription` pero nunca `ogImage`/`twitterImage`. Una página de ciudad compartida en redes salía sin imagen: tarjeta de solo texto.

La corrección agrega `ogImage`/`twitterImage` apuntando a `franchise.ogImage` (el asset estático por marca, el mismo que ya usa el home), más un `alt` contextual por ciudad. Deliberadamente **no** se usa una imagen de modelo de Blob: así el caché social no se rompe cuando rota el catálogo de vehículos.

### Validadores sociales

El Twitter/X Card Validator se dio de baja en 2022 y el Facebook Sharing Debugger exige login. Como sustituto se usó un inspector OG público que hace fetch tipo-crawler. Contra prod (pre-deploy) confirmó:

- **`/bogota`**: "Image is missing" + "X image is missing" — la tarjeta de Facebook renderiza sin imagen. Es el gap que cierra este cambio.
- **Post de blog**: el og:image renderiza bien (200); única observación menor, el aspect ratio 1200×800 frente al 1.91:1 ideal, preexistente y fuera del scope de #49.

Post-deploy, la verificación correcta del checklist es correr el Facebook Sharing Debugger sobre una URL de ciudad para forzar el re-scrape del og:image nuevo.

## Cómo reproducir

```bash
# og:image de ciudad (post-deploy: debe aparecer og:image absoluto 200)
curl -s https://alquilatucarro.com/bogota | grep -oiE '<meta property="og:image[^>]*>'

# JSON-LD model images resuelven
curl -s https://alquilatucarro.com/bogota | grep -oE '"contentUrl":"https://[^"]*blob[^"]*"'
# → HEAD cada URL: curl -sI <url> | head -1   (esperado: 200 image/*)

# sin hosts legacy en el HTML renderizado
curl -s https://alquilatucarro.com/bogota | grep -ciE 'firebasestorage|cloudinary|imgix'   # → 0
```

## Scenarios

Holdout en `scenarios/city-og-image.scenarios.md` (SCEN-001…005). Test de regresión: `packages/logic/src/composables/__tests__/useCityPageSEO.ogImage.test.ts`. Suite de logic verde (362/362).
