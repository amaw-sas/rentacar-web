---
name: f1-home
created_by: pablo
created_at: 2026-06-24T00:00:00Z
---

# F1 — Home nueva de alquicarros (port de las secciones de alquilame, identidad naranja)

Holdout observable para la fase F1. El motor de reservas no cambia; solo se porta
la capa de presentación a `ui-alquicarros` con la paleta naranja de F0. Reviews se
omite en F1 (decisión: no fabricar data de Google).

## SCEN-F1-01: la home renderiza las secciones del diseño en orden, sin Reviews
**Given**: un visitante anónimo abre la home de alquicarros (`/`)
**When**: la página termina de cargar
**Then**: se renderizan, en orden, las secciones AnnouncementBar, Hero, Fleet,
HowItWorks, ValueProps, Cities, Stats, Requirements, Faq, Contact, Partners; NO
existe una sección de reseñas de Google
**Evidence**: DOM — presencia de cada bloque de sección (landmark/heading/testid)
y ausencia de un bloque "reseñas verificadas en Google"

## SCEN-F1-02: la identidad de marca es naranja, sin rojo residual de alquilame
**Given**: la home renderizada
**When**: se inspeccionan el CTA primario y el gradiente del hero
**Then**: su color computado es el naranja de marca (CTA ≈ `#ef9600`/`brand-600`,
hero gradient anclado en `--color-hero-from` = `#ff9500`); ningún componente de
`app/components/home/` shippeado contiene literales rojos de alquilame
(`#cc022b`, `#cb032c`, `#a00425`, `#93070b`)
**Evidence**: computed style en browser + grep sobre `app/components/home/`

## SCEN-F1-03: el hero conserva el buscador funcional
**Given**: la home renderizada
**When**: el usuario selecciona lugar de recogida y fechas en el Searcher del hero
y dispara la búsqueda
**Then**: se ejecuta la consulta de disponibilidad real (igual que hoy), navegando
al flujo de resultados
**Evidence**: request de red al endpoint de disponibilidad + navegación

## SCEN-F1-04: cero data fabricada
**Given**: la home renderizada y el `<head>`
**When**: se inspeccionan textos de reseñas y el schema.org
**Then**: no aparece ningún conteo de reseñas inventado (p.ej. "43 reseñas"
de alquilame) ni un `AggregateRating` sin reseñas visibles que lo respalden
**Evidence**: DOM (sin bloque Google) + JSON-LD del head (sin AggregateRating huérfano)

## SCEN-F1-05: el copy de marca es config-driven, no menciona "Alquilame"
**Given**: la home de alquicarros renderizada
**When**: se lee el texto visible y el source de los componentes
**Then**: el nombre de marca proviene de `franchise.*` (Alquicarros); no hay
literal "Alquilame" ni datos de otra marca
**Evidence**: texto renderizado + grep sin "Alquilame" en `app/components/home/`

## SCEN-F1-06: los data-testid del E2E se preservan
**Given**: la home y el flujo de búsqueda
**When**: corren los selectores estables de los specs `BRAND=alquicarros`
**Then**: los `data-testid="*-test"` que consumían los E2E siguen presentes
**Evidence**: DOM — presencia de los testids consumidos por `/e2e/*.spec.ts`

## SCEN-F1-07: runtime limpio
**Given**: la home de alquicarros en un dev server
**When**: se carga la página y se hace scroll por todas las secciones
**Then**: cero errores de consola y cero requests de red fallidos
**Evidence**: consola del browser (agent-browser) + lista de network requests

## SCEN-F1-08: tipografía Montserrat
**Given**: la home renderizada
**When**: se inspecciona la fuente computada de titulares y cuerpo
**Then**: la familia es Montserrat (F0), no la fuente por defecto del sistema
**Evidence**: computed `font-family` en browser
