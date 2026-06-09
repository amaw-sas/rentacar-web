# Issue #108 — og:image por marca (alquilame 404 / alquicarros marca equivocada)

## Problema

Las tres marcas declaran `franchise.ogImage: "/img/og-alquilatucarro.jpg"`. En runtime:

- **alquilame** → `https://alquilame.co/img/og-alquilatucarro.jpg` → **404** (no existe `og-*` en `packages/ui-alquilame/public/img/`). El share no muestra imagen.
- **alquicarros** → 200 pero **imagen de la marca equivocada** (el OG de alquilatucarro).
- **alquilatucarro** → correcto.

`og:image` se renderiza absoluto vía `nuxt-seo-utils` + `site.url` (ver #69), así que el path roto/equivocado se sirve tal cual.

## Restricción descubierta

alquilame y alquicarros **no tienen identidad visual propia en el repo**: los tres `Logo.vue` son byte-idénticos (el wordmark dice "ALQUILATUCARRO" en las tres) y `/images/brand/logo.svg` ni existe en disco. El único asset OG es el de alquilatucarro, una pieza fotográfica diseñada (familia + SUV + paisaje colombiano + wordmark blanco sobre panel + tagline "Alquiler de carros en Colombia").

El usuario aportó los SVG reales de marca (`alquilame.svg`, `alquicarros.svg`): logos a color (alquilame rojo `#CC022B` + check negro; alquicarros texto negro + badge naranja `darkorange` + ".com"). Ambos diseñados para fondo claro.

## Decisión de diseño (aprobada)

**Reusar la base fotográfica + panel blanco con logo a color por marca** (tratamiento "B").

La foto (familia/SUV/Colombia) y el tagline son **neutros de marca** — mismo producto, misma empresa (AMAW SAS), mismo país. Solo el wordmark distingue. Por tanto:

1. Tomar `og-alquilatucarro.jpg` como base (1200×630).
2. Superponer un panel **blanco opaco** sobre el tercio derecho (x≥800), cubriendo el logo/tagline viejos.
3. Panel: filete vertical en color de marca (8px) en la junta + logo real a color centrado + regla corta de marca + tagline `ALQUILER / DE CARROS EN / Colombia` (Colombia en itálica, color de marca).
   - alquilame: acento `#CC022B`.
   - alquicarros: acento `#FF8C00`.
4. Apuntar `franchise.ogImage` de cada marca a su propio archivo.

### Por qué reusar la base y no generar tarjeta nueva o esperar diseño externo

- **Tarjeta tipográfica nueva**: rompería consistencia con la pieza fotográfica de alquilatucarro.
- **Esperar assets de diseño**: bloquea el issue; las marcas ni siquiera tienen wordmark propio "diseñado" más allá del SVG aportado.
- **Reusar base + logo real**: on-brand, determinista, regenerable, resultado near-idéntico al insignia con la identidad correcta. Satisface el escenario observable.

## Mecanismo de generación

Script versionado `scripts/generate-og-images.ts` (Node + `sharp`, agregado como devDependency root; el binario prebuilt ya estaba en el store vía `@nuxt/image`):

- Lee la base + el SVG de marca, compone el panel vía SVG inline (`sharp().composite`), escribe el JPEG final.
- Determinista: misma entrada → mismo byte output. Reproducible para futuros cambios de logo/tagline.
- Entrada de logos: `scripts/og-logo-<brand>.svg` (versionados junto al script, fuente de verdad del wordmark).

## Blast radius

- **Nuevos assets** (2): `packages/ui-{alquilame,alquicarros}/public/img/og-<brand>.jpg`.
- **Config** (2 líneas): `ogImage` en `app.config.ts` de alquilame y alquicarros.
- **Script + fuentes** (1 + 2 SVG): `scripts/generate-og-images.ts`, `scripts/og-logo-{alquilame,alquicarros}.svg`.
- **Sin tocar**: alquilatucarro (asset correcto), logic layer, `Logo.vue`.

## Out of scope

- Rediseñar la identidad visual de las marcas (logos propios en `Logo.vue`, etc.).
- Unificar el OG de alquilatucarro al nuevo template.
- Mover assets OG a Vercel Blob (#49).
