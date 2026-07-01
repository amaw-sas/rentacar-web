# Rediseño sección `#contact` — alquicarros (doble ruta CTA)

**Fecha:** 2026-07-01
**Marca:** alquicarros (`packages/ui-alquicarros`)
**Componente:** `app/components/home/Contact.vue` (mount `<HomeContact />`, posición 10 del home)
**Branch:** `feat/alquicarros-contact-redesign`
**Épico:** reskin alquicarros (#210)

## Problema

`Contact.vue` de alquicarros es un **clon casi verbatim** de `packages/ui-alquilame/app/components/home/Contact.vue`: misma composición (banda full-bleed con gradiente, texto alineado a la izquierda, SUV transparente flotando a la derecha, dos píldoras CTA, tres trust badges), cambiando únicamente rojo→naranja. Al derivarse de alquilame, las dos marcas comparten identidad visual en esta sección. La directiva es **diferenciar alquicarros**.

Problemas secundarios de la versión actual:
- La composición (banda + SUV lateral) es idéntica a alquilame → no distingue la marca.
- Trust badges con SVG dibujados a mano, no con `UIcon` lucide como las secciones hermanas.
- Texto blanco sobre naranja documentado como riesgo WCAG AA (`theme.css:54-60`).

## Objetivo

Rediseñar `#contact` en alquicarros con una **composición estructuralmente distinta** de la banda de alquilame, **conservando exactamente los dos CTA reales** y su comportamiento. Alinear iconografía y lenguaje visual con las secciones hermanas del home.

## No-objetivos (YAGNI)

- NO convertir la sección en formulario (se mantiene la decisión de directiva: CTAs, no form).
- NO cambiar los destinos ni la mecánica de los CTA.
- NO tocar el orden de secciones del home (`HomeContact` permanece en posición 10, entre `HomeFaq` y `HomePartners` — invariante testeado en `__tests__/reskin-invariants.test.ts`).
- NO modificar `Contact.vue` de alquilame ni de otras marcas (cambio aislado a `ui-alquicarros`).

## Decisión de diseño: "Doble ruta CTA" (sin imagen)

La banda única se reemplaza por un **selector de dos caminos**: dos tiles parejos, uno por cada CTA, sobre fondo crema suave, con titular centrado arriba y una fila única de trust badges abajo. Sin SUV, sin banda full-bleed, sin eje texto-izquierda/foto-derecha.

### Estructura (de arriba a abajo)

1. **Encabezado centrado**
   - Accent bar naranja (`h-1 w-10 rounded-full bg-brand-600`, patrón exacto de `HowItWorks.vue:18`).
   - `<h2>` "Reserva tu Carro Hoy" — `font-heading text-3xl md:text-4xl font-extrabold`, color oscuro cálido (`text-brand-900`/`#7c2d12`) para contraste sobre crema.
   - Subtítulo: "Sin anticipos. Sin cargos ocultos. Cancela gratis hasta 24 horas antes." — texto cálido atenuado.

2. **Dos tiles de acción** (grid `grid-cols-1 md:grid-cols-2 gap-5`)
   - **Tile A — "Reserva online"** (fondo gradiente naranja, texto blanco):
     - Ícono `i-lucide-car` en badge redondeado translúcido.
     - Título "Reserva online" + microcopy "Cotiza y confirma en 2 minutos, sin llamadas."
     - CTA **"Reserva Ahora"** — botón blanco full-width, texto `brand-700`, `href="{reserveAnchor}"`.
   - **Tile B — "¿Prefieres hablar?"** (fondo blanco, borde cálido sutil):
     - Ícono `i-lucide-message-circle` en badge verde suave (`bg-[#e9f9ec]` / `text-[#090]`).
     - Título "¿Prefieres hablar?" + microcopy "Un asesor te ayuda a elegir y reservar al instante."
     - CTA **"Habla con un Asesor"** — botón verde `bg-[#090]` full-width con `WhatsappIcon`, `href="{franchise.whatsapp}"`, `target="_blank" rel="noopener noreferrer"`, `aria-label` conservado.

3. **Fila de trust badges** (una sola fila centrada, `flex-wrap gap-x-7 gap-y-3`) con `UIcon` lucide:
   - `i-lucide-wallet` "Sin anticipos"
   - `i-lucide-shield-check` "Cancela gratis 24h"
   - `i-lucide-headset` "Soporte 24/7" (mismo icono que `ValueProps`, no `headphones`)
   - `i-lucide-map-pinned` "+{cityCount} ciudades" ← dato real vía `useCityCount()` (ref, `cityCount.value`, live=19), NO hardcodeado. Icono alineado a `ValueProps`.

### Responsive

- **Desktop (`md+`):** dos tiles lado a lado; badges en fila.
- **Mobile:** tiles apilados (online arriba, WhatsApp abajo); badges apilados/centrados. Titular reducido.

### Fondo y tokens

- Sección: fondo **crema suave** — `bg-linear-to-b from-[#fff7ee] to-[#fdeede]` (Tailwind 4 `bg-linear-to-*`, NO `bg-gradient-to-*` — ver `[[reference_tailwind4_gradient_bg_linear]]`).
- Padding de sección: `py-16 md:py-24` (estándar de secciones claras hermanas), reemplazando el `py-12 lg:py-0 lg:min-h-[520px]` de la banda actual.
- Tile A gradiente: `linear-gradient(160deg,#ff8a00,#e35d0a 60%,#c2410c)` + radial cálido superior. El extremo oscuro (`#c2410c`) garantiza contraste del texto blanco.
- Verde WhatsApp: `#090` (único verde legítimo de marca), sin cambios.
- Tipografía: Montserrat (`font-heading`/`font-sans`), sin cambios.

## Accesibilidad

- **Botón "Reserva Ahora":** blanco con texto `brand-700` (#c2700a) sobre blanco → contraste AA OK.
- **Texto blanco en Tile A:** cae sobre el extremo oscuro del gradiente naranja (`#e35d0a`→`#c2410c`), no sobre `#EF9600` puro → cumple AA. Verificar computed contrast en runtime (≥4.5:1 para body, ≥3:1 para el título grande).
- **Botón "Habla con un Asesor":** blanco sobre `#090` → AA OK.
- Íconos decorativos `aria-hidden`; el `aria-label` del CTA de WhatsApp se conserva.
- Orden de foco: Reserva Ahora → Habla con un Asesor → (badges no focusables).

## Consumidores / blast radius

- **Archivo modificado (único):** `packages/ui-alquicarros/app/components/home/Contact.vue`.
- **Hosts que montan `<HomeContact>` (3 en total)** — la prop `reserveAnchor` se conserva con misma firma y defaults (`withDefaults(..., { reserveAnchor: '#hero' })`, `Contact.vue:160`). **Importante:** el valor NO siempre es un ancla in-page; el landing pasa una **ruta completa** (`/reservas`), así que el binding `href="{reserveAnchor}"` debe seguir funcionando igual para rutas y para anclas:
  - `app/pages/index.vue:22` → `<HomeContact />` → default `#hero` (home).
  - `app/components/CityPage.vue:62` → `:reserve-anchor="mode === 'landing' ? '/reservas' : '#searcher'"` → **landing = `/reservas` (ruta)**, **results = `#searcher` (ancla)**.
  - `app/pages/reservas/index.vue:116` → `<HomeContact reserve-anchor="#hero" />` (tercer host).
- **Tests — cobertura real (verificada):**
  - `app/components/home/__tests__/reskin-invariants.test.ts` — corre sobre **todos** los `home/*.vue`, incluido `Contact.vue`. Asserta, además del orden de secciones (Contact en pos. 10): **sin literal `Alquilame`, sin hex rojo (`RED_HEX`), sin clase `-red-\d`, sin alias `bg-gradient-to-`, y tokens `brand-*`**. El nuevo diseño los cumple (naranja `#ff8a00/#e35d0a/#c2410c`, crema `#fff7ee`, `#090`, y `bg-linear-to-b`) — pero el implementador DEBE mantener los hexes fuera del regex `RED_HEX` y usar `bg-linear-to-*`, nunca `bg-gradient-to-*`.
  - `presentational.test.ts` — **NO referencia `Contact.vue`** (solo `HowItWorks/ValueProps/Stats`). No requiere cambios. En consecuencia, **hoy ningún test encoda el copy/estructura de Contact** → los scenarios SCEN-01/03/04/05 necesitan un test nuevo (ver Estrategia de satisfacción).
  - Tests de **hosts** (no tocan internals de Contact, no deben romper si se conserva el nombre de prop `reserve-anchor` y el mount incondicional): `app/pages/reservas/__tests__/index.test.ts:145`, `app/components/city/__tests__/Hero.test.ts:80`.
- **Assets:** `/images/cta/cta-suv.webp` deja de usarse en alquicarros (sigue usándose en alquilame — no borrar).
- **Otras marcas:** sin impacto (cambio aislado a `ui-alquicarros`).

## Observable Scenarios (Given/When/Then)

- **SCEN-CONTACT-01 · CTAs conservados y funcionales**
  Given la home de alquicarros renderizada, When el usuario ve la sección `#contact`, Then existen exactamente dos CTA: "Reserva Ahora" (`href="#hero"`) y "Habla con un Asesor" (`href="{franchise.whatsapp}"`, `target="_blank"`, `rel="noopener noreferrer"`).

- **SCEN-CONTACT-02 · `reserveAnchor` respetado por host (ancla o ruta)**
  Given un host que pasa `reserve-anchor` (home → `#hero` default; city results → `#searcher`; city landing → `/reservas` ruta; página reservas → `#hero`), When se renderiza `#contact`, Then el CTA "Reserva Ahora" tiene `href` igual al valor pasado, tanto si es ancla in-page como si es ruta completa (`/reservas`).

- **SCEN-CONTACT-03 · Diferenciación de alquilame**
  Given `Contact.vue` de alquicarros, When se inspecciona el markup, Then NO contiene la banda full-bleed con SUV lateral (`cta-suv.webp` ausente en alquicarros) y SÍ contiene dos tiles de acción en grid de 2 columnas en `md+`.

- **SCEN-CONTACT-04 · Iconografía lucide**
  Given la sección renderizada, When se inspeccionan íconos, Then usan `UIcon` con nombres `i-lucide-*` (car, message-circle, wallet, shield-check, headset, map-pinned) en lugar de los SVG inline previos.

- **SCEN-CONTACT-05 · Conteo de ciudades dinámico**
  Given `useCityCount` retorna N, When se renderiza el badge de ciudades, Then muestra "+N ciudades" (no un número hardcodeado).

- **SCEN-CONTACT-06 · Contraste AA en runtime**
  Given la sección renderizada en navegador, When se mide el contraste del texto blanco del Tile A y de los labels de CTA, Then todos cumplen WCAG AA (≥4.5:1 body, ≥3:1 título grande) — verificado con /agent-browser computed-style, cero errores de consola.

- **SCEN-CONTACT-07 · Orden de secciones intacto**
  Given el home renderizado, When se listan las secciones, Then `HomeContact` sigue en posición 10 entre `HomeFaq` y `HomePartners` (`reskin-invariants.test.ts` verde).

## Estrategia de satisfacción

- **Unit/render (nuevo test):** crear `app/components/home/__tests__/contact.test.ts` que monte `Contact.vue` y encode SCEN-01/02/03/04/05:
  - dos CTA con los `href`/atributos correctos (01); `href` = `reserveAnchor` para valor ancla y ruta (02);
  - ausencia de `cta-suv.webp` + presencia de grid de 2 tiles (03);
  - íconos vía `UIcon`/`i-lucide-*` (04); badge de ciudades derivado de `useCityCount`, no hardcodeado (05);
  - que Contact use al menos un token `brand-*` propio (el check `brand orange tokens` de `reskin-invariants` es un `.some(...)` a nivel home, no por-archivo — encodarlo aquí para blindar Contact).
  Motivo: `presentational.test.ts` NO cubre Contact y no debe tocarse.
- **Invariantes:** confirmar `reskin-invariants.test.ts` verde (orden de secciones + sin rojo/`Alquilame`/`bg-gradient-to-` + tokens brand) tras el cambio.
- **Runtime (SCEN-06):** `/agent-browser` en el dev server del worktree — contraste computado AA de texto blanco del Tile A y labels de CTA, cero errores de consola, cero requests fallidos + `/dogfood` exploratorio.
- **Regresión de hosts:** correr los tests de host (`reservas/__tests__/index.test.ts`, `city/__tests__/Hero.test.ts`) — deben seguir verdes sin cambios.
- Verificación desktop y mobile (breakpoint `md`).

## Riesgos / notas

- Tailwind 4: usar `bg-linear-to-b` (no `bg-gradient-to-b`) para el fondo crema — ver `[[reference_tailwind4_gradient_bg_linear]]`. Solo un check de computed-style en navegador lo confirma.
- Auto-import por dir-prefix: el componente es `<HomeContact>` (dir `home/`) — no renombrar el archivo ni mover de carpeta.
- Los radiales del gradiente del Tile A no son utilidades Tailwind → posible `:style` inline (patrón ya usado en la versión actual). Cuidado: `reskin-invariants.test.ts` prohíbe hexes rojos y el alias `bg-gradient-to-` incluso en `:style`/clases de Contact.
- `presentational.test.ts` NO cubre Contact (verificado) → la cobertura estática de los scenarios vive en el nuevo `contact.test.ts`, no ahí.
