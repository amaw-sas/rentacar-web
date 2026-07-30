# Estado verificado de redirects de los 19 EMD de enero

**Documento original:** 2026-01-16

**Última verificación en vivo:** 2026-07-30

**Estado:** inventario sincronizado; no autoriza cambios de infraestructura

**Informe completo:** `docs/seo/2026-07-30-auditoria-satelites.md`

## Resumen

El plan de enero ya no describe el estado vivo. De los 19 nombres:

| Estado al 2026-07-30 | Cantidad |
|---|---:|
| Redirigen 301 a la página exacta de `alquilatucarro.com` | 14 |
| Fallan con Cloudflare 525 | 4 |
| Sigue vivo, indexable y con contenido propio | 1 |

Los 14 redirects no son homogéneos:

- **4 hacen un salto:** satélite → `https://alquilatucarro.com/{ciudad}` → 200.
- **10 hacen dos saltos:** satélite → `https://alquilatucarro.com/{ciudad}/` → `/{ciudad}` → 200.

El issue #446 registró 14 dobles saltos el 2026-07-29. La medición del día siguiente ya encontró cuatro destinos sin barra final. No se verificó quién o qué hizo ese cambio; esta tabla informa únicamente lo observado.

## Tabla actual

| # | Dominio de enero | Estado HTTP medido | Cadena / destino final | Saltos | Estado documental |
|---:|---|---|---|---:|---|
| 1 | `alquilerdecarrosbogota.com` | 200 | Sigue en `https://alquilerdecarrosbogota.com/` | 0 | Vivo e indexable; 67 clics/90d; issue #447 |
| 2 | `alquilerdecarrosarmenia.com` | 525 | Sin destino HTTP | 0 | Registrado en Cloudflare; no está en GSC |
| 3 | `alquilerdecarrosbarranquilla.com` | 301→200 | `https://alquilatucarro.com/barranquilla` | 1 | Redirigido |
| 4 | `alquilercarrosbucaramanga.com` | 301→301→200 | `https://alquilatucarro.com/bucaramanga/` → `/bucaramanga` | 2 | Redirigido; doble salto |
| 5 | `alquilercarrosmedellin.co` | 301→301→200 | `https://alquilatucarro.com/medellin/` → `/medellin` | 2 | Redirigido; doble salto |
| 6 | `alquilercarroscali.net` | 301→301→200 | `https://alquilatucarro.com/cali/` → `/cali` | 2 | Redirigido; doble salto |
| 7 | `alquilerdecarroscartagena.com` | 301→200 | `https://alquilatucarro.com/cartagena` | 1 | Redirigido |
| 8 | `alquilercarrossantamarta.com` | 301→301→200 | `https://alquilatucarro.com/santa-marta/` → `/santa-marta` | 2 | Redirigido; doble salto |
| 9 | `alquilerdecarrospereira.com` | 525 | Sin destino HTTP | 0 | Registrado en Cloudflare; no está en GSC |
| 10 | `alquilerdecarroscucuta.com` | 301→200 | `https://alquilatucarro.com/cucuta` | 1 | Redirigido |
| 11 | `alquilerdecarrosibague.com` | 301→301→200 | `https://alquilatucarro.com/ibague/` → `/ibague` | 2 | Redirigido; doble salto |
| 12 | `alquilerdecarrosmanizales.com` | 525 | Sin destino HTTP | 0 | Registrado en Cloudflare; no está en GSC |
| 13 | `alquilerdecarrosneiva.com` | 525 | Sin destino HTTP | 0 | Registrado en Cloudflare; no está en GSC |
| 14 | `alquilerdecarrosmonteria.com` | 301→200 | `https://alquilatucarro.com/monteria` | 1 | Redirigido |
| 15 | `alquilerdecarrosvalledupar.com` | 301→301→200 | `https://alquilatucarro.com/valledupar/` → `/valledupar` | 2 | Redirigido; doble salto |
| 16 | `alquilercarrosvillavicencio.com` | 301→301→200 | `https://alquilatucarro.com/villavicencio/` → `/villavicencio` | 2 | Redirigido; doble salto |
| 17 | `alquilerdecarrosfloridablanca.com` | 301→301→200 | `https://alquilatucarro.com/floridablanca/` → `/floridablanca` | 2 | Redirigido; doble salto |
| 18 | `alquilerdecarrospalmira.com` | 301→301→200 | `https://alquilatucarro.com/palmira/` → `/palmira` | 2 | Redirigido; doble salto |
| 19 | `alquilerdecarrossoledad.com` | 301→301→200 | `https://alquilatucarro.com/soledad/` → `/soledad` | 2 | Redirigido; doble salto |

## Los cuatro 525 son dominios reales

RDAP del registro `.com`, consultado el 2026-07-30:

| Dominio | Alta | Vence | Registrador | Nameservers | Tráfico verificable actual |
|---|---|---|---|---|---|
| `alquilerdecarrosarmenia.com` | 2017-08-16 | 2027-08-16 | Cloudflare, Inc. | `BARBARA` / `CASEY.NS.CLOUDFLARE.COM` | No verificado; propiedad ausente de GSC |
| `alquilerdecarrospereira.com` | 2016-07-12 | 2027-07-12 | Cloudflare, Inc. | mismos | No verificado; propiedad ausente de GSC |
| `alquilerdecarrosmanizales.com` | 2016-07-16 | 2027-07-16 | Cloudflare, Inc. | mismos | No verificado; propiedad ausente de GSC |
| `alquilerdecarrosneiva.com` | 2018-08-02 | 2027-08-02 | Cloudflare, Inc. | mismos | No verificado; propiedad ausente de GSC |

Por tanto, no eran meros nombres imposibles. Sin embargo, no se puede afirmar que las métricas escritas en enero les pertenecieran: hoy no están en Search Console y existen dominios casi idénticos que sí producen.

| 525 de enero | Parecido productivo | Clics 2026-04-29 a 2026-07-28 |
|---|---|---:|
| `alquilerdecarrosarmenia.com` | `alquilercarrosarmenia.com` | 356 |
| `alquilerdecarrospereira.com` | `alquilercarrospereira.com` | 348 |
| `alquilerdecarrosmanizales.com` | `alquilercarrosmanizales.com` | 570 |
| `alquilerdecarrosneiva.com` | `alquilercarrosneiva.com` | 225 |

**No asumir pérdida de tráfico.** La cuenta de Cloudflare que paga los dominios y la fecha exacta desde la que fallan no fueron verificables con el acceso disponible.

## Recomendación, no instrucción de ejecución

1. No cambiar los 14 redirects sin una ventana de medición; los satélites son el 88% del tráfico orgánico considerado.
2. Cuando el dueño autorice mantenimiento, eliminar los diez dobles saltos apuntando directamente a la URL final sin barra.
3. Tratar los cuatro 525 como cartera registrada pero sin tráfico atribuible, no como incidente probado de pérdida.
4. Resolver `alquilerdecarrosbogota.com` por separado: la recomendación auditada es 301 controlado a `https://alquilatucarro.com/bogota`, sin ejecutar desde este frente.

## Historial corregido

El documento de enero hablaba de “13 dominios verdes listos” y mostraba todos los redirects como pendientes. Esa información queda reemplazada por la tabla anterior. La auditoría histórica y sus clasificaciones se conservan en `EMD-AUDIT-CHECKLIST.md`; no deben usarse como estado vivo.
