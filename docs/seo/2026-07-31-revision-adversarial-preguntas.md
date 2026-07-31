# Revisión adversarial del informe de preguntas de clientes

- **Fecha de la revisión:** 2026-07-31
- **Informe atacado:** `docs/seo/2026-07-31-preguntas-de-clientes.md`
- **Parrilla contrastada:** `docs/specs/2026-07-29-parrilla-blog-design.md`

## Veredicto en una frase

**No se debe reordenar meses de trabajo con el informe tal como está: el universo depurado y la dirección general de ciudades/precio/vehículo aguantan, pero los conteos semánticos no son reproducibles, “requisitos” está dominado por un texto automático y la “fricción por tema” atribuye fallas de toda la conversación a temas que quizá no las causaron.**

Esto no significa desecharlo. Sirve como señal direccional y como lista de hipótesis. No sirve como censo ni como ranking fino de prioridades editoriales hasta publicar el clasificador, volver a etiquetar una muestra y corregir la atribución de fricción.

## Escala de veredictos

- **Reproducida:** obtuve el mismo resultado o una diferencia explicada y materialmente irrelevante.
- **No reproducida / no probada:** la afirmación puede ser cierta, pero faltan código, reglas o asignaciones para comprobarla.
- **Falsa:** los datos consultados contradicen la cifra o la inferencia.

Todas las consultas a las dos bases fueron lecturas. Los números de las líneas se usaron solo en memoria para resolver las tres sesiones vigentes; no se copiaron al informe ni se guardaron teléfonos, nombres, documentos, correos o identificadores de clientes. La muestra manual se revisó con los posibles datos personales sustituidos antes de verla.

## 1. Resultado por afirmación grande

| Afirmación del informe | Veredicto | Salida independiente | Consecuencia |
|---|---|---|---|
| El corte útil es 1.668 mensajes/335 chats web + 12.909/1.619 de WhatsApp | **Reproducida** | Web: 1.668/335 después de las exclusiones declaradas. WhatsApp: 12.909/1.619 en tres sesiones vigentes. | El universo principal no está inventado. |
| La diferencia frente a 4.735 mensajes/1.143 chats web tiene explicación | **Reproducida** | 692 mensajes/150 chats son de `alquicarros`; 2.375 mensajes/661 chats son del 13–14 de julio. Quedan 1.668/335. | No hubo un descarte silencioso adicional. |
| El 13–14 de julio es un lote anómalo | **Reproducida** | 661 conversaciones, todas `open`, cero cotizadas/reservadas; 606 tienen secuencia normalizada duplicada en el mismo día. | Excluirlo es razonable. Persisten cinco conversaciones duplicadas fuera del lote. |
| Las tres sesiones de WhatsApp corresponden a las líneas vigentes | **Reproducida** | Una sesión coincide con la línea configurada de Alquílame y dos con la de AlquilaTuCarro. | El corte de WhatsApp es defendible. |
| Los tres temas principales son requisitos 773, vehículo 762 y precio 755 | **No reproducida** | Mi taxonomía transparente dio 776, 842 y 800, respectivamente, y cambió el orden a vehículo, precio, requisitos. | La dirección “vehículo y precio son grandes” aguanta; los números y el puesto de requisitos no. |
| 654 conversaciones empiezan con texto prellenado de requisitos | **Parcialmente reproducida** | El texto existe en código y en datos. Conté 643 con criterio estricto de plantilla y 657 con criterio amplio; el informe no define la frontera que produce 654. | La salvedad es obligatoria; el exacto 654 queda no probado. |
| Fricción: vehículo 59/106 y precio 56/110 | **No reproducida** | Mi reconstrucción dio 70/117 y 60/116. El conjunto original de casos no está publicado. | No usar 55,7% y 50,9% como tasas de falla del tema. |
| Search Console devolvió 3.121 + 2.741 filas, 116.278 impresiones y 1.329 clics | **Reproducida exactamente** | Mismos seis valores por propiedad y combinados. | El universo de GSC es correcto. |
| Tarjeta tiene 1.420 impresiones y 1.388 son “sin tarjeta” | **No reproducida; falsa en lectura literal** | Las consultas que contienen `tarjeta` suman 1.388 impresiones; 1.387 contienen `sin tarjeta`; queda una impresión no vetada. No apareció ninguna consulta adicional de pago/crédito sin `tarjeta`. | La cifra está mal, pero la conclusión del veto sobrevive aún más fuerte: 99,9% de la señal literal es la variante vetada. |
| Precio, vehículo y aeropuerto son altos en clientes y GSC | **Reproducida en dirección, no en cifras exactas** | Mi diccionario: precio 800 conversaciones/2.269 impresiones; vehículo 842/995; aeropuerto 221/1.509. Los tres superan holgadamente los umbrales del informe. | El cuadrante alto/alto sobrevive. |
| Conservar la columna vertebral de ciudades | **Reproducida en dirección** | Todas las ciudades conservadas, salvo el caso explícito de Palmira en cola, muestran cientos o miles de impresiones en la propiedad asignada. | No hay base para desmontar los pilares de ciudad. |
| Reemplazar Soledad | **Reproducida, con dato de reservas mal acotado** | Soledad tiene 21 reservas en AlquilaTuCarro, 45 entre las dos marcas del alcance y 59 solo al sumar 14 de Alquicarros. | Reemplazarla sí se sigue de los datos; el “59” usó una tercera marca fuera de alcance. |

## 2. Consultas ejecutadas y salidas

### 2.1 Universo web y explicación de 4.735 → 1.668

Se ejecutaron estos GET de PostgREST con credencial de servicio solo para lectura:

```http
GET /rest/v1/chat_conversations
  ?select=id,brand,status,review_label,created_at,is_test,environment
  &is_test=eq.false

GET /rest/v1/chat_messages
  ?select=id,conversation_id,role,content,created_at
```

Después se aplicó localmente texto no vacío, `role='user'`, las dos marcas del alcance y la exclusión por fecha declarada por el informe. La salida fue:

| Paso | Mensajes de usuario con texto | Conversaciones con texto |
|---|---:|---:|
| Solo `is_test=false`, todas las marcas | 4.735 | 1.143 |
| Solo Alquílame + AlquilaTuCarro | 4.043 | 993 |
| Lote 13–14 julio que se retira | -2.375 | -661 |
| **Resultado** | **1.668** | **335** |

El descarte de 692 mensajes/150 conversaciones intermedio es enteramente `alquicarros`, fuera del alcance declarado. La gran diferencia restante es el lote anómalo, no `environment` ni otro filtro oculto.

El informe dice que el archivo analítico cerró a las 04:02 UTC, pero su 1.668 incluye un mensaje de las 04:02:07. Con corte estricto `<= 04:02:00` salen 1.667. Es una inconsistencia de siete segundos, no un problema material, pero la consulta publicada no fija hora final y por tanto no puede regenerar el snapshot meses después.

### 2.2 Comprobación del lote anómalo

Algoritmo ejecutado:

```text
por conversación:
  fingerprint = unir(normalizar(mensajes de usuario ordenados))
por fecha UTC + fingerprint:
  marcar las conversaciones si longitud >= 30 y el grupo tiene >= 2
```

Salida:

```text
13–14 julio: 661 conversaciones
estado open: 661
cotizadas/reservadas: 0
con fingerprint duplicado: 606, en 106 grupos
fuera de esas fechas con fingerprint duplicado: 5, en 2 grupos
```

La exclusión grande aguanta. Lo que no aguanta es llamar completamente “limpio” al resto: en la muestra aleatoria apareció además una instrucción con redacción sintética para crear una reserva duplicada, y los cinco duplicados residuales no se retiraron.

### 2.3 Universo de WhatsApp

Las tres sesiones se resolvieron comparando, en memoria, la línea de `sessions` contra los números configurados por las dos marcas. No se imprimieron ni persistieron esos valores.

```http
GET /rest/v1/sessions?select=id,phone_number,status,created_at

GET /rest/v1/messages
  ?select=id,session_id,contact_id,direction,text,sent_at
  &session_id=in.(:tres_sesiones_vigentes)
```

Filtro local:

```text
direction = inbound
sent_at >= 2026-06-21T00:00:00Z
sent_at <= 2026-07-31T04:02:00Z
conversación publicada = session_id + contact_id
```

Salida exacta:

```text
mensajes inbound: 12.909
unidades contact_id + session_id: 1.619
AlquilaTuCarro: 10.167 mensajes / 1.247 unidades
Alquílame:       2.742 mensajes /   372 unidades
```

“Unidad contacto-sesión” no es necesariamente una conversación. Separando episodios del mismo contacto aparecen 1.658 hilos con una pausa de siete días y 1.804 con una pausa de 24 horas. El informe subcuenta episodios recurrentes en 2,4%–11,4%, según la frontera elegida.

### 2.4 Taxonomía independiente

Mi réplica no usó el clasificador del informe. Normalicé tildes, enlaces y números; apliqué reglas multietiqueta explícitas de acción + entidad por mensaje; luego conté conversaciones distintas. Algunos ejemplos de las reglas:

```text
requisitos  := requisito | qué necesito | qué piden para alquilar | condiciones para alquilar
vehículo    := automático | mecánico | gama | modelo | camioneta | capacidad | pasajeros
precio      := precio | valor | costo | cotización | tarifa | cuánto cuesta | total | descuento
aeropuerto  := aeropuerto | vuelo | El Dorado | terminal aérea nombrada
seguro      := seguro | cobertura | deducible | protección básica/total
```

Esta réplica es más fácil de auditar que la del informe, pero no pretende ser verdad censal. Su propia muestra manual demuestra que también se equivoca.

| Tema | Informe | Réplica independiente | Diferencia |
|---|---:|---:|---:|
| Requisitos | 773 | 776 | +3 (+0,4%) |
| Vehículo/gama/modelo | 762 | 842 | +80 (+10,5%) |
| Precio/cotización | 755 | 800 | +45 (+6,0%) |
| Disponibilidad | 318 | 276 | -42 (-13,2%) |
| Tarjeta/pago | 239 | 270 | +31 (+13,0%) |
| Sede/ubicación | 212 | 252 | +40 (+18,9%) |
| Aeropuerto/vuelo | 195 | 221 | +26 (+13,3%) |
| Horarios | 122 | 186 | +64 (+52,5%) |
| Depósito/cupo/garantía | 119 | 103 | -16 (-13,4%) |
| Cambios/cancelación | 98 | 97 | -1 (-1,0%) |
| Documentos/licencia | 72 | 104 | +32 (+44,4%) |
| Seguro/coberturas | 57 | 84 | +27 (+47,4%) |

Varias diferencias tienen explicación semántica, no necesariamente un “ganador”. Mi regla de horarios captura mensajes rutinarios de hora que el informe intentó excluir; mi regla de vehículo incluye capacidad y catálogo de forma más amplia. Ese es precisamente el problema: sin el código y las asignaciones del informe, 762 y 755 no son cifras auditables.

El informe publica `Q-TAX` como una consulta sobre `coded_mentions`, pero esa estructura existió solo en memoria. No publica:

- las reglas completas;
- los ejemplos positivos y negativos;
- el orden de aplicación;
- las asignaciones mensaje → etiqueta;
- el código que crea `coded_mentions`;
- una semilla o archivo de salida congelado.

Por tanto, su frase “estimaciones reproducibles” es falsa en el estado actual del entregable.

### 2.5 Muestra aleatoria de 30 mensajes

Tomé 30 mensajes del universo combinado con orden por `SHA-256('revision-adversarial-2026-07-31-v1:' + id)`: 25 de WhatsApp y 5 del chat. Se ocultó cualquier dato potencialmente personal antes de la revisión.

Resultado manual:

```text
mensajes sin intención editorial identificable por sí solos: 15/30
mensajes con tema clasificable:                         15/30
mensajes donde mi réplica perdió al menos una etiqueta:  6/30
tasa de error de mi réplica sobre los 30:                 20,0%
tasa sobre los 15 mensajes temáticos:                     40,0%
mensaje con apariencia sintética residual:                 1/30
```

Las seis discrepancias fueron: duración expresada como “24 horas”, dos preguntas de ubicación formuladas sin la palabra “sede”, una solicitud de imágenes de vehículos, una duda sobre firma/contrato y una duda que combinaba precio con duración.

**La tasa de error de la taxonomía original no se puede calcular.** El informe no dejó las etiquetas originales para esos 30 mensajes. Afirmar que mi 20% es su error sería inventar. El hallazgo correcto es **NO PROBADO**: la validación pedida es imposible con el artefacto entregado.

La muestra y un barrido adicional sí encontraron dos temas omitidos o escondidos dentro de categorías mayores:

- fotos/catálogo del vehículo: 47 conversaciones independientes;
- contrato/firma: 11 conversaciones.

El primero queda justo por debajo del umbral de 50 que el propio informe usa para “preguntan mucho” y es relevante para producto/bot aunque quizá no merezca artículo autónomo.

## 3. La salvedad del prellenado

### Existe y no es una pregunta espontánea

El plugin `packages/ui-alquilatucarro/app/plugins/wa-message.client.ts` reescribe cualquier enlace de contacto de esa marca, justo antes de abrir WhatsApp, con un texto equivalente a:

> El visitante vio la página de alquiler de carros, opcionalmente en una ciudad, y quiere conocer los requisitos.

No es un botón específico de “ver requisitos”. Es el mensaje por defecto del enlace general de contacto. Por eso, enviarlo prueba que la persona entró a WhatsApp y pulsó enviar; no prueba que requisitos fuera su duda original ni que eligiera ese tema entre alternativas.

Conteos:

```text
criterio estricto de plantilla pura: 643 primeras intervenciones
criterio amplio de texto prellenado: 657 primeras intervenciones
afirmación del informe:              654
```

El 654 cae dentro de una frontera razonable —hay textos editados o ampliados—, pero esa frontera no está publicada. Veredicto: existencia **reproducida**; exacto **no reproducido**.

### Cómo cambia la conclusión

En la propia aritmética del informe, 773 - 654 = **119** conversaciones de requisitos que no empiezan con el prellenado. En mi clasificación, ignorar las señales que son solo plantilla deja aproximadamente **145**, no 776. Requisitos deja de ser el tema número uno y cae muy por debajo de vehículo y precio.

La distorsión además es de marca:

```text
Alquílame WhatsApp:       35/372 con requisitos =  9,4%
AlquilaTuCarro WhatsApp: 730/1.247              = 58,5%
```

El titular correcto no es “requisitos es la mayor pregunta de los clientes”. Es “el enlace general de WhatsApp de AlquilaTuCarro inicia con requisitos y luego ese flujo comercial genera muchas conversaciones”. Eso sí puede justificar mejorar onboarding, pero no demuestra demanda editorial espontánea.

### ¿La salvedad se aplicó a los demás temas?

No en el informe. En mi cohorte estricta de 643 prellenados, las conversaciones posteriores también tocaron:

| Tema posterior | Conversaciones del cohorte |
|---|---:|
| Vehículo | 294 |
| Precio | 264 |
| Disponibilidad | 122 |
| Tarjeta/pago | 111 |
| Aeropuerto | 69 |
| Seguro | 29 |

No se deben restar automáticamente: esos temas aparecen después y pueden ser preguntas comerciales reales. Pero sí se necesita una sensibilidad “con cohorte / sin cohorte”, porque 41% de mis conversaciones de vehículo y 39% de precio en WhatsApp vienen de ese mismo canal prellenado. El informe solo hace la corrección narrativa para requisitos; no muestra cuánto dependen los demás rankings del canal y la marca.

## 4. Fricción del bot

### La definición publicada no permite reproducir 59 y 56

El informe define:

```text
repregunta = mismo tema después de una respuesta
sin_respuesta = última intervención temática sin respuesta
revision = review_label en bad/improvable
fricción = unión de las tres
```

Faltan la función de igualdad temática, la ventana entre turnos, el tratamiento de respuestas citadas, los IDs resultantes y el código. Con mis reglas explícitas obtuve:

| Tema | Chats con tema | Repregunta | Sin respuesta | `bad`/`improvable` | Unión |
|---|---:|---:|---:|---:|---:|
| Vehículo | 117 | 39 | 11 | 38 | 70 |
| Precio | 116 | 32 | 9 | 32 | 60 |

No reproduce 106/59 ni 110/56. Eso no prueba que el informe sea falso; prueba que no dejó lo necesario para verificarlo.

### La etiqueta global infla la fricción específica

`review_label` califica la conversación completa. `Q-CHAT` ni siquiera selecciona `review_note`, que es donde se explica la causa humana de la mala revisión. Después, `Q-FRICTION` adjudica esa etiqueta a cada tema presente.

Con los propios números publicados:

- vehículo: como repregunta + sin respuesta cubren a lo sumo 44 casos, **al menos 15 de 59** entran únicamente por la etiqueta global;
- precio: cubren a lo sumo 35, así que **al menos 21 de 56** entran únicamente por la etiqueta global.

Son mínimos; los solapamientos pueden elevarlos. En al menos 25% de vehículo y 37,5% de precio, el informe no demuestra una falla sobre ese tema concreto.

### Muestra cualitativa

Revisé 12 conversaciones de la reconstrucción marcada, seis de vehículo y seis de precio, con textos anonimizados. Juicio manual:

```text
fricción clara y específica del tema marcado: 5/12
fricción real, pero causada por otro tema:      4/12
progreso normal de cotización/reserva:          3/12
```

Los falsos positivos típicos fueron:

- el cliente confirma la misma gama varias veces mientras avanza una reserva que termina bien;
- cambia de seis a cinco pasajeros o de cuatro días a uno, y la repetición refleja requisitos nuevos;
- la conversación tiene una mala revisión por horario o disponibilidad y esa etiqueta se imputa también a precio/vehículo.

Sí encontré fricción real: preguntas de vehículo que quedan sin responder, una gama ya escogida que el bot vuelve a pedir y un total calculado para una duración distinta. El problema existe; lo que no aguanta es el porcentaje por tema.

### Seguro como “acción editorial más urgente”

No se sigue de los datos. Incluso aceptando 57 conversaciones, hay cero señal GSC y la tasa 3/6 depende de una muestra mínima y del mismo método de fricción defectuoso. Que 51 conversaciones lleguen a asesor tampoco demuestra falla: el handoff puede ser la respuesta correcta para coberturas y deducibles.

Una guía de seguro es una hipótesis razonable de soporte y bot. Llamarla la acción editorial número uno por encima de vehículo, precio, sedes o depósito es criterio editorial no medido.

## 5. Search Console

### Consulta reproducida

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

Salida:

| Propiedad | Filas | Impresiones | Clics |
|---|---:|---:|---:|
| `sc-domain:alquilame.co` | 3.121 | 52.904 | 610 |
| `sc-domain:alquilatucarro.com` | 2.741 | 63.374 | 719 |
| **Total** | **5.862** | **116.278** | **1.329** |

Esta parte coincide exactamente.

### Tarjeta

Después de descargar todas las filas, ejecuté:

```text
tarjeta := consulta normalizada contiene palabra completa tarjeta/tarjetas
veto    := tarjeta y contiene sin tarjeta
```

Salida:

```text
tarjeta:       50 filas, 1.388 impresiones, 10 clics
sin tarjeta:   49 filas, 1.387 impresiones, 10 clics
no vetada:      1 fila,      1 impresión,  0 clics
```

Amplié la búsqueda a pago, pagar, efectivo, débito, crédito, cuotas, método, medio y forma de pago. No apareció ninguna fila adicional sin la palabra `tarjeta`. No pude encontrar las 32 impresiones que llevan de 1.388 a 1.420 ni la impresión que lleva el veto de 1.387 a 1.388.

Por tanto:

- **la cifra 1.420/1.388 no se reproduce**;
- **la decisión de no crear contenido nuevo para “sin tarjeta” sí se sostiene**, y con una proporción más extrema que la publicada.

### Precio, vehículo y aeropuerto

El diccionario GSC del informe tampoco está publicado. Con reglas independientes más estrechas obtuve:

| Tema | Informe: impresiones | Réplica: impresiones | Umbral alto del informe |
|---|---:|---:|---:|
| Precio | 3.277 | 2.269 | 500 |
| Vehículo | 1.293 | 995 | 500 |
| Aeropuerto | 1.480 | 1.509 | 500 |

Los números exactos no son reproducibles, pero ninguna diferencia cambia el cuadrante. Los tres siguen altos en clientes y GSC.

### Ciudades

Mi conteo literal por ciudad es normalmente mayor que el del informe porque este aplicó un diccionario de “alquiler por ciudad” que no publicó. Aun así, la ordenación es estable: en la propiedad asignada, todas las ciudades conservadas de la tanda tienen cientos o miles de impresiones; Palmira queda deliberadamente aparte con 38 en Alquílame.

Esto respalda conservar la columna vertebral, no los valores exactos de cada fila.

## 6. Las 31 recomendaciones, una por una

“Sí” significa que la acción se sigue de los datos presentados o de mi réplica. “Parcial” significa que necesita una inferencia editorial adicional. “No probada” significa que la evidencia citada no mide el artículo propuesto.

| ID | Acción del informe | Auditoría | Juicio |
|---|---|---|---|
| A0 | Mantener Medellín | Miles de impresiones en la propiedad asignada y datos propios. | **Sí** |
| A1 | Mantener Santa Marta | Señal GSC clara y base operativa turística. | **Sí** |
| A2 | Mantener Cartagena | Señal de ciudad clara. | **Sí** |
| A3 | Subir aeropuerto vs. ciudad | Aeropuerto queda alto/alto con ambos diccionarios. | **Sí** |
| B0 | Mantener Cali | Demanda GSC y prioridad comercial previa. | **Sí** |
| B1 | Subir cuántos días | Duración aparece en clientes y GSC; el ángulo exacto necesita investigación. | **Sí, con ángulo por validar** |
| B2 | Palmira en cola | Reproduje 140 reservas de Alquílame y 38 impresiones en esa propiedad. | **Sí** |
| C0 | Subir visitante extranjero | El informe muestra señal internacional, pero el cambio de “coches” a “extranjero” añade criterio. | **Parcial** |
| C1 | Mantener licencia extranjera | Usa 72 casos mezclando documentos domésticos y licencia extranjera; GSC es cero. No publica cuántos son realmente extranjeros. | **No probada** |
| C2 | Mantener requisitos para extranjero | Las 773 dudas generales no son extranjeras; 236 impresiones y cierre de silo dan apoyo débil. | **Parcial** |
| D0 | Mantener Pereira | Demanda de ciudad y dato propio. | **Sí** |
| D1 | Bajar rutas Eje Cafetero | Cero señal en la marca y contenido vivo equivalente en la otra. | **Sí** |
| K0 | Puentes/temporada condicionado | Se apoya en búsquedas internas del diseño, no en este análisis. La condición evita sobreafirmar. | **Parcial/condicionado** |
| K1 | Evento solo con evidencia | No elige un artículo; fija una puerta de decisión razonable. | **Sí como regla, no como prioridad** |
| E0 | Mantener Villavicencio | Demanda de ciudad fuerte. | **Sí** |
| E1 | Mantener Ibagué | Demanda de ciudad fuerte. | **Sí** |
| E2 | Subir hoy para hoy | Disponibilidad sigue siendo grande en mi réplica; es contenido de conversión, no de tráfico. | **Sí** |
| E3 | Mantener Neiva | Demanda de ciudad fuerte. | **Sí** |
| F0 | Mantener Armenia | Demanda de ciudad fuerte. | **Sí** |
| F1 | Mantener Manizales | Demanda de ciudad fuerte. | **Sí** |
| F2 | Bajar/reformular anticipación | No aparece como pregunta explícita ni como grupo GSC; integrarlo con disponibilidad es coherente. | **Sí** |
| G0 | Mantener Cúcuta | Demanda de ciudad clara. | **Sí** |
| G1 | Mantener Bucaramanga | Demanda de ciudad clara. | **Sí** |
| G2 | Mantener Valledupar | Demanda de ciudad clara. | **Sí** |
| H0 | Subir Bogotá | Mercado y demanda orgánica grandes. | **Sí** |
| H1 | Bajar/reformular pico y placa | La señal publicada es cívica y casi nada corresponde a Bogotá arrendatario. | **Sí** |
| H2 | Subir El Dorado/sedes | Aeropuerto y ubicación tienen señal robusta. | **Sí** |
| J0 | Subir Barranquilla | Demanda fuerte en la propiedad asignada. | **Sí** |
| J1 | Reemplazar Soledad | Es la pieza más débil y viola el piso aun usando el 59 inflado. En la marca asignada son 21 reservas. | **Sí** |
| L0 | Puentes por ciudad condicionado | Se apoya en el diseño y no en este informe; la condición es necesaria. | **Parcial/condicionado** |
| L1 | Evento o reasignar | Es una regla de salida, no una evidencia de contenido. | **Sí como regla** |

### Soledad: dato real, mal agregado

Consulta equivalente a los GET de `reservations` y `locations` ejecutados:

```sql
SELECT r.franchise, count(*)
FROM reservations r
JOIN locations l ON l.id = r.pickup_location_id
WHERE lower(unaccent(concat_ws(' ', l.city, l.name, l.code, l.slug))) LIKE '%soledad%'
GROUP BY r.franchise;
```

Salida:

```text
AlquilaTuCarro: 21
Alquílame:      24
Alquicarros:    14
total:          59
```

El diseño usa 140 reservas de **Alquílame** para Palmira, pero 59 de **todas las marcas** para Soledad. Es una comparación inconsistente. No salva Soledad: con la regla correcta por marca, queda todavía peor. La recomendación de reemplazarla es de las más sólidas del informe.

### Recomendaciones nuevas fuera de los 31 espacios

- **Actualizar vehículo/gama/modelo:** sí se sostiene; es grande con cualquier clasificador y tiene fallas reales de contexto.
- **Tarjeta/titular/cupo/garantía:** se sostiene como contenido de conversión, con cuidado de no apuntar a la variante vetada.
- **Seguro como primera prioridad:** no se sostiene como ranking. Puede ser guía de soporte, pero la urgencia es criterio no medido.
- **Integrar horarios en A3/H2:** se sostiene cualitativamente; mi réplica encuentra incluso más casos, aunque parte sea dato rutinario y no pregunta.

## 7. Errores encontrados, por impacto

### 1. “Requisitos es el tema número uno” confunde el copy del canal con demanda espontánea

Este es el error que más puede mover la parrilla. Entre 83% y 85% del supuesto tema de requisitos viene del texto que el sitio inserta en el enlace general de WhatsApp. Quitada esa señal automática, requisitos cae a aproximadamente 119–145 conversaciones. No es el número uno.

### 2. La taxonomía no es reproducible

El informe conserva resultados de una tabla en memoria, no el clasificador que la creó. Dos métodos razonables cambian vehículo en 10,5%, precio en 6,0%, seguro en 47,4% y horarios en 52,5%. No se puede auditar la tasa de error original ni los 557 casos de transmisión o 103 de modelo.

### 3. La fricción por tema está metodológicamente inflada

El `review_label` global se asigna a todos los temas sin leer la causa, y una repetición normal cuenta como repregunta. Al menos 15 casos de vehículo y 21 de precio no tienen otra señal publicada. La muestra confirma falsos positivos y atribución al tema equivocado.

### 4. La acción “seguro primero” no se sigue del ranking

Seguro es un hueco real, no la prioridad demostrada. Tiene poco volumen relativo, cero GSC y una muestra de bot diminuta. El informe pasa de “57 casos y 3/6 con señal” a “acción más urgente” sin una función de prioridad comparable para el resto.

### 5. El cruce de tarjeta contiene una cifra incorrecta o un diccionario oculto

Los datos brutos de GSC coinciden exactamente, pero 1.420/1.388 no. El resultado natural es 1.388/1.387. La política editorial resultante es correcta; la cifra que la justifica no.

### 6. Soledad usa una tercera marca fuera del alcance

El 59 es real solo sumando Alquicarros. El criterio declarado de “dato propio de la marca” exigiría 21. La conclusión no cambia, pero revela que los conteos de reservas no se agregaron con una regla uniforme.

### 7. El conjunto “limpio” conserva contaminación residual

Hay cinco conversaciones con secuencia duplicada fuera del lote y una apareció en la muestra de 30 con redacción claramente sintética. El gran lote se limpió bien; la depuración no terminó en cero.

### 8. “Conversación de WhatsApp” es realmente contacto + sesión

Ese identificador mezcla episodios separados. Una segmentación de siete días produce 39 hilos adicionales; una de 24 horas, 185. Los conteos por conversación son sensibles a una elección que el informe no somete a prueba.

## 8. Lo que el informe no miró y debería

### Marca como tasa, no solo como conteo

Sí publica columnas de marca, pero no normaliza por el tamaño de cada marca. Eso oculta que requisitos representa 9,4% de Alquílame en WhatsApp y 58,5% de AlquilaTuCarro. La demanda combinada no debe dictar igual contenido para ambas.

### Cambio en el tiempo

Con mi mismo clasificador, la proporción semanal de requisitos en WhatsApp pasa de 28,4%–33,2% al inicio a 60,4% en la semana del 19 de julio. Vehículo es mucho más estable, 37,9%–47,7%; precio oscila 28,4%–48,0%.

Un total de seis semanas mezcla cambios de canal, campaña, copy e intención. La prioridad de requisitos depende más del momento; vehículo resiste mejor.

### Cliente nuevo vs. recurrente

Treinta y tres unidades contacto-sesión ya tenían mensajes antes del 21 de junio. Además, el agrupamiento por pausa aumenta 1.619 unidades a 1.658 o 1.804 episodios. No se comparan preguntas de primera compra, modificación, posventa y regreso.

### Ciudad como segmento

El informe lista menciones de ciudad, pero reconoce que pueden ser origen, destino o ruta. No calcula tasas por ciudad ni demuestra que las 195 dudas de aeropuerto respalden por igual Medellín, Bogotá y otras sedes. Promover A3 y H2 con un total combinado requiere ese corte.

### Canal y etapa del embudo

WhatsApp aporta 88,6% de los mensajes entrantes del corte y está más cerca de la venta; el chat web tiene otra interfaz y otro comportamiento. Sumar conversaciones sin normalizar convierte el canal dominante en la voz de “todos los clientes”.

### Resultado comercial

No se cruzan temas con reserva, cotización exitosa o valor del cliente en WhatsApp. El informe lo reconoce como límite, pero luego prioriza contenido como si volumen y valor fueran equivalentes. Una pregunta frecuente que filtra malos leads no pesa igual que una duda menos frecuente que bloquea reservas buenas.

### Causa de la revisión humana

La base tiene `review_note`; el análisis usa solo `review_label`. Leer y codificar la causa de la nota es indispensable para hablar de fricción por tema.

### Validación reproducible

Hacen falta, como mínimo:

- un archivo con IDs seudonimizados y etiquetas, sin texto personal;
- el código exacto y su versión;
- una muestra aleatoria congelada, no solo ejemplos elegidos por etiqueta;
- doble anotación de una muestra y acuerdo entre anotadores;
- matriz de falsos positivos/negativos por tema;
- sensibilidad con/sin prellenados, por marca, por canal y por semana.

## 9. Qué sobrevive y sí permite decidir

1. **El corte de fuentes y la exclusión del lote anómalo aguantan.** La explicación de 4.735 → 1.668 es real y defendible.
2. **Precio y vehículo son prioridades robustas.** Cambian los números, no la conclusión. Actualizar los artículos vivos y el bot antes de abrir pilares duplicados es sensato.
3. **Requisitos es una necesidad de onboarding de AlquilaTuCarro, no una pregunta espontánea número uno.** Se puede mejorar el flujo y el contenido existente, pero no justificar una expansión editorial con 773 formulaciones independientes.
4. **Aeropuerto conserva señal en clientes y GSC.** A3 y H2 tienen apoyo, sujeto a validar por ciudad.
5. **El veto suave de “sin tarjeta” está bien aplicado.** El numerador publicado falla, pero prácticamente toda la demanda literal de tarjeta es la variante vetada.
6. **La parrilla de ciudades no debe desmontarse.** La demanda orgánica de ciudad es mucho más sólida que la precisión de la taxonomía de chat.
7. **Soledad debe salir.** No es una corazonada; el dato correcto de la marca la debilita aún más.
8. **Devolución en otra ciudad no es el tema principal.** Mi réplica encuentra 19 conversaciones frente a 13 del informe: la diferencia no la acerca a una prioridad de silo.
9. **Seguro es un hueco real, pero su prioridad queda abierta.** Puede entrar como guía de soporte; no está probado que deba ser la primera pieza nueva.
10. **Los eventos deben permanecer condicionados.** El informe no aporta evidencia nueva que permita comprometer K1 o L1 hoy.

### Decisión segura con lo que queda

Se puede conservar la arquitectura de ciudades, reemplazar Soledad, mantener los eventos detrás de una puerta de evidencia y priorizar la corrección de precio/vehículo/aeropuerto en contenido vivo y bot. No se debe usar el orden 773/762/755 ni las tasas 59/106 y 56/110 para asignar meses de producción hasta rehacer la validación reproducible.
