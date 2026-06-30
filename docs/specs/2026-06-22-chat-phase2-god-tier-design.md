# Chat Fase 2 — "Nivel Dios"

**Fecha:** 2026-06-22
**Estado:** Propuesta (pendiente de aprobación)
**Repos afectados:** `rentacar-dashboard` (bot, conocimiento, UI de revisión, reserva) · `rentacar-web` (widget, rama `feat/chat-widget` / PR #205)
**Antecede:** Fase 1 — widget de chat en preview (PR #205), bot cotiza y redirige.

---

## Decisiones de alcance (fijadas con el usuario)

| Decisión | Elección | Implicación |
|----------|----------|-------------|
| Canal | **Solo web**, ejecutado a la perfección | Un canal, sin omnicanal ni voz. Toda la energía va a calidad, no a integración. |
| Reserva | **El bot cierra end-to-end** | Conectar `crearSolicitudReserva` al chat. El bot toma datos, crea la reserva y confirma. |
| Documento | **Visión + primer incremento ejecutable** | Norte claro de "nivel dios" + spec accionable para arrancar ya. |

---

## Qué significa "chat nivel dios"

No es un bot que responde. Es un asesor que **vende sin que se note que es un bot**, con tres cualidades que hoy no tiene:

1. **Cierra.** Lleva al cliente de "estoy mirando" a "tengo mi reserva con número de confirmación" sin sacarlo del chat.
2. **Sabe.** Responde cualquier duda real del negocio —modelos, sedes, requisitos, promos— con datos verdaderos, nunca inventados.
3. **Se mejora solo... porque nosotros lo vemos.** Cada conversación queda registrada y es legible por el equipo. Lo que falla se detecta y se corrige en días, no en meses.

La tercera cualidad es la que sostiene a las otras dos. Sin un loop de revisión, mejorar el bot es adivinar. Por eso es el primer incremento, no el último.

### El listón concreto

Un cliente escribe *"necesito un carro este finde en Bogotá"* y termina con una reserva confirmada en **menos de seis mensajes**, sin que el bot le pida nada que no necesite, sin un solo precio inventado, y con un tono que un revisor humano calificaría de natural. Eso es el listón.

---

## Estado actual (línea base)

Lo que ya existe, para no reconstruirlo:

- **Endpoint:** `dashboard/app/api/chat/route.ts` — público, anónimo, streaming SSE (AI SDK v6), rate limit 40 msg/hora por conversación.
- **Modelo:** `gpt-5-mini` (OpenAI), definido en `lib/chat/agent.ts`.
- **System prompt:** `lib/chat/agent.ts:buildSystemPrompt()` — tono colombiano, fecha de Bogotá inyectada, reglas anti-alucinación.
- **Herramienta `cotizar`:** `lib/chat/tools.ts` → precios reales de Localiza por ciudad y fechas.
- **Conocimiento:** `lib/api/rental-requirements.ts` — solo requisitos de alquiler (documentos, pago, pico y placa).
- **Persistencia:** Supabase, tablas `chat_conversations` y `chat_messages` (migración 064). Se escribe, nadie lo lee.
- **`crearSolicitudReserva`:** existe en `lib/api/mcp/tools.ts`, pero **no está conectada al chat**.
- **Widget web:** 3 marcas, panel inline en desktop, página `/chat` en móvil, persistencia en localStorage.

### Brechas hacia "nivel dios"

| Brecha | Hoy | Nivel dios |
|--------|-----|------------|
| Visibilidad | Las conversaciones se guardan pero nadie las lee | UI para leer, filtrar y marcar cada conversación |
| Conocimiento | Solo requisitos legales | Modelos/gamas, sedes por ciudad, promos, tarifa mensual |
| Cierre | Cotiza y redirige al sitio | Crea la reserva dentro del chat |
| Calidad medible | Sin métricas ni escenarios | Set de escenarios + métricas de conversión |
| Seguridad | Endpoint público sin defensa de inyección | Guardrails contra abuso e inyección de prompt |

---

## Incrementos

Orden deliberado: primero ver, después saber, después cerrar, después blindar. Cada incremento entrega valor por sí solo y es desplegable de forma independiente.

### Incremento 1 — Ojos: UI de revisión de conversaciones

**Por qué primero.** Todo lo demás se mejora leyendo conversaciones reales. Sin esto, las fases 2-4 son a ciegas.

**Repo:** `rentacar-dashboard`.

**Alcance:**
- Página `/conversations` (área autenticada del dashboard).
- Lista paginada: marca, ciudad detectada, estado (`open`/`closed`/`handoff`), fecha, nº de mensajes.
- Filtros: marca, rango de fechas, ciudad, estado.
- Vista de hilo: reconstruye la conversación desde `chat_messages.parts` (incluye llamadas a `cotizar` con sus argumentos y resultados).
- Marcado manual: un revisor puede etiquetar una conversación como "buena" / "falló" + nota libre. Esto alimenta el set de evaluación del incremento 2.
- Métricas de cabecera: volumen, % que llegó a cotización, % que pidió handoff, promedio de mensajes hasta cotizar.

**Fuera de alcance:** búsqueda full-text, exportación, analítica avanzada. Después.

**Criterios de aceptación:**
- Un revisor abre `/conversations`, filtra por marca y día, y lee cualquier hilo completo con sus tool calls.
- El marcado persiste (tabla nueva `chat_conversation_reviews` o columna en `chat_conversations`).
- Las tablas ya tienen RLS de lectura para `authenticated`; no se relaja seguridad.
- 0 errores de consola, 0 requests fallidos en validación runtime.

---

### Incremento 2 — Cerebro: conocimiento + prompt + evaluación

**Por qué.** Con las conversaciones a la vista, ahora sí sabemos qué no sabe el bot. Aquí se cierra esa brecha.

**Repo:** `rentacar-dashboard`.

**Alcance:**
- **Ampliar conocimiento** (`lib/api/rental-requirements.ts` o nuevo módulo `lib/chat/knowledge/`):
  - Gamas y modelos representativos por categoría.
  - Sedes reales por ciudad (reutilizar el directorio de ubicaciones que ya alimenta `cotizar`).
  - Promociones vigentes y condiciones de tarifa mensual.
- **Endurecer el system prompt:** manejo explícito de los escenarios límite (ver abajo), tono más proactivo (sugerir, no solo responder).
- **Set de evaluación:** 15-20 conversaciones reales (sacadas del incremento 1) con el resultado esperado. Sirve para no romper lo que ya funciona al iterar el prompt.

**Criterios de aceptación (escenarios observables):**

| Escenario | Comportamiento esperado |
|-----------|------------------------|
| Datos completos: *"carro en Bogotá del viernes al domingo"* | Cotiza en **1 turno**, ofrece reservar |
| Datos incompletos | Pregunta **solo lo que falta**, sin loops |
| Fecha relativa: *"este finde"* | Resuelve a fechas concretas YYYY-MM-DD |
| Ciudad con varias sedes | Pregunta cuál sede prefiere |
| Sin disponibilidad | Ofrece alternativas (otras fechas/ciudad) |
| +30 días | Deriva a tarifa mensual / asesor humano con enlace |
| Pregunta de modelos/sedes/promos | Responde con el conocimiento nuevo, sin inventar |
| Fuera de tema | Redirige con amabilidad; **resiste inyección de prompt** |

- Regla dura: **0 precios o disponibilidad inventados**. Todo precio viene de `cotizar`. Verificable en la UI del incremento 1.
- El set de evaluación pasa al 100% antes de mergear cambios de prompt.

---

### Incremento 3 — Manos: reserva end-to-end

**Por qué.** Es el salto de conversión y la decisión de alcance principal del usuario. El bot deja de redirigir y cierra.

**Repos:** `rentacar-dashboard` (herramienta + endpoint) · `rentacar-web` (confirmación en el widget).

**Alcance:**
- Exponer `crearSolicitudReserva` como segunda herramienta del agente en `lib/chat/agent.ts`.
- Flujo de recolección de datos mínimos: nombre completo, tipo y número de documento, correo, teléfono. El bot los pide de forma natural, uno o dos a la vez, no como formulario.
- El bot usa el `quote` opaco de la cotización previa (ya existe ese token) para amarrar precio y disponibilidad reales a la reserva.
- Confirmación: el bot devuelve número de solicitud y resumen (vehículo, fechas, sede, monto, requisitos para la recogida).
- **Idempotencia:** reutilizar el trabajo de idempotencia de reservas ya hecho en el dashboard (issues #99, #138). Un reintento o doble envío **no crea reservas duplicadas**.

**Criterios de aceptación:**

| Escenario | Comportamiento esperado |
|-----------|------------------------|
| Cliente cotiza y dice "resérvalo" | Bot pide datos mínimos y crea la reserva |
| Reserva creada | Confirma con número + resumen + requisitos de recogida |
| Cliente reenvía / reintenta | **Idempotente**: una sola reserva, no duplicados |
| Datos inválidos (documento, email) | Bot valida y re-pregunta sin crear basura |
| Falla la API de Localiza | Error claro, no promete lo que no pudo crear, ofrece reintentar |

- Manejo de PII: los datos del cliente quedan en la persistencia existente; documentar qué se guarda y por qué.
- Validación runtime end-to-end del flujo completo en el preview, las 3 marcas.

---

### Incremento 4 — Escudo: guardrails y lanzamiento

**Por qué.** El endpoint es público y anónimo, y ahora crea reservas. Antes de producción hay que blindarlo y decidir cómo se despliega.

**Repos:** ambos.

**Alcance:**
- **Anti-inyección de prompt:** el bot no debe poder ser manipulado para salirse de su rol, revelar el prompt, ni crear reservas falsas masivas.
- **Anti-abuso:** revisar el rate limit actual (40/hora) ahora que se crean reservas; considerar verificación ligera antes de confirmar (p. ej. validar teléfono).
- **Observabilidad:** alertas si la tasa de error de `cotizar`/`crearSolicitudReserva` se dispara.
- **Decisión de despliegue:** merge directo vs. feature flag por marca. Recomendación inicial: **feature flag** (ver recuadro).
- Sacar el widget del estado "NO MERGEAR" del PR #205.

> **¿Qué es un feature flag?**
> Un interruptor de encendido/apagado para una función, controlado desde la config (no desde el código). Permite prender o apagar el chat **sin volver a desplegar**.
>
> - **Sin flag (merge directo):** al mergear, el chat queda visible para todos al instante. Si sale un bug, hay que revertir código y redesplegar con el bug vivo mientras tanto. No se puede limitar a una sola marca sin más código.
> - **Con flag:** el chat vive en el código detrás de un interruptor que arranca apagado. Se prende cuando se quiera, por marca, desde un panel o variable de config. Si sale un bug, se apaga en segundos y el código queda para arreglar con calma.
>
> **Por qué encaja acá:** hay 3 marcas y el bot crea reservas reales. El flag permite encender primero solo en una marca (p. ej. Alquilatucarro), validar con clientes reales y luego extender a las otras dos; y apagar al instante si el bot se comporta mal, sin un deploy de emergencia. En la práctica es un `if (chatHabilitado(marca)) { mostrarChat() }` donde `chatHabilitado` lee la config.

**Criterios de aceptación:**
- Intentos conocidos de inyección de prompt no logran sacar al bot de su rol (probado con un set de ataques).
- No es posible crear N reservas falsas en ráfaga sin toparse con el rate limit.
- Plan de despliegue aprobado y documentado.

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Endpoint público + reserva end-to-end = spam de reservas falsas | Rate limit + verificación ligera (incremento 4) |
| Inyección de prompt en endpoint anónimo | Guardrails explícitos + set de ataques en evaluación |
| El bot promete algo que Localiza no puede cumplir | Todo amarrado al `quote` opaco; manejo de error sin promesas |
| Manejo de PII de clientes | Persistencia existente, documentar alcance; revisar retención |
| Costo de tokens al escalar | `gpt-5-mini` es barato; monitorear; subir de modelo solo donde el razonamiento falle |
| Dependencia de Localiza (disponibilidad/latencia) | Mensajes de error claros, no bloquear la conversación |

---

## Lo que NO es la fase 2

Para evitar que el alcance se infle:

- **No es omnicanal.** Nada de WhatsApp ni voz. Solo web. (Candidato natural a fase 3.)
- **No es RAG sobre conversaciones pasadas.** El conocimiento se cura a mano en el incremento 2.
- **No es CRM ni gestión de leads.** La UI de revisión lee conversaciones; no gestiona clientes.
- **No es multi-idioma.** Español de Colombia.

---

## Secuencia y dependencias

```
Inc. 1 (Ojos)  ──►  Inc. 2 (Cerebro)  ──►  Inc. 3 (Manos)  ──►  Inc. 4 (Escudo)
   UI revisión       conocimiento+prompt     reserva e2e         guardrails+launch
   (independiente)    (usa datos de Inc.1)    (usa calidad Inc.2)  (cierra todo)
```

Cada incremento es desplegable solo. Si hay que parar, lo entregado hasta ahí ya aporta: el incremento 1 da visibilidad aunque no se toque el bot; el 2 sube calidad aunque no cierre reservas.

**Próximo paso si se aprueba:** abrir el incremento 1 como issue en `rentacar-dashboard`, plan mode, y arrancar por la UI de revisión.
