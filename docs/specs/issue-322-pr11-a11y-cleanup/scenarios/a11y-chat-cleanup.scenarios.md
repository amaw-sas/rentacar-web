---
name: a11y-chat-cleanup
created_by: agent
created_at: 2026-07-16T19:00:00Z
issue: 322
pr_package: 11
---

# Issue 322 · PR11 — A11y restante, watchdog del chat y código muerto

Holdout para los hallazgos F pendientes, el timeout del stream del chat,
la rama results muerta de CityPage y la rama de vuelo del formulario.

## SCEN-322-X01 — El error del teléfono se anuncia al lector de pantalla

**Given** un error de validación en el campo Teléfono del formulario de reserva
**When** el error está visible
**Then** el input tiene `aria-invalid` y `aria-describedby` apuntando al id del mensaje de error (las 3 marcas)

**Evidence**: unit test que renderiza el estado con error y asserta los atributos.

## SCEN-322-X02 — El drawer móvil comunica la opción seleccionada

**Given** una opción ya seleccionada en SearcherSelectDrawer
**When** se lee el botón de esa opción con tecnología asistiva
**Then** expone su estado (`aria-pressed` o `role=option`+`aria-selected`)

**Evidence**: unit test de atributos según modelValue.

## SCEN-322-X03 — BUSCAR deshabilitado por horario explica el motivo en pantalla

**Given** la selección fuera de horario de sucursal al montar el Searcher de alquicarros
**When** el botón BUSCAR está deshabilitado por `!isSelectionWithinSchedule`
**Then** un mensaje inline persistente explica el motivo, enlazado al botón con `aria-describedby`

**Evidence**: unit test del estado inválido en el montaje.

## SCEN-322-X04 — El stream del chat no puede colgar la conversación para siempre

**Given** un stream de respuesta que deja de emitir chunks
**When** pasa el umbral de inactividad
**Then** el stream se aborta y cae en la rama de error existente (banner + WhatsApp), y el input se rehabilita
**And** mientras `isStreaming` hay un control «detener» visible que aborta a demanda

**Evidence**: unit test del watchdog con timers falsos + atributo del botón.

## SCEN-322-X05 — El fondo queda inerte con el panel de chat abierto

**Given** el panel de chat abierto
**When** el usuario tabula
**Then** el contenido de la página detrás del backdrop no es alcanzable (inert/aria-hidden)

**Evidence**: unit test o assert estructural del atributo mientras panelOpen.

## SCEN-322-X06 — Las landings de ciudad no descargan el motor de reservas

**Given** una landing de ciudad (mode ≠ results) en alquilame y alquicarros
**When** se carga la página
**Then** el chunk del motor de reservas (wizard/grid) no se solicita — la rama `results` muerta se elimina o su import es async

**Evidence**: CityPage sin import estático del motor + tests de la landing verdes.

## SCEN-322-X07 — La rama de vuelo del formulario no existe

**Given** el store del formulario de reserva
**When** se inspecciona el estado y los esquemas
**Then** no existen `haveFlight`, esquemas `*WithFlight*` ni `flightForm` — el payload no puede exigir campos sin input

**Evidence**: grep limpio + suite del store verde tras la eliminación.
