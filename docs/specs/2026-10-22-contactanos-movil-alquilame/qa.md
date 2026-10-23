# QA en navegador — botón «Contáctanos» en móvil

Fecha: 2026-10-23 · Preview: `rentacar-web-alquilame-oii178n7v` (Vercel, árbol con los
arreglos de la revisión) · Playwright Chromium (iPhone 13, 320×568, 1280×800).

| Escenario | Resultado | Evidencia |
|---|---|---|
| SCEN-CM-01 cerrado | ✅ | 390 px: botón 154×50, borde derecho a 16 px, fondo `rgb(20,132,63)`, 0 opciones visibles, sin barra |
| SCEN-CM-02 abierto | ✅ | `aria-expanded=true`, «Cerrar»; Chat IA / Llamar / WhatsApp blancas de 44 px en ese orden; el botón conserva 154 px (captura `m-open`) |
| SCEN-CM-03 canales por horario | ⚠️ solo test | mount tests; no se pudo forzar el horario en el preview |
| SCEN-CM-04 Llamar / WhatsApp | ✅ | `tel:+573002436677`, `https://wa.me/573002436677` en el DOM; supresión 15 d en mount test |
| SCEN-CM-05 Chat IA | ✅ (test) | navegación a `/chat` en mount test; `/chat` del preview muestra «24 horas» |
| SCEN-CM-06 cierre | ✅ | toque fuera → cerrado; Escape → cerrado y foco en el botón |
| SCEN-CM-07 saludo | ✅ | una sola burbuja «¡Hola! ¿Dudas? Estamos en línea 24 horas.» a los 6,5 s, termina 22 px sobre el botón; a 320 px va de x 24 a 16 px del borde |
| SCEN-CM-08 / 08b | ✅ (test) | con el menú abierto 0 burbujas; eventos engaged/dismissed y tope de paso 1 en mount tests |
| SCEN-CM-09 insignia | ✅ | insignia «1» sobre el botón cerrado y en Chat IA del menú |
| SCEN-CM-10 escritorio | ✅ | sin botón «Contáctanos»; píldoras 123/119/147 × 44 px en y 732 (idénticas a producción); panel abre con `inert`; Escape devuelve el foco a Chat IA y quita `inert` |
| SCEN-CM-11 capas | ✅ | `/reservas`: con «Lugar de recogida» abierto (capa reka, `pointer-events:none`) el botón no está; al cerrar vuelve. Lock pegado sin capa: mount test |
| SCEN-CM-12 atribución | ✅ | el nav está dentro de `[data-analytics-placement="fab"]`; `contact_click` en mount test |
| SCEN-CM-13 pie | ✅ | al final de la página ningún enlace ni texto del pie se cruza con el botón |
| SCEN-CM-14 chat apagado | ✅ (test) | mount test |
| SCEN-CM-15 runtime | ✅ | 0 errores de consola en móvil, 320 px, escritorio y `/reservas`; sin desbordamiento; CLS portada móvil 0 |
| SCEN-CM-16 otras marcas | ✅ | suites de las 3 marcas en verde; único cambio compartido: `maxStep` opcional en `useContactTeaser.start` (por defecto 2) |
