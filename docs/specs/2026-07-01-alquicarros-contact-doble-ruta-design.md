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
   - Accent bar naranja (`h-1 w-11 rounded-full bg-brand-600`, patrón de `HowItWorks.vue`).
   - `<h2>` "Reserva tu Carro Hoy" — `font-heading text-3xl md:text-4xl font-extrabold`, color oscuro cálido (`text-brand-900`/`#7c2d12`) para contraste sobre crema.
   - Subtítulo: "Sin anticipos. Sin cargos ocultos. Cancela gratis hasta 24 horas antes." — texto cálido atenuado.

2. **Dos tiles de acción** (grid `grid-cols-1 md:grid-cols-2 gap-5`)
   - **Tile A — "Reserva online"** (fondo gradiente naranja, texto blanco):
     - Ícono `i-lucide-car` en badge redondeado translúcido.
     - Título "Reserva online" + microcopy "Cotiza y confirma en 2 minutos, sin llamadas."
     - CTA **"Reserva Ahora"** — botón blanco full-width, texto `brand-700`, `href="{reserveAnchor}"`.
   - **Tile B — "¿Prefieres hablar?"** (fondo blanco, borde cálido sutil):
     - Ícono `i-lucide-message-circle` en badge verde suave (`#e9f9ec` / `text-[#090]`).
     - Título "¿Prefieres hablar?" + microcopy "Un asesor te ayuda a elegir y reservar al instante."
     - CTA **"Habla con un Asesor"** — botón verde `bg-[#090]` full-width con `WhatsappIcon`, `href="{franchise.whatsapp}"`, `target="_blank" rel="noopener noreferrer"`, `aria-label` conservado.

3. **Fila de trust badges** (una sola fila centrada, `flex-wrap gap-x-7 gap-y-3`) con `UIcon` lucide:
   - `i-lucide-wallet` "Sin anticipos"
   - `i-lucide-shield-check` "Cancela gratis 24h"
   - `i-lucide-headphones` "Soporte 24/7"
   - `i-lucide-map-pin` "+{cityCount} ciudades" ← dato real vía `useCityCount` (live=19), NO hardcodeado.

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
- **Hosts que montan `<HomeContact>`:**
  - `app/pages/index.vue` (home) → usa `reserveAnchor` default `#hero`.
  - City landing (`/[city]`) → pasa `reserveAnchor="#searcher"`. **La prop `reserveAnchor` se conserva con misma firma y defaults.**
- **Tests que pueden romper y deben actualizarse:**
  - `app/components/home/__tests__/reskin-invariants.test.ts` — orden de secciones (no cambia; `HomeContact` sigue en pos. 10). Verificar que no asserte estructura interna de Contact.
  - `presentational.test.ts` (si asserta copy de Contact) — actualizar strings: nuevos títulos de tiles ("Reserva online", "¿Prefieres hablar?") y microcopy. Los labels de CTA ("Reserva Ahora", "Habla con un Asesor") y del `<h2>` ("Reserva tu Carro Hoy") **no cambian**.
- **Assets:** `/images/cta/cta-suv.webp` deja de usarse en alquicarros (sigue usándose en alquilame — no borrar).
- **Otras marcas:** sin impacto (cambio aislado a `ui-alquicarros`).

## Observable Scenarios (Given/When/Then)

- **SCEN-CONTACT-01 · CTAs conservados y funcionales**
  Given la home de alquicarros renderizada, When el usuario ve la sección `#contact`, Then existen exactamente dos CTA: "Reserva Ahora" (`href="#hero"`) y "Habla con un Asesor" (`href="{franchise.whatsapp}"`, `target="_blank"`, `rel="noopener noreferrer"`).

- **SCEN-CONTACT-02 · Anchor configurable por host**
  Given la city landing `/[city]` que pasa `reserveAnchor="#searcher"`, When se renderiza `#contact`, Then el CTA "Reserva Ahora" tiene `href="#searcher"` (no `#hero`).

- **SCEN-CONTACT-03 · Diferenciación de alquilame**
  Given `Contact.vue` de alquicarros, When se inspecciona el markup, Then NO contiene la banda full-bleed con SUV lateral (`cta-suv.webp` ausente en alquicarros) y SÍ contiene dos tiles de acción en grid de 2 columnas en `md+`.

- **SCEN-CONTACT-04 · Iconografía lucide**
  Given la sección renderizada, When se inspeccionan íconos, Then usan `UIcon` con nombres `i-lucide-*` (car, message-circle, wallet, shield-check, headphones, map-pin) en lugar de los SVG inline previos.

- **SCEN-CONTACT-05 · Conteo de ciudades dinámico**
  Given `useCityCount` retorna N, When se renderiza el badge de ciudades, Then muestra "+N ciudades" (no un número hardcodeado).

- **SCEN-CONTACT-06 · Contraste AA en runtime**
  Given la sección renderizada en navegador, When se mide el contraste del texto blanco del Tile A y de los labels de CTA, Then todos cumplen WCAG AA (≥4.5:1 body, ≥3:1 título grande) — verificado con /agent-browser computed-style, cero errores de consola.

- **SCEN-CONTACT-07 · Orden de secciones intacto**
  Given el home renderizado, When se listan las secciones, Then `HomeContact` sigue en posición 10 entre `HomeFaq` y `HomePartners` (`reskin-invariants.test.ts` verde).

## Estrategia de satisfacción

- Unit/render: actualizar `presentational.test.ts` (nuevos copys de tiles) y confirmar `reskin-invariants.test.ts` verde.
- Runtime: `/agent-browser` en el dev server del worktree (SCEN-06: contraste + cero errores de consola + cero requests fallidos) + `/dogfood` exploratorio.
- Verificación desktop y mobile (breakpoint `md`).

## Riesgos / notas

- Tailwind 4: usar `bg-linear-to-b` (no `bg-gradient-to-b`) para el fondo crema — ver `[[reference_tailwind4_gradient_bg_linear]]`. Solo un check de computed-style en navegador lo confirma.
- Auto-import por dir-prefix: el componente es `<HomeContact>` (dir `home/`) — no renombrar el archivo ni mover de carpeta.
- Los radiales del gradiente del Tile A no son utilidades Tailwind → posible `:style` inline (patrón ya usado en la versión actual).
- Verificar que `presentational.test.ts` efectivamente asserte (o no) copy de Contact antes de asumir cambios de test.
