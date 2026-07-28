---
name: cta-buscar-brand
created_by: orchestrator
created_at: 2026-07-22T15:26:27Z
---

# CTA "BUSCAR VEHÍCULOS" — identidad de marca y señal acotada (issue #363)

Holdout de la remediación del CTA principal del embudo de alquicarros, que hoy se
pinta `red-600` (`#dc2626`, el rojo institucional de **alquilame**) con un glow rojo
en bucle infinito sobre un hero naranja.

El botón vive **pelado** sobre el gradiente del hero (`--color-hero-from: #ff9500` →
`--color-hero-to: #ff6b1c`), sin tarjeta detrás: los campos del formulario son píldoras
`bg-white` individuales, el botón no. Por eso la propuesta original del issue
(`bg-brand-600`) no sirve — `#EF9600` contra `#ff9500` da 1.06:1 y el CTA se disolvería
en el fondo. La remediación va al extremo oscuro de la misma rampa naranja.

Superficies donde se monta: `app/components/city/Hero.vue` (solo `mode === 'results'`)
y `app/components/wizard/steps/StepSearch.vue` (`/reservas`), ambas vía
`app/components/Searcher.vue` y su fallback `app/components/Placeholders/Searcher.vue`.

---

## SCEN-363-01: el CTA deja de vestir el rojo de otra marca

**Given**: `/reservas` de alquicarros cargada, el buscador hidratado y el botón
"BUSCAR VEHÍCULOS" habilitado.

**When**: se leen los estilos computados del botón.

**Then**: `backgroundColor` es `rgb(124, 45, 18)` (`#7c2d12`, `brand-900` de la rampa
naranja de alquicarros) y ninguna capa de su `box-shadow` contiene `rgba(220, 38, 38`.

**Evidence**: `getComputedStyle` del botón vía agent-browser — valores literales de
`backgroundColor` y `boxShadow`.

---

## SCEN-363-02: el CTA se despega del hero en el que está apoyado

**Given**: el botón renderizado sobre el gradiente naranja del hero, en `/reservas` y
en una ciudad en modo results.

**When**: se calcula el ratio de contraste WCAG entre el `backgroundColor` pintado del
botón y **cada uno de los dos extremos** del gradiente.

**Then**: ambos ratios alcanzan 3.0:1 — el mínimo de WCAG 1.4.11 para contraste de
componentes no textuales. Valores esperados: 4.26:1 contra `#ff9500` y 3.29:1 contra
`#ff6b1c`. El extremo `to` es el operativo: el gradiente es `to-br` y el botón cae de
ese lado.

**Evidence**: `backgroundColor` computado del botón y del `section#hero`, más los dos
ratios calculados sobre esos valores pintados (no sobre los tokens del archivo).

---

## SCEN-363-03: la etiqueta del CTA se lee sobre su propio relleno

**Given**: el botón habilitado con el texto "BUSCAR VEHÍCULOS".

**When**: se calcula el ratio entre `color` y `backgroundColor` computados.

**Then**: alcanza 4.5:1 — mínimo AA para texto normal. Valor esperado: 9.37:1 (blanco
sobre `#7c2d12`). El texto va blanco porque la superficie es oscura; la regla de #364
—texto oscuro sobre naranja— aplica a superficies naranjas, y esta no lo es.

**Evidence**: `color` y `backgroundColor` computados, más el ratio.

---

## SCEN-363-04: el pulso se detiene solo

**Given**: una carga limpia de `/reservas` con el botón habilitado, sin interacción del
usuario y sin `prefers-reduced-motion` activo.

**When**: se muestrea el `box-shadow` computado del botón a t≈0.4 s, t≈2.0 s, t≈6.0 s
y t≈7.0 s desde la hidratación.

**Then**: las muestras de 0.4 s y 2.0 s **difieren** entre sí (la animación corrió), las
de 6.0 s y 7.0 s son **idénticas** (se detuvo antes de los 5 s del umbral de WCAG 2.2.2),
y la muestra final **no es `none`**: queda el halo suave puesto en vez de cortarse de golpe.

**Evidence**: la serie de cuatro valores de `boxShadow`, con sus marcas de tiempo.

---

## SCEN-363-05: el pulso vuelve cuando hay algo nuevo que buscar

**Given**: una búsqueda ya completada — el botón está deshabilitado y su lista de clases
ya no incluye `search-button-glow`.

**When**: el usuario cambia la fecha de recogida.

**Then**: el botón se habilita, recupera la clase `search-button-glow`, su `box-shadow`
vuelve a variar entre muestras consecutivas, y se detiene de nuevo antes de 5 s.

**Evidence**: `classList` del botón y su atributo `disabled` antes y después, más una
segunda serie de muestras de `boxShadow`.

---

## SCEN-363-06: quien pidió menos movimiento no ve rojo tampoco

**Given**: `prefers-reduced-motion: reduce` emulado en el navegador.

**When**: se carga `/reservas` y se leen los estilos computados del botón.

**Then**: `animationName` es `none`, el `box-shadow` estático contiene
`rgba(255, 255, 255` y no contiene `rgba(220, 38, 38`.

**Evidence**: `animationName` y `boxShadow` computados bajo emulación de reduced-motion.

---

## SCEN-363-07: las otras dos marcas quedan intactas

**Given**: la remediación aplicada en `packages/ui-alquicarros`.

**When**: se compara la rama contra `main`.

**Then**: cero líneas modificadas bajo `packages/ui-alquilame` y
`packages/ui-alquilatucarro`. El rojo en sus copias de `base.css` no es un bug: es la
marca de alquilame.

**Evidence**: salida de `git diff --stat main...HEAD`.

---

## SCEN-363-08: el guard se pone rojo si alguien devuelve el rojo

**Given**: la suite de `ui-alquicarros` en verde.

**When**: se revierte a mano el relleno de `.search-button` a `bg-red-600`, o se
devuelve `infinite` a `.search-button-glow`.

**Then**: `pnpm --filter ui-alquicarros test` falla nombrando la regla incumplida y el
ratio medido — no un `expect` genérico.

**Evidence**: salida de vitest con el mensaje de fallo, antes y después de revertir.
