---
name: alquilame-formato-v3
created_by: diego-alex-melo
created_at: 2026-10-23T00:00:00Z
---

# Escenarios: nuevo texto de Alquilame con opcionales (silla y lavado)

Texto aprobado por el dueño el 2026-10-23 (ver `design.md`, sección «Alquilame»). Solo cambia
Alquilame; Alquilatucarro (formato del 2026-10-22) y Alquicarros quedan como están.

## SCEN-025: la cotización de Alquilame sigue el formato nuevo
**Given**: Daniela activa en alquilame; búsqueda Bogotá Aeropuerto → Bogotá Aeropuerto, viernes
23 oct. 12:00pm → viernes 30 oct. 12:00pm (7 días); «Con Seguro Total» sin marcar
**When**: toca «Copiar cotización»
**Then**: el texto es exactamente la versión aprobada: «Esta es tu cotización:», bloques
«📍*Recoges:*» y «📍*Entregas:*» con la sede y la fecha en líneas propias (sin coma), cada gama
como «🚗 Nombre» (🚙 si es camioneta) con el precio debajo en negrilla «*$X COP*», luego
*Cantidad:* 7 días, *Seguro:* Seguro básico, *Impuestos:* Incluye IVA y Tax, *Kilometraje:*
Ilimitado, *Precio:* Se mantiene 20 minutos, luego debes recotizar, la sección *OPCIONALES* y los
3 renglones con ✅; sin enlace, sin firma, sin código de gama, sin «deducible»
**Evidence**: prueba unitaria con el texto aprobado como fixture byte a byte (atado a
`design.md`); en vivo, el texto copiado contra los totales de las tarjetas

## SCEN-026: emoji y nombre de camionetas
**Given**: gamas «Compacto Mecánico», «Sedán Automático Híbrido», «Camioneta Mecánica 4X4»,
«Camioneta Automática Híbrida 7 puestos», «Camioneta Automática Especial»
**When**: se arma el texto de Alquilame
**Then**: «🚗 Compacto Mecánico», «🚗 Sedán Automático Híbrido», «🚙 Camioneta MT 4X4», «🚙 Camioneta
AT Híbrida 7 puestos», «🚙 Camioneta AT Especial»
**Evidence**: prueba unitaria por nombre

## SCEN-027: los opcionales salen siempre, con su precio
**Given**: 7 días; silla a $12.000 por día y lavado prepagado a $20.000 en el catálogo
**When**: se copia la cotización de Alquilame
**Then**: aparece *OPCIONALES* con «*Silla de bebé:*» / «$84.000 COP por 7 días» y «*Lavada pago
anticipado:*» / «$20.000 COP»; en mensual la silla dice «por el mes»; el panel de Alquilame ya
no tiene la casilla «Con silla de bebé» (solo «Con Seguro Total»)
**Evidence**: prueba unitaria (diario y mensual), prueba de montaje del panel; en vivo, valores
contra el catálogo

## SCEN-028: las variantes de Alquilame
**Given**: Alquilame con: Seguro Total marcado; una gama que no admite Seguro Total; horas extra;
devolución en otra sede con cargo; mensual con un plan; mensual con planes distintos
**When**: se arma el texto
**Then**: «*Seguro:* Seguro Total»; la gama que no lo admite lleva « (sin Seguro Total)» tras el
precio en negrilla; «*Cantidad:* 7 días + 3 horas extra»; línea «*Devolución en otra sede:*
Incluida en el precio» solo si hay cargo; mensual «*Cantidad:* 30 días» y «*Kilometraje:* 1.000
km al mes» (planes distintos: «Según el plan de cada gama» y « (plan 2.000 km)» por gama)
**Evidence**: una prueba unitaria por caso

## SCEN-029: las otras marcas no cambian
**Given**: la misma entrada en Alquilatucarro y Alquicarros
**When**: se arma su texto
**Then**: Alquilatucarro sale idéntico al formato del 2026-10-22 y Alquicarros idéntico a su
versión aprobada; el panel de Alquicarros conserva sus dos casillas
**Evidence**: `matchesDesign.test.ts` verde para ambas; pruebas de sus paneles sin cambios
