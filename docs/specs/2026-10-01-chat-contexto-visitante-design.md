# Chat web: contexto del visitante (fase 1)

Fecha: 2026-10-01 · Estado: aprobado por el dueño en conversación · Repos: `rentacar-web` (widget) y `rentacar-dashboard` (API `/api/chat` y bandeja)

## Para qué

Cuando un asesor abre una conversación del chat web hoy ve los mensajes y nada más. No sabe de dónde llegó el cliente (Google Ads, TikTok, orgánico), en qué página estaba, qué vio antes, desde qué aparato escribe ni en qué ciudad está. Esta fase le da ese contexto en la ficha de la conversación y en la lista.

Fuera de alcance (fase 2, solo si los asesores llegan a contestar dentro del chat web): presencia en vivo, aviso de visitante nuevo, saber si ya salió del sitio. Descartado: leer lo que el cliente escribe antes de enviarlo.

## Estado actual (verificado en código el 2026-10-01)

- El widget (`packages/logic/src/composables/useChatConversation.ts:642`) hace POST directo del navegador a `${rentacarPublicApiBase}/api/chat`. En producción ese host es `rentacar-dashboard-delta.vercel.app` en alquilame y alquilatucarro (comprobado en el HTML servido). **No pasa por Cloudflare**, así que las cabeceras `x-vercel-ip-*` traen la ubicación real del visitante.
- alquicarros no tiene chat en producción; el cambio le llega por la capa compartida pero no se activa.
- El envío lleva `{ brand, conversationId?, messages, attribution }`. `attribution` sale de `readStoredAttribution()` (localStorage `rentacar_attribution`, último toque, 30 días) y trae utm_*, click-ids, `referrer` y `landing_url`.
- El servidor (`app/api/chat/route.ts`) lee el cuerpo con `request.json()` sin esquema estricto: **los campos desconocidos se ignoran**. Entre web y dashboard el orden da igual; dentro del dashboard, las migraciones van antes que el código (§7).
- `sanitizeAttribution` (`route.ts:266`) conserva solo 8 claves y descarta `utm_campaign`, `landing_url`, `gbraid`, `wbraid` y otras. Solo llega a las reservas que cierra el bot, por los dos orquestadores (v2 en `route.ts:989` y v1 `runTurn` en `route.ts:1095`).
- Todas las conversaciones nuevas se crean en un solo punto (`route.ts:597-623`). Si `createConversation` lanza error, `conversationId` queda indefinido y el hilo entero deja de guardarse (`route.ts:621`).
- El servidor guarda solo el último mensaje del arreglo (`route.ts:651, 690-702`) con `appendMessages` (`persistence.ts:198`), o con `appendUserMessageReturning` (`persistence.ts:231`) cuando la coalescencia está activa. Un mensaje que descarta el guardia de duplicados (`route.ts:667`) no se guarda.
- `chat_conversations.channel` ya existe y vale `web` o `whatsapp` (migración 144). `city_detected` siempre se escribe en `null` (`route.ts:619`): la columna «Ciudad» de la lista y la cabecera «Ciudad: —» de la ficha están muertas.
- `deriveAttributionChannel` clasifica una visita orgánica de Google (referente externo, sin utm) como `referral`, no como `organic` (`derive-channel.ts:163-167`).
- `chat_conversations` no guarda origen, dispositivo ni ubicación. La IP solo se guarda como hash con sal (`ip_hash`). `chat_messages` tiene `content` y `parts`, sin página.
- El dashboard ya traduce origen a etiqueta y color: `lib/attribution/derive-channel.ts` (`deriveAttributionChannel`) y `lib/attribution/channel-meta.ts` (`CHANNEL_META`).
- La ficha (`app/(dashboard)/conversations/[id]/page.tsx`) tiene una columna derecha de 320 px con una sola tarjeta («Revisión»). La lista (`conversations/columns.tsx`) no tiene columna de origen. Ficha y lista leen con `select("*")` y RLS da SELECT a usuarios autenticados (migración 064); `thread-live.tsx` solo hace `router.refresh()`.
- El dashboard no tiene librería para traducir el user-agent.

## Diseño

### 1. Widget (rentacar-web, capa `packages/logic`)

- **Recorrido**: un plugin de cliente en la capa compartida registra la ruta de la carga inicial y cada cambio de ruta posterior. Guarda en `sessionStorage` dos cosas: `entry`, la primera ruta de la sesión (nunca se sobrescribe), y `trail`, las últimas 10 rutas (`pathname`, sin query), sin repetir la misma ruta consecutiva. Sin red, sin trabajo en el arranque más allá de una lectura. Todo acceso a storage va en try/catch; si falla, el recorrido queda vacío y el chat sigue igual.
- **Envío**: cada POST agrega `context: { page, entry, trail }`. `page` es `location.pathname` al enviar; `entry` y `trail` salen del plugin.
- El origen ya viaja en `attribution`; no se toca.

### 2. API (rentacar-dashboard, `/api/chat`)

- **`sanitizeVisitorContext`** (nuevo, separado de `sanitizeAttribution`): valida `context.page`, `context.entry` y cada elemento de `trail` como rutas que empiezan por `/`, máximo 200 caracteres cada una, máximo 10 elementos. Lo inválido se descarta.
- **`sanitizeVisitorAttribution`** (nuevo): como el de reservas pero conserva además `utm_campaign`, `utm_term`, `utm_content`, `landing_url`, `gbraid` y `wbraid`. **`sanitizeAttribution` no cambia**, para que el origen grabado en reservas siga idéntico.
- **Dispositivo**: se traduce `user-agent` a `{ type: 'movil'|'tablet'|'escritorio', os, browser }`. Se guarda solo lo traducido, nunca la cadena cruda. La librería o regex se decide en el plan.
- **Ubicación**: `x-vercel-ip-city` (viene codificada en URL, hay que decodificarla), `x-vercel-ip-country-region`, `x-vercel-ip-country`. La IP cruda sigue sin guardarse.
- **Canal**: `deriveAttributionChannel(attribution)`, la misma función que las reservas, para que chat y reservas nunca discrepen; `null` = desconocido. Como esa función da `referral` para el orgánico de buscadores, la tarjeta muestra junto al canal el dominio del referente («Referido web · google.com») para que el asesor lo distinga. Corregir la clasificación de orgánico es un cambio global de atribución (afecta reservas y analítica) y queda fuera de esta fase.

### 3. Datos (migraciones en rentacar-dashboard)

- `chat_conversations.visitor jsonb null`: foto al crear la conversación:
  `{ v: 1, attribution, attribution_channel, entry, trail, page, device, geo, captured_at }`. Se llama `attribution_channel` para no confundirlo con la columna `channel` (web/whatsapp) que ya existe.
- `chat_conversations.attribution_channel text null` + índice, para filtrar la lista.
- `chat_messages.page_path text null`: la página desde la que se escribió cada mensaje `role='user'`.
- La foto se escribe **una vez**, con un `update` aparte justo después de `createConversation` y protegido con try/catch. Ese mismo `update` escribe también la columna `attribution_channel`, para que filtro y tarjeta nunca discrepen. El insert de creación no cambia: si la foto falla, la conversación ya existe y el hilo se sigue guardando. Los turnos siguientes no la pisan (`update ... where visitor is null`).
- `page_path` se escribe en el mismo insert del mensaje de usuario, en las dos rutas de escritura (`appendMessages` y `appendUserMessageReturning`). Como eso sí toca el insert crítico, va detrás de la bandera `CHAT_VISITOR_CONTEXT` (apagada por defecto): sin bandera, el insert queda byte a byte igual que hoy. Si el guardia de duplicados descarta un mensaje, su página se pierde con él.
- **Entrada** = `entry` de la sesión (lo que vio primero en esta visita). `sessionStorage` es por pestaña: un enlace abierto en pestaña nueva arranca otra entrada y otro recorrido. Se acepta. `attribution.landing_url` se muestra aparte como «Página de la campaña» solo si existe, porque es último toque de hasta 30 días y puede venir de otra visita.
- `city_detected` no se toca. Ningún código la escribe y la migración 064 no documenta su significado; por el nombre y el contexto suponemos que era la ciudad donde el cliente quiere alquilar, no donde está. La ubicación nueva se rotula «Ubicación del visitante» para que no se confundan. Rellenar o retirar esa columna muerta queda como ticket aparte.
- Filas anteriores quedan en `null`; no hay relleno retroactivo.

### 4. Bandeja (rentacar-dashboard)

- **Tarjeta «Visitante»** en la columna derecha de la ficha, encima de «Revisión»: origen con la etiqueta, insignia y color de `CHANNEL_META` tal cual, sin etiquetas propias (más el dominio del referente cuando el canal es `referral`), campaña, entrada, página de la campaña si existe, recorrido, dispositivo y ubicación del visitante (ciudad, departamento, país).
- **En el hilo**: bajo cada mensaje del cliente, texto pequeño «desde /tarifas» cuando hay `page_path`.
- **Lista**: columna «Origen» con insignia y filtro por canal (`.eq('attribution_channel', …)` en `getConversationsPage`, igual que los filtros existentes). La consulta de la lista sigue con `select("*, chat_messages(count)")` y por tanto trae `visitor`: proyectar columnas a mano tocaría una consulta compartida y la forma `ConversationRow`, y la página de la lista es corta. Las tarjetas de métricas (`chat_conversation_metrics`) no respetan este filtro, igual que hoy no respetan los de revisión y marcas; queda anotado, fuera de alcance.
- `visitor` nulo en conversación web → «Sin datos: conversación anterior a esta función».
- Conversaciones de WhatsApp (`channel = 'whatsapp'`) → la tarjeta no aparece.
- Campo individual ausente → «No disponible».

### 5. Errores y degradación

Ningún dato de contexto puede tumbar el chat ni impedir que se guarde el hilo. La sanitización, el parseo del user-agent y el `update` de `visitor` van en try/catch: si fallan, la conversación y sus mensajes se guardan igual sin esos datos y el fallo se registra en el log. `page_path` va detrás de la bandera (ver §3).

### 6. Privacidad

Se guarda ciudad aproximada, tipo de aparato y rutas del sitio; no IP, ni user-agent crudo, ni texto sin enviar. El consentimiento existente (migración 087, tras `CHAT_HABEAS_DATA`) cubre solo el dato explícito antes de reservar, no lo que se toma al abrir el chat. **Decisión del dueño, pendiente**: añadir o no una línea al aviso del chat. `visitor` y `page_path` viven en las filas de la conversación y del mensaje, así que borrar una conversación los borra con ella.

### 7. Despliegue

1. Migraciones en Supabase. 2. Código del dashboard con `CHAT_VISITOR_CONTEXT` apagada (la foto ya se intenta, protegida; la bandeja muestra lo que haya). 3. Verificar que las columnas existen en producción y encender la bandera. 4. Web. El web puede salir antes o después sin romper nada porque el servidor ignora campos desconocidos.

## Escenarios observables

- **SCEN-01 — Origen Google Ads**: dado un visitante que entra a `/bogota?utm_source=google&gclid=x`, cuando abre el chat y envía un mensaje, entonces la tarjeta «Visitante» muestra «Google Ads», entrada `/bogota`, su tipo de aparato y su ciudad.
- **SCEN-02 — Página por mensaje y recorrido**: dado ese visitante y `CHAT_VISITOR_CONTEXT` encendida, cuando navega a `/tarifas` y envía otro mensaje, entonces ese mensaje muestra «desde /tarifas», el primero sigue mostrando «desde /bogota», y el recorrido incluye ambas rutas en orden.
- **SCEN-03 — Directo**: dado un visitante sin utm, click-id ni referente externo, cuando chatea, entonces el origen dice «Directo».
- **SCEN-04 — Conversación antigua**: dada una conversación web creada antes del despliegue, cuando se abre en la bandeja, entonces la tarjeta dice «Sin datos: conversación anterior a esta función» y la página no da error.
- **SCEN-05 — Filtro de lista**: dadas conversaciones con distintos orígenes, cuando se filtra la lista por el canal `tiktok_organic` (etiqueta «TikTok»), entonces solo aparecen esas, y las de `tiktok_ads` quedan fuera.
- **SCEN-06 — Reservas intactas**: dada una reserva cerrada por el bot, cuando se crea, entonces sus columnas de origen son idénticas a las que grababa antes del cambio.
- **SCEN-07 — Foto inmutable**: dada una conversación ya creada y `CHAT_VISITOR_CONTEXT` encendida, cuando el visitante envía más mensajes desde otras páginas, entonces `visitor` no cambia y solo cambia `page_path` de los mensajes nuevos.
- **SCEN-08 — Contexto basura**: dado un envío con `context` malformado (rutas sin `/`, arreglo de 500 elementos, tipos erróneos), cuando llega al servidor, entonces el chat responde normal y se guarda solo lo válido.
- **SCEN-09 — Storage bloqueado**: dado un navegador con `sessionStorage` inaccesible, cuando el visitante chatea, entonces el chat funciona y el recorrido llega vacío.
- **SCEN-10 — Cero errores**: en alquilame y alquilatucarro, en la página con el chat, cero errores de consola y cero peticiones fallidas; en la bandeja, igual.
- **SCEN-11 — WhatsApp**: dada una conversación de WhatsApp, cuando se abre, la tarjeta «Visitante» no aparece.
- **SCEN-12 — Falla la foto**: dado que el `update` de `visitor` falla (columna inexistente o error de base), cuando un visitante abre el chat, entonces la conversación y todos sus mensajes se guardan igual y la tarjeta dice «Sin datos».
- **SCEN-13 — Bandera apagada**: dado `CHAT_VISITOR_CONTEXT` apagada, cuando un visitante chatea, entonces el insert de mensajes es idéntico al actual y `page_path` queda vacío.
- **SCEN-14 — Orgánico de Google**: dado un visitante que llega desde `google.com` sin utm, cuando chatea, entonces la tarjeta muestra «Referido web · google.com».
- **SCEN-15 — Entrada sin campaña**: dado un visitante directo que entra por `/medellin` y luego va a `/tarifas`, cuando chatea, entonces la entrada es `/medellin` y no aparece «Página de la campaña».
