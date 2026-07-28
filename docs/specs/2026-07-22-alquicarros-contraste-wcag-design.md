# Contraste WCAG AA en alquicarros — diseño de remediación

Issue: [#364](https://github.com/amaw-sas/rentacar-web/issues/364) · Epic [#372](https://github.com/amaw-sas/rentacar-web/issues/372) · Fecha: 2026-07-22

## El problema, en una frase

El naranja institucional de alquicarros no admite texto blanco, y media aplicación lo usa igual.

Los ratios son malos de verdad. El H1 de los dos heroes está en 2.20:1 contra un mínimo de 3:1. El precio de cada vehículo —el dato por el que la gente entra— en 2.13:1. La sección de aliados en 1.90:1, que es el peor de la aplicación.

Lo que más me molesta no son los números. Es que ya estaban escritos. `app/assets/css/theme.css:62-65` lleva meses diciendo:

> "CAVEAT DE CONTRASTE (resolver en QA visual de F1): texto blanco sobre el naranja #EF9600 NO cumple WCAG AA para texto normal (~2.6:1). Los CTAs con texto deben usar brand-700+ o texto oscuro."

Ese QA nunca se hizo. Y hay un detalle peor: el remedio que prescribe tampoco cumple. `brand-700` sobre blanco da 3.74:1, por debajo del 4.5 que exige el texto normal. La advertencia era correcta en el diagnóstico y equivocada en la cura.

## Qué se decidió

Texto oscuro sobre el naranja. El naranja no se toca.

La alternativa era oscurecer el token para salvar el texto blanco, y las cuentas la descartan: para que el blanco llegue a 4.5:1 hace falta bajar hasta `#b45309`, que es marrón quemado. No es un ajuste de accesibilidad, es un rebranding. `#ff9500` y `#ef9600` están verificados contra alquicarros.com y se quedan como están.

La tercera opción —un scrim negro sobre el gradiente— es la segunda disfrazada. El token queda intacto en el archivo, pero el usuario ve `#b36800`. Y no cubre Partners ni las cajas de Faq.

Hay un argumento que pesa más que las cuentas: **la convención de texto oscuro ya existe en el propio código**. `home/Faq.vue:32-42` y `city/Faq.vue:42-52` pintan cajas con el mismo gradiente `from-hero-from to-hero-to` y usan `text-black`. `FleetCard.vue:31,93` usa `text-gray-900` sobre `bg-brand-600` y saca 7.63:1. Esto no es adoptar una regla nueva. Es terminar una que quedó a medias.

## La paleta sale de los números, no del gusto

Medí cada candidato contra el **peor punto** de cada gradiente, no contra el color de partida. La diferencia importa: el gradiente del footer termina en `#e35d0a`, bastante más oscuro que su `#ff8a00` inicial.

| Candidato | hero (peor: `#ff6b1c`) | footer (peor: `#e35d0a`) | Veredicto |
|---|---|---|---|
| `gray-700` | 3.62 | 2.86 | falla |
| `gray-800` | 5.15 | 4.08 | falla en footer |
| `gray-900` | 6.23 | 4.93 | **cumple los dos** |
| `black` | 7.37 | 5.84 | cumple, innecesario |

`gray-900` es el único tono que aguanta ambos. `gray-800` se queda a 0.42 en el tramo final de Partners.

Y una consecuencia que no esperaba: **ninguna opacidad sirve**. Sobre `#e35d0a`, `gray-900/90` da 4.48:1 y falla texto normal por 0.02. Los seis `text-white/75|80|85` que hay hoy no se traducen a `gray-900/85`; desaparecen. En superficie naranja la jerarquía tiene que salir de tamaño y peso.

Para el naranja como texto sobre fondo claro, el piso es `brand-800`:

| Shade | sobre `#ffffff` | sobre `#F4F5F9` |
|---|---|---|
| `brand-600` | 2.32 | 2.13 |
| `brand-700` | 3.74 | 3.43 |
| `brand-800` | 5.56 | 5.10 |

## Diseño

### El token que faltaba

Hoy las seis secciones naranjas llevan `[--ctx-text-primary:#fff]` inline. Eso declara "esto es una superficie oscura", y el naranja no lo es. El sistema produjo texto blanco porque se lo pidieron, no porque nadie lo decidiera mal en cada componente. Ahí está la causa raíz.

Peor aún: esa variable solo gobierna las clases `.heading-*`. El resto del texto de esas secciones es `text-white` crudo, fuera del sistema de tipografía. Por eso el defecto se propagó sin que ninguna capa lo frenara.

En `theme.css` entra un token semántico:

```css
/* Superficie de marca. El naranja institucional NO admite texto blanco:
   2.20:1 sobre #ff9500. gray-900 es el único tono que aguanta los dos
   gradientes (peor punto #e35d0a => 4.93:1). Sólido, sin alpha:
   gray-900/90 cae a 4.48:1 y falla texto normal. */
--color-on-brand: #111827;
```

En `typography.css` entra el contexto que faltaba. Había `.context-light` y `.context-dark`; el naranja no es ninguno de los dos:

```css
.context-brand {
  --ctx-text-primary:   var(--color-on-brand);
  --ctx-text-secondary: var(--color-on-brand);
  --ctx-text-muted:     var(--color-on-brand);
}
```

Los tres valores idénticos, a propósito. Sobre naranja no hay margen para un tono atenuado, y quiero que quede escrito para que nadie lo "mejore" dentro de seis meses.

### Tres reglas

| | Regla | Evidencia |
|---|---|---|
| R1 | Superficie naranja: `gray-900` sólido. Nunca blanco, nunca alpha. Incluye estados `hover:` y `focus:` | peor punto 4.93:1; `/90` = 4.48 |
| R2 | Naranja como texto sobre claro: `brand-800` mínimo. Iconos: `brand-700` mínimo | 600 = 2.13, 700 = 3.43, 800 = 5.10 |
| R3 | Gris sobre `surface-soft` / `#F4F5F9`: `gray-600` mínimo | `gray-500` = 4.44, falla por 0.06 |

El CAVEAT de `theme.css` se sustituye por estas reglas. No por otra advertencia: ya hubo una y no sirvió de nada.

Umbral aplicable, con la definición de WCAG 2.1 y no a ojo. Texto grande es 24px o más, o 18.66px en negrita o más; ahí el mínimo es 3:1. Todo lo demás es texto normal y pide 4.5:1. Los iconos y demás objetos gráficos van por 1.4.11 y piden 3:1. El tamaño se lee del estilo computado, no de la clase Tailwind: `text-3xl` puede estar sobrescrito por un `md:` más abajo.

### Estados, no solo estilos base

El issue midió estilos en reposo. Los estados también pintan, y uno falla: `home/Partners.vue:56,69` lleva `hover:text-white`, que da 2.36:1 sobre `#ff8a00` y 3.60:1 sobre `#e35d0a`. Pasar el ratón por encima de un aliado empeora el contraste del texto.

Los hover de los CTAs sí pasan con `brand-800`: `home/Hero:37` sobre `hover:bg-gray-100` da 5.05:1, y `city/Hero:113` sobre `hover:bg-white/90` (que compone a `#fff4e6`) da 5.12:1.

R1 cubre `hover:` y `focus:` por eso, y el invariante estructural busca `text-white` con cualquier prefijo de estado, no solo la clase suelta.

### Una sola superficie: no hay modo oscuro

Lo comprobé antes de diseñar la regla. `packages/ui-alquicarros/nuxt.config.ts:534` declara `colorMode.preference: 'light'`, y `e2e/color-mode.spec.ts` ya afirma que `html` lleva `light` y nunca `dark`. El bloque `.dark` de `theme.css` solo fija `--ui-primary` y no se activa nunca. Así que `--color-on-brand` tiene un único valor y no necesita variante.

## Por qué la medición tiene que ser runtime

Emparejando clases por línea con grep obtuve `text-brand-700` sobre `bg-brand-600` en `VehicleSegmentTile.vue:24`, que daría 1.61:1 y sería el peor caso del repositorio. Es falso. Son las dos ramas de un ternario:

```
:class="active ? 'bg-brand-600 text-gray-900' : 'bg-surface-soft text-brand-700'"
```

El análisis estático no resuelve ternarios ni ve fondos heredados del ancestro. Tampoco distingue texto de icono, ni texto grande de texto normal, y ahí es donde cambia el umbral entre 3:1 y 4.5:1. La sonda de estilos computados es la única fuente fiable.

## Alcance

Clase A, texto sobre superficie naranja: `home/Hero`, `city/Hero`, `home/Partners`, `home/Faq:33`, `city/Faq:43`, `wizard/steps/StepSearch:11`. Los dos `Faq` ya cumplen R1 y no cambian; sirven de confirmación de la regla.

Clase B, `text-brand-*` sobre fondo claro: 72 usos en 24 archivos. Confirmados fallando hasta ahora, `Stats:23` (icono, 2.32), `Stats:34` (badge de 11px, 2.24), `SeoContent:72` (2.19), `blog/index:41` (3.26), `Requirements:68` (3.45), `blog/[...slug]:230` (3.46) y `WizardStepper:132` (4.13). El resto se clasifica en el barrido runtime.

Clase C, grises de FleetCard: `:50` "Desde" 4.44, `:52` "+ IVA" 2.33, `:60` "IVA incluido" 3.46. Los tres son hallazgos nuevos, no estaban en la tabla del issue.

Fuera de alcance: las otras dos marcas —los tokens son por paquete y alquilame es rojo— y los P2 de #371 que no comparten causa con el naranja (estrellas de testimonios 1.53, chevrons 2.54, chips de horario 2.32, nombres de día 3.30).

## Escenarios observables

Todos se miden sobre el color efectivamente pintado, con el mínimo aplicable a cada elemento: 3:1 para texto grande e iconos, 4.5:1 para texto normal.

| | Escenario | Hoy |
|---|---|---|
| SCEN-01 | Home 1440×900: H1, subtítulo y CTA "Ver Precios" del hero cumplen su mínimo | 2.20 / 1.95 / 3.74 |
| SCEN-02 | Landing de ciudad: H1, subtítulo, badge "4.9 reviews" y CTA "Reservar ahora" cumplen | 2.20 / — / — / 2.20 |
| SCEN-03 | Card de flota: precio, "Desde", "+ IVA" e "IVA incluido" cumplen | 2.13 / 4.44 / 2.33 / 3.46 |
| SCEN-04 | Aliados: título, párrafo y nombres cumplen en todo el recorrido del gradiente | 1.90 |
| SCEN-05 | Paso 1 del wizard: `heading-label`, `heading-page` y `body-lg` sobre el hero cumplen | sin medir |
| SCEN-06 | Barrido de las 11 rutas: cero `text-brand-600` sobre claro; cero `text-brand-700` como texto normal | 7+ confirmados |
| SCEN-07 | El naranja pintado sigue siendo `#ff9500` / `#ef9600` | — |
| SCEN-08 | Mover un token naranja por debajo de 4.5:1 contra `--color-on-brand` pone rojo el test unitario | no existe |
| SCEN-09 | Rutas tocadas: cero errores de consola, cero peticiones fallidas | baseline limpio |
| SCEN-10 | Con el ratón encima de un aliado de Partners, el contraste sigue cumpliendo | 2.36 / 3.60 |

SCEN-07 existe para que este PR no se convierta en un cambio de marca disfrazado de arreglo de accesibilidad. SCEN-08, para que el problema no vuelva. SCEN-10 salió de revisar el spec, no del issue.

## Estrategia de satisfacción

Cuatro capas, de determinista a empírica.

La primera es un test unitario sobre el token: parsea `theme.css`, calcula el contraste de cada token naranja contra `--color-on-brand` y exige 4.5:1. Convierte la regla en algo ejecutable en vez de documentado, y es el único guard que sobrevive a un cambio de token futuro.

La segunda son invariantes estructurales por componente. Sustituyo el guard de `[--ctx-text-primary:#fff]` en `city/__tests__/Hero.test.ts:67` por `context-brand`, y añado ausencia de `text-white` en los seis componentes de superficie naranja. Aquí lo estático sí vale: es ausencia de un literal en un archivo conocido, sin ternarios de por medio.

La tercera es el barrido runtime con agent-browser sobre las 11 rutas en 1440 y 390, recalculando cada fila de la tabla del issue. Es la única capa que clasifica texto contra icono contra texto grande.

La cuarta es reparar el e2e de contraste. `e2e/accessibility.spec.ts:58-67` se llama "debe tener contraste adecuado en textos" y lo que comprueba es que `getComputedStyle(body).color` sea *truthy*. Ha estado en verde todo este tiempo con la página en 1.90:1. Eso no es un caso que se escapó: es cobertura falsa sobre exactamente este defecto, y dejarla ahí al lado del fix sería peor que no tener nada.

Esta cuarta capa es separable. Toca un archivo compartido por las tres marcas y no hace falta para cerrar #364. Si prefieres un PR más estrecho, sale y se va a su propio issue; lo dejo dentro porque el nombre del test promete justo lo que este PR arregla.

La tercera capa es el holdout. Los tests codifican las reglas; lo que decide si el issue está cerrado son los números del navegador. Si un test pasa y la sonda dice 3.9:1, gana la sonda.

## Riesgos

El cambio visual es real y es el precio de la decisión. Los heroes pasan de blanco sobre naranja a casi negro sobre naranja. Es más plano y más legible. Conviene que alguien de negocio lo vea antes del merge, aunque el naranja no se mueva ni un dígito.

`city/__tests__/Hero.test.ts` se va a poner rojo, y tiene que hacerlo: ancla una violación WCAG como invariante. Lo reemplazo por el contrato nuevo, no lo borro. De paso, ese archivo es copia de alquilame sin adaptar —su cabecera habla de "brand red gradient" y su constante `ROOT` está comentada como `→ packages/ui-alquilame`—, así que corrijo la documentación mientras estoy dentro.

Clase B toca 24 archivos, incluido el blog y el wizard completo. Es la parte con más superficie de regresión y la que justifica que el barrido runtime cubra las 11 rutas y no solo la home.
