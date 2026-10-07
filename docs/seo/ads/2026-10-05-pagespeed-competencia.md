# PageSpeed contra la competencia, 5 de octubre de 2026

## Método

- Herramienta: PageSpeed Insights (Lighthouse 13.5.0 de laboratorio, móvil emulado Moto G Power con 4G lenta; datos de campo de CrUX, últimos 28 días).
- La API v5 no se pudo usar. Sin llave devuelve 429 (cuota diaria agotada) y con el token de gcloud devuelve 403 (faltan permisos de `diego-seo-audit`). Se midió con la interfaz pagespeed.web.dev, que corre el mismo motor, desde el navegador de Orca.
- No hay JSON crudo. Se guardó el texto de cada informe en `/private/tmp/claude-501/-Users-diegomelo-orca-workspaces-rentacar-web-Google-Ads/4d1374a1-5327-43f0-9022-1f28367737f3/scratchpad/psi/` (`<sitio>_<estrategia>_r<corrida>_url.txt` y `_origin.txt`). Todas las cifras salen de esos archivos.
- Corridas: nuestras dos URLs, 2 corridas en móvil y 3 en escritorio. Competidores, 1 corrida en móvil y 2 en escritorio. Las columnas de laboratorio (FCP, LCP, TBT, CLS, SI) son de la corrida 1. El score muestra todas las corridas.
- El score de laboratorio varía mucho entre corridas, sobre todo en móvil (nuestra home: 61 y 88). Una corrida inicial de la home móvil, cuyo texto no se guardó, dio 46. Lee los scores como rangos, no como un número exacto.
- Campo: "Móvil URL" y "Escritorio URL" son los datos de esa página. "Origen" es el dominio completo.

## URLs medidas (URL final tras redirecciones con `curl -sIL`)

| Sitio | URL medida | Nota |
|---|---|---|
| alquilatucarro.com (home) | https://alquilatucarro.com/ | 200 sin redirección |
| alquilatucarro.com/bogota | https://alquilatucarro.com/bogota | 200; existe en el menú de la home |
| Booking.com Cars | https://www.booking.com/cars/index.es.html | 200 |
| LATAM Airlines | https://www.latamairlines.com/co/es/autos | NO verificada. `curl` se cuelga (exit 28) con cualquier ruta. No sé si esa ruta es la página de autos o una 404. PSI sí entregó informe. |
| Kayak Colombia | https://www.kayak.com.co/cars | 200 |
| Localiza Colombia | https://www.localiza.com/colombia/es-co | 200 (redirige desde /colombia) |
| Alkilautos | https://alkilautos.com/ | 200 (de alkilautos.com sin barra) |
| Rentcars | https://www.rentcars.com/es-co/ | `curl` recibe 403 (bloqueo de bots). PSI sí lo midió. |
| Renting Colombia | https://www.rentingcolombia.com/ | Sin www devuelve 500; con www 200. Es la home de renting (leasing de flota para empresas), no una landing de alquiler diario. Enlaza a Localiza. |
| Evolution Rent a Car | https://evolutionrentacar.com/ | 200 (redirige desde www) |

Ningún sitio bloqueó la medición de PSI. Ninguno quedó sin datos de campo.

## Laboratorio

### Móvil

| Sitio | Score (corridas) | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|
| alquilatucarro.com (home) | 61 / 88 | 2.9 s | 3.2 s | 1,700 ms | 0.05 | 3.0 s |
| alquilatucarro.com/bogota | 50 / 61 | 3.3 s | 3.3 s | 830 ms | 0.301 | 3.3 s |
| Booking.com Cars (ES) | 36 | 3.5 s | 6.3 s | 2,170 ms | 0.055 | 6.5 s |
| LATAM Airlines autos | 35 | 1.1 s | 23.7 s | 8,290 ms | 0.002 | 24.1 s |
| Kayak Colombia Cars | 35 | 11.6 s | 13.0 s | 860 ms | 0.001 | 11.6 s |
| Localiza Colombia | 24 | 10.3 s | 25.5 s | 1,800 ms | 0.114 | 17.4 s |
| Alkilautos | 99 | 1.7 s | 1.7 s | 20 ms | 0 | 2.6 s |
| Rentcars (es-co) | 54 | 1.7 s | 4.0 s | 1,400 ms | 0 | 7.1 s |
| Renting Colombia | 62 | 3.8 s | 4.8 s | 400 ms | 0.003 | 5.2 s |
| Evolution Rent a Car | 46 | 5.4 s | 11.9 s | 510 ms | 0.071 | 6.2 s |

### Escritorio

| Sitio | Score (corridas) | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|
| alquilatucarro.com (home) | 95 / 91 / 87 | 0.5 s | 1.0 s | 130 ms | 0.076 | 0.6 s |
| alquilatucarro.com/bogota | 73 / 61 / 71 | 0.7 s | 0.8 s | 470 ms | 0.137 | 0.8 s |
| Booking.com Cars (ES) | 58 / 61 | 1.3 s | 1.5 s | 1,710 ms | 0.028 | 2.0 s |
| LATAM Airlines autos | 36 / 38 | 0.3 s | 5.8 s | 8,070 ms | 0.012 | 8.0 s |
| Kayak Colombia Cars | 40 / 50 | 2.0 s | 2.8 s | 1,320 ms | 0.053 | 3.2 s |
| Localiza Colombia | 35 / 33 | 0.9 s | 6.6 s | 3,360 ms | 0.001 | 5.4 s |
| Alkilautos | 98 / 98 | 0.5 s | 1.0 s | 10 ms | 0.001 | 1.0 s |
| Rentcars (es-co) | 63 / 63 | 0.5 s | 1.2 s | 1,540 ms | 0.005 | 2.3 s |
| Renting Colombia | 82 / 76 | 0.8 s | 1.3 s | 280 ms | 0.014 | 1.8 s |
| Evolution Rent a Car | 82 / 88 | 0.8 s | 1.4 s | 260 ms | 0.098 | 1.1 s |

## Campo (CrUX, 28 días)

Formato: LCP p75 / INP p75 / CLS p75 y el veredicto de Core Web Vitals entre paréntesis. "aprobada" exige LCP ≤ 2.5 s, INP ≤ 200 ms y CLS ≤ 0.1.

| Sitio | Móvil URL: LCP / INP / CLS | Móvil origen: LCP / INP / CLS | Escritorio URL: LCP / INP / CLS | Escritorio origen: LCP / INP / CLS |
|---|---|---|---|---|
| alquilatucarro.com (home) | 2 s / 260 ms / 0.08 (desaprobada) | 2.9 s / 275 ms / 0.33 (desaprobada) | 2.6 s / 157 ms / 0.13 (desaprobada) | 2.6 s / 157 ms / 0.13 (desaprobada) |
| alquilatucarro.com/bogota | 3.1 s / 279 ms / 0.33 (desaprobada) | 2.9 s / 275 ms / 0.33 (desaprobada) | 3.2 s / 157 ms / 0.11 (desaprobada) | 2.6 s / 157 ms / 0.13 (desaprobada) |
| Booking.com Cars (ES) | 2.3 s / 240 ms / 0.06 (desaprobada) | 2.5 s / 388 ms / 0 (desaprobada) | 2 s / 87 ms / 0.02 (aprobada) | 2.8 s / 147 ms / 0.04 (desaprobada) |
| LATAM Airlines autos | 8.1 s / 437 ms / 0.45 (desaprobada) | 5.6 s / 846 ms / 0.49 (desaprobada) | 7.2 s / 242 ms / 0.18 (desaprobada) | 4.4 s / 273 ms / 0.09 (desaprobada) |
| Kayak Colombia Cars | 5.3 s / 379 ms / 0.01 (desaprobada) | 4.6 s / 378 ms / 0.16 (desaprobada) | 2.5 s / 146 ms / 0.02 (desaprobada) | 3.8 s / 331 ms / 0.13 (desaprobada) |
| Localiza Colombia | 5.7 s / 393 ms / 0.13 (desaprobada) | 3.4 s / 476 ms / 0.44 (desaprobada) | 2.3 s / 209 ms / 0.12 (desaprobada) | 2.7 s / 180 ms / 0.09 (desaprobada) |
| Alkilautos | 1.6 s / 344 ms / 0 (desaprobada) | 1.7 s / 339 ms / 0 (desaprobada) | 1.5 s / 177 ms / 0.02 (aprobada) | 1.5 s / 146 ms / 0.07 (aprobada) |
| Rentcars (es-co) | 2.4 s / 589 ms / 0.08 (desaprobada) | 10 s / 576 ms / 0.13 (desaprobada) | 2.3 s / 168 ms / 0.01 (aprobada) | 8.5 s / 216 ms / 0.09 (desaprobada) |
| Renting Colombia | 1.9 s / 218 ms / 0 (desaprobada) | 2.1 s / 255 ms / 0 (desaprobada) | 1.8 s / 132 ms / 0 (aprobada) | 1.7 s / 128 ms / 0.01 (aprobada) |
| Evolution Rent a Car | 3.9 s / 231 ms / 0.1 (desaprobada) | 3.2 s / 172 ms / 0.09 (desaprobada) | 1.9 s / 74 ms / 0.18 (desaprobada) | 1.7 s / 45 ms / 0.12 (desaprobada) |
## Lo que más pesa en alquilatucarro.com

Las oportunidades salen de los informes móviles de la home y de /bogota. Los KiB son ahorros estimados por Lighthouse.

| # | Hallazgo | Ahorro o dato |
|---|---|---|
| 1 | JavaScript sin usar | 194 KiB en la home, 214 KiB en /bogota |
| 2 | Tiempo de ejecución de JavaScript y trabajo del hilo principal | Home corrida 1: 2.6 s de JS y 4.4 s de hilo principal. /bogota: 1.5 s y 2.8 s. La corrida 2 de la home ya no lo marcó (TBT 250 ms). |
| 3 | Mejorar la entrega de imágenes | 38 KiB en la home (44 KiB en escritorio), 19 KiB en /bogota |
| 4 | JavaScript heredado | 11 KiB, en todos los informes |
| 5 | Tareas largas en el hilo principal | 19 tareas en la home corrida 1, 5 en la corrida 2, 11 en /bogota |

Otros diagnósticos: causantes de cambio de diseño (CLS) en todos los informes, 11 elementos con animaciones no compuestas en la home (19 en /bogota), y caché eficiente (7 a 9 KiB).
El problema real no es el peso. Es el CLS de /bogota (0.301 en laboratorio, 0.33 en campo) y el INP.

## Conclusiones

1. En laboratorio estamos arriba del grupo, salvo contra Alkilautos. En móvil la home (61 a 88) supera a Booking (36), LATAM (35), Kayak (35), Localiza (24), Rentcars (54) y Evolution (46), y empata con Renting (62, una sola corrida). Alkilautos saca 99. En escritorio la home (87 a 95) solo la supera Alkilautos (98).
2. En campo no pasamos Core Web Vitals en ninguna de las dos páginas, ni en móvil ni en escritorio. El motivo es el CLS: 0.33 en móvil en el origen y en /bogota (el umbral de "bueno" es 0.1), y 0.13 en escritorio. El INP móvil también falla (260 a 279 ms, el umbral es 200). El LCP de campo sí está bien (2 a 3.2 s).
3. Casi nadie aprueba. En móvil, ningún competidor pasa Core Web Vitals, incluido Alkilautos (INP 344 ms). En escritorio pasan Alkilautos, Rentcars (solo la URL), Renting y Booking (solo la URL). Quien más pierde es LATAM, con LCP de campo de 8.1 s y CLS de 0.45 en móvil. Para Ads, esto significa que ganamos terreno corrigiendo CLS e INP, no el peso de la página.
4. La landing de ciudad es la más débil. /bogota tiene CLS de laboratorio 0.30 en móvil (ambas corridas) y de 0.14 a 0.23 en escritorio, y score de escritorio entre 61 y 73 frente a 87 a 95 de la home. Es la página a la que va el tráfico pagado por ciudad. Corregir primero el salto de diseño de /bogota y repetir en las demás ciudades.
5. Para la experiencia de página de destino de Google Ads, el dato que cuenta es el de campo, no el score de laboratorio. Tenemos ventaja real en LCP, que es lo que el usuario percibe como velocidad. Perdemos en estabilidad visual e INP, que es lo que Google marca como "desaprobada".

## Límites

- Sin JSON crudo de la API (ver Método). Competidores con 1 corrida en móvil: sus scores móviles pueden moverse 20 puntos o más entre corridas, como nos pasó a nosotros.
- LATAM: la URL no se pudo verificar con `curl`. Tratar sus cifras con cautela.
- Renting Colombia no es una landing de alquiler diario. Es la comparación más débil de la tabla.
- El laboratorio de PSI vive en servidores de Google, no en un teléfono real. El campo (CrUX) es la referencia de verdad.
