---
name: pendiente-sin-plazo
created_by: diego
created_at: 2026-08-16T00:00:00Z
---

# `/pendiente` deja de prometer un plazo y le da una salida al cliente

Parte 2 del issue #460. `/pendiente` es la pantalla que ve el cliente cuando su
reserva queda en verificación. En alquilatucarro y alquicarros dice:

> Tiempo estimado: 3 a 5 horas. No necesitas hacer nada más.

Medido sobre las reservas que pasaron por ese estado, siete de cada diez se
resuelven en menos de dos horas — el plazo es hasta conservador. El problema no
es la puntería: **el operador puede tardar días**, y a ese cliente la página le
prometió horas y le dijo que no hiciera nada. Cualquier cifra que pongamos va a
estar mal para alguien.

Lo que falta no es precisión, es **qué hacer si no llega**.

alquilame ya quitó el plazo (`SCEN-E4` de `estados-reserva.test.ts`), pero su
versión tampoco dice cuándo escribir: tiene el botón de WhatsApp sin nada que lo
señale como la salida. Por eso la frase que falta se añade a las tres.

## SCEN-001: ninguna marca promete un plazo
**Given**: `/pendiente` de alquilatucarro, alquicarros y alquilame
**When**: se lee la página
**Then**: no aparece "Tiempo estimado" ni "3 a 5 horas" ni ninguna otra promesa
de plazo cerrado
**Evidence**: markup renderizado de las tres páginas; guarda de source por marca

## SCEN-002: el cliente sabe cuándo escribir si no llega respuesta
**Given**: un cliente que lleva más de un día esperando
**When**: vuelve a `/pendiente`
**Then**: la página le dice explícitamente que si al día siguiente no ha recibido
nada, escriba — y el enlace para hacerlo está ahí mismo
**Evidence**: texto renderizado con la instrucción + enlace a `franchise.whatsapp`
en las tres marcas

## SCEN-003: la expectativa que se da es honesta y sin cifra cerrada
**Given**: `/pendiente` en cualquiera de las tres marcas
**When**: el cliente busca cuánto tarda
**Then**: encuentra un rango honesto que reconoce el caso lento ("en temporada
alta puede tomarnos algunos días"), no una promesa que el operador pueda
incumplir
**Evidence**: texto renderizado

## SCEN-004: el WhatsApp es un enlace real, no una etiqueta
**Given**: `/pendiente` de alquilatucarro y alquicarros
**When**: se inspecciona el bloque de contacto
**Then**: hay un `<a href>` que apunta a `franchise.whatsapp`, no solo la palabra
"WhatsApp" como nombre del canal de aviso — que es lo único que había
**Evidence**: DOM con `href` resuelto a la URL de WhatsApp de cada marca

## SCEN-005: la página sigue sin leerse como una confirmación
**Given**: `/pendiente` tras los cambios
**When**: se lee
**Then**: sigue dejando claro que la reserva todavía no está confirmada y no
muestra código de reserva
**Evidence**: markup; guarda equivalente a `SCEN-E4` de alquilame

## SCEN-006: no se indexa
**Given**: `/pendiente` de las tres marcas
**When**: se leen sus metadatos
**Then**: sigue emitiendo `robots: noindex, nofollow`
**Evidence**: `<meta name="robots">` en el HTML servido

## SCEN-007: las tres marcas siguen verdes
**Given**: el repo con los cambios
**When**: se corre la suite de cada paquete como la corre CI y el typecheck
**Then**: todo pasa, incluido `estados-reserva.test.ts` de alquilame
**Evidence**: salida de vitest por paquete y de typecheck

## SCEN-008: sin errores en runtime
**Given**: `/pendiente` cargada en el navegador
**When**: se revisan consola y red
**Then**: cero errores y cero peticiones fallidas
**Evidence**: consola y red del navegador de Orca
