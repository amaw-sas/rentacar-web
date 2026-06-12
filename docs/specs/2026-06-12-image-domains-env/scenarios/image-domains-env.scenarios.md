---
name: image-domains-env
created_by: claude
created_at: 2026-06-12T00:00:00Z
issue: 73
references: [48, 72, "amaw-sas/rentacar-reservas#12"]
---

# Mover host de Blob de `image.domains` a `NUXT_IMAGE_DOMAINS` (env) — 3 marcas (#73)

En #72 (fix de #48) el host del Blob compartido quedó hardcodeado en `image.domains` de los 3
`nuxt.config.ts`. Este cambio lo lee desde `NUXT_IMAGE_DOMAINS` (CSV) **con fallback** al host actual,
para sacarlo del build y poder rotarlo sin tocar el repo — sin perder la red de seguridad de #48
(si la env falta en un target de Vercel, el fallback impide que las imágenes vuelvan a salir crudas).

Alcance: SOLO `image.domains` (allowlist build-time de `@nuxt/image`). El `remotePatterns` del hook
`nitro:config` ya es regex host-agnóstico (`^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$`) — no se toca.

Host del Blob (compartido por las 3 marcas): `9grznib0czdjtk77.public.blob.vercel-storage.com`.

Los scenarios autoritativos son runtime (preview/prod). SCEN-73-01/02 son guardas locales.

## SCEN-73-01: cada marca resuelve `image.domains` desde env con fallback (regression guard)
**Given**: cada uno de los 3 brand configs (`ui-alquilatucarro`, `ui-alquilame`, `ui-alquicarros`)
**When**: se inspecciona el bloque `image.domains` de su `nuxt.config.ts`
**Then**: lee `process.env.NUXT_IMAGE_DOMAINS` con el host Blob como fallback (`|| '…'`) parseado por
`.split(',')` — y NO conserva la forma hardcodeada de única fuente `domains: ['9grznib0…']`
**Evidence**: unit test config-hygiene (`packages/ui-alquilame/tests/image-domains.test.ts`, patrón
static-source de `f0-assets.test.ts`) sobre los 3 configs; falla antes del fix, pasa después

## SCEN-73-02: la expresión rinde fallback con env ausente y override con env presente
**Given**: la expresión `(process.env.NUXT_IMAGE_DOMAINS || '<host>').split(',').map(trim).filter(Boolean)`
**When**: se evalúa con `NUXT_IMAGE_DOMAINS` **ausente** y luego con `'a.com, b.com'`
**Then**: ausente → `['9grznib0czdjtk77.public.blob.vercel-storage.com']` (fallback);
presente → `['a.com','b.com']` (override, split por coma + trim, sin vacíos)
**Evidence**: eval local en node de la expresión en ambos estados de env

## SCEN-73-03: imágenes de modelo siguen optimizadas en preview (AUTORITATIVO, por marca)
**Given**: una página de resultados real (post búsqueda de disponibilidad) en el preview de cada marca,
con `NUXT_IMAGE_DOMAINS` seteado en el target Preview del proyecto Vercel
**When**: renderiza un `<img>` de modelo (slide del `Carrusel`) y se audita `document.images`
**Then**: su `currentSrc` es `/_vercel/image?url=…&w=…&q=80` con `w ≤ 768`, `content-type: image/webp`,
`cache-control: max-age ≥ 2678400`; y el conteo de `currentSrc` crudos
`*.blob.vercel-storage.com/*.jpeg` es **0**
**Evidence**: auditoría agent-browser de #72 — `viaOptimizer == total` (imgs de modelo), `rawBlob == 0`

## SCEN-73-04: mismo gate en producción (por marca)
**Given**: el deploy de producción de cada marca con `NUXT_IMAGE_DOMAINS` en el target Production
**When**: se audita una página de resultados real en el dominio/preview-de-prod
**Then**: idéntico a SCEN-73-03 — todo modelo vía `/_vercel/image` webp `max-age=2678400`, `rawBlob == 0`
**Evidence**: auditoría agent-browser tras promover el deploy
