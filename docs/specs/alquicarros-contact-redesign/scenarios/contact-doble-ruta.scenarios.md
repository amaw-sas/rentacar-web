---
name: alquicarros-contact-redesign
created_by: brainstorming
created_at: 2026-07-01T00:00:00Z
---

Holdout para el rediseño de la sección "Reserva tu Carro Hoy" (`#contact`) de
alquicarros (`packages/ui-alquicarros/app/components/home/Contact.vue`) al layout
"doble ruta CTA" (sin imagen). Observable = source del componente + DOM renderizado
en home/city/reservas de alquicarros. Diseño de referencia:
`docs/specs/2026-07-01-alquicarros-contact-doble-ruta-design.md`. Se conservan los
dos CTA reales.

## SCEN-CONTACT-01: los dos CTA se conservan con sus atributos
**Given**: el home de alquicarros con la sección `#contact`
**When**: se renderiza
**Then**: existen exactamente dos CTA: "Reserva Ahora" (un `<a :href="reserveAnchor">`) y "Habla con un Asesor" (un `<a :href="franchise.whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Habla con un asesor por WhatsApp">` con el `WhatsappIcon`); el `<h2>` dice "Reserva tu Carro Hoy"
**Evidence**: DOM — dos `<a>` con los `href`/`target`/`rel`/`aria-label` indicados; `textContent` del `<h2>` = "Reserva tu Carro Hoy"; source `Contact.vue` contiene `:href="reserveAnchor"` y `:href="franchise.whatsapp"` con `target="_blank"` y `rel="noopener noreferrer"`

## SCEN-CONTACT-02: `reserveAnchor` respetado por host, verbatim (ancla o ruta)
**Given**: los hosts que montan `<HomeContact>` — home (default `#hero`), city results (`#searcher`), city landing (`/reservas`, una RUTA), página reservas (`#hero`)
**When**: cada uno renderiza `#contact`
**Then**: el CTA "Reserva Ahora" tiene `href` exactamente igual al valor pasado por el host, sin envolverlo ni concatenarlo (funciona igual para ancla in-page y para ruta completa)
**Evidence**: source `Contact.vue` bindea `:href="reserveAnchor"` sin template string ni concatenación alrededor; DOM — en `/` el `href` del CTA es `#hero`, en city landing es `/reservas`

## SCEN-CONTACT-03: diferenciación de alquilame (doble ruta, sin SUV)
**Given**: el `Contact.vue` rediseñado de alquicarros
**When**: se inspecciona source y DOM
**Then**: NO contiene la banda full-bleed con SUV lateral (sin referencia a `cta-suv.webp`) y SÍ presenta dos tiles de acción en un grid de 2 columnas en `md+`
**Evidence**: source `Contact.vue` no contiene `cta-suv.webp` y sí contiene `md:grid-cols-2`; DOM — `#contact` no tiene `<img>` de SUV y muestra dos tiles lado a lado en viewport `md`

## SCEN-CONTACT-04: iconografía lucide vía UIcon
**Given**: la sección renderizada
**When**: se inspeccionan los íconos
**Then**: usa `UIcon` con nombres `i-lucide-*` (car, message-circle, wallet, shield-check, headset, map-pinned) y NO los `<svg viewBox>` dibujados a mano de los badges previos
**Evidence**: source `Contact.vue` contiene `<UIcon` con esos `i-lucide-*`; DOM — ningún `<svg>` de badge hand-drawn dentro de `#contact`

## SCEN-CONTACT-05: conteo de ciudades dinámico
**Given**: `useCityCount()` retorna N (live = 19)
**When**: se renderiza el badge de ciudades
**Then**: muestra "+N ciudades" derivado del composable, NO un número hardcodeado
**Evidence**: source `Contact.vue` referencia `useCityCount` y renderiza `cityCount.value` en el badge; DOM — el texto del badge = "+19 ciudades" cuando el composable retorna 19

## SCEN-CONTACT-06: contraste AA y consola limpia en runtime
**Given**: la sección renderizada en navegador (desktop y mobile)
**When**: se mide el contraste del texto blanco del Tile A (sobre el extremo oscuro del gradiente `#e35d0a`→`#c2410c`) y de los labels de ambos CTA
**Then**: todos cumplen WCAG AA (≥4.5:1 body, ≥3:1 título grande); no hay errores de consola ni requests fallidos
**Evidence**: computed contrast ratio ≥ umbral AA vía `/agent-browser`; consola del navegador sin errores; network sin requests fallidos

## SCEN-CONTACT-07: orden de secciones intacto
**Given**: el home de alquicarros
**When**: se listan las secciones montadas
**Then**: `HomeContact` sigue en la posición 10, entre `HomeFaq` y `HomePartners`
**Evidence**: `reskin-invariants.test.ts` (bloque de orden de 11 secciones) verde; DOM — `#contact` aparece tras `#faq`-equivalente y antes de la sección Partners

## SCEN-CONTACT-08: sin regresión cross-marca ni de hosts
**Given**: alquilame, alquilatucarro y los hosts que montan `<HomeContact>`
**When**: se inspecciona el diff y se corre el suite del brand
**Then**: solo se tocan archivos bajo `packages/ui-alquicarros/` (+ docs/specs); los `Contact.vue` de las otras marcas quedan sin modificar; los tests de host (`reservas/__tests__/index.test.ts`, `city/__tests__/Hero.test.ts`) siguen verdes (prop `reserve-anchor` y mount incondicional preservados)
**Evidence**: `git diff --name-only origin/main` no lista rutas bajo `packages/ui-alquilame/` ni `packages/ui-alquilatucarro/`; `pnpm --filter ui-alquicarros test` verde incluyendo los tests de host
