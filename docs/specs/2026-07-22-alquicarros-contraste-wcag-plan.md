# Contraste WCAG AA en alquicarros — plan de implementación

Spec: [`2026-07-22-alquicarros-contraste-wcag-design.md`](./2026-07-22-alquicarros-contraste-wcag-design.md) · Issue [#364](https://github.com/amaw-sas/rentacar-web/issues/364) · Fecha: 2026-07-22

Todo bajo `packages/ui-alquicarros/`salvo donde se diga otra cosa.

## Mapa de archivos

| Archivo | Responsabilidad | Qué le pasa |
|---|---|---|
| `app/assets/css/theme.css` | tokens de marca | entra `--color-on-brand`; el CAVEAT sale y lo sustituyen R1/R2/R3 |
| `app/assets/css/rentacar-main/typography.css` | escala tipográfica y contextos de fondo | entra `.context-brand`, junto a `.context-light` y `.context-dark` |
| `tests/brand-surface-contrast.test.ts` | **nuevo.** Guard ejecutable del token y de las superficies naranjas | calcula ratios reales sobre `theme.css` y comprueba ausencia de `text-white` |
| `app/components/home/Hero.vue` | hero de la home | R1 en titular, subtítulo y badge; R2 en la CTA |
| `app/components/city/Hero.vue` | hero de landing de ciudad | R1 + R2 |
| `app/components/home/Partners.vue` | marquee de aliados | R1 incluido el `hover:` |
| `app/components/wizard/steps/StepSearch.vue` | paso 1 del wizard | R1 |
| `app/components/home/FleetCard.vue` | card de flota | R2 en el precio, R3 en los grises |
| 24 archivos con `text-brand-*` | Clase B | R2 después de clasificarlos en runtime |
| `app/components/city/__tests__/Hero.test.ts` | invariante del hero de ciudad | el guard de `[--ctx-text-primary:#fff]` pasa a ser `context-brand` |
| `e2e/accessibility.spec.ts` *(raíz, 3 marcas)* | e2e de accesibilidad | la comprobación falsa pasa a ser sonda real. Separable |

Un archivo nuevo, no varios. `tests/brand-surface-contrast.test.ts` sigue el patrón de `tests/whatsapp-green-token.test.ts`, que ya hace exactamente esto para el verde de WhatsApp: lee `theme.css`, recorre el árbol y afirma sobre tokens y superficies. No hace falta inventar estructura.

## Lo que ya existe y hay que respetar

`tests/f0-foundation.test.ts:43` ancla `--color-hero-from: #ff9500`. Ese test ya defiende SCEN-07 y no se toca: si alguien intentara oscurecer el token en vez de aplicar R1, se pondría rojo solo. Es el guard que hace innecesario escribir otro.

`tests/wizard-contrast.a11y.test.ts` recorre una lista de archivos y afirma ausencia de una clase. Es el patrón para el invariante estructural: cada paso que arregla una superficie añade su archivo a la lista, así que no existe un paso dedicado a "escribir tests".

`typography.css` son tres copias independientes, una por marca, con hashes distintos. Añadir `.context-brand` a la de alquicarros no toca a alquilame ni a alquilatucarro. Lo comprobé antes de planificar porque la ruta `assets/css/rentacar-main/` sugiere un archivo compartido y no lo es.

## Prerrequisitos

Servidor de dev en el worktree, que necesita `pnpm install` y copiar `.env.local` a la raíz del worktree. Sin eso todo responde 500. Levantar con `PORT=4000 pnpm --filter ui-alquicarros dev`; el argumento `--port` da NuxtWelcome.

La navegación interna rebota a `:4000` si hay otro worktree sirviendo ahí, así que conviene comprobar `/proc/PID/cwd` antes de fiarse de lo que se ve.

## Pasos

### Fase 1 — Fundación

**1. El token de superficie de marca, con guard ejecutable** · S/M · sin dependencias

Cuando alguien mueva un token naranja de forma que el contraste contra `--color-on-brand` baje de 4.5:1, la suite se pone roja.

Entra `--color-on-brand: #111827` en `theme.css` y `.context-brand` en `typography.css`. El bloque CAVEAT se sustituye por R1, R2 y R3 con sus ratios. Se crea `tests/brand-surface-contrast.test.ts`, que parsea los `--color-*` naranjas de `theme.css`, calcula luminancia relativa según WCAG 2.x y exige 4.5:1 contra `--color-on-brand`.

Acepto el paso cuando el test nuevo pasa, cuando falla al bajar a mano `--color-on-brand` a `gray-800`, y cuando `f0-foundation.test.ts` sigue verde. → SCEN-08

### Fase 2 — Superficies naranjas, una por paso

Los pasos 2 a 5 son Clase A: cada uno deja la aplicación en un estado demostrable y añade su archivo a la lista del invariante estructural creado en el paso 2. El paso 6 va en esta fase por prioridad, no por clase —el precio de flota es lo más urgente del issue— y su guard es otro, según se explica ahí.

**2. Hero de la home** · S · depende de 1

El H1, el subtítulo y la CTA "Ver Precios" cumplen su mínimo AA.

`[--ctx-text-primary:#fff]` sale y entra `context-brand`. `text-white` pasa a `text-gray-900`; `text-white/85` pasa a `text-gray-900` sin alpha. La CTA sube de `text-brand-700` a `text-brand-800`. El invariante estructural se crea aquí con `home/Hero.vue` en la lista. → SCEN-01

**3. Hero de landing de ciudad** · M · depende de 2

El H1, el subtítulo, el badge "4.9 reviews" y la CTA "Reservar ahora" cumplen.

Mismo tratamiento, más la CTA `text-hero-from` → `text-brand-800` y las estrellas del badge. En `city/__tests__/Hero.test.ts:67` el guard de `[--ctx-text-primary:#fff]` pasa a exigir `context-brand`; el test se pone rojo antes de tocar el componente y verde después. De paso corrijo la cabecera del archivo, que es copia sin adaptar de alquilame y habla de "brand red gradient" con `ROOT` documentado como `→ packages/ui-alquilame`. → SCEN-02

**4. Aliados** · S · depende de 2

El título, el párrafo y los nombres cumplen en todo el gradiente, también con el ratón encima.

Los seis `text-white/75|80` pasan a `text-gray-900` sólido, y `hover:text-white` desaparece (era 2.36:1). La jerarquía la sostienen el `text-2xl md:text-3xl font-extrabold` que ya está. → SCEN-04, SCEN-10

**5. Paso 1 del wizard** · S · depende de 2

`heading-label`, `heading-page` y `body-lg` sobre el hero naranja cumplen.

Aquí el arreglo es casi todo de contexto: `context-brand` alimenta las tres clases por variable. Se quitan los `text-white/80` y `text-white/85` que las sobrescriben. → SCEN-05

**6. Card de flota** · S · depende de 1

El precio, "Desde", "+ IVA" e "IVA incluido" cumplen.

Precio de `text-brand-600` a `text-brand-800`. "Desde" y "+ IVA" a `text-gray-600`. "IVA incluido" en `emerald-600` da 3.46:1 y necesita bajar de tono. El badge y la CTA ya cumplen y no se tocan.

El guard aquí ya existe: `tests/wizard-contrast.a11y.test.ts` recorre una lista de archivos afirmando ausencia de `text-gray-400`, y `FleetCard.vue:52` usa justo esa clase. Basta con añadir el archivo a esa lista, que es donde el repositorio ya guarda esta clase de invariante. → SCEN-03

### Fase 3 — Clase B

**7. Clasificar los 72 usos de `text-brand-*` en runtime** · M · depende de 1

Una tabla que dice, por cada uso, si es texto normal, texto grande o icono, y cuál es su ratio real.

Sonda de estilos computados con agent-browser sobre las 11 rutas. El tamaño se lee del estilo computado, no de la clase: un `text-3xl` puede venir sobrescrito por un `md:` posterior. Esto existe como paso propio porque el análisis estático ya me dio un falso positivo de 1.61:1 en `VehicleSegmentTile.vue:24` que resultó ser un ternario. → insumo de SCEN-06

**8. Aplicar R2 en wizard, home y city** · M · depende de 7

Ningún `text-brand-600` sobre fondo claro; ningún `text-brand-700` como texto normal.

Confirmados hasta ahora: `Stats:23` icono a 2.32, `Stats:34` badge de 11px a 2.24, `SeoContent:72` a 2.19, `Requirements:68` a 3.45, `WizardStepper:132` a 4.13. El resto sale del paso 7. Los iconos se quedan en `brand-700` si llegan a 3:1. → SCEN-06

**9. Aplicar R2 en blog, páginas legales y layout** · M · depende de 7

Lo mismo en `pages/blog/**`, `terminos-condiciones`, `politica-privacidad` y `layouts/default.vue`.

Va aparte del paso 8 porque son rutas distintas con su propia verificación, y así cada paso queda por debajo de dos horas. `blog/index:41` está en 3.26 y `blog/[...slug]:230` en 3.46. → SCEN-06

### Fase 4 — Verificación

**10. Barrido runtime completo** · M · depende de 8 y 9

Las 11 rutas en 1440 y 390, con cada fila de la tabla del issue recalculada, más consola y red limpias.

Esta capa es el holdout. Si un test pasa y la sonda dice 3.9:1, gana la sonda. También confirma SCEN-07 mirando el color pintado del gradiente, no el archivo de tokens. → SCEN-01 a 07, SCEN-09

**11. Reparar el e2e de contraste** · S · depende de 10 · **separable**

El test llamado "debe tener contraste adecuado en textos" mide contraste de verdad.

Hoy `e2e/accessibility.spec.ts:58-67` comprueba que `getComputedStyle(body).color` sea *truthy*, y por eso lleva meses en verde con la página en 1.90:1. Pasa a barrer hero, precios y aliados. Toca un archivo de las tres marcas, así que si se prefiere un PR estrecho, este paso sale a su propio issue sin bloquear el cierre de #364.

## Estrategia de pruebas

El test del token es la única capa determinista y la única que sobrevive a un cambio futuro de paleta. Los invariantes estructurales cubren ausencia de literales en archivos conocidos, que es donde lo estático sí es fiable. El barrido runtime cubre lo que ninguna de las dos puede: si un elemento es icono, texto normal o texto grande, y qué color se pinta de verdad.

Correr solo la marca tocada: `pnpm --filter ui-alquicarros test`. Los tests de esta zona viven únicamente en `ui-alquicarros`, así que correr otra marca no prueba nada.

Typecheck nunca desde la raíz: congela el disco en WSL2. Una sola marca y con `ionice -c3 nice -n19`. La línea base de typecheck y lint está en rojo en `main`, así que lo que se compara es el delta contra esa base, no un verde absoluto.

## Despliegue y vuelta atrás

Son cambios de CSS y de plantilla, sin migración de datos ni de API. La vuelta atrás es un `git revert` del merge.

Lo que conviene mirar en preview antes de producción es el cambio visual: los heroes pasan de blanco sobre naranja a casi negro sobre naranja. El naranja no se mueve, pero la lectura de la marca sí.

## Riesgos

El paso 3 pone rojo un test a propósito. Es lo correcto —ancla una violación WCAG como invariante— pero conviene que quede escrito en el commit para que nadie lo lea como una regresión.

La Clase B toca 24 archivos, incluidos el blog y el wizard entero. Es la mayor superficie de regresión del PR y la razón de que el barrido del paso 10 cubra las 11 rutas y no solo la home.

`packages/logic` no recarga de forma fiable en los servidores de dev. Aquí no se toca `logic`, pero si algún paso deja el servidor con código viejo, hay que reiniciarlo antes de medir; medir contra código stale daría números falsos en ambas direcciones.
