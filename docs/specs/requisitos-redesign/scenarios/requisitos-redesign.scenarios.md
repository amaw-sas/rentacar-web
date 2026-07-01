---
name: requisitos-redesign
created_by: pablo
created_at: 2026-06-30T00:00:00Z
---

# Requisitos para Alquilar — rediseño (alquicarros)

Sección `#requisitos` del home de alquicarros
(`packages/ui-alquicarros/app/components/home/Requirements.vue`). Rediseño espejo:
foto con sujeto a la izquierda / copy a la derecha, iconos bullet semánticos por ítem,
textos idénticos. Foto nueva generada vía Vercel AI Gateway.

## SCEN-001: layout espejo en desktop (copy a la derecha)
**Given**: usuario en el home de alquicarros con viewport ≥ 1280px
**When**: hace scroll hasta la sección `#requisitos`
**Then**: el bloque de copy (h2 "Requisitos para Alquilar", 5 líneas de requisitos, CTA
"Reserva Ahora") aparece en la mitad **derecha** de la sección, legible sobre un scrim blanco;
el sujeto de la foto (mujer + carro blanco) queda en la mitad **izquierda** sin solaparse con el texto
**Evidence**: screenshot ≥1280px; DOM: columna de copy con `ml-auto`; scrim desktop `bg-linear-to-l from-white`

## SCEN-002: iconos bullet semánticos distintos
**Given**: la sección `#requisitos` renderizada
**When**: se observan las 5 filas de requisitos
**Then**: cada fila muestra un icono `i-lucide-*` **distinto y con significado**
(reserva=calendario, documento=id-card, licencia=carro, tarjeta=tarjeta de crédito, edad=persona),
NO el check verde uniforme anterior (`bg-green-500`)
**Evidence**: 5 nombres `i-lucide-*` distintos en el source/DOM; screenshot con 5 glifos diferentes

## SCEN-003: textos de requisitos idénticos (verbatim)
**Given**: la lista de requisitos
**When**: se comparan con la copy previa
**Then**: los 5 textos son idénticos palabra por palabra:
"Realizar una reserva previa.", "Cédula de ciudadanía o pasaporte vigente",
"Licencia de conducción vigente", "Tarjeta de crédito a nombre del conductor",
"Ser mayor de 18 años"
**Evidence**: texto renderizado == lista golden

## SCEN-004: apilado legible en mobile
**Given**: viewport ≤ 640px
**When**: se ve la sección `#requisitos`
**Then**: la sección apila banner (foto) arriba y copy abajo; los 5 requisitos y el CTA
"Reserva Ahora" son legibles y accesibles; el texto no queda sobre la zona ocupada de la foto
**Evidence**: screenshot 390px

## SCEN-005: foto nueva cargada con composición sujeto-izquierda
**Given**: la sección renderizada en desktop
**When**: el navegador solicita el asset de fondo
**Then**: `requisitos-derecha.webp` responde 200 con `content-type: image/webp` y muestra
al sujeto (mujer + carro) enmarcado a la izquierda con espacio negativo a la derecha
**Evidence**: request 200 `image/webp` + inspección visual del asset

## SCEN-006: página sana tras el cambio
**Given**: el home de alquicarros cargado con el rediseño
**When**: se inspeccionan consola y network
**Then**: cero errores de consola y cero requests fallidos atribuibles a la sección
**Evidence**: logs de consola + network de agent-browser
