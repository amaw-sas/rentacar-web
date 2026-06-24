# Reskin alquicarros — nuevo diseño con identidad naranja

**Fecha:** 2026-06-24
**Estado:** F0 implementado; F1–F3 pendientes
**Relacionado:** #112 (reskin alquilame, CLOSED — template estructural), #108 (og:image)

## Qué y por qué

alquicarros.com sigue en el sitio legacy. Es la última de las tres marcas
pendiente de cortar al app nuevo. Esta tarea porta el diseño de secciones que ya
construimos para alquilame, pero con la **identidad naranja institucional de
alquicarros** en vez del rojo. El motor de reservas no se toca; solo cambia la
capa de presentación, aislada a `packages/ui-alquicarros/**`.

No reinventamos el diseño: alquilame ya resolvió la arquitectura de secciones, el
patrón de tokens, las fuentes self-hosted y el Logo de dos variantes. Aquí lo
reusamos y le cambiamos la piel.

## Fuente de verdad de la marca

La paleta sale del sitio legacy (alquicarros.com), medida con computed styles el
2026-06-24:

| Token | Valor | Origen |
|---|---|---|
| Primario `brand-500` / `brand-600` | `#FF9500` / `#EF9600` | naranja dominante (38 usos) + botón institucional |
| Hero gradiente | `#FF9500 → #FF6B1C` | naranja → ámbar profundo del legacy |
| Verde WhatsApp | `#090` / `#04BF29` | único verde legítimo |
| Neutros / texto | `zinc` + `#333` | texto del legacy |
| Fuente | **Montserrat** | `bodyFont` del legacy — una sola familia, titulares y cuerpo |

El logo institucional es el wordmark `alqui⊙carros.com` (negro + ícono de carro
naranja, para fondo claro):
`https://storage.googleapis.com/alquicarros/landing2022/images/logo.png`.

**Decisiones del usuario:** naranja `#EF9600` como ancla; **Montserrat** del
legacy (no las fuentes de alquilame); paridad total de alcance con #112.

## Caveat de contraste (a resolver en QA de F1)

Texto blanco sobre `#EF9600` no cumple WCAG AA para texto normal (~2.6:1). Los
CTAs con texto deben usar `brand-700`+ o texto oscuro. La verificación final es
computed-style en browser, no a ojo. Está documentado en `theme.css`.

## Fases

### F0 — Fundación de marca (implementado)
Tokens + fuente + logo, sin tocar todavía la estructura de la home.
- `app/assets/css/theme.css` (nuevo): escala `brand` 50–950 anclada al naranja +
  tokens semánticos (hero/footer/surfaces) + variables de fuente Montserrat.
- `app/assets/css/main.css`: `@import './theme.css'`.
- `app/app.config.ts`: `ui.colors = { primary: 'brand', neutral: 'zinc' }`.
- `nuxt.config.ts`: bloque top-level `fonts` (Montserrat self-hosted, sin `<link>`
  a Google) + font crítico del body a Montserrat.
- `app/components/Logo.vue`: prop `variant` (`color` = wordmark oscuro + emblema
  naranja `#EF9600`; `white` = todo blanco sobre el hero naranja).
- `tests/f0-foundation.test.ts`: 14 aserciones que encodean los escenarios F0.

**Verificación:** `pnpm --filter ui-alquicarros test` en verde (14/14).
Runtime (browser) se difiere a F1, cuando hay UI nueva que mirar.

### F1 — Home nueva (13 secciones, paridad #112)
Portar los componentes de `app/components/home/` de alquilame re-skinned a naranja:
Hero+Searcher, Fleet, HowItWorks, ValueProps, Cities, Reviews/Google, Requirements,
Faq, Contact, header blanco sticky + CTA naranja + WhatsApp verde, footer naranja.
Conectados a la misma data (`useData().faqs`, disponibilidad real). Assets pesados
→ webp <500KB en el critical path. **Bloqueador:** conseguir el logo institucional
como SVG (color + white) — el emblema naranja-carro necesita el vector real, no el
PNG del legacy.

### F2 — Legales + landing de ciudad
`/terminos-condiciones`, `/politica-privacidad` y la landing `[city]` (preservando
ISR y `validateCityParams`) re-skinned a naranja.

### F3 — Páginas funcionales
Resultados/disponibilidad, flujo de reserva, `sindisponibilidad`, `pendiente`,
`reservado/[reserveCode]` y blog — nueva paleta/tipografía sin alterar comportamiento.

## Invariantes (no se rompen)

- `data-testid="*-test"` que consumen los E2E (`BRAND=alquicarros`).
- SEO programático: `useBaseSEO`, schema.org, breadcrumbs, sitemap.
- Motor de reservas: Searcher → `useSearch` → store → `server/api`.
- Aislamiento: solo `packages/ui-alquicarros/**`. `logic/` y las otras 2 marcas
  no cambian de salida.

## Escenarios observables

- **SCEN-F0-01** — Dado el theme de alquicarros, cuando se renderiza un botón
  primario, su color es el naranja institucional (`--ui-primary` = `#EF9600`), y
  no queda azul legacy (`#000073`) en la capa de tokens. *(test: brand primary)*
- **SCEN-F0-02** — Dada la config, cuando carga la fuente, es Montserrat
  self-hosted (sin `<link>` a Google) y el font crítico del body es Montserrat.
  *(test: self-hosted font)*
- **SCEN-F0-03** — Dado `theme.css`, expone la rampa `brand` 50–950 anclada en
  `#FF9500`/`#EF9600` + tokens hero/footer/surface. *(test: brand tokens)*
- **SCEN-F0-04** — Dado `Logo.vue`, soporta `variant` color/white y pinta el
  acento naranja en color. *(test: Logo variants)*
- **SCEN-F1-01** — Dada la home nueva, renderiza las 13 secciones con identidad
  naranja y Montserrat; el Searcher dispara disponibilidad real igual que hoy.
- **SCEN-F1-02** — Validación runtime: cero errores de consola, cero requests
  fallidos; ningún PNG >500KB en el critical path; contraste de CTA cumple AA.
- **SCEN-F2/F3** — Legales, landing de ciudad, resultados y reserva combinan con
  la paleta naranja y completan una reserva end-to-end sin regresión.

## Fuera de alcance

- Cambios al motor de reservas / contratos de API.
- Rediseño de alquilatucarro o alquilame.
- El cutover de DNS de alquicarros.com (decisión aparte).
