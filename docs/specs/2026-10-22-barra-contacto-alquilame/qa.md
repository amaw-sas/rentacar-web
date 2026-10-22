# QA en navegador — barra de contacto de alquilame

Fecha: 2026-10-22 · Commit: `5b8f74c` · Preview: `rentacar-web-alquilame-m8vie2au9` (Vercel, build OK).
Herramientas: navegador embebido de Orca (390 px y escritorio) y Playwright Chromium
(iPhone 13 y 1280×800). A/B contra producción (https://alquilame.co) donde aplica.

| Escenario | Resultado | Evidencia |
|---|---|---|
| SCEN-BC-01 barra móvil | ✅ | 390 px: 3 bloques de 130 px, columna, 13 px, `#6D28D9/#1D4ED8/#14843F`, texto blanco, barra pegada al borde inferior |
| SCEN-BC-02 píldoras escritorio | ✅ | 1280 px: píldoras 44 px en y 732–776, borde derecho 1256 (24 px), sin barra a lo ancho |
| SCEN-BC-03 WhatsApp fuera de horario | ⚠️ solo test | mount tests (`ChatWidget.bar.test.ts`); no se pudo forzar el horario en el preview |
| SCEN-BC-04 Llamar | ✅ | `href="tel:+573002436677"` en el DOM |
| SCEN-BC-05 abrir chat | ✅ | móvil → `/chat`; escritorio → panel abierto y `#__nuxt[inert]` |
| SCEN-BC-06 saludo | ✅ | burbuja 1 a los 5 s con insignia 1; burbuja 2 «…Estamos en línea 24 horas.» con insignia 2; anclado sobre Chat IA (captura) |
| SCEN-BC-07 chat vacío | ✅ | `/chat` del preview: segundo saludo «…Estamos en línea 24 horas.», 0 errores |
| SCEN-BC-08 pie libre | ✅ (safe-area 0) | último enlace del pie termina en y 558, barra empieza en 600; safe-area > 0 solo cubierto por el `calc()` del CSS |
| SCEN-BC-09 resumen de reserva | ⚠️ solo test | mount tests; no se recorrió una reserva real en el preview |
| SCEN-BC-10 canales / «×» | ⚠️ solo test | mount tests con reloj falso (15 días canales; «×» por la visita, enmienda del dueño) |
| SCEN-BC-11 runtime limpio | ✅ | 0 errores de consola (móvil y escritorio); sin desbordamiento (scrollWidth = innerWidth en portada, Bogotá, reservas); únicos fallos de red = beacons GA/Clarity `ERR_ABORTED`, igual en producción |
| SCEN-BC-12 otras marcas | ✅ | sin cambios de código fuera de alquilame salvo `line2` opcional; suites de las 3 marcas en verde |
| SCEN-BC-13 foco | ✅ | Escape cierra el panel, quita `inert` y deja el foco en «Chat IA» |
| SCEN-BC-14 listas sobre la barra | ✅ | `/reservas` móvil: con «Lugar de recogida» abierto la barra se oculta; «Villavicencio» (última) recibe el toque; al cerrar, la barra vuelve |
| SCEN-BC-15 atribución | ✅ | `nav[data-analytics-placement="fab"]` en el DOM + mount test de `contact_click` |
| SCEN-BC-16 primera pintura | ✅ | CLS portada móvil 0 (producción 0,053 por el FAB viejo); `/reservas` 0,029 (producción 0,087), el resto es la animación del botón de búsqueda, igual en ambos |
| SCEN-BC-17 créditos del pie | ✅ | crédito termina en y 690, píldoras empiezan en 732, sin solape |

Nota: en el navegador embebido de Orca las animaciones de cierre de los slideovers de
Nuxt UI no terminan (el `<body>` queda con `pointer-events: none`). Pasa igual en
producción, así que es del entorno; en Chromium (Playwright) cierran y la barra vuelve.
