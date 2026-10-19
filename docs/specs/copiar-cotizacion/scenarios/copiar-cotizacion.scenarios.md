---
name: copiar-cotizacion
created_by: diego-alex-melo
created_at: 2026-10-18T00:00:00Z
---

# Escenarios — botón «Copiar cotización»

Cada escenario se prueba en las 3 marcas en el navegador, salvo donde se indica.

## SCEN-001: el asesor copia la cotización básica
**Given**: un navegador abrió la web con `?asesor=1`; búsqueda Cali Aeropuerto → Cali
Aeropuerto, viernes 7:30am → domingo 8:00am (2 días), sin casillas marcadas
**When**: toca «Copiar cotización» y lee el portapapeles
**Then**: el texto sigue el formato de `design.md`: «*Recoges:*», «*Entregas:*», «*Total: 2
días*», «2 día(s)», «· Cali Aeropuerto», una línea por gama disponible con su total
con IVA, la frase de 20 minutos, «seguro básico», los 6 beneficios
**Evidence**: texto del portapapeles vs. total con IVA de cada gama: alquilame = precio de la
tarjeta; alquilatucarro = «Total» del tooltip de la tarjeta; alquicarros = total del
resumen (WizardSummary) al elegir esa gama

## SCEN-002: el visitante no ve el botón
**Given**: un navegador sin `?asesor=1` nunca activado (o activado y luego `?asesor=0`)
**When**: hace una búsqueda con resultados
**Then**: no existe el botón ni las casillas en el DOM
**Evidence**: consulta del DOM

## SCEN-003: el modo asesor se recuerda
**Given**: se abrió `/?asesor=1` una vez
**When**: se navega a una búsqueda sin el parámetro, y se recarga
**Then**: el botón aparece
**Evidence**: DOM tras recarga

## SCEN-004: las gamas agotadas no se copian
**Given**: resultados con al menos una gama agotada (tarjeta gris)
**When**: el asesor copia
**Then**: el código de la gama agotada no aparece en el texto
**Evidence**: texto copiado vs. tarjetas grises (prueba unitaria con datos fijos + e2e con
ruta simulada)

## SCEN-005: otra sede y horas extra
**Given**: recoge en Cali Aeropuerto, entrega en Cali Centro, con horas extra
**When**: el asesor copia
**Then**: «*Entregas:*» muestra Cali Centro; aparece «· Recoge en Cali Aeropuerto, entrega
en Cali Centro», «y {H} horas extra», «Cada precio incluye las horas extra.» y «Cada precio
incluye el cargo por entregar en otra sede.»; los precios son el total con IVA de cada gama
**Evidence**: texto copiado vs. total con IVA por marca (como SCEN-001)

## SCEN-006: Seguro Total
**Given**: resultados normales
**When**: el asesor marca «Con Seguro Total» y copia
**Then**: aparece «· Con Seguro Total (deducible $0)»; cada precio es el total con IVA de
esa gama con Seguro Total; la penúltima línea dice
«Seguro Total» y no «seguro básico»; una gama sin precio de Seguro Total sale con su
precio básico y «(sin Seguro Total)»
**Evidence**: texto copiado vs. total con Seguro Total por marca (alquilame/alquilatucarro:
tarjeta con su casilla marcada; alquicarros: resumen tras elegir Seguro Total en el Paso 3);
unitaria para la gama sin precio de Seguro Total

## SCEN-007: silla de bebé aparte
**Given**: 2 días, sin reserva mensual
**When**: el asesor marca «Con silla de bebé» y copia
**Then**: los precios de las gamas NO cambian; aparece «Silla de bebé: $24.000 (2 días ×
$12.000), se paga al recoger.» (o el diario que tenga la empresa en `extras`)
**Evidence**: texto copiado con y sin la casilla

## SCEN-008: el portapapeles falla
**Given**: `navigator.clipboard.writeText` rechaza
**When**: el asesor toca el botón
**Then**: sale el aviso «No se pudo copiar» y la página sigue funcionando
**Evidence**: prueba unitaria del composable

## SCEN-009: limpio en ejecución
**Given**: modo asesor en las 3 marcas
**When**: búsqueda, marcar casillas, copiar
**Then**: cero errores en consola, cero peticiones fallidas, sin aviso de hidratación
**Evidence**: `orca console` / `orca network`

## SCEN-010: búsqueda desactualizada
**Given**: modo asesor, resultados en pantalla
**When**: el asesor cambia la fecha en el formulario sin volver a buscar
**Then**: el botón desaparece hasta que la búsqueda se refresca; nunca se copian fechas
nuevas con precios viejos
**Evidence**: DOM antes y después del cambio

## SCEN-011: reserva mensual
**Given**: modo asesor, búsqueda mensual (30 días)
**When**: el asesor copia
**Then**: «*Total: 30 días*», «· Plan mensual de 1.000 km» (o el plan vendible de la
primera fila), sin horas extra; ninguna gama aparece con precio igual solo al cargo de
otra sede; con silla: «Silla de bebé: $100.000 el mes, se paga al recoger.» (o el
mensual de `extras`)
**Evidence**: texto copiado + unitaria con una gama que solo vende 2.000 km
