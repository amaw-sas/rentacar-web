# Preguntas de clientes: taxonomía, fricción y efecto sobre la parrilla

**Fecha del informe:** 2026-07-31

**Ventana de conversaciones:** 2026-06-21 a 2026-07-31

**Ventana de Search Console:** 2026-05-01 a 2026-07-28

**Marcas:** Alquílame y AlquilaTuCarro

**Operación:** todas las consultas a Supabase fueron de solo lectura. No se usó GA4.

## Resumen ejecutivo

La parrilla no debe desecharse. Sus artículos de ciudad se sostienen: las consultas genéricas de alquiler por ciudad sumaron **73.964 impresiones y 612 clics** en Search Console. El cambio necesario es incorporar preguntas de decisión y de operación sin duplicar los artículos vivos.

Después de depurar datos que parecían de producción pero no lo eran, la base útil quedó en **14.577 mensajes entrantes de 1.954 conversaciones**: 1.668 mensajes de 335 chats web con texto y 12.909 mensajes de 1.619 conversaciones de WhatsApp.

Los resultados principales son:

1. Los tres temas más extendidos son **requisitos** (773 conversaciones), **vehículo/gama/modelo** (762) y **precio/cotización** (755). Requisitos necesita una salvedad importante: 654 conversaciones comenzaron con un texto prellenado de WhatsApp. Son leads reales que pidieron esa información, pero no 654 formulaciones espontáneas independientes.
2. La intuición de que una pregunta repetida produce varios contenidos es correcta. Requisitos se divide, como mínimo, en documentos, tarjeta, titularidad, cupo/garantía y edad. Lo mismo ocurre con precio y elección del vehículo.
3. La sonda original no sirve como conteo. **Devolución en otra ciudad** pasó de 563 menciones estimadas a **15 menciones en 13 conversaciones**, todas de WhatsApp. La sonda había mezclado campos rutinarios de recogida/devolución, cambios de sede y un lote de pruebas no etiquetado.
4. **Seguro y coberturas** pasó de 407 menciones estimadas a **80 menciones en 57 conversaciones**. Es menor de lo supuesto, pero sigue siendo un hueco real: no hay artículo dedicado, 51 conversaciones llegaron a asesores y el chat mostró fricción fuerte en 3 de 6 conversaciones limpias sobre el tema.
5. En el bot, las mayores cantidades de fricción están en **vehículo/gama/modelo** (59 de 106 conversaciones) y **precio** (56 de 110). Seguro tiene menos casos, pero una tasa alta y una explicación cualitativa clara: el cliente no entiende la diferencia entre seguro básico, seguro total, deducible y precio final.
6. Los temas con demanda alta tanto en clientes como en Search Console son precio, vehículo y aeropuerto. Tarjeta también parece entrar, pero **1.388 de sus 1.420 impresiones son búsquedas de “sin tarjeta de crédito”**, sujetas al veto suave; no justifican contenido nuevo.
7. La recomendación editorial es conservar 24 espacios con prioridad normal o alta, mantener Palmira en cola, bajar o reformular 3, dejar 2 eventos condicionados a la evidencia mensual y reemplazar Soledad. Los huecos deben apoyarse en artículos vivos para no crear canibalización.

## 1. Método y límites

### 1.1 Fuentes y corte

El tamaño actual de las bases no coincide con el que tenía la solicitud inicial, porque ambas siguieron recibiendo mensajes. La diferencia grande está en WhatsApp: la tabla ya no tenía 5.462 mensajes sino 216.010. Para evitar mezclar otras líneas capturadas por el monitor, se seleccionaron solamente las tres sesiones asociadas a las líneas vigentes de las dos marcas.

| Fuente | Estado bruto al consultar | Filtros de elegibilidad | Corte efectivamente analizado |
|---|---|---|---|
| Chat web | 33.840 mensajes; 17.103 de usuario; 3.432 conversaciones | `is_test=false`; entorno `production` o legado nulo; solo dos marcas; exclusión del lote anómalo del 13-14 de julio | 1.668 mensajes de usuario con texto; 335 conversaciones |
| WhatsApp Monitor | 216.010 mensajes; 7.967 contactos; 54 sesiones | 3 sesiones de las líneas vigentes; `direction='inbound'`; desde 2026-06-21 | 12.909 mensajes; 1.619 conversaciones contacto-sesión |
| Combinado | — | Ventana común y dos marcas | **14.577 mensajes; 1.954 conversaciones** |

**Consulta:** Q-SNAPSHOT, Q-CHAT y Q-WA, definidas en 1.4. Conteos brutos tomados a las 2026-07-31 04:48 UTC; el archivo analítico se cerró a las 04:02 UTC.

En el chat, `environment` es nulo en 3.038 de las 3.432 conversaciones. Aplicar literalmente `environment='production'` habría dejado casi todo el histórico fuera. Se tomó la decisión conservadora de incluir nulos solamente cuando `is_test=false`, y excluir cualquier entorno explícitamente distinto de producción. No había entornos explícitamente no productivos en el corte elegible.

### 1.2 Un lote de pruebas que la base no marcó como prueba

Los días 13 y 14 de julio muestran un salto imposible de reconciliar con el resto de la serie: 661 conversaciones, todas abiertas, ninguna cotizada o reservada y 606 con una secuencia larga de mensajes repetida dentro del mismo día. Además, una misma solicitud recibió respuestas mutuamente incompatibles del bot.

| Periodo de chat | Conversaciones | Abiertas | Cotizadas o reservadas | Conversaciones con secuencia larga duplicada |
|---|---:|---:|---:|---:|
| 13-14 de julio | 661 | 661 | 0 | 606 |
| Resto de la ventana | 338 | 231 | 97 | 5 |

**Consulta:** Q-ANOMALY. La última columna agrupa por día y por la secuencia normalizada completa de mensajes del usuario; cuenta conversaciones cuyo patrón aparece al menos dos veces y tiene 30 o más caracteres.

Aunque `is_test=false` y `environment IS NULL`, el lote se excluyó del conteo principal y de la fricción. Incluirlo habría tratado ejecuciones de evaluación como clientes. La observación de QA se conserva: ante la misma solicitud de devolución en otra ciudad, el bot llegó a decir tanto “sí, con recargo” como “solo se permite devolver en la misma ciudad”. Eso requiere una regla de negocio única, pero no es evidencia de 661 clientes.

### 1.3 Agrupación por significado

La unidad principal es la **conversación con el tema**, no el número de veces que aparece una palabra. También se conserva “menciones”, porque una conversación puede insistir varias veces. La clasificación es multietiqueta: preguntar si el precio incluye seguro cuenta en precio y en seguro.

El proceso fue:

1. Normalizar mayúsculas, tildes, enlaces y ruido; conservar el mensaje original solo en el área temporal local.
2. Generar vecindarios semánticos locales con `paraphrase-multilingual-MiniLM-L12-v2`. Los mensajes no se enviaron a un servicio externo.
3. Probar HDBSCAN para descubrir grupos. Produjo 131 clústeres, pero dejó aproximadamente 65% como ruido; por eso no se usó como contador final.
4. Construir un código semántico multietiqueta con ejemplos de los clústeres y reglas de acción/entidad. Ejemplo: “¿puedo devolverlo en Medellín si lo recojo en Bogotá?” entra en otra ciudad; “lo devuelvo a las 9” entra en horarios, no en otra ciudad.
5. Revisar manualmente cuatro ejemplos por cada etiqueta observada —más de 120 casos— y corregir falsos positivos como “seguro de que…”, “camioneta” confundida con carga y “transporte público” usado para llegar a una sede.

No hay un segundo anotador ni un conjunto etiquetado de referencia, por lo que **no existe un margen de error porcentual defendible**. Los conteos son estimaciones reproducibles del código semántico, no verdad censal. Los temas implícitos y de poco volumen son límites inferiores; los grandes son más estables. La exclusión del lote anómalo reduce mucho el sesgo más evidente.

Para WhatsApp no existe columna de ciudad. La ciudad se infirió solo cuando se menciona explícitamente en la conversación; puede ser origen, destino o ruta, no residencia. Una conversación puede sumar en más de una ciudad. En chat se usó `city_detected`.

### 1.4 Consultas y cálculos reproducibles

Todos los accesos fueron `SELECT` o GET de PostgREST.

**Q-SNAPSHOT — tamaño de tablas**

```sql
SELECT count(*) FROM chat_messages;
SELECT count(*) FROM chat_messages WHERE role = 'user';
SELECT count(*) FROM chat_conversations;

SELECT count(*) FROM messages;
SELECT count(*) FROM contacts;
SELECT count(*) FROM sessions;
```

**Q-CHAT — extracción elegible del chat**

```sql
SELECT m.id, m.conversation_id, m.role, m.content, m.created_at,
       c.brand, c.city_detected, c.status, c.state, c.review_label,
       c.created_at AS conversation_created_at
FROM chat_messages m
JOIN chat_conversations c ON c.id = m.conversation_id
WHERE c.is_test IS FALSE
  AND (c.environment = 'production' OR c.environment IS NULL)
  AND c.brand IN ('alquilame', 'alquilatucarro')
  AND c.created_at::date NOT IN (DATE '2026-07-13', DATE '2026-07-14');
```

**Q-WA — extracción elegible de WhatsApp**

```sql
SELECT m.id, m.session_id, m.contact_id, m.direction, m.text, m.sent_at
FROM messages m
WHERE m.session_id IN (:sesiones_de_las_lineas_vigentes_de_las_dos_marcas)
  AND m.direction = 'inbound'
  AND m.sent_at >= TIMESTAMPTZ '2026-06-21 00:00:00+00';
```

Los identificadores se resolvieron localmente contra `sessions` y la configuración vigente. No se guardan números de teléfono ni identificadores personales en este informe.

**Q-ANOMALY — detección local del lote**

```text
fingerprint = unir(normalizar(mensajes_de_usuario_ordenados_por_conversacion))
agrupar por fecha UTC y fingerprint
marcar si longitud(fingerprint) >= 30 y count(conversaciones) >= 2
```

**Q-TAX — agregado de la taxonomía local**

```sql
-- coded_mentions se construyó solo en memoria; no se creó tabla en Supabase.
SELECT topic,
       count(*) AS mentions,
       count(DISTINCT source || ':' || conversation_key) AS conversations,
       source, brand, city
FROM coded_mentions
GROUP BY topic, source, brand, city;
```

**Q-FRICTION — señales del chat**

```text
repregunta = el mismo tema aparece de nuevo después de una respuesta del bot
sin_respuesta = la última intervención temática del usuario no recibe respuesta
revision = review_label IN ('bad', 'improvable')
friccion_fuerte = union(repregunta, sin_respuesta, revision)
abandono_asociado = el bot responde, no hay otro mensaje ni reserva
```

El abandono no entra en “fricción fuerte”: es una asociación, no prueba causal. Una transferencia a asesor tampoco se considera por sí sola una falla.

**Q-GSC — Search Console**

```http
POST https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query
Authorization: Bearer {ADC_TOKEN}
x-goog-user-project: diego-seo-audit
Content-Type: application/json

{
  "startDate": "2026-05-01",
  "endDate": "2026-07-28",
  "dimensions": ["query"],
  "rowLimit": 25000,
  "startRow": 0
}
```

Se ejecutó para `sc-domain:alquilame.co` y `sc-domain:alquilatucarro.com`. Las consultas se codificaron con el mismo diccionario temático, ajustado a intención de búsqueda.

**Q-BLOG — cobertura existente**

```sql
SELECT brand, title, slug, date
FROM blog_posts
WHERE brand IN ('alquilame', 'alquilatucarro')
ORDER BY brand, date;

SELECT brand, title, slug, body
FROM blog_posts
WHERE brand = 'alquilatucarro'
  AND slug IN (
    'requisitos-alquilar-carro-colombia',
    'precios-alquiler-carros-colombia',
    'tipos-carros-alquilar-cual-elegir'
  );
```

## 2. Taxonomía completa

`M/C` significa menciones/conversaciones. La columna de marca cuenta conversaciones. Las ciudades muestran las tres principales y, cuando aplica, las que no pudieron determinarse.

| Tema | Menciones | Conversaciones | Chat M/C | WhatsApp M/C | Alquílame / ATC (C) | Ciudades principales (C) |
|---|---:|---:|---:|---:|---:|---|
| Requisitos generales | 820 | 773 | 11/10 | 809/763 | 34 / 739 | Bogotá 185, Cartagena 68, Bucaramanga 51; sin determinar 82 |
| Vehículo, gama o modelo | 1.115 | 762 | 174/106 | 941/656 | 139 / 623 | Bogotá 198, Medellín 48, Cartagena 44; sin determinar 160 |
| Precio o cotización | 1.178 | 755 | 155/110 | 1.023/645 | 137 / 618 | Bogotá 174, Cartagena 44, Medellín 38; sin determinar 216 |
| Disponibilidad / última hora | 391 | 318 | 30/26 | 361/292 | 51 / 267 | Bogotá 72, Medellín 19, Bucaramanga 18; sin determinar 77 |
| Tarjeta y medio de pago | 334 | 239 | 37/25 | 297/214 | 40 / 199 | Bogotá 53, Cartagena 15, Medellín 15; sin determinar 73 |
| Sede o ubicación | 307 | 212 | 30/20 | 277/192 | 42 / 170 | Bogotá 44, Villavicencio 18, Cartagena 17; sin determinar 40 |
| Aeropuerto y vuelo | 299 | 195 | 33/30 | 266/165 | 38 / 157 | Bogotá 50, Montería 20, Cali 15; sin determinar 45 |
| Horarios de recogida/devolución | 155 | 122 | 15/14 | 140/108 | 21 / 101 | Bogotá 27, Medellín 15, Bucaramanga 9; sin determinar 26 |
| Depósito, cupo o garantía | 152 | 119 | 12/10 | 140/109 | 16 / 103 | Bogotá 31, Medellín 12, Santa Marta 6; sin determinar 30 |
| Cambios, cancelación o extensión | 129 | 98 | 13/10 | 116/88 | 19 / 79 | Bogotá 16, Medellín 10, Barranquilla 7; sin determinar 38 |
| Documentos/licencia extranjera | 87 | 72 | 2/2 | 85/70 | 15 / 57 | Bogotá 11, Medellín 10, Villavicencio 5; sin determinar 14 |
| Cómo reservar / confirmación | 81 | 67 | 6/6 | 75/61 | 13 / 54 | Bogotá 22, Santa Marta 4, Medellín 4; sin determinar 14 |
| Titular de tarjeta vs. conductor | 69 | 58 | 2/2 | 67/56 | 15 / 43 | Bogotá 12, Medellín 9, Cartagena 4; sin determinar 12 |
| Combustible, lavado o peajes | 63 | 57 | 3/3 | 60/54 | 10 / 47 | Bogotá 16, Bucaramanga 4, Medellín 4; sin determinar 11 |
| Seguro y coberturas | 80 | 57 | 11/6 | 69/51 | 12 / 45 | Bogotá 19, Medellín 6, Pereira 4; sin determinar 11 |
| Duración: horas/día/mes | 43 | 39 | 6/6 | 37/33 | 10 / 29 | Bogotá 9, Bucaramanga 2, Valledupar 2; sin determinar 13 |
| Pico y placa / multas | 56 | 35 | 6/4 | 50/31 | 3 / 32 | Bogotá 20, Medellín 3, Floridablanca 2; sin determinar 5 |
| Viajes, kilometraje o frontera | 32 | 29 | 4/4 | 28/25 | 4 / 25 | Bogotá 9, Ibagué 3, Pereira 3; sin determinar 5 |
| Adicionales: conductor/silla/mascota | 38 | 27 | 5/2 | 33/25 | 7 / 20 | Bogotá 8, Medellín 2, Ibagué 2; sin determinar 10 |
| Empresa o factura | 40 | 26 | 1/1 | 39/25 | 5 / 21 | Bogotá 5, Montería 3, Villavicencio 3; sin determinar 6 |
| Devolución en otra ciudad | 15 | 13 | 0/0 | 15/13 | 3 / 10 | Bogotá 5, Medellín 4, Cartagena 3 |
| Contacto con asesor | 12 | 11 | 1/1 | 11/10 | 0 / 11 | Bogotá 4, Medellín 2, Rionegro 1; sin determinar 1 |
| Momento/moneda del pago | 10 | 10 | 0/0 | 10/10 | 3 / 7 | Bogotá 3, Medellín 2, Ibagué 2; sin determinar 2 |
| **Veto:** carga o mudanza | 9 | 8 | 1/1 | 8/7 | 1 / 7 | Villavicencio 3, Bogotá 2, Neiva 1; sin determinar 3 |
| Edad mínima | 7 | 6 | 1/1 | 6/5 | 1 / 5 | Bogotá 1, Cali 1, Armenia 1; sin determinar 1 |
| **Veto:** apps (Uber/DiDi) | 6 | 6 | 1/1 | 5/5 | 2 / 4 | Bogotá 1, Barranquilla 1; sin determinar 4 |
| Confianza / operador real | 6 | 5 | 1/1 | 5/4 | 3 / 2 | Villavicencio 1, Cartagena 1, Medellín 1; sin determinar 1 |
| **Veto:** con conductor | 3 | 3 | 1/1 | 2/2 | 0 / 3 | sin determinar 3 |
| Entrega a domicilio/hotel | 2 | 2 | 0/0 | 2/2 | 1 / 1 | Ibagué 1, Cartagena 1, Medellín 1 |
| Posventa/asistencia/reclamo | 2 | 2 | 0/0 | 2/2 | 2 / 0 | Medellín 1, Cali 1, Pereira 1; sin determinar 1 |
| Ofrecer vehículo propio | 1 | 1 | 0/0 | 1/1 | 0 / 1 | Bucaramanga 1 |
| **Veto:** transporte público/escolar | 0 | 0 | 0/0 | 0/0 | 0 / 0 | — |

**Consulta:** Q-TAX. Los totales por ciudad pueden superar las conversaciones porque una misma conversación puede mencionar origen y destino.

La fuente cambia la lectura. Requisitos es casi enteramente WhatsApp y **654 de sus 773 conversaciones** usaron el mensaje prellenado “vi la página y quiero saber los requisitos”, con variaciones por ciudad. Es una necesidad real de onboarding, pero la variedad lingüística es mucho menor que el volumen. Precio, gama, disponibilidad y cambios también crecen en WhatsApp, coherente con conversaciones más comerciales y difíciles.

La comparación con la sonda deja claro qué se corrigió:

| Tema | Sonda por patrones | Conteo semántico depurado | Veredicto |
|---|---:|---:|---|
| Entrega/devolución en otra ciudad | 563 menciones | 15 menciones; 13 conversaciones | No es el tema número 1. Los patrones confundían cualquier recogida/devolución y el lote anómalo. |
| Requisitos y documentos | 557 menciones | 820 menciones; 773 conversaciones | Sí es enorme, pero 654 conversaciones traen texto prellenado. Debe dividirse por decisión concreta. |
| Medio de pago/tarjeta | 430 menciones | 334 menciones; 239 conversaciones | Tema grande; la búsqueda externa está dominada por la variante vetada “sin tarjeta”. |
| Seguro y coberturas | 407 menciones | 80 menciones; 57 conversaciones | Menor de lo supuesto, todavía hueco editorial y de bot. |
| Aeropuerto y vuelos | 240 menciones | 299 menciones; 195 conversaciones | Confirmado y además respaldado por Search Console. |

**Consulta:** cifras de la sonda entregadas en el encargo + Q-TAX para el conteo depurado.

## 3. Temas mal respondidos por el bot

La fricción solo se puede medir en chat, donde existe respuesta del asistente. Después de retirar el lote anómalo quedaron 338 conversaciones elegibles, 335 con mensaje de usuario no vacío. Quince terminaron reservadas. Esa tasa no debe interpretarse como conversión total del negocio: solo observa el estado guardado por este bot.

Las columnas de señal pueden solaparse. “Fricción fuerte” es su unión, no la suma.
`review_label` califica la conversación completa; su asociación con un tema no demuestra que ese tema haya causado la mala revisión.

| Tema | Chats con tema | Repregunta | Sin respuesta | `bad`/`improvable` | Fricción fuerte | Tasa | Abandono asociado | Handoff/fallback |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Vehículo, gama o modelo | 106 | 37 | 7 | 34 | 59 | 55,7% | 33 | 18 |
| Precio o cotización | 110 | 29 | 6 | 30 | 56 | 50,9% | 26 | 23 |
| Disponibilidad / última hora | 26 | 4 | 0 | 13 | 14 | 53,8% | 5 | 6 |
| Sede o ubicación | 20 | 6 | 0 | 9 | 11 | 55,0% | 8 | 8 |
| Horarios de recogida/devolución | 14 | 1 | 2 | 6 | 9 | 64,3% | 1 | 1 |
| Aeropuerto y vuelo | 30 | 3 | 0 | 7 | 8 | 26,7% | 6 | 9 |
| Tarjeta y medio de pago | 25 | 5 | 1 | 5 | 8 | 32,0% | 5 | 3 |
| Cambio, cancelación o extensión | 10 | 2 | 0 | 4 | 4 | 40,0% | 4 | 7 |
| Reserva / confirmación | 6 | 0 | 2 | 2 | 4 | 66,7% | 1 | 0 |
| Requisitos generales | 10 | 1 | 1 | 1 | 3 | 30,0% | 1 | 2 |
| Depósito, cupo o garantía | 10 | 1 | 0 | 3 | 3 | 30,0% | 2 | 0 |
| Seguro y coberturas | 6 | 2 | 1 | 2 | 3 | 50,0% | 0 | 1 |
| Pico y placa / multas | 4 | 1 | 0 | 2 | 3 | 75,0% | 1 | 0 |

**Consulta:** Q-FRICTION sobre Q-CHAT. Orden: cantidad de conversaciones con fricción fuerte y luego tamaño del tema. Las tasas de filas con menos de 10 casos son descriptivas, no estables.

La revisión cualitativa explica mejor la urgencia que la tasa sola:

- **Vehículo y precio:** el cliente vuelve a pedir modelo, transmisión, disponibilidad o total incluido después de que el bot lo lleva a elegir una gama. Parte es iteración normal de una cotización, pero los 34 y 30 `review_label` problemáticos, respectivamente, impiden descartarlo como simple conversación larga.
- **Disponibilidad:** cuando no hay inventario para “hoy”, el bot no siempre ofrece una alternativa útil de fecha, sede o gama.
- **Sede y horarios:** aparecen pérdidas de contexto. Por ejemplo, después de que el cliente ya indicó aeropuerto y ciudad, el bot vuelve a pedir la sede o da un horario parcial sin la hora exacta de apertura.
- **Seguro:** la duda no es solo “¿incluye seguro?”. Es la diferencia entre básico y total, cuánto queda de deducible, qué cubre cada uno y cuándo se conoce el valor. En una conversación limpia el cliente dijo que no entendía el valor mostrado; en otra el tema quedó sin respuesta. Las preguntas citadas aquí están reescritas y no contienen datos personales.
- **Cambios y cancelaciones:** buena parte requiere una acción humana sobre una reserva. Un handoff es correcto si conserva contexto; no se debe prometer que un artículo resolverá una operación transaccional.

No hay una muestra limpia de chat para **devolución en otra ciudad**: las 13 conversaciones verificadas vienen de WhatsApp. Por tanto, su calidad de respuesta del bot queda **no verificada**. El lote excluido sí reveló inconsistencia de QA, pero no se usa como fricción de clientes.

## 4. Cruce con Search Console

Search Console devolvió 3.121 filas de consulta para Alquílame —52.904 impresiones y 610 clics— y 2.741 para AlquilaTuCarro —63.374 impresiones y 719 clics—. En conjunto son 116.278 impresiones y 1.329 clics.

| Propiedad | Filas de consulta | Impresiones | Clics |
|---|---:|---:|---:|
| `sc-domain:alquilame.co` | 3.121 | 52.904 | 610 |
| `sc-domain:alquilatucarro.com` | 2.741 | 63.374 | 719 |
| **Total** | **5.862** | **116.278** | **1.329** |

**Consulta:** Q-GSC, sin filtros de consulta y con dimensión `query`.

Para hacer operativos los cuadrantes se fijó antes de mirar el resultado final:

- “Preguntan mucho”: al menos 50 conversaciones, 2,6% de las 1.954 analizadas.
- “Buscan mucho”: al menos 500 impresiones en los 89 días de Search Console.

No son umbrales estadísticos universales; sirven para ordenar esta cartera. Cero impresiones significa que **estas propiedades** no aparecieron para el grupo detectado, no que no exista demanda en Google.

| Cuadrante | Tema | Conversaciones | Impresiones | Clics | Lectura y acción |
|---|---|---:|---:|---:|---|
| Preguntan + buscan | Precio/cotización | 755 | 3.277 | 32 | Prioridad máxima, pero actualizar el post vivo antes de crear otro. |
| Preguntan + buscan | Vehículo/gama/modelo | 762 | 1.293 | 9 | Prioridad máxima; el post vivo no explica gama vs. modelo ni transmisión. |
| Preguntan + buscan | Aeropuerto/vuelo | 195 | 1.480 | 2 | Prioridad máxima; subir A3 y H2. Posición media 28,0: margen grande. |
| Preguntan + buscan, con veto | Tarjeta/medio de pago | 239 | 1.420 | 10 | 1.388 impresiones son “sin tarjeta”. Mantener FAQ que filtra; no crear contenido para captar esa variante. |
| Preguntan + búsqueda baja | Requisitos generales | 773 | 288 | 2 | Web, asesores y bot. Refrescar el artículo vivo y mantener C2; no duplicar H1/H2 genéricos. |
| Preguntan + búsqueda baja | Disponibilidad / última hora | 318 | 0 | 0 | Contenido de conversión y bot; E2 se sostiene aunque no atraiga tráfico hoy. |
| Preguntan + búsqueda baja | Sede/ubicación | 212 | 280 | 0 | Mejorar páginas de sede y bot; las consultas GSC están sesgadas a un operador específico. |
| Preguntan + búsqueda baja | Horarios de recogida/devolución | 122 | 0 | 0 | Contenido operativo dentro de A3/H2 y datos del bot. |
| Preguntan + búsqueda baja | Depósito/cupo/garantía | 119 | 16 | 1 | Nuevo satélite de condiciones; no está cubierto por el post vivo de requisitos. |
| Preguntan + búsqueda baja | Cambios/cancelación/extensión | 98 | 0 | 0 | Centro de ayuda y handoff, no artículo de captación. |
| Preguntan + búsqueda baja | Documentos/licencia extranjera | 72 | 0 | 0 | C1 y C2 se sostienen por conversión, no por GSC actual. |
| Preguntan + búsqueda baja | Reserva/confirmación | 67 | 0 | 0 | FAQ y flujo; no necesita artículo autónomo. |
| Preguntan + búsqueda baja | Seguro/coberturas | 57 | 0 | 0 | Nuevo artículo/guía para conversión y bot; no prometer tráfico orgánico. |
| Preguntan + búsqueda baja | Combustible/lavado/peajes | 57 | 15 | 0 | FAQ operativa; separar peajes de condiciones de devolución. |
| Preguntan poco + buscan | Alquiler por ciudad | n/a | 73.964 | 612 | Sostiene la mayoría de los pilares de ciudad. La ciudad suele ser parámetro, no pregunta. |
| Preguntan poco + buscan | Duración: día/semana/mes | 39 | 1.511 | 20 | Tráfico frío con intención útil; B1 se sostiene. |
| Preguntan poco + buscan | Guía para extranjero en Colombia | n/a | 856 | 6 | C0 se sostiene; no equivale a las dudas documentales de 72 conversaciones. |
| Ninguno | Pico y placa / multas | 35 | 387 | 1 | No descartar del sitio, pero bajar H1: casi toda la impresión es intención cívica; Bogotá aporta solo 1 impresión. |
| Ninguno | Empresa/factura | 26 | 337 | 0 | FAQ o página comercial, no prioridad de blog. |
| Ninguno | Devolución en otra ciudad | 13 | 11 | 0 | FAQ precisa y regla única para bot/asesores; no artículo SEO autónomo. |
| Ninguno | Viaje/kilometraje/frontera | 29 | 5 | 0 | FAQ operativa; no nuevo silo todavía. |
| Ninguno | Adicionales | 27 | 1 | 0 | FAQ dentro de requisitos/vehículo. |
| Veto | Carga/mudanza | 8 | 85 | 1 | Registrar la demanda y rechazarla; no publicar. |
| Veto | Apps | 6 | 64 | 0 | Registrar y rechazar; no publicar. |
| Veto | Con conductor | 3 | 19 | 0 | Registrar y rechazar; no publicar. |
| Veto | Transporte público/escolar | 0 | 1 | 0 | No publicar. La impresión no describe el servicio. |

**Consulta:** Q-TAX + Q-GSC. Cuadrantes calculados con ≥50 conversaciones y ≥500 impresiones. La fila de tarjeta resta las 1.388 impresiones de Q-GSC clasificadas además como `sin_tarjeta_credito` para interpretar la parte utilizable.

## 5. Veredicto sobre la parrilla de 31 espacios

El documento de diseño dice “32 espacios”, pero sus tablas contienen **14 de Alquílame + 17 de AlquilaTuCarro = 31**. Este informe usa los 31 solicitados.

### 5.1 Decisión espacio por espacio

La columna GSC usa la propiedad asignada al artículo, no la suma de los dos dominios. Para temas no geográficos usa el grupo semántico del título.

| ID | Artículo/tema | GSC en su propiedad | Decisión | Motivo medido |
|---|---|---:|---|---|
| A0 | Medellín | 4.314 impr. | Mantener | Demanda de ciudad fuerte. |
| A1 | Santa Marta | 945 | Mantener | Demanda suficiente y dato propio turístico. |
| A2 | Cartagena | 1.883 | Mantener | Demanda de ciudad clara. |
| A3 | Aeropuerto o ciudad | 607 | **Subir** | 195 conversaciones y 1.480 impresiones combinadas de aeropuerto. |
| B0 | Cali | 1.129 | Mantener | Demanda propia en la marca y prioridad comercial del plan. |
| B1 | Cuántos días alquilar | 749 | **Subir** | 1.511 impresiones combinadas y 39 conversaciones. |
| B2 | Palmira | 38 | Mantener en cola | Las 140 reservas del diseño la sostienen; GSC en Alquílame aún es débil. |
| C0 | Visitante extranjero en Colombia | 788 | **Subir** | 856 impresiones combinadas y 6 clics; ángulo extranjero, no dialectal. |
| C1 | Licencia extranjera | 0 | Mantener | 72 conversaciones documentales; valor de conversión, no SEO actual. |
| C2 | Requisitos para extranjero | 236 | Mantener | Cierra el silo C. No usar las 773 dudas generales como si todas fueran de extranjeros. |
| D0 | Pereira | 714 | Mantener | Demanda de ciudad y datos de estadía propios. |
| D1 | Rutas del Eje Cafetero | 0 en Alquílame; 3 combinadas | **Bajar** | El post vivo de ATC ya cubre Eje Cafetero; riesgo de convergencia. |
| K0 | Puentes/temporada alta | 0 en esta ventana | Mantener condicionado | El diseño aporta búsquedas internas futuras; GSC no lo confirma todavía. |
| K1 | Evento por definir | 0 | Condicionar | Solo publicar si el agregado mensual demuestra evento y con antelación suficiente. |
| E0 | Villavicencio | 4.109 | Mantener | Demanda de ciudad fuerte. |
| E1 | Ibagué | 3.605 | Mantener | Demanda de ciudad fuerte. |
| E2 | Hoy para hoy | 0 | **Subir para conversión** | 318 conversaciones de disponibilidad; no venderlo como apuesta de tráfico. |
| E3 | Neiva | 2.398 | Mantener | Demanda de ciudad fuerte. |
| F0 | Armenia | 5.152 | Mantener | Mayor demanda de ciudad de este bloque en ATC. |
| F1 | Manizales | 3.514 | Mantener | Demanda de ciudad fuerte. |
| F2 | Anticipación según ciudad | 0 | **Bajar/reformular** | La idea se apoya en operación, pero no aparece en preguntas ni GSC como tema explícito. Integrar con disponibilidad. |
| G0 | Cúcuta | 2.737 | Mantener | Demanda de ciudad clara. |
| G1 | Bucaramanga | 1.406 | Mantener | Demanda de ciudad clara. |
| G2 | Valledupar | 2.250 | Mantener | Demanda de ciudad clara. |
| H0 | Bogotá | 3.005 | **Subir** | Principal mercado propio; 12.621 impresiones combinadas. |
| H1 | Pico y placa en Bogotá | 387 del tema; 1 de Bogotá | **Bajar y reformular** | 35 conversaciones, pero GSC es tráfico cívico de otras ciudades. Enfocar solo al arrendatario. |
| H2 | El Dorado y sedes | 873 | **Subir** | Aeropuerto es alto/alto y sede suma 212 conversaciones. |
| J0 | Barranquilla | 6.674 | **Subir** | Mayor demanda de ciudad asignada a ATC. |
| J1 | Soledad | 63 | **Reemplazar** | 59 reservas, bajo el piso del diseño, y GSC mínimo. Es el espacio más débil. |
| L0 | Puentes por ciudad | 0 en esta ventana | Mantener condicionado | Tiene evidencia de búsqueda interna del diseño; no de GSC. |
| L1 | Evento por definir | 0 | Condicionar/reasignar | Si no aparece evidencia mensual, usar el espacio para un hueco de clientes. |

**Consulta:** Q-GSC por propiedad y ciudad/tema + Q-TAX + datos propios ya documentados en `docs/specs/2026-07-29-parrilla-blog-design.md`. La decisión es la regla editorial declarada: mantener ciudad con demanda o dato propio; subir alto/alto; bajar intención fría o sin señal; reemplazar solo cuando fallan ambas y también el piso de reservas.

Resultado: **24 espacios se mantienen o suben**, Palmira queda en cola, 3 bajan o se reformulan, 2 eventos quedan condicionados y Soledad se reemplaza. No se desmonta la arquitectura.

### 5.2 No duplicar lo que ya está vivo

La demanda más grande coincide con tres artículos ya publicados en AlquilaTuCarro. Antes de crear títulos nuevos hay que usarlos como pilares y comprobar sus huecos.

| Artículo vivo | Cobertura verificada por encabezados | Hueco que muestran las preguntas |
|---|---|---|
| Requisitos para alquilar un carro en Colombia | Documento, licencia, tarjeta y una FAQ breve de seguro/otra ciudad | No tiene depósito, cupo, garantía, titularidad ni deducible. |
| Precios de alquiler de carros en Colombia | Precio por ciudad, incluidos, adicionales, duración y FAQ de cargos | Debe alinearse con la cotización real y explicar por qué web/cotización pueden cambiar; no crear otro pilar de precio. |
| Tipos de carros para alquilar | Compacto, sedán, SUV, 4x4 y van según viaje | No explica que se reserva por gama, no por modelo, ni automático vs. mecánico. |

**Consulta:** Q-BLOG; la cobertura se obtuvo de los encabezados y de presencia de los conceptos en `body`.

### 5.3 Silos y piezas que faltan

Sí hace falta ampliar el mapa, pero usando los posts vivos como pilares para cumplir la regla “un artículo, un dominio”. La mayoría del volumen corresponde a AlquilaTuCarro, así que no debe duplicarse en Alquílame.

| Silo propuesto | Pilar que ya existe | Pieza nueva o cambio | Evidencia |
|---|---|---|---|
| **M. Condiciones antes de reservar** | Requisitos + precios, ambos vivos en ATC | M1: seguro básico, total, coberturas y deducible | 57 conversaciones; 51 en WhatsApp; fricción fuerte en 3/6 chats; 0 GSC. |
| **M. Condiciones antes de reservar** | Requisitos vivo | M2: tarjeta, titular, cupo, depósito y garantía —sin apuntar a “sin tarjeta” | 239 de tarjeta, 119 de garantía y 58 de titularidad; el post vivo no cubre cupo/depósito. |
| **N. Elegir el vehículo** | Tipos de carros vivo en ATC | Añadir o crear satélite claramente distinto: gama vs. modelo; automático vs. mecánico | 762 conversaciones; 557 sobre transmisión y 103 sobre modelo/marca. |
| **Recogida y devolución** | A3 y H2 planeados | Integrar horarios por sede; mantener otra ciudad como FAQ, no como artículo autónomo | 122 conversaciones de horarios, 212 de sede, 195 de aeropuerto; solo 13 de otra ciudad y 11 impresiones. |

**Consulta:** Q-TAX + Q-FRICTION + Q-GSC + Q-BLOG. Los subgrupos de vehículo provienen de Q-SUB, definida en la sección 6.

Asignación concreta: usar **J1** para M1 porque Soledad es el único descarte claro; usar **L1** para M2 si el respaldo mensual no encuentra un evento; tratar N como actualización/satélite del artículo vivo para evitar otro pilar genérico. A3 y H2 deben contener horarios y sede. La FAQ existente de requisitos puede absorber la política exacta de devolución en otra ciudad.

Lista negra: las 8 conversaciones de carga/mudanza, 6 de apps y 3 de conductor son información comercial útil, no oportunidades editoriales. Transporte público/escolar tuvo cero conversaciones. La FAQ ya posicionada de “sin tarjeta” se conserva y no se expande.

## 6. Tres temas grandes: de una pregunta salen varios títulos

Todas las preguntas de origen están **reescritas y anonimizadas**. Conservan la intención observada, no las palabras literales ni datos de la persona. Los subgrupos se solapan: una conversación puede preguntar total, seguro y precio diario a la vez.
En requisitos, “checklist general” es una etiqueta y las demás filas son etiquetas hermanas de la familia de elegibilidad; no tienen que ser subconjuntos del checklist.

**Q-SUB — cálculo de subgrupos**

```text
para precio y vehículo: filtrar mensajes ya asignados al tema principal
para requisitos: reunir las etiquetas de la familia de elegibilidad
aplicar reglas de significado específicas de cada subpregunta
contar menciones y conversaciones distintas
```

### 6.1 Requisitos — 773 conversaciones

| Subpregunta | Conversaciones | Pregunta real reescrita | Título que produce | Tratamiento |
|---|---:|---|---|---|
| Checklist general | 773 | “¿Qué necesito para poder alquilar?” | **Requisitos para alquilar un carro en Colombia: checklist actualizado** | Ya existe: actualizar, no duplicar. |
| Tarjeta y forma de pago | 239 | “¿Qué tarjeta aceptan y cuándo se paga?” | **Tarjeta de crédito para alquilar carro: requisitos, pago y límites** | Integrar en M2; no apuntar a “sin tarjeta”. |
| Depósito, cupo y garantía | 119 | “¿Retienen dinero y cuánto cupo necesito?” | **Cupo, depósito y garantía al alquilar un carro: qué bloquean y cuándo** | Nuevo satélite M2 o sección sustancial. |
| Documentos/licencia extranjera | 72 | “¿Me sirve una licencia de otro país y qué documentos llevo?” | **Licencia extranjera para alquilar carro en Colombia: documentos válidos** | C1, ya planeado. |
| Titular de tarjeta vs. conductor | 58 | “¿La tarjeta puede ser de otra persona?” | **¿La tarjeta y la licencia deben estar a nombre de la misma persona?** | Sección de M2; artículo solo si la investigación amplía el caso. |
| Edad mínima | 6 | “¿Puedo alquilar con mi edad?” | **Edad mínima para alquilar un carro: qué cambia según la rentadora** | FAQ; volumen insuficiente para artículo propio. |

**Consulta:** Q-SUB sobre Q-TAX. El checklist general incluye 654 conversaciones iniciadas con mensaje prellenado de WhatsApp.

La intuición del dueño queda probada, con un matiz: no son seis artículos automáticos. Son seis decisiones distintas; algunas merecen satélite, otras actualización o FAQ para no generar contenido a escala redundante.

### 6.2 Vehículo, gama o modelo — 762 conversaciones

| Subpregunta | Conversaciones | Pregunta real reescrita | Título que produce | Tratamiento |
|---|---:|---|---|---|
| Automático vs. mecánico | 557 | “¿Tienen automático y cuánto cambia frente al mecánico?” | **Carro automático o mecánico para alquilar: diferencias, disponibilidad y precio** | Satélite N o sección amplia del post vivo. |
| Modelo o marca exactos | 103 | “¿Puedo reservar ese modelo específico?” | **¿Se reserva un modelo o una gama? Así se asigna el carro al recoger** | Prioridad alta para bot y artículo distinto. |
| Camioneta/SUV | 94 | “¿Qué camioneta tienen para este viaje?” | **SUV o camioneta de alquiler: cuál gama elegir según pasajeros y ruta** | Actualizar el post vivo; evitar duplicar su guía genérica. |
| Siete puestos/capacidad | 39 | “Somos siete, ¿qué vehículo nos sirve con equipaje?” | **Alquiler de carros de 7 puestos: capacidad real, equipaje y gamas** | Satélite posible después de validar flota. |
| Híbrido/eléctrico/diésel | 8 | “¿Hay vehículos híbridos o eléctricos?” | **¿Hay carros híbridos o eléctricos para alquilar?** | FAQ/inventario; no artículo todavía. |

**Consulta:** Q-SUB sobre Q-TAX. Los patrones específicos cuentan intención dentro de mensajes ya clasificados en vehículo.

### 6.3 Precio o cotización — 755 conversaciones

| Subpregunta | Conversaciones | Pregunta real reescrita | Título que produce | Tratamiento |
|---|---:|---|---|---|
| Web vs. cotización | 143 | “¿El valor de la página es el mismo que me están cotizando?” | **Precio web vs. cotización final: por qué puede cambiar el alquiler** | Actualizar el pilar vivo; no crear otro pilar. |
| Total, incluidos e impuestos | 132 | “¿Ese es el total con IVA, seguro y adicionales?” | **Qué incluye el precio de alquilar un carro y qué se cobra aparte** | Rehacer sección del pilar y enlazar M1. |
| Económico/descuentos | 78 | “¿Cuál es la opción más económica y hay descuento?” | **Cómo conseguir la tarifa más baja sin perder cobertura ni disponibilidad** | Sección basada en datos propios; evitar promesas de descuento. |
| Precio por día | 67 | “¿Ese valor es diario o por todo el alquiler?” | **Cómo se calcula un día de alquiler: 24 horas, horarios y días adicionales** | Conectar con B1 y horarios. |
| Semana o mes | 19 | “¿Cuánto cambia si alquilo por semana o por mes?” | **Alquiler por día, semana o mes: cómo comparar el costo total** | B1 puede absorberlo; volumen bajo para otro artículo. |

**Consulta:** Q-SUB sobre Q-TAX. Los subgrupos no son excluyentes.

## 7. Lo que no se pudo verificar

1. No se pudo identificar con certeza el origen del lote del 13-14 de julio. Los campos dicen producción/no test, pero su comportamiento es de evaluación. Se excluyó y se documentó la decisión.
2. No se puede deduplicar a una misma persona entre chat y WhatsApp sin usar identificadores personales. Por privacidad, no se intentó.
3. Las ciudades de WhatsApp son menciones en la conversación, no domicilio ni ciudad detectada. En otra ciudad, precisamente, una conversación cuenta para más de una.
4. No se midió un intervalo de confianza ni acuerdo entre anotadores. Hubo revisión manual, pero no una segunda codificación independiente.
5. Search Console mide impresiones de las dos propiedades, no volumen total del mercado. Cero no significa ausencia de búsquedas.
6. No se pudo atribuir una reserva de WhatsApp a una pregunta concreta ni demostrar que una respuesta del bot causó el abandono. Por eso el informe habla de asociación y señales, no causalidad.
7. La calidad del bot para devolución en otra ciudad no se pudo medir con clientes limpios: los casos verificados están en WhatsApp. La inconsistencia se observó en el lote de QA excluido.
8. No se verificaron precios, deducibles, coberturas ni política operativa vigente. Los títulos propuestos describen preguntas que hay que responder; la investigación de negocio debe fijar la respuesta antes de publicar.
9. No se auditó en profundidad la exactitud factual de los 16 artículos vivos. Solo se verificaron títulos, encabezados y presencia de conceptos en los tres posts que podían canibalizar los temas nuevos.
10. GA4 no se intentó, siguiendo la instrucción expresa de que el scope está bloqueado.

## Decisión final

La parrilla conserva su columna vertebral de ciudades. El ajuste no es reemplazarla por 31 FAQs, sino conectar tres clases de demanda:

- adquisición: ciudad, precio, vehículo y aeropuerto;
- conversión: requisitos, disponibilidad, sede, horarios, depósito y seguro;
- soporte: cambios, combustible y devolución en otra ciudad.

La acción editorial más urgente es crear la pieza de **seguro básico vs. total, coberturas y deducible**, asignarla a AlquilaTuCarro y usarla también como fuente de conocimiento del bot. La segunda es cubrir **tarjeta, titular, cupo y garantía** sin perseguir “sin tarjeta”. La tercera es corregir el vacío entre **gama y modelo** en el artículo vivo de tipos de carro y en las respuestas del bot.

La devolución en otra ciudad necesita una política clara y una FAQ exacta, no un silo SEO: hay 13 conversaciones y 11 impresiones, no 563 preguntas verificadas.
