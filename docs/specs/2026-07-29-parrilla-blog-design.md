# Parrilla de contenido del blog — alquilame y alquilatucarro

**Fecha:** 2026-07-29 · **Estado:** diseño acordado con el dueño, pendiente de la fase de investigación
**Alcance:** 12 artículos nuevos (6 por marca), la maquinaria para producirlos y el chequeo que impide publicarlos rotos.

---

## Dónde vive el blog (verificado, no es supuesto)

El contenido del blog **no está en ningún repositorio**. Vive en Supabase, tabla `blog_posts`, con clave `brand + slug`. Los markdown originales se borraron en `9c4411d` cuando Supabase pasó a ser fuente única.

- `rentacar-dashboard` no tiene una sola línea de blog. Descartado como sede.
- `rentacar-web` tiene la lectura (`server/api/blog/posts.get.ts`, `post/[slug].get.ts`), el render (`app/pages/blog/[...slug].vue`) y las 19 páginas de ciudad que son el destino de los enlaces internos.

En producción hoy: alquilatucarro 16 posts, alquilame 1, alquicarros fuera del alcance (no es franquicia activa).

**Conclusión:** el trabajo se hace en `rentacar-web`.

---

## Decisiones cerradas

| Decisión | Elegido | Por qué |
|---|---|---|
| Calendarios | Dos independientes, uno por marca | Cada marca cubre los temas que quiera con ángulo propio. Exige vigilar la convergencia: los 16 posts de alquilame ya se vaciaron una vez por duplicar a alquilatucarro. |
| Dónde se escribe | Markdown versionado en el repo + script de sync | Es la única opción donde "los enlaces no están rotos" se demuestra con un test en CI en lugar de revisarlo a ojo. |
| Tamaño | 6 por marca, 2 clústeres = 12 posts | Un clúster (1 pilar + 2 satélites) es la masa mínima que produce enlaces internos reales. Dos clústeres permiten enlaces cruzados. Sigue siendo revisable en un PR. |
| Los 16 vivos | Se enlaza hacia ellos, no se tocan | Son rankings reales del sitio que factura. Auditarlos es misión aparte. |

**Regla de oro del flujo:** el archivo markdown es el original, Supabase es la fotocopia. Una sola dirección. Nadie edita filas a mano; el siguiente sync se lo pisa.

```
content/blog/<marca>/*.md  ──┐
                             ├─→ validador ─→ sync ─→ Supabase blog_posts ─→ web
docs/seo/parrilla.json     ──┘   (CI+local)                (brand+slug)
```

**Riesgo asumido:** son dos fuentes si alguien edita Supabase por fuera, y el validador no puede detectarlo. Mitigación: `sync --check` compara repo contra tabla y avisa si divergen. Se corre antes de cada tanda.

---

## Piezas nuevas

| Pieza | Qué hace | Dónde |
|---|---|---|
| Fuente markdown | 12 artículos con frontmatter, separados por marca | `content/blog/<marca>/` |
| Parrilla | El mapa: keyword, H1, ciudad y enlaces de cada post | `docs/seo/parrilla-editorial.json` |
| Lista negra | Temas y keywords prohibidos | `docs/seo/lista-negra.json` |
| Validador | Corre los chequeos y bloquea la publicación | `scripts/validate-blog-grid.ts` + test en CI |
| Sync | Upsert a Supabase por `brand+slug`, idempotente | `scripts/sync-blog-posts.ts` |

**Nada de esto toca código vivo.** El render y la API ya funcionan; esto solo alimenta la tabla que ya leen.

**Por qué la parrilla es un archivo aparte y no vive en el frontmatter de cada post:** los enlaces forman un grafo. Si cada artículo declara solo sus salidas, nadie puede responder "¿qué post quedó huérfano?" ni "¿qué ciudad prioritaria no recibe ni un enlace?" sin leer los doce. Con el mapa en un archivo, esas dos preguntas se responden solas — y son justo las que deciden si una parrilla funciona.

---

## Formato de la parrilla

Modelo, propuesto por el dueño: **una palabra clave = un post**, y el H1 de ese post es el texto ancla cuando otro artículo lo cita.

De esa tabla sale el slug, el H1, la meta descripción, la ciudad destino y el texto con que se citan entre ellos.

**Matiz sobre el ancla:** si los artículos enlazan siempre con el H1 exacto, se lee como manipulación. La regla es H1 exacto en aproximadamente la mitad de los enlaces y variantes naturales en el resto — *"pico y placa en Cali"*, *"consulta las restricciones vigentes"*, *"cómo funciona allá"*. El validador vigila la proporción.

### La parrilla va en dos capas

Decisión del dueño el 2026-07-29, después de observar que el post 1 no puede enlazar a posts que aún no existen y que con 60 artículos el grafo sería mucho más rico.

**Capa de estructura — se fija hoy, completa.** Los silos, qué ciudades y temas van en cada uno, y cómo se conectan. Es estable: las 19 ciudades no cambian y las páginas de ciudad tampoco.

**Capa de keywords — solo la tanda vigente.** Los 12 de la tanda 1 llevan keyword comprometida, sacada de datos frescos. Los demás llevan silo y tema asignados, pero la keyword se elige antes de cada tanda. Comprometer hoy la keyword del artículo 28 sería fingir que sabemos algo que no sabemos: los datos disponibles son 30 días de búsquedas y las posiciones de esta semana.

**Pilares primero.** Lo que el dueño describió — los primeros artículos reciben enlaces y no mandan — en un silo **es lo correcto**: el pilar debe acumular enlaces de sus satélites. El problema solo aparece si un satélite se escribe antes que su pilar. Por eso los 11 pilares abren cada silo.

**Re-enlace por tanda.** Al publicar una tanda, el validador lista qué artículos existentes deberían enlazar hacia los nuevos, porque el mapa ya declara el grafo. Es mecánico, no es criterio. Editar un artículo publicado son dos líneas en el repo y un redespliegue — esa es la ventaja de haber elegido markdown versionado.

### Regla de enlace (añadida el 2026-07-29)

**Un enlace existe solo si responde "¿por qué un lector seguiría esto?". Si la única respuesta es un hecho interno del negocio, se borra.**

Salió de un error real. El silo original H agrupaba Barranquilla con Bogotá porque son las dos ciudades donde alquilatucarro le gana a alquilame en reservas. Eso es contabilidad interna que el lector nunca ve: a nadie que alquila en Barranquilla le importa Bogotá. El silo se disolvió — Bogotá quedó con silo propio y Barranquilla pasó a un silo de Costa.

### Estructura: 11 silos, 32 espacios

Pilar marcado con ★. `t1` = keyword comprometida; `t2`/`t3` = tema fijo, keyword por elegir. Un silo admite satélites nuevos sin cambiar la estructura.

**alquilame — 14 espacios**

| Silo | # | Tanda | Artículo | Keyword | Dato propio |
|---|---|---|---|---|---|
| **A** Llegas en avión | A0 ★ | t1 | Alquiler de carros en Medellín | `alquiler de carros en medellin` | 741 reservas · 42% aeropuerto entre 5 sedes · 1.046 impr, pos 16,6 |
| | A1 | t1 | Alquiler de carros en Santa Marta | `alquiler de carros en santa marta` | 707 reservas · 82% aeropuerto entre 2 sedes · solo 32% pide vie-sáb |
| | A2 | t2 | Alquiler de carros en Cartagena | — | 674 reservas · cero búsquedas sin disponibilidad |
| | A3 | t2 | ¿Recoger en el aeropuerto o en la ciudad? | — | Solo comparable con 2+ sedes: Medellín 42%, Cali 52%, Santa Marta 82% |
| **B** Cali y el Valle | B0 ★ | t1 | Alquiler de carros en Cali | `alquiler de carros en cali` | 679 reservas con Ads apagado · 8,9 gamas · 52% aeropuerto entre 3 sedes |
| | B1 | t1 | Buscan una semana, reservan tres días | `cuantos dias alquilar un carro` | Cali pide 6 días, Pereira 7, Armenia 6; la reserva dura 3 |
| | B2 | t3 | Alquiler de carros en Palmira | — | 140 reservas (pasa el piso de 100, justo) · 8,8 gamas |
| **C** Viajas desde España | C0 ★ | t1 | Alquiler de coches en Colombia | `alquiler de coches en colombia` | España: 281 clics en pos 10,4, mejor que Colombia (12,6) · 759 consultas dicen "coche" |
| | C1 | t2 | Licencia de conducción extranjera | — | Válida durante la permanencia autorizada (art. 25 código de tránsito) |
| | C2 | t2 | Requisitos para alquilar siendo extranjero | — | Pasaporte, licencia, tarjeta, 18 años. Ojo: 0 pasaportes registrados en la base |
| **D** Eje Cafetero | D0 ★ | t1 | Alquiler de carros en Pereira | `alquiler de carros pereira` | 308 reservas · piden 7 días, la estadía más larga · **una sola sede** |
| | D1 | t2 | Rutas del Eje Cafetero en carro | — | Apoya la estadía larga: 7 días dan para recorrer |
| **K** Calendario | K0 ★ | t2 | Puentes y temporada alta | — | Recicla el post vivo: vie-sáb antes de cada festivo = 46% de las recogidas de junio |
| | K1 | t3 | Evento por definir | — | Sale del respaldo mensual de búsquedas |

**alquilatucarro — 17 espacios**

| Silo | # | Tanda | Artículo | Keyword | Dato propio |
|---|---|---|---|---|---|
| **E** Tolima y Llano | E0 ★ | t1 | Alquiler de carros en Villavicencio | `alquiler de carros villavicencio` | 1.613 impr, pos 9,2 · 52% pide para ya, solo 7% con +30 días |
| | E1 | t1 | Alquiler de carros en Ibagué | `alquiler de carros ibague` | 1.516 impr, pos 9,5 · 51% pide vie-sáb · el que menos improvisa (37%) |
| | E2 | t1 | Reservar hoy para hoy: qué queda | `alquilar carro el mismo dia` | 52% de Villavicencio y Cúcuta pide con ≤1 día |
| | E3 | t2 | Alquiler de carros en Neiva | — | 813 impr, pos 10,8, solo 2 clics |
| **F** Eje Cafetero | F0 ★ | t1 | Alquiler de carros en Armenia | `alquiler de carros en armenia` | 1.073 impr, **pos 7,9** — la mejor del conjunto · 21% busca con +30 días |
| | F1 | t1 | Alquiler de carros en Manizales | `alquiler de carros manizales` | 1.064 impr, pos 9,4 · 5,6 gamas contra 9,2 en Bogotá |
| | F2 | t1 | Con cuánta anticipación reservar, según la ciudad | `con cuanta anticipacion reservar carro` | Armenia 21% vs Villavicencio 7%: misma empresa, tres veces de diferencia |
| **G** Nororiente | G0 ★ | t2 | Alquiler de carros en Cúcuta | — | 830 impr, pos 10,5 · 52% para ya · 4,9 gamas, el catálogo más corto |
| | G1 | t2 | Alquiler de carros en Bucaramanga | — | 19% busca con +30 días |
| | G2 | t2 | Alquiler de carros en Valledupar | — | 834 impr, pos 11,4 con 2 clics |
| **H** Bogotá | H0 ★ | t3 | Alquiler de carros en Bogotá | — | 1.093 reservas, donde atc manda · pos media 26,8: todo por hacer |
| | H1 | t3 | Pico y placa en Bogotá | — | — |
| | H2 | t3 | El Dorado y las 5 sedes de Bogotá | — | 5 sedes, 1 en aeropuerto |
| **J** Costa | J0 ★ | t2 | Alquiler de carros en Barranquilla | — | 475 reservas, la otra ciudad donde atc gana · 1.805 impr, pos 12,2 |
| | J1 | t3 | Alquiler de carros en Soledad | — | ⚠ 59 reservas: **bajo el piso de 100**, sin cifras propias |
| **L** Calendario | L0 ★ | t2 | Puentes ciudad por ciudad | — | 11 jul 2026: pico simultáneo en 5 ciudades |
| | L1 | t3 | Evento por definir | — | Sale del respaldo mensual de búsquedas |

Grafo interactivo: `docs/specs/assets/2026-07-29-silos-blog.html`.

### Contenido de calendario: reglas propias

Los silos K y L no se comportan como los demás. Se separan a propósito:

| | Artículos de ciudad | Artículos de evento |
|---|---|---|
| Vida útil | años | semanas |
| Cuándo se publica | cuando esté listo | **6-8 semanas antes**, o no sirve |
| Después | se actualiza | se recicla al año siguiente o se retira |
| Riesgo | quedarse viejo | publicar tarde = cero tráfico |

**Alarma temprana verificada el 2026-07-29.** `search_logs` guarda la fecha que el usuario pide, no solo cuándo buscó: 33.481 búsquedas apuntan a fechas futuras. Demanda visible antes de que exista una sola reserva:

| Fecha pedida | Búsquedas | Veces lo normal | Concentración |
|---|---:|---:|---|
| sáb 1 ago 2026 | 979 | 8,3× | Bogotá 360 · Neiva 95 |
| vie 31 jul 2026 | 945 | 8,0× | Bogotá 392 · Medellín 114 |
| sáb 15 ago 2026 | 885 | 7,5× | **Bogotá 566** (2 de cada 3) |
| vie 7 ago 2026 | 717 | 6,1× | Bogotá 283 · Manizales 82 |

Son los puentes de Batalla de Boyacá (7 ago) y la Asunción (17 ago).

**Tres límites de este método, medidos:**

1. **Horizonte de ~6 semanas.** `search_logs` retiene 30 días, así que solo se ven búsquedas hechas en el último mes. De septiembre en adelante no aparece nada — por falta de búsquedas registradas, no por falta de demanda.
2. **Los picos históricos dicen la fecha, no el motivo.** La detección sobre 2 años de reservas encuentra los picos (Bogotá 26-27 jun 2026 a 13× lo normal; 11 jul 2026 simultáneo en 5 ciudades), pero atribuirlos a un evento concreto exige un calendario verificado, no memoria.
3. **Fuera de Bogotá los números son flacos.** En Cali un día normal son 2 recogidas y el pico son 8. Es señal, no prueba. Bogotá es la única ciudad con densidad suficiente.

### Respaldo mensual de búsquedas — HECHO el 2026-07-29

**Corrección de una afirmación previa: `search_logs` NO se purga.** No existe cron de purga ni borrado en el código; la ventana de 30 días es simplemente la fecha en que se encendió el registro (la migración `009_search_logs.sql` avisa *"the producer is NOT yet wired — search_logs is empty in prod"*, y el 2026-06-30 tiene 291 filas contra ~1.000 de los días siguientes: día parcial de arranque, no borde de purga). El comentario de `search_conversions` que dice *"survives the search_logs retention purge"* se refiere a una purga planeada que nunca se implementó.

**Pero al medirlo apareció algo peor.** `search_logs` pesa **738 MB con 40.914 filas** — 15 MB de tabla, 27 MB de índices y **649 MB en la columna `available_categories`**, que guarda la cotización completa de cada gama por búsqueda (precio, IVA, descuento, cobertura: ~16,6 KB por fila). A ~1.000 búsquedas diarias son **~500 MB/mes, unos 6 GB al año**, creciendo sin límite. Además retiene `ip_address` y `user_agent` sin caducidad, que es dato personal.

**Implementado (migración `112_search_demand_monthly` + `112b`, aplicada a producción):** tabla `search_demand_monthly` con grano *(mes de búsqueda, franquicia, ciudad, fecha pedida)* y columnas `searches`, `no_availability`, `avg_categories`, `median_lead_days`, `median_rental_days`, `median_day_charge`. Filtra `source = 'organic'`. Cero datos personales. Refresco por `refresh_search_demand_monthly(mes)`, idempotente, con `pg_cron` los días 1 y 15.

Resultado: **3.483 filas y 1,3 MB** cubriendo las 39.330 búsquedas orgánicas — contra 738 MB. Verificado contra la consulta cruda: el pico del 15 de agosto da 885 búsquedas con 566 en Bogotá, idéntico. Corrigió de paso un bug de mayúsculas en `pickup_location_code` que descartaba 9 filas en silencio.

**Decisión pendiente del dueño — la purga.** Con el agregado en pie, borrar filas crudas viejas ya es seguro para el blog. Pero `available_categories` es el histórico de precios reales del que sale `price_anchors`, así que la purga tiene un costo que no es solo de almacenamiento. Tres caminos, sin ejecutar ninguno todavía:

1. **Purga a 6 meses** de filas crudas. Recupera espacio, conserva medio año de detalle. Pierde el precio crudo anterior.
2. **Adelgazar la escritura**: guardar en `available_categories` solo lo que se consume (códigos de gama y `vehicleDayCharge`) en vez de la cotización completa. Ataca la causa — corta ~90% del crecimiento sin borrar nada. Requiere tocar el camino de escritura en `rentacar-dashboard`.
3. **Anonimizar antes de purgar**: vaciar `ip_address` y `user_agent` a los 30 días y purgar el resto más tarde. Resuelve el problema de datos personales por separado del de espacio.

Recomendado: **2 primero, luego 1**. La 2 es la única que resuelve la causa; sin ella, cualquier purga es un balde bajo una gotera.

---

## Prioridad de ciudades

Sale de los datos de Google Ads del dueño (CPA promedio 15.841 COP sobre 336 conversiones):

1. **Cali** — sin ningún canal: Ads pausado y sin autoridad orgánica
2. **Pereira** — igual que Cali
3. **Medellín** — 1,4× el CPA promedio con datos sólidos (25 conversiones) y 542.652 COP de gasto
4. **Santa Marta** — 2,6× el promedio con datos sólidos; mercado turístico, que es el mejor cliente
5. **Armenia** — 2,0×, y refuerza el bloque Eje Cafetero junto a Pereira y Manizales

**Trampa que hay que recordar:** el CPA de Cali (49.326) y Pereira (40.520) sale de **1 y 2 conversiones**, sobre 280 y 491 impresiones. No son ciudades caras, son ciudades sin probar. El argumento para priorizarlas no es el costo, es que hoy no tienen canal.

Al final de la cola: Valledupar, Barranquilla, Villavicencio y Cartagena — Ads les funciona barato, escribir para ellas es gastar esfuerzo donde ya hay solución. Floridablanca, Palmira y Soledad no tienen grupo de anuncios; se decide aparte si viven de la ciudad grande vecina.

---

## Lista negra

Temas por los que el negocio **no** quiere posicionar, porque traen contactos que hay que rechazar:

1. Alquiler para trabajar en apps (Uber, DiDi, inDrive)
2. Alquiler sin tarjeta de crédito — **veto suave**, ver abajo
3. Mudanzas, carga, camiones
4. Alquiler con conductor — **incluye "carros matrimonio"**, ver abajo
5. Transporte público o escolar

### Caso cerrado: "carros matrimonio" (2026-07-29)

Salió de la investigación con 1.583 impresiones repartidas en 9 ciudades (Armenia 420, Manizales 325, Ibagué 317, Cúcuta 150, Pereira 115…), posiciones 9-20. Parecía un nicho servido. **No lo es.** Tres evidencias:

1. **Cero clics en 90 días**, donde en esas posiciones cabría esperar 8-15.
2. **La intención no coincide.** Las variantes que sí describirían el servicio no tienen volumen: *"alquiler de carros para bodas"* 1 impresión, *"alquiler carros antiguos"* 2, *"alquiler carros de lujo bogota"* 1. Quien busca "carros matrimonio" quiere un clásico **con chofer** — confirmado por el dueño.
3. **La flota no lo tiene.** El techo de gama es LE (Kia Sportage, Hyundai Tucson, Renault Koleos, Ford Escape — 389 reservas) y GR de 7 puestos (Trailblazer, Montero Sport, Ford Explorer — 297). Camionetas de gama media, ningún vehículo de lujo ni clásico.

**Veto duro**, porque es un subcaso de la regla 4: lo que piden es el chofer. Solo se reabriría con flota de lujo **y** servicio con conductor, que es otro negocio.

**Dos que parecían vetadas y no lo están:**

- **Extranjeros son el mejor cliente.** Casi todos escogen seguro total y piden silla si viajan con niño. Es segmento prioritario. Explica por qué Santa Marta sale cara en Ads: ahí se compite justo por ese cliente.
- **Edad mínima 18 años**, como dice el sitio. Posible ventaja frente a rentadoras que piden 21 o 25 — sin verificar; se comprueba en la investigación antes de afirmarlo en un artículo.

### Hay dos tipos de veto

**Veto duro** — reglas 1, 3, 4 y 5. No se escribe nada y no se quiere aparecer ahí en absoluto.

**Veto suave** — regla 2, *sin tarjeta de crédito*. **No se escribe contenido nuevo, pero lo que ya rankea se queda.** Decisión del dueño el 2026-07-29, con este razonamiento:

alquilatucarro rankea en posiciones 2 a 4 para esas búsquedas (~500 impresiones, según `docs/seo/baseline/2025-01-inicial.md`). Lo que Google muestra es la FAQ del home, primera pregunta: *"¿Se puede realizar un alquiler de carros sin tarjeta de crédito?"* → *"Lamentablemente no se puede... la única manera es con Tarjeta de crédito."* Verificado en vivo.

Ese contenido **no atrae leads malos: los filtra.** Quien busca eso lee que no y no llama. Borrarlo sacrificaría posiciones sin ganar nada, y la gente seguiría buscándolo — mejor que encuentre tu respuesta clara que la de un competidor. Lo que sí se prohíbe es **expandirlo**: escribir artículos para atraer más de ese tráfico sí traería gente que no puede alquilar.

Consecuencia para el validador: la lista negra necesita **dos niveles**, no uno. Un tema con veto suave puede aparecer en contenido existente pero no puede ser la keyword objetivo de un post nuevo.

### Deuda saneada el 2026-07-29

Tres documentos empujaban a perseguir el tema vetado. Corregidos:

| Archivo | Qué decía | Qué se hizo |
|---|---|---|
| `docs/seo/estrategia/keywords.md` | listaba *"alquiler de carros en bogota sin tarjeta de credito"* como objetivo long-tail | línea borrada + nota de que la lista negra manda sobre el archivo |
| `docs/seo/baseline/2025-01-inicial.md` | *"diferenciador clave"* y *"Expandir contenido sin tarjeta de crédito"* como acción de alta prioridad | ambas líneas anuladas con el motivo |
| `docs/seo/research/kayak-keywords-por-ciudad.md` | *"NICHO interesante"* y el patrón *"[ciudad] sin tarjeta de credito"* como long-tail objetivo | ambas marcadas como vetadas |

La FAQ de Supabase **no se toca**.

**La lista negra tiene dos trabajos:** bloquear artículos nuevos y **auditar los 16 vivos**, escritos antes de que existiera. El artículo de requisitos ya reveló el patrón — una promesa publicada que no se cumple no es un problema de SEO, es gente llegando al mostrador a que la devuelvan.

---

## Datos propios como base del contenido

Decisión del dueño el 2026-07-29, y es el diferenciador central de toda la parrilla: **los artículos se construyen sobre datos de la operación**, mezclados con contenido redactado. El modelo ya existe y funciona: el único post de alquilame (`temporada-de-puentes-junio-2026-en-datos`) salió de la base de reservas.

Kayak y Rentcars pueden copiar cualquier "5 rutas desde Medellín". No pueden copiar las reservas.

### Inventario verificado (proyecto Supabase `ilhdholjrnbycyvejsub`)

| Tabla | Filas | Qué aporta |
|---|---:|---|
| `reservations` | 15.091 | Abr 2024 → hoy. Fechas, duración, categoría, sede, seguro total, silla de bebé, conductor adicional, vuelo, canal de atribución |
| `search_logs` | 40.654 | Búsquedas **incluidas las que no convirtieron** — demanda que ningún competidor ve |
| `chat_messages` | 29.898 | Las dudas reales, con las palabras del cliente |
| `search_conversions` | 2.645 | Segundos entre buscar y reservar, anticipación, días, categorías ofrecidas |
| `price_anchors` | 36 | Precio diario real (p95) por marca y gama |

### El hallazgo que decide el reparto de marcas

Reservas por ciudad, histórico completo:

| Ciudad | alquilame | alquilatucarro | Dueño del dato |
|---|---:|---:|---|
| Santa Marta | **707** | 120 | alquilame, 5,9× |
| Cali | **679** | 126 | alquilame, 5,4× |
| Medellín | **741** | 216 | alquilame, 3,4× |
| Armenia | **466** | 195 | alquilame, 2,4× |
| Pereira | **308** | 251 | casi empate |
| Bogotá | 789 | **1.093** | alquilatucarro |
| Barranquilla | 194 | **475** | alquilatucarro |

**alquilatucarro solo gana en Bogotá y Barranquilla.** En las otras 17 ciudades manda alquilame — pero alquilatucarro es la que tiene la autoridad en Google y los 16 artículos. Las marcas están cruzadas respecto a lo que se asumía.

**Regla que sale de ahí: cada marca escribe de las ciudades donde tiene los números.** Y eso resuelve gratis el riesgo de convergencia: no hay que vigilar que las dos marcas no se parezcan, porque si una cuenta Cali con 679 reservas y la otra cuenta Bogotá con 1.093, los artículos son estructuralmente distintos. La diferencia la produce el dato, no la disciplina del redactor.

**Nota aparte:** Cali acumula 679 reservas de alquilame con Ads pausado. Esa ciudad ya produce sin publicidad; el contenido se monta sobre demanda existente, no arranca de cero.

### Tres reglas de honestidad

1. **Cero datos personales.** `reservations` y `customers` tienen nombres, cédulas, teléfonos y correos. Solo se publican agregados. Ningún caso individual, ni anonimizado.
2. **Piso de 100 reservas por celda.** Soledad tiene 59; Palmira y Floridablanca 225 cada una. Por debajo de 100 no se publica una cifra atribuida a esa ciudad. Cuando el dato sea justo, el artículo lo dice.
3. **Toda cifra publicada guarda su consulta SQL al lado**, en el frontmatter o junto al markdown. Sin eso no se puede recalcular en seis meses ni saber si sigue siendo cierta.

Escenarios que esto añade: SCEN-12 a SCEN-14.

## Fase de investigación (antes de escribir una sola línea)

Los temas se investigan, no se inventan. Fuentes:

- **Los datos propios** (ver sección anterior). Son la base, no el adorno.
- **Search Console.** Acceso confirmado end-to-end el 2026-07-29: 89 propiedades y consultas reales de ambos dominios. Requiere el header `x-goog-user-project: diego-seo-audit` sobre el token de `gcloud auth application-default` — sin ese header devuelve 403. Scopes del token ADC: `cloud-platform` y `webmasters`. Se busca: qué consultas ya traen gente, cuáles están entre las posiciones 5 y 20 (subir de la 12 a la 5 es más barato que aparecer de cero), y qué le falta a Cali y Pereira frente a Bogotá y Medellín.
- **Google Analytics 4 — BLOQUEADO por Google, diferido por decisión del dueño (2026-07-29).** El token ADC solo tiene `cloud-platform` + `webmasters`, y **no se puede ampliar**: `gcloud auth application-default login --scopes=...analytics.readonly` avisa que *"the following scopes will be blocked soon for the default client ID"* y el consentimiento falla. Requiere crear un cliente OAuth propio en `diego-seo-audit` o impersonar una cuenta de servicio — misión aparte. Probado el 2026-07-29; el intento **no** dañó el acceso a GSC (verificado después). No bloquea nada: GSC + datos propios alcanzan. GA4 añadiría comportamiento dentro del artículo (hasta dónde bajan, cuál termina en reserva).
- **Los datos SEMrush ya guardados** en `docs/seo/estrategia/` (volumen y dificultad por keyword) y `docs/seo/data/keywords.json`.
- **Los 16 posts vivos**, para no repetir terreno.

**Pregunta abierta que resuelve la investigación:** si los extranjeros son el mejor cliente, ¿buscan en español o en inglés? La dimensión país/consulta de Search Console lo responde. Si sale inglés, es misión aparte — no entra en estos 12.

**Entregable:** la tabla de la parrilla completa con keywords reales, para aprobación del dueño **antes** de escribir prosa.

---

## Doctrina de Google aplicable (verificada el 2026-07-29)

Fuentes abiertas y leídas ese día. Se marca qué es doctrina oficial y qué es interpretación.

### Riesgo por tener tres marcas del mismo dueño

**`site reputation abuse` NO aplica** — esa política habla de contenido de *terceros* alojado en un sitio anfitrión. Tres marcas propias con contenido propio no encajan. Fuente: [spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

**`doorway abuse` SÍ describe el montaje.** Textual: *"Having multiple domain names or pages targeted at specific regions or cities that funnel users to one page"*. Y aplica entre dominios, no solo dentro de un sitio: *"These doorway campaigns manifest themselves as pages on a site, **as a number of domains**, or a combination thereof"* ([doorway pages, 2015](https://developers.google.com/search/blog/2015/03/an-update-on-doorway-pages)).

**`scaled content abuse` tiene una cláusula escrita para esto:** *"Creating multiple sites with the intent of hiding the scaled nature of the content"*.

**El mecanismo que muerde primero no es una sanción, es la indiferencia.** No existe política de "contenido duplicado". Lo que pasa es agrupación: Google elige una URL canónica del grupo y la otra desaparece; *"if a canonical URL is in a Search Console property that you don't own, you won't be able to see any of the traffic"* ([canonicalización](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)). Publicar lo mismo en dos marcas: pagas dos veces, cobras una.

**Consecuencia para el plan — regla dura: un artículo, un dominio.** Los 31 espacios se reparten, no se duplican. Ya corrigió un conflicto propio: Bogotá estaba en alquilame (A4) y en alquilatucarro (silo H). Se quedó en alquilatucarro, que tiene 1.093 reservas contra 789.

**Cabo suelto — nada de cross-link entre marcas en el footer:** *"Widely distributed links in the footers or templates of various sites"* es link spam, textual.

**RIESGO MAYOR, SIN AUDITAR: los 19 dominios satélite EMD** que alimentan alquilame. Encajan en la descripción de doorway mejor que las tres marcas principales. No se comprobó su estado; auditarlos antes de escribir.

### Contenido a escala

El volumen no es el criterio. Lo es la intención: *"generated for the primary purpose of manipulating search rankings and not helping users"*. 31 artículos con estructura parecida no infringen nada **si cada uno aporta algo que no existía** — para eso están los datos propios, siempre que se vean en el artículo y no de adorno.

**El listón actual, de la guía de optimización para IA de mayo 2026** ([ai-optimization-guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)): *commodity* = "7 Tips for First-Time Homebuyers"; *non-commodity* = algo que "provides unique expert or experienced takes that go beyond common knowledge". **Pasar los 31 títulos por esa prueba.**

**Advertencia directa contra los satélites de silo**, misma fuente: crear contenido separado *"for every possible variation of how people might search... primarily to manipulate rankings violates Google's scaled content abuse spam policy"*. Si dos satélites le responderían lo mismo a un lector, son un artículo. Fusionar antes de publicar.

### Lo que falta en el sitio, verificado contra nuestro código

| Hallazgo | Estado en `[...slug].vue` | Acción |
|---|---|---|
| **FAQPage murió el 2026-05-07** — *"no longer shown in Google Search results"*, doc borrada en junio ([updates](https://developers.google.com/search/updates#removing-faq-rich-result)) | **Se emite** (línea ~493) | Quitar el marcado. Las preguntas se quedan: sirven al lector |
| **Autor: `Person` para personas, `Organization` para organizaciones** ([article #author-bp](https://developers.google.com/search/docs/appearance/structured-data/article)) | Emite `'@type': 'Person', name: 'Alquilame'` — **una marca declarada como persona** | Corregir. Decisión pendiente: firma humana con página de autor, u organización |
| **E-E-A-T:** *"Do pages carry a byline... Do bylines lead to further information about the author?"*; *"trust is most important"* | Sin `author.url`, sin página de autor | El hueco más grande. 31 sedes y 2 años de datos son la prueba de experiencia y no se muestra |
| `BlogPosting` y `BreadcrumbList` siguen vigentes | Ambos se emiten | Nada |
| **Fechas:** visible y structured data deben coincidir, ISO 8601 con zona, sin fechas futuras, *"minimize the presence of other dates"* ([publication-dates](https://developers.google.com/search/docs/appearance/publication-dates)) | Por revisar | Separar `lastmod` técnico de `dateModified` editorial en el modelo |
| **Sitemap:** *"Google ignores `<priority>` and `<changefreq>`"*; `lastmod` solo si es exacto — y un cambio de **enlaces** cuenta como significativo ([build-sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)) | Por revisar | Limpiar. Justifica el barrido de re-enlace (SCEN-16) |
| **Enlaces a ciudades:** *"Blocks of text that list cities and regions that a web page is trying to rank for"* es keyword stuffing, textual | Por revisar | Enlaces dentro del texto, nunca en bloque al pie del artículo |
| **IndexNow no incluye a Google** — los participantes son Bing, Naver, Seznam, Yandex, Yep ([indexnow.org](https://www.indexnow.org/)) | — | Solo vale la pena por Bing y lo que use su índice |
| **Core Web Vitals:** LCP 2,5 s · **INP** 200 ms · CLS 0,1 en percentil 75 ([web.dev/vitals](https://web.dev/articles/vitals)) | — | INP, no FID |

### Tráfico de España — decisión y desacuerdo registrado

El investigador recomendó **eliminar** el artículo C0, por considerarlo doorway. **Se acepta a medias.**

Tiene razón en que el ángulo no puede ser el dialecto: una página "alquiler de coches" creada para pescar tráfico peninsular que desemboca en el mismo servicio colombiano sí se parece a *"pages targeted at specific regions... that funnel users to one page"*. Pero un artículo dirigido a **extranjeros que viajan a Colombia** no es un doorway: es una audiencia real con un servicio real, y el dueño afirma que es su cliente de mayor ticket.

**C0 se reformula, no se borra:** deja de ser una jugada de vocabulario y pasa a ser la guía para el visitante extranjero, alineada con C1 (licencia) y C2 (requisitos).

Lo que sí no se hace: **hreflang no aplica** — describe versiones que ya existen, y no hay página es-ES que anotar. Además la segmentación por país en Search Console **está descontinuada** ([soporte](https://support.google.com/webmasters/answer/12474899)), y Google advierte contra redirigir automáticamente por idioma o adaptar contenido por IP.

**Duda abierta que los datos no resuelven:** los 281 clics de España, ¿son personas planeando un viaje a Colombia o gente buscando alquilar *en España* que llega por error? Si es lo segundo, ese tráfico no vale nada. Se resuelve mirando qué páginas ven y si cotizan.

### Actualizar contenido publicado

Google premia la actualización real y castiga el maquillaje, con dos señales de alarma seguidas ([creating-helpful-content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)): *"Are you changing the date of pages to make them seem fresh when the content has not substantially changed?"* y *"...primarily because you believe it will help your search rankings **(No, it won't)**"* — el paréntesis es de Google.

**Añadir enlaces internos hacia artículos nuevos sí cuenta como cambio significativo** para `lastmod` (textual en build-sitemap). Pero **no** justifica mover la fecha visible. Son dos cosas distintas.

**Tiempos oficiales:** rastreo tras un cambio, de días a semanas; salir de un grupo de duplicados, hasta dos semanas; pedir reindexación varias veces no acelera nada y tiene cuota.

**Política de refresco que se adopta:** fecha visible solo con cambio sustancial · `lastmod` con cambios de enlaces · priorizar el 20% de artículos con más tráfico · cada artículo nuevo llega con su lista de 3-5 artículos existentes que deben enlazarlo.

### Contenido de evento

**Doctrina oficial, y contradice cómo está hecho el post vivo:** *"Use a recurring URL, not a new URL for each occurrence of the event... use `/sale/black-friday`, not `/sale/2020/black-friday`"* ([Black Friday best practices](https://developers.google.com/search/blog/2020/10/best-practices-black-friday)). La URL recurrente acumula autoridad; una nueva empieza de cero cada año.

El post vivo es `temporada-de-puentes-junio-2026-en-datos` — lleva año y mes. El año va en el `<title>` y el H1, que afectan el CTR; no en la URL, que acumula autoridad.

Misma fuente: crear la página **con antelación** para que Googlebot la descubra, enlazarla desde la home, imagen estática de calidad.

**Cuánta antelación: NO VERIFICADO.** Google solo dice *"well before"*; no hay cifra en fuente primaria. Las 6-8 semanas que este documento usaba son una estimación derivada de los tiempos publicados de rastreo (días a semanas) más el desagrupado de duplicados (hasta dos semanas) — **mínimo 4-6 semanas**, y para eventos anuales casi no aplica porque la URL ya está indexada.

Si hay que retirar contenido de evento: 301 al pilar del silo, nunca 404 en una URL con enlaces.

## Escenarios observables

| # | Dado | Cuando | Entonces |
|---|---|---|---|
| SCEN-1 | Un post enlaza a `/cali`, ciudad que existe | corre el validador | pasa |
| SCEN-2 | Un post enlaza a `/calii`, que no existe | corre el validador | falla y nombra archivo y línea |
| SCEN-3 | Un post enlaza a `/blog/x` que no está ni en la parrilla ni entre los 16 vivos | corre el validador | falla y nombra el destino |
| SCEN-4 | Un enlace externo devuelve 404 o no resuelve | corre el validador | falla y nombra la URL |
| SCEN-5 | Un post de alquilame menciona "alquilatucarro" (o al revés) | corre el validador | falla |
| SCEN-6 | Un post apunta a una keyword con veto duro | corre el validador | falla y cita la regla |
| SCEN-6b | Un post nuevo apunta a una keyword con veto suave | corre el validador | falla y cita la regla |
| SCEN-6c | La FAQ del home menciona un tema con veto suave | corre el validador | pasa (el veto suave no alcanza contenido existente) |
| SCEN-7 | La parrilla completa | corre el validador | reporta posts huérfanos y ciudades prioritarias sin enlace entrante |
| SCEN-8 | Más del 60% de los enlaces a un destino usan el H1 exacto | corre el validador | advierte |
| SCEN-9 | El sync terminó | se consulta `/api/blog/posts` de esa marca | devuelve los posts nuevos con sus slugs |
| SCEN-10 | Una fila de Supabase difiere del markdown | corre `sync --check` | lo reporta y no publica |
| SCEN-11 | Los 12 posts publicados | se recorre la parrilla | las 5 ciudades prioritarias reciben al menos un enlace cada una |
| SCEN-12 | Un post cita una cifra por ciudad con menos de 100 reservas detrás | corre el validador | falla y nombra la ciudad y el conteo real |
| SCEN-13 | Un post cita una cifra sin su consulta SQL guardada | corre el validador | falla |
| SCEN-14 | Se recalculan todas las consultas de un post publicado | se comparan con las cifras del texto | coinciden, o el post queda marcado para actualizar |
| SCEN-15 | Un post cita un % que depende de elegir sede, en una ciudad con una sola sede | corre el validador | falla y nombra la ciudad y su número de sedes |
| SCEN-16 | Se publica una tanda nueva | corre el barrido de re-enlace | lista los posts existentes que el mapa dice que deberían enlazar a los nuevos y aún no lo hacen |
| SCEN-17 | Un satélite se publica antes que el pilar de su silo | corre el validador | falla y nombra el pilar que falta |
| SCEN-18 | Un enlace de la parrilla no tiene una razón de lectura declarada | corre el validador | falla (regla de enlace) |
| SCEN-19 | Un artículo del silo de calendario apunta a una fecha a menos de 6 semanas | corre el validador | advierte: publicar tarde equivale a no publicar |
| SCEN-20 | Corre el respaldo mensual de búsquedas | se consulta el histórico agregado | contiene el mes recién cerrado, por ciudad y fecha pedida |
| SCEN-21 | Una misma ciudad o tema aparece en las dos marcas | corre el validador | falla: un artículo, un dominio |
| SCEN-22 | Un artículo emite marcado `FAQPage` | corre el validador | falla: el rich result se retiró el 2026-05-07 |
| SCEN-23 | Un artículo declara `author` de tipo `Person` con el nombre de la marca | corre el validador | falla: `Person` es para personas |
| SCEN-24 | Un slug de artículo de evento contiene un año | corre el validador | falla: la URL debe ser recurrente |
| SCEN-25 | Un artículo cierra con un bloque de enlaces a varias ciudades | corre el validador | falla: es el ejemplo textual de keyword stuffing |
| SCEN-26 | Se añade un enlace a un artículo publicado | se compara `lastmod` con la fecha visible | `lastmod` cambia, la fecha visible no |

---

## Qué NO se hace en este plan

- No se toca el render del blog, la API de lectura, ni `wordpress-sync.post.ts`.
- No se reescribe ninguno de los 16 posts vivos de alquilatucarro.
- No se incluye alquicarros: el sync se limita a las dos marcas por lista explícita, no por descubrimiento.
- No se escriben artículos en inglés hasta que los datos lo justifiquen.
- No se redirige ningún dominio satélite (eso es la fase F6 del plan de publicación, con su propio documento).
- No se toca la FAQ del home de alquilatucarro, ni la de Supabase: el veto de *sin tarjeta de crédito* es suave.
