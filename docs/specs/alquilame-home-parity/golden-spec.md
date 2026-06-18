# Golden Spec — alquilame home parity

**Fuente de verdad**: `astro-alquilame/index.html` (dump estático servido en `http://localhost:4321/`).
**Objetivo**: home Nuxt (`packages/ui-alquilame`) idéntico al ojo, conservando datos reales donde el Astro usa placeholder.
**Criterio de aceptación por sección**: diff screenshot Nuxt-vs-golden < umbral en desktop 1440 + mobile 390.

## Markup exacto por sección
Cada sección del golden está extraída en `golden-sections/NN-<name>.html` (HTML compilado, copy/clases/estructura exactos):
`01-hero`, `02-fleet`, `03-how-it-works`, `04-value-props`, `05-cities`, `06-google-reviews`, `07-stats`, `08-requirements`, `09-faq`, `10-contact`, `11-partners`.

## Tokens de marca (ya correctos en `packages/ui-alquilame/app/assets/css/theme.css`)
- Rojo marca: `--color-brand-600: #CC022B` (variantes `#A00425`/`#94001E`/`#7a001a`); rojo claro `#fff1f3`.
- Hero gradient: `from-[#CC022B] to-[#94001E]` (usar `bg-linear-to-br`, NO `bg-gradient-to-*` en Tailwind 4).
- Fuentes: heading `Plus Jakarta Sans`, body `DM Sans` (ya cargadas vía @nuxt/fonts). **Ya correctos — no tocar.**
- Verde legítimo SOLO para WhatsApp (`#090`). Cualquier otro botón verde = bug.

## Backgrounds por sección (del golden)
| Sección | bg |
|---|---|
| hero | gradient `#CC022B→#94001E` |
| fleet | white |
| how-it-works | `#EDF0F5` |
| value-props | white |
| cities | gray-100 |
| google-reviews | gray-100 |
| stats | white |
| requirements | white |
| faq | gray-100 |
| contact | gradient (rojo) |
| partners | gradient `#CB032C→#A00425` |

## Assets reales del golden (`astro-alquilame/images/`)
Copiar al `public/images/` de Nuxt los que falten:
- `carro_hero.png`, `fondo-banner.png`
- `vehicles/` — economico.jpg, camioneta.jpg, camioneta-full.jpg, … (flota 6 cards)
- `cities/` — bogota(.jpg/.webp), medellin.jpg, cali.jpg, cartagena.jpg
- `requirements/` — conductor-llaves.webp, requisitos-fondo-1/2/3.webp
- `cta/` — cta-suv.webp, app-celular.png, mano-celular.png
- `puntos-entrega/` — aeropuerto/centro/exito/yumbo.webp
- `howitworks/` — paso-escoge.jpg, paso-reserva.jpg, paso-recoge.jpg, carros-publico.png, circulo-rojo.svg, colombia-mapa.svg
- `logo.svg`, `logo-white.svg`, `favicon.svg`

## Ubicaciones Nuxt (worktree)
- Página: `packages/ui-alquilame/app/pages/index.vue`
- Componentes sección: `packages/ui-alquilame/app/components/home/*.vue`
- **public real**: `packages/ui-alquilame/public/` (NO `app/public` — ese no existe)
- Tokens: `packages/ui-alquilame/app/assets/css/theme.css`

## Bug confirmado — "Cómo Funciona"
`HowItWorks.vue` renderiza cajas vacías de altura enorme en local Y Vercel. Las imágenes `public/images/howitworks/paso-*.jpg` **SÍ existen** (no es 404). Causa real: layout/render del componente. Diagnosticar con systematic-debugging (probable: `<NuxtImg>` sin dimensiones → colapso/aspect, o estructura del v-for que reserva alto sin mostrar la imagen).

## Divergencias por sección (golden vs Nuxt actual)
| Sección | Golden | Nuxt actual | Acción |
|---|---|---|---|
| header | blanco, logo rojo | rojo | a blanco |
| hero | foto en card derecha, CTAs Ver Precios+WhatsApp | familia, tipografía gigante | igualar layout/imagen |
| fleet | 6 cards + toggle Diario/Mensualidad, botón rojo | 4 cards, sin toggle, botón verde | 6 cards data real + toggle + rojo |
| how-it-works | 3 pasos con imágenes | vacío (bug) | fix bug + layout |
| cities | cards foto+gradiente + pills | cards rojas planas | foto+gradiente, data real |
| google-reviews | bloque Google 5,0·43 + cards | testimonios sin bloque Google | bloque Google (data real) |
| stats | banda | números reales | igualar banda, mantener reales |
| contact | botones | formulario | botones (paridad visual) |
