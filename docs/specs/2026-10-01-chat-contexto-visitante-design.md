# Chat web: contexto del visitante (fase 1)

Fecha: 2026-10-01 · Estado: aprobado por el dueño en conversación · Repos: `rentacar-web` (widget) y `rentacar-dashboard` (API `/api/chat` y bandeja)

## Para qué

Cuando un asesor abre una conversación del chat web hoy ve los mensajes y nada más. No sabe de dónde llegó el cliente (Google Ads, TikTok, orgánico), en qué página estaba, qué vio antes, desde qué aparato escribe ni en qué ciudad está. Esta fase le da ese contexto en la ficha de la conversación y en la lista.

Fuera de alcance (fase 2, solo si los asesores llegan a contestar dentro del chat web): presencia en vivo, aviso de visitante nuevo, saber si ya salió del sitio. Descartado: leer lo que el cliente escribe antes de enviarlo.

## Estado actual (verificado en código el 2026-10-01)

- El widget (`packages/logic/src/composables/useChatConversation.ts:642`) hace POST directo del navegador a `${rentacarPublicApiBase}/api/chat`. En producción ese host es `rentacar-dashboard-delta.vercel.app` en alquilame y alquilatucarro (comprobado en el HTML servido). **No pasa por Cloudflare**, así que las cabeceras `x-vercel-ip-*` traen la ubicación real del visitante.
- alquicarros no tiene chat en producción; el cambio le llega por la capa compartida pero no se activa.
- El envío lleva `{ brand, conversationId?, messages, attribution }`. `attribution` sale de `readStoredAttribution()` (localStorage `rentacar_attribution`, último toque, 30 días) y trae utm_*, click-ids, `referrer` y `landing_url`.
- El servidor (`app/api/chat/route.ts`) lee el cuerpo con `request.json()` sin esquema estricto: **los campos desconocidos se ignoran**. Desplegar web o dashboard primero no rompe nada.
- `sanitizeAttribution` (`route.ts:266`) conserva solo 8 claves y descarta `utm_campaign`, `landing_url` y otras. Se usa únicamente cuando el bot cierra una reserva (`lib/chat-v2/booking-core.ts`).
- `chat_conversations` no guarda origen, dispositivo ni ubicación. La IP solo se guarda como hash con sal (`ip_hash`). `chat_messages` tiene `content` y `parts`, sin página.
- El dashboard ya traduce origen a etiqueta y color: `lib/attribution/derive-channel.ts` (`deriveAttributionChannel`) y `lib/attribution/channel-meta.ts` (`CHANNEL_META`).
- La ficha (`app/(dashboard)/conversations/[id]/page.tsx`) tiene una columna derecha de 320 px con tarjetas; la lista (`conversations/columns.tsx`) no tiene columna de origen.

## Diseño

### 1. Widget (rentacar-web, capa `packages/logic`)

- **Recorrido**: un plugin de cliente en la capa compartida escucha los cambios de ruta y guarda en `sessionStorage` las últimas 10 rutas (`pathname`, sin query), sin repetir la misma ruta consecutiva. Sin red, sin trabajo en el arranque más allá de una lectura. Todo acceso a storage va en try/catch; si falla, el recorrido queda vacío y el chat sigue igual.
- **Envío**: cada POST agrega `context: { page, trail }`. `page` es `location.pathname` al enviar; `trail` es el arreglo del plugin.
- El origen ya viaja en `attribution`; no se toca.

### 2. API (rentacar-dashboard, `/api/chat`)

- **`sanitizeVisitorContext`** (nuevo, separado de `sanitizeAttribution`): valida `context.page` y cada elemento de `trail` como rutas que empiezan por `/`, máximo 200 caracteres cada una, máximo 10 elementos. Lo inválido se descarta.
- **`sanitizeVisitorAttribution`** (nuevo): como el de reservas pero conserva además `utm_campaign`, `utm_term`, `utm_content` y `landing_url`. **`sanitizeAttribution` no cambia**, para que el origen grabado en reservas siga idéntico.
- **Dispositivo**: se traduce `user-agent` a `{ type: 'movil'|'tablet'|'escritorio', os, browser }`. Se guarda solo lo traducido, nunca la cadena cruda. La librería o regex se decide en el plan.
- **Ubicación**: `x-vercel-ip-city` (viene codificada en URL, hay que decodificarla), `x-vercel-ip-country-region`, `x-vercel-ip-country`. La IP cruda sigue sin guardarse.
- **Canal**: `deriveAttributionChannel(attribution)`; `null` = desconocido.

### 3. Datos (migraciones en rentacar-dashboard)

- `chat_conversations.visitor jsonb null`: foto al crear la conversación:
  `{ v: 1, attribution, channel, landing, trail, page, device, geo, captured_at }`.
- `chat_conversations.attribution_channel text null` + índice, para filtrar la lista.
- `chat_messages.page_path text null`: la página desde la que se escribió cada mensaje `role='user'`.
- Se escribe la foto **solo al crear** la conversación (`createConversation`); los turnos siguientes no la pisan. `page_path` se escribe en cada mensaje de usuario nuevo.
- Filas anteriores quedan en `null`; no hay relleno retroactivo.

### 4. Bandeja (rentacar-dashboard)

- **Tarjeta «Visitante»** en la columna derecha de la ficha: origen con insignia y color de `CHANNEL_META`, campaña, página de entrada, recorrido, dispositivo, ciudad/departamento/país.
- **En el hilo**: bajo cada mensaje del cliente, texto pequeño «desde /tarifas» cuando hay `page_path`.
- **Lista**: columna «Origen» con insignia y filtro por canal.
- `visitor` nulo en conversación web → «Sin datos: conversación anterior a esta función».
- Conversaciones de WhatsApp (`channel = 'whatsapp'`) → la tarjeta no aparece.
- Campo individual ausente → «No disponible».

### 5. Errores y degradación

Ningún dato de contexto puede tumbar el chat. Si la sanitización, el parseo del user-agent o la escritura de `visitor` fallan, la conversación se crea igual sin esos datos y el fallo se registra en el log del servidor.

### 6. Privacidad

Se guarda ciudad aproximada y tipo de aparato, no IP ni user-agent crudo ni texto sin enviar. Revisar en el plan si el consentimiento del chat (migración 087) ya cubre estos datos o si el aviso necesita una línea.

### 7. Despliegue

Orden libre porque el servidor ignora campos desconocidos. Se recomienda dashboard primero (migraciones + API + bandeja) y web después, para que el primer chat con contexto ya tenga dónde guardarse.

## Escenarios observables

- **SCEN-01 — Origen Google Ads**: dado un visitante que entra a `/bogota?utm_source=google&gclid=x`, cuando abre el chat y envía un mensaje, entonces la tarjeta «Visitante» muestra «Google Ads», entrada `/bogota`, su tipo de aparato y su ciudad.
- **SCEN-02 — Página por mensaje y recorrido**: dado ese visitante, cuando navega a `/tarifas` y envía otro mensaje, entonces ese mensaje muestra «desde /tarifas», el primero sigue mostrando «desde /bogota», y el recorrido incluye ambas rutas en orden.
- **SCEN-03 — Directo**: dado un visitante sin utm, click-id ni referente externo, cuando chatea, entonces el origen dice «Directo».
- **SCEN-04 — Conversación antigua**: dada una conversación web creada antes del despliegue, cuando se abre en la bandeja, entonces la tarjeta dice «Sin datos: conversación anterior a esta función» y la página no da error.
- **SCEN-05 — Filtro de lista**: dadas conversaciones con distintos orígenes, cuando se filtra la lista por «TikTok», entonces solo aparecen las de TikTok.
- **SCEN-06 — Reservas intactas**: dada una reserva cerrada por el bot, cuando se crea, entonces sus columnas de origen son idénticas a las que grababa antes del cambio.
- **SCEN-07 — Foto inmutable**: dada una conversación ya creada, cuando el visitante envía más mensajes desde otras páginas, entonces `visitor` no cambia y solo cambia `page_path` de los mensajes nuevos.
- **SCEN-08 — Contexto basura**: dado un envío con `context` malformado (rutas sin `/`, arreglo de 500 elementos, tipos erróneos), cuando llega al servidor, entonces el chat responde normal y se guarda solo lo válido.
- **SCEN-09 — Storage bloqueado**: dado un navegador con `sessionStorage` inaccesible, cuando el visitante chatea, entonces el chat funciona y el recorrido llega vacío.
- **SCEN-10 — Cero errores**: en alquilame y alquilatucarro, en la página con el chat, cero errores de consola y cero peticiones fallidas; en la bandeja, igual.
- **SCEN-11 — WhatsApp**: dada una conversación de WhatsApp, cuando se abre, la tarjeta «Visitante» no aparece.
