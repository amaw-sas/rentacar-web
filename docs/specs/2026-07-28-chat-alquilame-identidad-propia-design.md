# Identidad propia para el chat de alquilame

**Fecha:** 2026-07-28
**Estado:** implementado
**Marca afectada:** alquilame (alquilatucarro y alquicarros quedan intactas)

## El problema

El chat de alquilame era el chat de alquilatucarro. `ChatConversation.vue` estaba
triplicado byte a byte en las tres marcas: la misma cabecera "¿En qué te ayudamos?", la
misma foto de asesora servida desde `packages/logic/public/images/`, el mismo beige de
WhatsApp y las mismas burbujas verde y blanco. Lo único que cambiaba de una marca a otra
era el tinte del token `--ui-primary` en dos sitios: el borde del campo de texto y el
botón de enviar.

Comprobado en vivo antes de tocar nada: capturas de `localhost:4002` y del sitio de
alquilatucarro en producción, una al lado de la otra.

Encima había un defecto de posición: en alquilame el panel de escritorio abría pegado al
borde izquierdo de la pantalla mientras su botón flotante vivía abajo a la derecha.

## Qué se decidió

Se maquetaron tres direcciones con el CSS real del componente y se eligió la variante de
marca, con el gris del cliente calibrado aparte (el rojo sólido pesaba demasiado junto a
la cabecera roja).

| Pieza | Antes | Ahora |
|---|---|---|
| Cabecera | blanca con borde gris | banda `var(--ui-primary)` con texto blanco |
| Títulos | "¿En qué te ayudamos?" / "En línea · Disponible 24/7" | "Camila · alquilame" / "Responde al instante · 24/7" |
| Avatar | `logic/public/images/asesora-avatar.webp` (compartido) | `ui-alquilame/public/images/asesora-camila.webp` |
| Lienzo | `#ece5dd` | `#f7f8f9` |
| Burbuja del cliente | `#d9fdd3` verde | `#4b5563` grafito con letra blanca |
| Burbuja del bot | blanca con sombra | blanca con filo `#e6e8ec` |
| Forma | radio `7.5px` + piquito triangular | radio `1rem`, esquina viva del lado del remitente |
| Saludo inicial | cartel gris centrado en el vacío | primera burbuja de Camila |
| Campo de texto | píldora con borde de 2px | `#f2f3f5`, sin borde, radio `0.75rem` |
| Botón de enviar | círculo gris hasta enfocar | cuadrado redondeado, de marca desde el principio |
| Botón flotante | círculo blanco con icono rojo | círculo rojo con icono blanco |
| Panel de escritorio | pegado al borde izquierdo | anclado bajo el botón, a la derecha |

## Cómo se protegió a las otras dos marcas

La identidad byte a byte de las tres copias era la red que impedía que un arreglo
aterrizara en una marca y no en las otras. Al bifurcar alquilame esa red se rompe, así que
se sustituyó por dos guardias explícitas:

- `ui-alquilatucarro/.../ChatConversation.parity.test.ts` **(nueva)** — alquicarros y
  alquilatucarro siguen byte-idénticas entre sí, conservan la piel de WhatsApp y siguen
  sirviendo el avatar del layer compartido. Además comprueba que alquilame está bifurcada
  a propósito.
- `ui-alquilame/.../ChatConversation.brand.test.ts` **(reemplaza a
  `ChatConversation.bubbles.wa.test.ts`)** — congela la piel nueva y conserva intactos los
  invariantes de comportamiento que traía la suite anterior: agrupación por remitente,
  hora metida en la burbuja, fila propia para las burbujas con partes estructuradas y
  placeholders del asistente que no pintan burbuja.

`ChatWidget.shift.test.ts` **no se debilitó**. En lugar de relajar la comparación, el
widget de alquilame volvió a los valores base en las cuatro líneas donde ya no necesitaba
diferir (el panel y la burbuja del teaser vuelven a la derecha, que era justamente el
arreglo del defecto de posición). El delta declarado bajó de cinco entradas a dos:
la capa de CSS crítico de PageSpeed y la regla del botón flotante relleno.

El pulso de atención sigue pintándose con `var(--ui-primary)` y nunca con el hex quemado,
que es lo que exige P386 en la suite de alquicarros.

## Escenarios observables

- **SCEN-ALQ-CHAT-01** — Cabecera roja con "Camila · alquilame" y "Responde al instante ·
  24/7" en blanco; las otras dos marcas conservan la cabecera blanca original.
- **SCEN-ALQ-CHAT-02** — El avatar de alquilame se sirve desde su propio `public/`; las
  otras dos siguen con el compartido.
- **SCEN-ALQ-CHAT-03** — Cliente en `#4b5563` sobre lienzo `#f7f8f9`, bot en blanco con
  filo; ni `#d9fdd3` ni `#ece5dd` sobreviven en la copia de alquilame.
- **SCEN-ALQ-CHAT-04** — Campo sin borde sobre `#f2f3f5` y botón de enviar cuadrado
  redondeado de marca; el control de detener durante el streaming hereda la misma forma.
- **SCEN-ALQ-CHAT-05** — Botón flotante relleno con el token, icono en blanco, sin hex
  quemado en ninguna regla ni keyframe.
- **SCEN-ALQ-CHAT-06** — El panel de escritorio abre a la derecha, alineado con su botón.
- **SCEN-ALQ-CHAT-07** — alquicarros y alquilatucarro siguen byte-idénticas y el widget de
  alquilame conserva teleport, `inert`, los dos canales, el teaser y el pulso tokenizado.
- **SCEN-ALQ-CHAT-08** — El rediseño se sostiene en las dos superficies: panel flotante de
  escritorio y `/chat` a pantalla completa.

## Verificación ejecutada

- Suite de componentes de alquilame completa: **624 pasan**.
- Guardias de chat: alquilame 45, alquilatucarro 30 + 13 (shift y paridad), alquicarros 12
  cross-marca + 20 de conversación, logic 36.
- Runtime en `localhost:4002` con conversación real contra el cerebro del dashboard: cero
  errores de consola, cero peticiones fallidas.
- Las dos superficies revisadas con capturas.

## Lo que queda fuera de este repo

El bot sigue presentándose como *"Soy Valeria, la asesora virtual de Alquílame"* y queda
registrado en la atención como `valeriabot`. Ese nombre no vive aquí: el web solo manda
`brand` a `${rentacarPublicApiBase}/api/chat` y es rentacar-dashboard quien resuelve la
persona, el saludo y el agente. El cambio va allá, con la instrucción entregada aparte.
