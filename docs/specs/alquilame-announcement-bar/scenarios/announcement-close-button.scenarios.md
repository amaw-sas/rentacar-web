---
name: announcement-close-button
created_by: pablo+claude
created_at: 2026-06-18T00:00:00Z
---

# alquilame — botón de cerrar del announcement bar

El banner superior dismissible ("Reserva con anticipación — Precios sujetos a
disponibilidad", `AnnouncementBar.vue`) muestra su botón de cerrar (`×`) mal
ubicado en escritorio ancho: cuelga en la esquina superior derecha del viewport,
desligado del texto centrado y montado por encima del centro vertical de la
barra (invade visualmente el borde superior / banner contiguo).

Marca aislada: `packages/ui-alquilame`; `packages/logic` y otras marcas NO se
tocan (el componente es exclusivo de alquilame).

---

## SCEN-001: el botón de cerrar queda anclado al contenido centrado, no al borde del viewport

**Given**: un usuario en el home de alquilame (`/`) con viewport de escritorio
ancho (≥ 1536px, p. ej. 1920px) y el announcement bar visible (no descartado).
**When**: la barra renderiza con su botón de cerrar (`[aria-label="Cerrar anuncio"]`).
**Then**: el borde derecho del botón queda DENTRO del contenedor de contenido
centrado (`max-w-7xl`), a ~16px de su borde derecho — NO flotando en el margen
vacío del viewport a cientos de px del contenido. En concreto, el centro
horizontal del botón cae a la izquierda del borde derecho de la barra de ancho
completo por un margen grande (≥ 250px en 1920px), porque se ancla al contenedor
centrado y no a la barra full-bleed.
**Evidence**: estilo computado en navegador real a 1920px — `button.right ≤
container.right + 4px` (anclado al contenedor `max-w-7xl`, no a la barra de 1920px
de ancho); `viewportRight − button.right ≥ 280px`.

---

## SCEN-002: el botón de cerrar está centrado verticalmente en la barra

**Given**: un usuario en el home de alquilame con el announcement bar visible, en
cualquier viewport (escritorio o móvil).
**When**: la barra renderiza con su botón de cerrar.
**Then**: el centro vertical del botón coincide con el centro vertical de la barra
oscura (no montado hacia el borde superior ni desbordando hacia abajo al banner
contiguo). El icono `×` queda visualmente centrado en la franja.
**Evidence**: estilo computado en navegador real — `|btnCenterY − barCenterY| ≤
2px`; el botón no sobresale por arriba (`btnTop ≥ barTop − 1`) ni por abajo
(`btnBottom ≤ barBottom + 1`).

---

## SCEN-003: descartar sigue funcionando y no rompe CLS / móvil

**Given**: un usuario en el home con el announcement bar visible.
**When**: hace click en el botón de cerrar.
**Then**: la barra desaparece (`v-if="!dismissed"`) y el descarte persiste por
sesión (`sessionStorage`), exactamente como hoy. En viewport móvil el botón sigue
centrado verticalmente y dentro de la barra (la corrección de escritorio no
regresa el comportamiento móvil ni el guard de CLS #109: la barra sigue
renderizándose en SSR por defecto).
**Evidence**: en navegador real, tras el click la barra ya no está en el DOM y
`sessionStorage['announcement-dismissed'] === 'true'`; a 390px de ancho el centro
vertical del botón coincide con el de la barra (`|btnCenterY − barCenterY| ≤ 2px`).
Los tests existentes de AnnouncementBar (SSR-by-default, dismiss client-only,
sessionStorage, aria-label) siguen verdes.

---

## SCEN-004: el critical CSS no duplica el translate (causa raíz sistémica)

**Given**: el critical CSS inline de `packages/ui-alquilame/nuxt.config.ts` define
las utilidades `-translate-x/y-1/2` y `-translate-*-[10%]` para el primer paint
above-the-fold.
**When**: la página completa carga y Tailwind v4 (CSS principal) aplica esas
mismas utilidades mediante la propiedad CSS `translate`.
**Then**: el critical CSS emite el translate por la MISMA propiedad `translate`
(no por `transform: translate(...)`, mecanismo v3), de modo que critical y CSS
principal NO se apilan: el desplazamiento efectivo es el declarado (−50% / −10%),
no el doble. Como consecuencia observable, los elementos centrados con
`-translate-*` quedan correctamente posicionados:
- el badge numérico de cada paso en `HomeHowItWorks` (`-top-6 left-1/2
  -translate-x-1/2`) queda horizontalmente centrado sobre su tarjeta
  (`|badgeCenterX − cardCenterX| ≤ 2px`), no corrido ~24px a la izquierda;
- el botón de cerrar del announcement bar queda centrado vertical (SCEN-002).
**And (no regresión de centrado/CLS)**: los elementos centrados con translate del
hero / above-the-fold conservan su posición; el critical CSS sigue presente (no se
elimina el guard de FOUC/CLS).
**Evidence**: estilo computado en navegador real — para un elemento con
`-translate-y-1/2`, `getComputedStyle(el).transform` NO contiene una traslación
adicional que sume al `translate` (el offset efectivo es −50%, no −100%);
`HomeHowItWorks` badge `|badgeCenterX − cardCenterX| ≤ 2px`. Test de fuente del
critical CSS: el bloque de utilidades translate usa la propiedad `translate:` y no
`transform: translate(`.
