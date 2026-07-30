# Auditoría GSC de dominios EMD — estado histórico y verificación actual

**Auditoría original:** 2026-01-16

**Última verificación:** 2026-07-30

**Informe completo actual:** `docs/seo/2026-07-30-auditoria-satelites.md`

## Cómo leer este documento

La auditoría de enero cubrió 19 nombres, revisó acciones manuales, seguridad y backlinks, y no encontró penalizaciones ni malware. Ese trabajo **no se repitió**. Sus cifras mensuales y clasificaciones son una fotografía histórica, no el estado actual.

La realidad del 2026-07-30 es distinta:

- el inventario productivo completo es de **43 propiedades con 10.192 clics/90d**;
- las 43 propiedades muestran “No se ha detectado ningún problema” en Acciones manuales;
- de los 19 nombres de enero, 14 ya redirigen, cuatro responden 525 y uno sigue vivo;
- los cuatro 525 no están en las propiedades actuales de Search Console, por lo que sus cifras históricas no se pudieron verificar.

## Resumen de la auditoría de enero — conservado como historia

| Clasificación de enero | Cantidad | Dominios anotados entonces |
|---|---:|---|
| Limpios / “verdes” | 13 | Armenia, Bucaramanga, Medellín, Cali, Santa Marta, Ibagué, Manizales, Neiva, Valledupar, Villavicencio, Floridablanca, Palmira, Soledad |
| Con backlinks para revisar / “amarillos” | 6 | Bogotá, Barranquilla, Cartagena, Pereira, Cúcuta, Montería |
| Con acción manual o seguridad / “rojos” | 0 | Ninguno |

Hallazgo histórico válido: en enero se reportaron **0 acciones manuales y 0 problemas de seguridad** para los 19. Los archivos de disavow preparados siguen en `docs/seo/disavow/`.

## Estado actual de los 19 nombres

| # | Dominio anotado en enero | Acción manual enero | Métricas mensuales anotadas en enero | Estado HTTP 2026-07-30 | GSC actual | Interpretación permitida |
|---:|---|---|---|---|---|---|
| 1 | `alquilerdecarrosbogota.com` | Limpio | 1.460 impr.; 34 clics; pos. 18,6 | 200, vivo e indexable | Sí: 67 clics / 2.191 impr. en 90d; acción manual limpia | Tráfico actual verificado; caso #447 |
| 2 | `alquilerdecarrosarmenia.com` | Limpio | 7.500; 313; pos. 9 | 525 | No | Las cifras de enero no se pueden atribuir hoy |
| 3 | `alquilerdecarrosbarranquilla.com` | Limpio | 7.633; 109; pos. 11,6 | 301 a `/barranquilla` | No | Redirect vivo; cifra histórica no revalidada |
| 4 | `alquilercarrosbucaramanga.com` | Limpio | 2.237; 24; pos. 17,1 | 301→301 a `/bucaramanga` | No | Redirect vivo; cifra histórica no revalidada |
| 5 | `alquilercarrosmedellin.co` | Limpio | 0; 0; pos. 1 | 301→301 a `/medellin` | No | Redirect vivo |
| 6 | `alquilercarroscali.net` | Limpio | 132; 0; pos. 70,9 | 301→301 a `/cali` | No | Redirect vivo |
| 7 | `alquilerdecarroscartagena.com` | Limpio | 2.397; 15; pos. 18,7 | 301 a `/cartagena` | No | Redirect vivo; cifra histórica no revalidada |
| 8 | `alquilercarrossantamarta.com` | Limpio | 5.300; 20; pos. 12,9 | 301→301 a `/santa-marta` | No | Redirect vivo; cifra histórica no revalidada |
| 9 | `alquilerdecarrospereira.com` | Limpio | 7.167; 101; pos. 13,1 | 525 | No | Las cifras de enero no se pueden atribuir hoy |
| 10 | `alquilerdecarroscucuta.com` | Limpio | 4.333; 60; pos. 10,5 | 301 a `/cucuta` | No | Redirect vivo; cifra histórica no revalidada |
| 11 | `alquilerdecarrosibague.com` | Limpio | 4.433; 70; pos. 10,8 | 301→301 a `/ibague` | No | Redirect vivo; cifra histórica no revalidada |
| 12 | `alquilerdecarrosmanizales.com` | Limpio | 4.400; 83; pos. 10,8 | 525 | No | Las cifras de enero no se pueden atribuir hoy |
| 13 | `alquilerdecarrosneiva.com` | Limpio | 3.063; 39; pos. 9 | 525 | No | Las cifras de enero no se pueden atribuir hoy |
| 14 | `alquilerdecarrosmonteria.com` | Limpio | 4.833; 105; pos. 7,4 | 301 a `/monteria` | No | Redirect vivo; cifra histórica no revalidada |
| 15 | `alquilerdecarrosvalledupar.com` | Limpio | 2.260; 23; pos. 9,6 | 301→301 a `/valledupar` | No | Redirect vivo; cifra histórica no revalidada |
| 16 | `alquilercarrosvillavicencio.com` | Limpio | 4.433; 63; pos. 11,1 | 301→301 a `/villavicencio` | No | Redirect vivo; cifra histórica no revalidada |
| 17 | `alquilerdecarrosfloridablanca.com` | Limpio | 427; 10; pos. 10,4 | 301→301 a `/floridablanca` | No | Redirect vivo |
| 18 | `alquilerdecarrospalmira.com` | Limpio | 2.433; 96; pos. 6,5 | 301→301 a `/palmira` | No | Redirect vivo; cifra histórica no revalidada |
| 19 | `alquilerdecarrossoledad.com` | Limpio | 135; 4; pos. 7,8 | 301→301 a `/soledad` | No | Redirect vivo |

## Los cuatro 525

Los cuatro dominios existen y están renovados. RDAP muestra a Cloudflare, Inc. como registrador, nameservers de Cloudflare y vencimientos en 2027. Esto descarta que sean simples cadenas nunca registradas, pero no prueba que las métricas de enero fueran suyas.

| Dominio 525 | Alta | Vence | Similar activo en GSC | Clics 90d del similar |
|---|---|---|---|---:|
| `alquilerdecarrosarmenia.com` | 2017-08-16 | 2027-08-16 | `alquilercarrosarmenia.com` | 356 |
| `alquilerdecarrospereira.com` | 2016-07-12 | 2027-07-12 | `alquilercarrospereira.com` | 348 |
| `alquilerdecarrosmanizales.com` | 2016-07-16 | 2027-07-16 | `alquilercarrosmanizales.com` | 570 |
| `alquilerdecarrosneiva.com` | 2018-08-02 | 2027-08-02 | `alquilercarrosneiva.com` | 225 |

**Regla documental:** no sumar las cifras de enero como tráfico perdido y no confundir los nombres con sus similares activos.

## Estado actual de acciones manuales del inventario productivo

El 2026-07-30 se abrieron las 43 propiedades productivas del informe actual. Resultado:

| Estado | Propiedades |
|---|---:|
| “No se ha detectado ningún problema” | 43 |
| Acción manual listada | 0 |
| No verificable | 0 |

La ausencia de acción manual no convierte la arquitectura en conforme. El análisis de política y el detalle por dominio están en `2026-07-30-auditoria-satelites.md`.

## Disavow: corrección de la afirmación histórica

En enero se dejaron seis archivos y este documento llegó a afirmar “Disavow subido / completado”. Esa ejecución no tiene hoy respaldo verificable en Search Console:

- la cuenta actual expone propiedades `sc-domain:`;
- Google dice que Disavow no soporta propiedades de dominio;
- al seleccionar `sc-domain:alquilerdecarrosbogota.com` la herramienta no muestra estado histórico;
- el repositorio prueba que el archivo fue preparado, no que fue subido.

Por ello, el estado correcto para Bogotá y los otros cinco es **upload histórico no verificado**. No se debe volver a subir por reflejo: Google recomienda la herramienta solo ante un volumen considerable de enlaces artificiales y una acción manual causada o probable. Las 43 propiedades están limpias hoy.

## Checklist para cualquier decisión futura

- [x] Inventario actual de 43 propiedades y tráfico de 90 días.
- [x] Acciones manuales actuales de las 43.
- [x] HTTP y cadenas de los 19 nombres históricos.
- [x] Registro público de los cuatro 525.
- [ ] Cuenta/pagador de Cloudflare de los cuatro 525 — no verificado.
- [ ] Fecha de inicio de los 525 — no verificada.
- [ ] Upload histórico de disavow — no verificado.
- [ ] Conversiones e ingreso por dominio — no verificado; GA4 fuera de alcance.
- [ ] Decisión del dueño sobre consolidación — pendiente; no ejecutar desde una auditoría.
