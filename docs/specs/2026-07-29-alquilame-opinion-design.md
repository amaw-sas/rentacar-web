# Página de opinión (`/opinion`)

Fecha: 2026-07-29 · Marcas: alquilame, alquilatucarro (desde 2026-09-03)
Paquetes: `packages/ui-alquilame`, `packages/ui-alquilatucarro`

> **Réplica en alquilatucarro (2026-09-03).** Este documento es el contrato de las DOS
> páginas. Son la misma salvo tres cosas:
>
> | | alquilame | alquilatucarro |
> |---|---|---|
> | Ficha de Google | `https://g.page/r/Ce09QLF1RhqkEBM/review` | `https://www.google.com/maps/place//data=!4m3!3m2!1s0xa2258f5934dd7fc3:0x61229dafa110309c!12e1` |
> | Paleta | escala `brand-*` (`theme.css`) | `red-*` de Tailwind — alquilatucarro no tiene escala `brand` |
> | Remitente Resend | `Alquilame <onboarding@resend.dev>` | `Alquilatucarro <onboarding@resend.dev>` |
>
> alquilatucarro no tiene alias corto `g.page/r/…` en su panel de GBP; de ahí el enlace
> largo de Maps. El `!12e1` del final es lo que abre el cuadro de reseña — sin él se cae
> en la ficha. El `1s0x…:0x…` sale de expandir el enlace corto de Maps del negocio con
> `curl -sIL -A "curl/8.0" <enlace-corto>`.
>
> Un cambio de comportamiento en una página tiene que replicarse en la otra: los dos
> paquetes tienen copias independientes de `StarRating.vue`, `PublicContactForm.vue`,
> `server/utils/contact-forms.ts` y `server/api/contact.post.ts`, y sus suites de tests
> son gemelas.

## Qué es y de dónde viene

Portar a Nuxt la página de calificación que vivía en GoHighLevel
(`crm.alquilame.co/preview/u9vchf9ZMq9gjhiZfezu`). El enlace se envía al cliente por
WhatsApp o correo después del alquiler; no es una página de tráfico orgánico.

El original es un filtro por estrellas: 1-3★ iban a un formulario interno y 4-5★ a la
ficha de Google. **La rama de 1-3★ nunca existió** — `rentacar.alquilame.co` no tiene
registro DNS y el propio código traía el comentario `// ¡REMPLAZA FORM_URL CON TU
FORMULARIO!`. Hoy el cliente descontento recibe un error de conexión.

Se conserva el filtro por decisión explícita del dueño, informado de que
`support.google.com/contributionpolicy/answer/7400114` prohíbe «discourage or prohibit
negative reviews, or selectively solicit positive reviews». No reabrir la discusión.

## Decisiones cerradas

| Decisión | Valor |
|---|---|
| Ruta | `/opinion` (sin tilde: sobrevive al copiar/pegar entre WhatsApp y navegador) |
| 1-3★ | Formulario **en la misma página**, sin navegar |
| 4-5★ | Redirección automática a los 800 ms, como el original |
| Destino Google | `https://g.page/r/Ce09QLF1RhqkEBM/review` — sin parámetros: el diálogo de Google **descarta** cualquier texto que se le pase (`?text=`, `?review=`, `?comment=` probados en navegador). No se puede prerrellenar la reseña, y la política de Google prohíbe pedir que incluya contenido concreto |
| Destino del correo | `NUXT_CONTACT_EMAIL_TO` vía Resend (tubería existente) |
| Indexación | `noindex, nofollow` + fuera del sitemap |
| Alcance | alquilame y alquilatucarro (ver «Réplica en alquilatucarro»). alquicarros NO |

Fuera de alcance: envío del enlace al cliente (sale del dashboard), persistencia en base
de datos, y réplica en alquicarros. La réplica en alquilatucarro SÍ se hizo el 2026-09-03
(ver el bloque de la cabecera); esta línea decía «réplica cross-marca» y quedó obsoleta.

## Arquitectura

Una ruta, tres estados en memoria (`rating: number | null`):

```
idle       logo · h1 · 5 estrellas huecas
  ├─ 4-5★  estrellas doradas + "Redirigiendo…" → 800 ms → GBP_URL
  └─ 1-3★  estrellas doradas fijas + PublicContactForm
```

La calificación no viaja por la URL. Al pasar a `feedback` las estrellas quedan
bloqueadas: el cliente ya eligió, y permitir re-calificar invita a buscar el umbral que
lleva a Google.

Con el layout por defecto, como `/quejas-y-reclamos`, `/aliados` y `/gana`. Se intentó
dejarla sin layout (`definePageMeta({ layout: false })`, como `/chat`) para que fuera una
pantalla enfocada: **el macro no surte efecto en esta página** — verificado en navegador
con servidor limpio, y descartadas la posición del macro, la caché de `.nuxt` y el
`import type` que apunta a otro `.vue`. `/chat`, con la misma directiva, sí renderiza sin
layout. Causa raíz sin encontrar. Se quitó la directiva antes que dejar en el código una
afirmación que el navegador desmiente, y con ella el logo de dentro de la página, que era
lo que se veía duplicado. **Abierto**: si se quiere la pantalla desnuda, primero hay que
averiguar por qué el macro se ignora aquí.

Al elegir 1-3★ el foco se lleva al `<h2>` del formulario (`tabindex="-1"`): en móvil nace
bajo el pliegue, y el foco se quedaba en una estrella ya congelada. El aviso de la rama de
4-5★ vive en una región `role="status"` que existe VACÍA desde el principio — una región
live insertada con el texto ya dentro no la anuncian ni NVDA ni VoiceOver.

El salto a Google va con `replace: true`: con `push`, volver con Atrás restauraba la
página desde bfcache congelada en «Redirigiendo…» y con las estrellas muertas. Un
`pageshow` con `event.persisted` recarga, igual que `Searcher.vue`.

### Archivos

**Nuevos**
- `app/pages/opinion.vue` — orquesta los tres estados.
- `app/components/StarRating.vue` — widget reutilizable.
- `app/components/__tests__/StarRating.test.ts`
- `app/pages/__tests__/opinion.test.ts`

**Modificados**
- `server/utils/contact-forms.ts` — tipo `resenas`.
- `server/utils/__tests__/contact-forms.test.ts` — casos nuevos, sin romper los existentes.
- `app/components/PublicContactForm.vue` — la unión del prop `type` pasa a
  `'quejas' | 'flota' | 'referidos' | 'resenas'`. Hoy declara solo `'quejas' | 'flota'`
  mientras `/gana` le pasa `"referidos"`: agujero de tipado real, se cierra de paso.
- `nuxt.config.ts` — excluir `/opinion` del sitemap.

### `StarRating.vue`

El original son `<span>` con `click`: sin teclado, sin nombre accesible, sin estado.
Se rehace con `<button type="button">` dentro de `role="radiogroup"`.

- Props: `modelValue: number | null`, `disabled?: boolean`.
- Emite `update:modelValue`.
- `aria-label` por estrella: `"1 estrella"` / `"N estrellas"`.
- `aria-checked` en el valor CONFIRMADO; `tabindex` roving (solo uno tabulable).
- Flechas ←/→ mueven y **previsualizan**; confirman el clic, Enter y Espacio.
  Las flechas no tocan `aria-checked`: anunciar «3 estrellas, marcado» sin que la
  aplicación haya registrado nada manda a la persona a cerrar creyendo que calificó.
- Widget controlado: el relleno y `aria-checked` sólo cambian cuando el padre
  devuelve el valor por `modelValue`. Adelantarse desincroniza widget y página
  cuando el padre descarta un segundo voto.
- Hover rellena hasta la estrella apuntada; al salir vuelve al valor real. Salir
  del grupo con Tab borra la previsualización de las flechas.
- Con `disabled`, los botones no responden pero SIGUEN recibiendo foco
  (`aria-disabled`, no `disabled`): el nativo desenfoca el botón enfocado en el
  mismo tick y tira el foco a `<body>`.
- Colores contra WCAG 1.4.11 sobre blanco: relleno `#d97706` (3,19:1), contorno
  `#4b5563` (7,56:1), más la calificación en texto — el color solo no basta.

### Formulario de 1-3★

`PublicContactForm` con `type="resenas"`:

| Campo | Tipo | Obligatorio |
|---|---|---|
| `nombre` | text | sí |
| `email` | email | sí |
| `telefono` | tel | no |
| `reserva` | text | no |
| `mensaje` | textarea | sí |

La calificación viaja aparte, como campo `estrellas` con el valor `"N de 5"`, puesto por
la página. `PublicContactForm` recibe un prop nuevo `extraFields?: Record<string, string>`
que se mezcla en el cuerpo del POST — sin campo visible ni editable.

### Servidor (`contact-forms.ts`)

```
ContactFormType   += 'resenas'
ContactFormPayload += estrellas?: string
REQUIRED.resenas   = ['nombre', 'email', 'mensaje']
SUBJECT.resenas    = 'Calificación baja de un cliente'
LABELS.estrellas   = 'Calificación'
FIELD_ORDER        → 'estrellas' primero
```

`server/api/contact.post.ts` sí se toca, aunque no por /opinion en sí:

- El 500 por configuración ausente ya no devuelve los nombres de las variables de
  entorno — el formulario los pintaba literales en pantalla. El detalle va al log.
- El `catch` vacío registraba nada: una queja perdida no dejaba rastro.
**Descartado — freno de envíos.** Se construyó un límite por IP (5 envíos / 10 min, en
memoria) y se retiró antes del PR: nadie lo pidió, cambia el comportamiento de tres
formularios que ya están vivos, y en Vercel el contador vive en cada instancia, así que
apenas protege. El riesgo real pesaba más: los operadores móviles colombianos comparten
IP de salida entre clientes (CGNAT), así que la queja de una persona podía rebotar con un
429 por culpa de otra. **El dueño lo descartó explícitamente (2026-07-29): no lo ve
necesario.** No volver a proponerlo sin que haya un abuso medido.

Correo resultante:

```
Asunto: Calificación baja de un cliente — Ana Ramírez
Reply-to: ana@ejemplo.com

Calificación: 2 de 5
Nombre: Ana Ramírez
Teléfono: 300 123 4567
Correo: ana@ejemplo.com
Número de reserva: AV33Y3U5QA
Mensaje: El carro llegó sin gasolina y esperé 40 minutos.
```

La calificación va primero porque es lo que decide si el operador abre el correo ya o
después.

`estrellas` llega del cliente y es falsificable dentro de /opinion. No importa: es un
correo interno, no una métrica publicada. No añadir defensas ahí.

Lo que sí se cierra: `estrellas` sólo se renderiza cuando `type` es `resenas`, y todos
los campos de una sola línea se aplanan. Como la calificación abre el cuerpo del correo,
aceptarla en quejas, flota o referidos —o dejar pasar un `\n` en `nombre`— le regalaba a
cualquiera la primera línea del correo del operador.

## Escenarios observables

| # | Given | When | Then |
|---|---|---|---|
| SCEN-1 | `/opinion` recién cargada | nada | 5 estrellas huecas, sin formulario, y `g.page` NO aparece en el DOM |
| SCEN-2 | `/opinion` en idle | clic en la 4ª estrella | 4 doradas, texto «Redirigiendo…», y a los 800 ms navega a `GBP_URL` |
| SCEN-3 | `/opinion` en idle | clic en la 2ª estrella | 2 doradas y bloqueadas, aparece el formulario, **no** hay navegación |
| SCEN-4 | formulario con 2★ y campos válidos | enviar | un POST a `/api/contact` con `type:'resenas'` y `estrellas:'2 de 5'`; luego mensaje de éxito |
| SCEN-5 | payload `resenas` con `estrellas` | `validateAndCompose` | `ok:true`, asunto `Calificación baja de un cliente — <nombre>`, primera línea `Calificación: 2 de 5`, `replyTo` = correo |
| SCEN-6 | formulario sin `mensaje` | enviar | error inline y **cero** llamadas a la API |
| SCEN-7 | foco en el radiogroup | flecha derecha ×2, luego Enter | queda seleccionada la 3ª estrella y dispara la misma rama que el clic |
| SCEN-8 | GET `/opinion` | — | `<meta name="robots" content="noindex, nofollow">` y la ruta no está en `/sitemap.xml`. La petición de verdad vive en `tests/seo-index-signals.http.test.ts` (Nitro); las pruebas de la página sólo pueden afirmar sobre la llamada a `useHead` y sobre el texto de `nuxt.config.ts` |
| SCEN-9 | payload `resenas` con `website` relleno | POST | `{ok:true}` sin componer correo |
| SCEN-10 | payloads `quejas`, `flota`, `referidos` | `validateAndCompose` | idénticos a hoy — cero regresión |

## Abierto — decisiones del dueño, no defectos por arreglar

- **La ventana de 800 ms no se puede parar, alargar ni desactivar** (WCAG 2.2.1). El
  aviso son ~60 caracteres: un lector de pantalla no alcanza a leer ni la primera
  palabra antes del salto. Se conserva porque es una decisión de la tabla de arriba
  («como el original»); cambiarlo es del dueño.
- **La calificación es irreversible desde el primer toque.** Un toque en el borde de la
  3ª estrella encierra al cliente en la rama de queja sin ningún «corregir». Permitir
  corregir es exactamente lo que deja tantear el umbral, así que las dos cosas no
  caben a la vez.
- **`GBP_URL` y el umbral viajan en claro en el chunk JS** de la página. Que el DOM no
  los enseñe antes de calificar no es ocultamiento: quien mire el bundle ve el filtro.
- **Freno por IP en memoria del proceso.** En Vercel cada instancia lleva el suyo. El
  límite durable necesita tabla o el RPC de Supabase que ya usa el blog.
- **Sin tope de longitud de los campos.** Un `mensaje` de megabytes sigue entrando; sólo
  el asunto está acotado (120 caracteres).

## Riesgos

- **Guardias cross-marca.** Hay pruebas en `ui-alquilatucarro` y `logic` que auditan
  código de otros paquetes. Correr solo la suite de alquilame ya dejó `main` en rojo
  antes. Verificar los tres paquetes.
- **vitest se cuelga dentro del paquete.** Correr desde la raíz del monorepo:
  `npx vitest run --root . <rutas completas>`, en lotes pequeños.
- **Sin `pnpm install` en el worktree.** Las dependencias están copiadas a mano; un
  install rompe el enlace de workspace y el worktree deja de compilar.
