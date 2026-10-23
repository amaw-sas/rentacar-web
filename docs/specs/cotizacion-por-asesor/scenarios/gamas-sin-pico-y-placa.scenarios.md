---
name: gamas-sin-pico-y-placa
created_by: diego-alex-melo
created_at: 2026-10-23T00:00:00Z
---

# Escenarios: las gamas exentas de pico y placa se distinguen en la cotización

Decisión del dueño (2026-10-23): en Bogotá salían dos gamas como «Camioneta AT» (GC y GL, esta
exenta). Toda gama exenta lleva « sin pico y placa» tras su nombre, en las 3 marcas, con el mismo
dato que pinta la etiqueta de la tarjeta (`picoyplaca_exempt` del panel).

## SCEN-030: una gama exenta lleva «sin pico y placa»
**Given**: una búsqueda en Bogotá Aeropuerto donde «Camioneta Automática» GC no es exenta y
«Camioneta Automática» GL sí lo es
**When**: el asesor copia la cotización en Alquilame, Alquilatucarro o Alquicarros
**Then**: la de GL sale como «Camioneta AT sin pico y placa» (Alquicarros: nombre completo +
« sin pico y placa») y la de GC sin añadido; ninguna línea de gama queda repetida
**Evidence**: prueba unitaria por marca; en vivo en alquilame (Bogotá), las líneas copiadas
contra las etiquetas «sin pico y placa» de las tarjetas

## SCEN-031: sin dato de exención, el nombre no cambia
**Given**: una gama cuyo `picoyplaca_exempt` es falso o no viene
**When**: se arma el texto
**Then**: el nombre sale igual que antes (los ejemplos aprobados de `design.md` siguen idénticos)
**Evidence**: `matchesDesign.test.ts` verde en las 3 marcas
