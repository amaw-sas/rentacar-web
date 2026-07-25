# Auditoría SEO on-page — Alquilame

**Fecha:** 2026-07-24
**Qué se auditó:** la rama `preview/alquilame-todo` (HEAD `d2cdc33`) servida en local en `:4002`, más el sitio que hoy responde en `https://alquilame.co`
**Referencia de comparación:** alquilatucarro.com (marca hermana, en producción)
**Datos de Search Console:** sí, vía `gcloud` (proyecto `diego-seo-audit`); crudos en `alquilame_gsc/`

---

## Veredicto

El sitio Nuxt de Alquilame está técnicamente sano. Casi todo lo que una auditoría
on-page suele encontrar roto, aquí está bien: un solo H1 por página, canonicals
absolutos correctos en las 28 rutas, 527 de 527 imágenes con `alt`, JSON-LD
completo y sin colisiones de `@id`, `noindex` bien puesto en las URLs
paramétricas de reserva, y un 404 que devuelve 404 de verdad.

El problema no es ese. Son dos, y ninguno se arregla tocando metadatos:

1. **Ese sitio no existe en internet.** `alquilame.co` sirve hoy una landing
   vieja de una sola página que reparte todo el tráfico de ciudades a 19
   dominios externos. Las 19 páginas de ciudad que auditamos devuelven 404 en
   producción.
2. **Cuando se publique, el 92% del texto de cada ciudad ya estará publicado en
   alquilatucarro.com**, que sí está vivo e indexado desde hace tiempo.

Publicar la rama tal como está no es neutro: sería estrenar 19 páginas cuyo
contenido Google ya conoce en otro dominio de la misma empresa.

---

## Hallazgos, por orden de lo que más pesa

| # | Hallazgo | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|
| 1 | `alquilame.co` en producción es un sitio legacy distinto; todo el Nuxt está sin publicar | Crítico | Alto | Confirmado |
| 2 | El 92% del texto de cada ciudad ya está en alquilatucarro.com | Alto | Alto | Confirmado |
| 2b | Las meta descripciones de las 19 ciudades son idénticas entre las dos marcas | Alto | Bajo | Confirmado |
| 3 | El sitio legacy no tiene robots.txt, sitemap, canonical, OG ni JSON-LD | Alto | Bajo | Confirmado |
| 4 | `/blog` está vacío pero indexable, con prioridad 0.8 en el sitemap | Medio | Bajo | Confirmado |
| 5 | El enlazado interno es completamente plano: todo enlaza a todo | Medio | Medio | Confirmado |
| 6 | Las reseñas de clientes son las mismas, con los mismos nombres, en las dos marcas | Medio | Medio | Confirmado |
| 7 | La home emite `og:image` dos veces | Bajo | Trivial | **Corregido** |
| 8 | El blog comparte el logo SVG como imagen social y no tiene `twitter:image` | Bajo | Trivial | **Corregido** |
| 9 | El H1 del blog dice "Blog de alquilame", con la marca en minúscula | Bajo | Trivial | **Corregido** |

---

## 1. `alquilame.co` no sirve este sitio

Lo que responde hoy el dominio:

```
GET https://alquilame.co/           → 200, 112 KB, una sola página
GET https://alquilame.co/robots.txt → 404  (devuelve el HTML de la home)
GET https://alquilame.co/sitemap.xml→ 404
GET https://alquilame.co/bogota     → 404
GET https://alquilame.co/blog       → 404
GET https://alquilame.co/gana       → 404
```

La página que sí responde declara `<html lang="en">`, no tiene `canonical`, ni
una sola etiqueta Open Graph, ni un bloque de JSON-LD, y conserva un `<meta
keywords>` con 18 frases apiladas, una técnica que Google ignora desde 2009. De
sus 13 imágenes, 9 no tienen `alt`.

Su estructura es un directorio: el H2 dice "Elige la ciudad en la que deseas
alquilar un carro en Colombia", y debajo cada ciudad enlaza **fuera del dominio**,
a 19 sitios independientes:

```
Bogotá        → https://alquilerdecarrosenbogota.info
Medellín      → https://alquilerdecarrosenmedellin.info
Cali          → https://alquilerdecarrosencali.com
Cartagena     → https://alquilerdecarrosencartagena.com
… (19 en total, más carrosenrentaencancun.com)
```

Comprobé dos de ellos: están vivos, sirven sitios completos y se canonicalizan a
sí mismos (`ALQUILER DE CARROS EN BOGOTA USD $30 DIA/MES`). Es decir, **la
autoridad que alquilame.co pueda tener se está regalando a otros dominios**, y las
19 páginas de ciudad del Nuxt entrarían a competir contra esos mismos sitios.

También encontré que la landing usa un WhatsApp distinto al del Nuxt
(+57 314 682 6821 contra +57 300 243 6677) y enlaza a `reservatuauto.com`, a
`alquicarros.com` y a `alquilatucarro.com`.

Esto no es un despliegue. Es una migración.

Search Console muestra que la landing legacy tiene cuatro URLs con historial que
hay que mapear, no solo la home: `/terminos-condiciones`,
`/aviso-proteccion-de-datos`, `/terminos-condiciones.html` y `/registratuflota`
(437 impresiones en posición 3,1). El detalle, con destinos, está en la sección
de Search Console.

---

## 2. El 92% del texto de ciudad ya está publicado en alquilatucarro.com

Comparé el texto renderizado de las 19 ciudades contra las mismas 19 páginas de
alquilatucarro, usando secuencias de 8 palabras consecutivas.

| Ciudad | Palabras | Repetido en las 19 ciudades | Ya publicado en alquilatucarro | Único de verdad |
|---|---|---|---|---|
| Bogotá | 1810 | 49% | 49% | **7%** |
| Medellín | 1786 | 49% | 49% | **7%** |
| Cali | 1776 | 50% | 48% | **7%** |
| Cartagena | 1715 | 52% | 46% | **8%** |
| … las 19 | ~1700 | 49-53% | 45-49% | **7-8%** |

**Promedio de contenido único por ciudad: 7,7%.**

En `/bogota`, 924 de 1824 palabras (50,7%) son idénticas palabra por palabra a
`alquilatucarro.com/bogota`. El pasaje idéntico más largo tiene **490 palabras
seguidas**: la sección completa "Explora Bogotá con tu carro de alquiler". Le
siguen un bloque de 117 palabras (las ventajas), uno de 106 (los testimonios), 62
(las preguntas frecuentes) y 52 (los puntos de entrega).

Los H2 de ciudad también coinciden literalmente entre las dos marcas:

```
Ventajas de alquilar carro en Bogotá
Explora Bogotá con tu carro de alquiler
Destinos para recorrer con carro rentado desde Bogotá
Consejos para alquilar carro en Bogotá
Mejor época para alquilar carro y viajar a Bogotá
Alquiler de carros en ciudades cercanas
Preguntas frecuentes sobre alquiler en Bogotá
```

La causa no es de redacción, es de arquitectura. El texto vive en la capa
compartida y las tres marcas lo consumen:

- `packages/logic/src/composables/useCityContent.ts` (628 líneas) — intro,
  destinos, pico y placa, peajes, parqueaderos y mejor temporada de las 19 ciudades
- `packages/logic/src/composables/useCityFAQs.ts` — las preguntas frecuentes
- `packages/logic/src/composables/useCityTestimonials.ts` — las reseñas, vía
  `/api/city-testimonials`

Los tres `CityPage.vue` (alquilame, alquilatucarro, alquicarros) importan lo
mismo.

Y el orden de llegada importa. Verifiqué que `alquilatucarro.com/bogota` sirve
hoy, en producción, esos mismos bloques. Cuando Google encuentre el texto por
segunda vez en alquilame.co, gana el que ya llevaba meses indexado. Alquilame no
arranca de cero: arranca en desventaja.

Salir de ahí cuesta reescribir la parte de ciudad solo para Alquilame: entre 500
y 800 palabras por cada una de las 19. No es un arreglo de metadatos, es un
proyecto de contenido. Y hay que hacerlo sin romper las otras dos marcas, porque
la capa compartida hoy no sabe servir texto distinto según quién lo pida.

---

## 3. El blog está vacío y aun así se anuncia

`/blog` responde 200, es indexable, está en el sitemap con `priority 0.8` y
`changefreq weekly`, y su contenido completo es:

> "Próximamente encontrarás contenido sobre alquiler de carros en Colombia."

165 palabras en total, casi todas de la cabecera y el pie. El feed RSS lo
confirma desde otro ángulo: `/rss.xml` no tiene un solo `<item>`, y su
`lastBuildDate` es `Thu, 01 Jan 1970 00:00:00 GMT`.

Un índice vacío que se declara semanal en el sitemap le pide a Google que vuelva
a mirar algo que no cambia. Hay dos salidas razonables: sacarlo del sitemap y
ponerle `noindex` hasta que haya artículos, o publicar artículos antes de lanzar.
Es una decisión de negocio, no técnica, así que no la toqué.

---

## 4. El enlazado interno no prioriza nada

Construí el grafo de enlaces a partir del crawl. El resultado es plano:

```
/                    → 28 enlaces entrantes
/bogota              → 28
/quejas-y-reclamos   → 28
/terminos-condiciones→ 28
… las 28 páginas     → 28
```

Todas las páginas reciben exactamente los mismos enlaces, porque el pie de página
enlaza a todo desde todas partes. Para Google, eso dice que `/quejas-y-reclamos`
importa tanto como `/bogota`.

Lo que sí está bien resuelto es el enlazado contextual dentro del cuerpo. En
`/bogota` hay 26 enlaces internos fuera del footer, y los de ciudades cercanas
llevan ancla útil:

```
/villavicencio  →  "Villavicencio · 2.5 horas en carro"
/ibague         →  "Ibagué · 3 horas en carro"
/medellin       →  "Medellín · 8 horas en carro"
```

Las dos excepciones al grafo plano son `/gana/terminos-condiciones` y
`/gana/politicas-privacidad`, con un solo enlace entrante cada una (desde
`/gana`). Está bien así: son páginas legales.

---

## 5. Las reseñas son las mismas en las dos marcas

Dentro del bloque duplicado de `/bogota` hay 106 palabras de testimonios con
nombre y apellido:

> "Julián Castillo — Colombia: tenía reuniones en el norte y en Chía el mismo
> día; con el carro pude cubrir ambas sin depender del tráfico de TransMilenio.
> La recogida en El Dorado fue en menos de 15 minutos."
> "Carolina Pinzón — Colombia: …"

Los mismos nombres y las mismas frases aparecen en `alquilatucarro.com/bogota`.
Vienen del endpoint compartido `/api/city-testimonials`.

Un cliente que compare las dos marcas ve las mismas personas recomendando ambas.
Para Google es contenido duplicado; para un usuario, es una señal de que las
reseñas no son de esa marca.

---

## 6. Tres defectos pequeños, ya corregidos

Los tres son de bajo riesgo y solo tocan Alquilame, así que los arreglé en esta
misma rama (`seo/alquilame-onpage`), con tests que los fijan en
`app/pages/__tests__/seo-meta-onpage.test.ts`.

La home emitía `og:image` dos veces. `app/pages/index.vue` declaraba `ogImage` y
`ogImageUrl` apuntando al mismo archivo, y nuxt-seo sacaba las dos etiquetas.
Quité `ogImageUrl`.

El blog compartía el logo SVG como imagen social
(`og:image = /images/brand/logo.svg`). Ninguna red social renderiza SVG en una
tarjeta, así que compartir `/blog` salía sin imagen. Ahora usa el JPG de marca de
1200×630, y añadí el `twitter:image` que faltaba: la página declaraba
`summary_large_image` sin imagen que enseñar.

El H1 del blog decía "Blog de alquilame". Usaba `franchise.shortname`
(`"alquilame"`) en vez de `organization.brand` (`"Alquilame"`).

Verificado en el servidor de desarrollo después del cambio: la home emite un solo
`og:image`, el blog emite `og:image` y `twitter:image` con el JPG, y el H1 dice
"Blog de Alquilame". Los 58 tests de páginas de Alquilame siguen pasando.

---

## Lo que está bien y no hay que tocar

Vale la pena dejarlo por escrito, porque en una auditoría es fácil que todo
parezca un problema.

| Dimensión | Estado | Evidencia |
|---|---|---|
| H1 | Un solo H1 en las 28 páginas | Ninguna página con 0 o 2 |
| Canonicals | Absolutos y correctos en las 28 | `https://alquilame.co/bogota`, etc. |
| Imágenes | 527 de 527 con `alt` | Las decorativas usan `alt=""`, que es lo correcto |
| Titles | Únicos, 29-65 caracteres | Ninguno duplicado |
| Descriptions | Únicas, ninguna pasa de 155 | `truncateForSEO` corta bien |
| JSON-LD | WebSite, WebPage, Organization, Service, BreadcrumbList, FAQPage | Sin colisiones de `@id`, todo parsea |
| robots.txt (producción) | Correcto, con `Sitemap:` apuntando bien | Verificado con `?mockProductionEnv` |
| Indexabilidad | `noindex` en `/chat`, `/pendiente`, `/reservado/**` y las URLs paramétricas de reserva | Coherente entre meta y cabecera HTTP |
| 404 | Una ciudad inexistente devuelve 404 real | `/ciudad-que-no-existe → 404` |
| Extensión | ~1700 palabras por ciudad | Suficiente para la intención de búsqueda |
| Precio del title | Dinámico y falla cerrado | `buildHomeSEO` omite el precio si la tarifa venció |
| OG / Twitter | Completos, con `og:locale`, dimensiones y `alt` | `summary_large_image` |

Dos cosas que parecen defectos y no lo son:

- **`/reservas` no tiene `<meta name="robots">`.** Lo lleva en la cabecera HTTP
  (`x-robots-tag: index, follow`), que es equivalente.
- **Las páginas de ciudad no emiten `Product` ni `Offer`.** Fue una decisión
  deliberada (`useCityProductSchema` → `useCityServiceSchema`, incidencia #312):
  se quitó el `AggregateRating` porque las calificaciones eran fabricadas. Cuesta
  los resultados enriquecidos con precio, pero la alternativa era publicar datos
  falsos.

---

## Alquilame frente a alquilatucarro

| | Alquilame (rama) | Alquilatucarro (producción) |
|---|---|---|
| Páginas de ciudad | 19 | 19 |
| Palabras por ciudad | ~1700 | ~1300 |
| H2 por ciudad | 15 | 11 |
| Secciones de marketing | Flota, Cómo funciona, Reseñas, Aliados | menos |
| Blog | vacío | con artículos |
| Estado | sin publicar | indexado |

Alquilame tiene la mejor página de las dos: más contenido, más estructura, mejor
diseño. Pero llega segunda al mismo texto. La ventaja de producto no compensa la
desventaja de haber llegado después con las mismas palabras.

---

## Qué no hacer

- **No publicar las 19 ciudades sin reescribir el texto.** Es el único hallazgo
  que empeora si se ejecuta rápido.
- **No redirigir los satélites antes de reescribir el texto.** Ya están medidos:
  traen 4.807 clics por trimestre, tres veces más que alquilame.co. Redirigirlos
  hacia páginas con contenido duplicado es la forma más rápida de perderlos.
- **No añadir `Product`/`AggregateRating` para conseguir estrellitas.** Ya se
  quitó una vez por datos fabricados.
- **No perseguir el enlazado plano antes que los dos hallazgos grandes.** Es
  real, pero mover el 5% cuando el 92% del contenido está duplicado no cambia el
  resultado.

---

## Los datos de Search Console

No hizo falta crear credenciales nuevas: `gcloud` ya está autenticado como
`info@artesyweb.com` y el proyecto `diego-seo-audit` existe desde la misión del
2026-07-18. Solo faltaba asignarle el quota project:

```bash
gcloud auth application-default set-quota-project diego-seo-audit
```

La cuenta tiene 89 propiedades, 70 de ellas como propietario. Entre ellas
`sc-domain:alquilame.co` y los 19 satélites.

Los datos crudos y los scripts quedaron en `alquilame_gsc/` (carpeta ignorada por
git). Periodo: 2026-04-24 a 2026-07-21.

### La landing legacy tiene tráfico de verdad

| Métrica | alquilame.co | alquilatucarro.com |
|---|---|---|
| Clics | 1.549 | 1.665 |
| Impresiones | 92.003 | 113.099 |
| Posición media | 12,7 | 12,2 |

De los 1.549 clics, **1.540 son de la home**. Las otras URLs indexadas apenas
suman: `/terminos-condiciones`, `/aviso-proteccion-de-datos` y `/registratuflota`
(esta última con 437 impresiones en posición 3,1, así que hay que redirigirla, no
dejarla morir).

Dos cosas que saltan en las búsquedas:

- La marca propia, `alquilame`, sale en **posición 3,4**. Debería ser la 1.
- `alquiler de carros bogota` le da **3.017 impresiones en posición 13,1** y solo
  15 clics. Google ya la considera candidata para consultas de ciudad, pero la
  deja en la segunda página porque la landing no tiene página de Bogotá.

### Los satélites valen tres veces más que el dominio principal

| Dominio | Ciudad | Clics | Impresiones | CTR | Posición |
|---|---|---:|---:|---:|---:|
| alquilerdecarrosenibague.com | Ibagué | 693 | 9.452 | 7,33% | 5,9 |
| alquilerdecarrosenarmenia.com | Armenia | 577 | 11.304 | 5,10% | 6,9 |
| alquilerdecarrosenmanizales.com | Manizales | 564 | 10.153 | 5,56% | 6,7 |
| alquilerdecarrosenbucaramanga.com | Bucaramanga | 430 | 16.473 | 2,61% | 8,4 |
| alquilerdecarrosenvalledupar.com | Valledupar | 376 | 5.778 | 6,51% | 6,3 |
| alquilerdecarrosenmonteria.com | Montería | 346 | 8.860 | 3,91% | 6,8 |
| alquilerdecarrosenpalmira.com | Palmira | 336 | 5.057 | 6,64% | 7,6 |
| alquilerdecarrosenvillavicencio.com | Villavicencio | 286 | 8.192 | 3,49% | 7,6 |
| alquilerdecarrosenneiva.com | Neiva | 283 | 7.148 | 3,96% | 7,2 |
| alquilerdecarrosencali.com | Cali | 253 | 21.620 | 1,17% | 11,5 |
| alquilerdecarrosensantamarta.com | Santa Marta | 198 | 15.707 | 1,26% | 9,6 |
| alquilerdecarrosencartagena.com | Cartagena | 132 | 16.133 | 0,82% | 16,4 |
| alquilerdecarrosenpereira.com | Pereira | 97 | 7.418 | 1,31% | 13,0 |
| alquilerdecarrosenbarranquilla.com | Barranquilla | 85 | 8.084 | 1,05% | 13,6 |
| alquilerdecarrosencucuta.com | Cúcuta | 74 | 5.131 | 1,44% | 9,4 |
| alquilerdecarrosensoledad.com | Soledad | 34 | 1.206 | 2,82% | 14,4 |
| alquilerdecarrosenmedellin.info | Medellín | 21 | 2.451 | 0,86% | 30,0 |
| alquilerdecarrosenfloridablanca.com | Floridablanca | 19 | 1.194 | 1,59% | 10,9 |
| alquilerdecarrosenbogota.info | Bogotá | 3 | 3.111 | 0,10% | 15,8 |
| **Total** | | **4.807** | **164.472** | | |

**4.807 clics contra 1.549.** El negocio orgánico de Alquilame no está en
alquilame.co: está repartido en 19 dominios que llevan años rankeando en
posiciones 6-8 para su ciudad. Ibagué, Armenia, Manizales y Valledupar convierten
entre el 5% y el 7% de sus impresiones, que es un rendimiento alto.

Los dos `.info` son la excepción: Bogotá con 3 clics y Medellín con 21, ambos
hundidos. Justo las dos ciudades más grandes del país.

### Qué implica para el plan de redirecciones

La idea de redirigir cada satélite a `alquilame.co/{ciudad}` es la correcta a
largo plazo: consolida 19 señales dispersas en un solo dominio. Pero **el orden
importa mucho más que la decisión**.

Una redirección 301 traslada la autoridad, no el puesto. Google reevalúa la
página de destino, y si encuentra un texto que ya tiene indexado en
alquilatucarro.com, puede decidir no rankearla. En ese escenario no mueves 4.807
clics: los pierdes.

El orden que aguanta el error:

1. Reescribir el texto de las 19 ciudades para Alquilame
2. Publicar alquilame.co con sus páginas de ciudad
3. Comprobar en Search Console que esas 19 URLs se indexan y empiezan a recibir
   impresiones por su ciudad
4. Redirigir por olas, empezando por los que no tienen nada que perder:
   `bogota.info` (3 clics), `floridablanca` (19), `medellin.info` (21),
   `soledad` (34)
5. Medir cuatro a seis semanas. Si la ciudad de prueba mantiene o mejora, seguir
   con las medianas y dejar Ibagué, Armenia y Manizales de últimas

Antes de redirigir cualquiera hay que revisar sus backlinks. En el repo hay
precedente: `docs/seo/disavow/` tiene seis archivos de renuncia de enlaces
tóxicos de la migración anterior de EMDs hacia alquilatucarro, y
`docs/seo/EMD-AUDIT-CHECKLIST.md` documenta que de 38 dominios auditados, varios
quedaron marcados como "disavow → esperar → redirect". Redirigir un dominio con
perfil sucio importa esa suciedad al destino.

Y hay redirecciones que no son de ciudad y también hay que mapear:

| URL legacy | Destino |
|---|---|
| `/registratuflota` | `/aliados` |
| `/terminos-condiciones` | `/terminos-condiciones` |
| `/aviso-proteccion-de-datos` | `/politica-privacidad` |
| `/terminos-condiciones.html` | `/terminos-condiciones` |

Ojo con `docs/seo/data/performance.json`: trae cifras (12.500 impresiones, 890
clics) que no corresponden a Alquilame. Son de alquilatucarro o son de relleno.
No usarlas: los datos buenos están en `alquilame_gsc/`.

---

## Decisiones tomadas (2026-07-24)

Después de revisar los datos, el dueño del proyecto decidió:

1. **Los 19 satélites se redirigen uno a uno** a `alquilame.co/{ciudad}`, con 301.
   No se apagan, no se dejan como están.
2. **El texto de las 19 ciudades se reescribe** para que no coincida con
   alquilatucarro.
3. **El WhatsApp que queda es el del sitio nuevo**, +57 300 243 6677. El
   +57 314 682 6821 de la landing legacy se da de baja. El repositorio ya usa
   solo el nuevo, así que no hay nada que cambiar en código.
4. **El blog sale al aire con al menos un artículo**, en otra rama y como trabajo
   aparte.

Con eso, el orden de ejecución queda:

| # | Paso | Bloquea a |
|---|---|---|
| 1 | Reescribir las 19 ciudades (y habilitar texto por marca en la capa compartida) | 2, 4 |
| 2 | Publicar alquilame.co con sus páginas de ciudad | 3, 4 |
| 3 | Redirigir las 4 URLs legacy con historial | — |
| 4 | Auditar backlinks de los 19 satélites y redirigir por olas, de menor a mayor tráfico | — |
| 5 | Primer artículo del blog | — |

El paso 4 no puede adelantarse al 2: redirigir hacia una URL que devuelve 404
manda el tráfico a la nada.

---

## Plan de diferenciación de contenido (pendiente, otra rama)

Decidido: se reescribe **todo** lo que hoy se comparte con alquilatucarro,
incluidos los testimonios. Se conserva la estructura actual de secciones y se
escribe texto nuevo; los H2 pueden cambiar buscando variantes que digan lo mismo
con otras palabras.

Una nota sobre eso último: el peso está en el cuerpo, no en los títulos. Los H2
son unas 60 palabras de 1.700. Cambiarlos ayuda a que la página no se lea como
un calco, pero lo que mueve la aguja es reescribir de verdad las 490 palabras del
bloque grande. Cambiar solo los encabezados no bajaría el 92%.

### Criterio de éxito, medible

El mismo script de esta auditoría vuelve a correrse al terminar:

```bash
node extract.mjs <crawl-alquilame> ; node extract.mjs <crawl-alquilatucarro>
```

Meta: que el porcentaje de secuencias de 8 palabras compartidas con
alquilatucarro baje **de 45-49% a menos del 15%** en las 19 ciudades. Ese 15%
residual es aceptable: son datos factuales que legítimamente coinciden (nombres
de aeropuertos, tarifas de peaje, reglas de pico y placa).

### Cuatro frentes, de más fácil a más caro

**Frente A — el texto largo.** `packages/logic/src/composables/useCityContent.ts`,
628 líneas: intro, destinos, consejos de conducción y mejor temporada de las 19
ciudades. Es el bloque de 490 palabras.

El punto de conexión es limpio. Cada marca lo llama en una sola línea:

- `packages/ui-alquilame/app/components/CityPage.vue:117`
- `packages/ui-alquilatucarro/app/components/CityPage.vue:453`
- `packages/ui-alquicarros/app/components/CityPage.vue:95`

Basta con crear el contenido propio dentro del paquete de Alquilame y cambiar esa
línea. Las otras dos marcas no se enteran. Riesgo casi nulo.

**Frente B — las preguntas frecuentes.** `useCityFAQs.ts`, otras 628 líneas.
Mismo patrón, mismo costo. Ojo: alimentan el `FAQPage` de datos estructurados, así
que el texto nuevo tiene que seguir coincidiendo con lo que se ve en pantalla.
Declarar en el schema una pregunta que no está visible es motivo de penalización.

**Frente C — las meta descripciones.** Salen de la columna `description` de la
tabla `cities` en Supabase, y hoy son **idénticas byte por byte** en las dos
marcas (verificado en 7 de 7 ciudades comprobadas). Es la línea que Google enseña
debajo del título: dos marcas de la misma empresa mostrando el mismo texto en la
misma búsqueda.

**Frente D — los testimonios.** Los más caros. Viven en la columna
`testimonials` (JSON) de la misma tabla `cities`, y se sirven por
`packages/logic/server/api/city-testimonials.get.ts`. No hay pantalla en el
dashboard que los edite: se manejan con `scripts/cities-snapshot.ts` y
`scripts/cities-backfill.ts` contra `scripts/cities-data.json`.

Para separarlos por marca hay tres caminos, de menor a mayor costo:

1. Reestructurar el JSON de la columna a `{ alquilame: [...], alquilatucarro: [...],
   alquicarros: [...] }` y que el endpoint reciba la marca y elija, con
   respaldo al formato actual si la clave no existe. Es el menos invasivo.
2. Columna nueva por marca.
3. Tabla aparte `city_testimonials` con columna de marca. El más limpio a futuro
   y el que más migración exige.

Cualquiera de los tres necesita, además, escribir 19 juegos de reseñas nuevas.
Y aquí hay una decisión de fondo que no es técnica: si las reseñas actuales no
corresponden a clientes reales de Alquilame, inventar otras nuevas repite el
problema en vez de resolverlo. Ya se quitó una vez el `AggregateRating` por datos
fabricados (incidencia #312).

### Orden sugerido

| # | Frente | Depende de | Riesgo |
|---|---|---|---|
| 1 | A — texto largo | nada | Bajo |
| 2 | C — meta descripciones | migración en Supabase | Bajo |
| 3 | B — preguntas frecuentes | nada (cuidar el schema) | Medio |
| 4 | D — testimonios | decisión sobre reseñas reales | Alto |

Los frentes A y B se pueden hacer sin tocar la base de datos. C y D obligan a
migración. Los cuatro caben en una rama aparte de esta.

---

## Cómo repetir esta auditoría

```bash
pnpm dev:alquilame            # sirve la rama en :4002
pnpm dev:alquilatucarro       # sirve la marca hermana en :4000
```

El crawl y el análisis quedaron en el scratchpad de la sesión:

- `crawl.sh <puerto> <directorio>` — descarga el HTML SSR de las 33 rutas
- `extract.mjs <directorio>` — extrae title, description, canonical, robots, OG,
  encabezados, texto, enlaces, imágenes y JSON-LD a JSON

En desarrollo, `robots.txt` y el `<meta robots>` salen siempre como
`noindex`. Es nuxt-robots protegiendo el entorno. Para ver lo que va a
producción hay que añadir `?mockProductionEnv` a la URL. El `<loc>` del sitemap
tampoco es fiable en local: sale como `https://[::1]:4002/`.
