---
name: alquilatucarro-formato-v3
created_by: diego-alex-melo
created_at: 2026-10-22T00:00:00Z
---

# Escenarios: nuevo texto de Alquilatucarro con opcionales (silla y lavado)

Texto aprobado por el dueño el 2026-10-22 (ver `design.md`, sección «Alquilatucarro»). Solo
cambia Alquilatucarro; Alquilame y Alquicarros quedan como están.

## SCEN-020: la cotización de Alquilatucarro sigue el formato nuevo
**Given**: Daniela activa en alquilatucarro; búsqueda Barranquilla Aeropuerto → Barranquilla
Aeropuerto, viernes 23 oct. 12:00pm → viernes 30 oct. 12:00pm (7 días); «Con Seguro Total» marcado
**When**: toca «Copiar cotización»
**Then**: el texto es exactamente la versión aprobada: «Le comparto la cotización solicitada:»,
bloques *RECOGIDA*/*DEVOLUCIÓN* sin línea en blanco entre ellos, cada gama como `*Nombre:*` y en
la línea siguiente `$X COP`, luego *Cantidad:* 7 días, *Seguro:* Total, *Impuestos:* Incluidos,
*Kilometraje:* Ilimitado, *Precios:* Dinámicos, válidos por 20 minutos., la sección *OPCIONAL* y
los 5 beneficios con «•»; sin «Solo necesita 4 datos», sin enlace, sin firma, sin código de gama
**Evidence**: prueba unitaria con el texto aprobado como fixture byte a byte (atado a
`design.md`); en vivo, el texto copiado comparado con los totales de las tarjetas

## SCEN-021: solo las camionetas se abrevian
**Given**: gamas «Compacto Mecánico», «Sedán Automático», «Camioneta Mecánica 4X4», «Camioneta
Automática Híbrida 7 puestos», «Camioneta Automática»
**When**: se arma el texto de Alquilatucarro
**Then**: salen «Compacto Mecánico», «Sedán Automático», «Camioneta MT 4X4», «Camioneta AT
Híbrida 7 puestos», «Camioneta AT»; Alquilame y Alquicarros siguen mostrando el nombre completo
**Evidence**: prueba unitaria por nombre y por marca

## SCEN-022: los opcionales salen siempre, con su precio
**Given**: una búsqueda de 7 días; silla a $12.000 por día y lavado prepagado a $20.000 en el
catálogo; ninguna casilla de silla (en Alquilatucarro ya no existe)
**When**: se copia la cotización de Alquilatucarro
**Then**: aparece *OPCIONAL* con «*Silla de bebé:*» / «$84.000 COP por 7 días» y «*Lavada
prepagada:*» / «$20.000 COP»; en una reserva mensual la silla dice «$X COP por el mes»; si el
catálogo cambia esos precios, el texto los sigue
**Evidence**: prueba unitaria (diario y mensual) y de `useCopyQuote` con precios del catálogo;
en vivo, los valores contra el catálogo

## SCEN-023: las variantes de Alquilatucarro
**Given**: Alquilatucarro con: horas extra; seguro básico; Seguro Total que una gama no admite;
devolución en otra sede con cargo; reserva mensual con un plan; mensual con planes distintos
**When**: se arma el texto
**Then**: «*Cantidad:* 7 días + 3 horas extra»; «*Seguro:* Básico»; la gama que no admite Seguro
Total lleva « (sin Seguro Total)» tras el precio; línea «*Devolución en otra sede:* Incluida en el
precio» solo si hay cargo; mensual «*Cantidad:* 30 días» y «*Kilometraje:* 1.000 km al mes» (o
«Según el plan de cada gama» con planes distintos, y cada gama lleva « (plan 2.000 km)»)
**Evidence**: una prueba unitaria por caso

## SCEN-024: el panel de Alquilatucarro ya no tiene la casilla de silla
**Given**: Daniela activa en alquilatucarro
**When**: ve el panel de copiar
**Then**: solo está la casilla «Con Seguro Total»; en Alquilame y Alquicarros siguen las dos
casillas y su texto no cambia
**Evidence**: prueba de montaje de los 3 paneles; `matchesDesign.test.ts` sigue verde para
Alquilame y Alquicarros
