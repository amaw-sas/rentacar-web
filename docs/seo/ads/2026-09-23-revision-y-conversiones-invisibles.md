# Google Ads: revisión completa y las reservas que Google no ve (2026-09-23)

Es un informe de análisis. No se cambió nada en la cuenta de Google Ads ni en la base de datos: todo se leyó. Las decisiones quedan para el dueño.

Tiene dos partes. La primera explica por qué Google Ads ve menos reservas de las que la pauta genera, y cómo medirlas mejor. La segunda resume la revisión de la campaña que hizo un agente con el modelo Fable, verificada contra los datos.

## 1. Las reservas que Google no ve

### El problema, contado por el dueño

Mucha gente llega al sitio por un anuncio y no reserva en la web. Llama o escribe por WhatsApp, y un asesor termina la reserva. Google Ads solo cuenta la reserva que se hace en el sitio, así que esa venta queda sin atribuir al anuncio que la trajo.

El dueño lo sabe por la historia de la marca. Antes de pautar, a alquilatucarro le llegaban muy pocos contactos. Hoy es la que más contactos recibe de las tres marcas, y la diferencia es la pauta. En el dashboard ve más resultados de los que reporta Google. Eso importa porque una sede puede verse mala en Google Ads y estar convirtiendo por teléfono.

La renta de carros también es estacional, como hoteles y aerolíneas. En temporada alta hay más demanda y los clics cuestan más. Un mes no se compara con otro de distinta temporada.

### Lo que dicen los datos del dashboard

Reservas de alquilatucarro creadas del 23 de agosto al 21 de septiembre de 2026:

| Origen en el dashboard | Reservas | Utilizadas |
|---|---|---|
| Canal «google_ads» (llegó con gclid) | 479 | 162 |
| Con código de asesor y sin gclid | 335 | 148 |
| Otras sin asesor ni gclid (directo, buscadores, WhatsApp) | 122 | 41 |
| **Total** | **936** | **351** |

Google Ads contó 540 conversiones en el mismo periodo. De las 396 reservas con código de asesor, solo 61 conservan el gclid. Las otras 335 son justo las que describe el dueño: una persona habló con un asesor y la reserva se hizo por él. Una parte de ellas vino de un anuncio y Google nunca lo sabrá con la medición actual. Además, 62 reservas llegaron desde enlaces de WhatsApp (live.wati.io y l.wl.co), también sin gclid. Pueden solaparse con las de asesor.

La serie mensual respalda lo que dice el dueño. La campaña arrancó el 16 de junio de 2026:

| Mes de creación | Reservas | Con asesor |
|---|---|---|
| Sep 2025 – abr 2026 (antes de pautar) | 49 a 129 al mes | 20 a 53 al mes |
| Mayo 2026 | 185 | 19 |
| Junio 2026 | 346 | 72 |
| Julio 2026 | 723 | 289 |
| Agosto 2026 | 694 | 232 |
| Septiembre 2026 (hasta el 21) | 715 | 311 |

Las reservas con asesor pasaron de unas 20 a 50 al mes a entre 230 y 310. Ese crecimiento coincide con la pauta, aunque también pudo influir la temporada. La captura del gclid en el sitio empezó el 13 de junio de 2026, así que la columna «google_ads» antes de junio no dice nada.

Antes de la pauta ya se veía la temporada: diciembre y enero tuvieron 107 y 129 reservas, contra 49 a 52 en septiembre y octubre de 2025.

### Por sede cambia mucho

Reservas por ciudad de recogida en el mismo periodo:

| Ciudad | Total | Con gclid | Asesor sin gclid | Lo que Google ve de lo atribuible |
|---|---|---|---|---|
| Bogotá | 256 | 118 | 96 | 55 % |
| Barranquilla | 91 | 56 | 21 | 73 % |
| Santa Marta | 79 | 44 | 27 | 62 % |
| Cartagena | 67 | 37 | 24 | 61 % |
| Villavicencio | 66 | 40 | 20 | 67 % |
| Montería | 58 | 24 | 25 | 49 % |
| Medellín | 57 | 31 | 20 | 61 % |
| Manizales | 49 | 25 | 18 | 58 % |
| Ibagué | 45 | 24 | 16 | 60 % |
| Armenia | 32 | 17 | 11 | 61 % |
| Neiva | 30 | 14 | 15 | 48 % |
| Cúcuta | 28 | 18 | 9 | 67 % |
| Valledupar | 26 | 15 | 7 | 68 % |
| Bucaramanga | 25 | 14 | 8 | 64 % |

La última columna compara lo que Google puede ver (con gclid) contra la suma de eso más las reservas de asesor. No todas las reservas de asesor vienen de anuncios, así que es un techo, no una cifra exacta. Aun así cambia la lectura. Montería, uno de los grupos más caros en Google Ads (CPA 23.937), y Neiva, cuya palabra exacta convierte muy por debajo de la cuenta, son las sedes donde más pesa el asesor.

### El error va en las dos direcciones

Google cuenta la reserva en el momento en que se hace. De las 479 reservas con gclid, 265 terminaron canceladas, no recogidas o sin disponibilidad, y solo 162 se utilizaron. Así que Google se queda corto con las reservas por teléfono y se pasa con las web que después se caen. Las reservas de asesor se utilizan más: 148 de 335, un 44 %, contra un 34 % de las que llegan por la web.

### Cómo medir mejor

Todas son propuestas. Google Ads documenta las opciones, y la ayuda oficial se leyó el 23 de septiembre de 2026.

1. **Reparar las conversiones secundarias de teléfono y WhatsApp.** Ya existen en Google Ads: «clic_boton_llamada» y «clic_boton_whatsapp», como secundarias. Pero marcan cero y «No hay conversiones recientes». El 18 de julio de 2026 un cambio del sitio (commit `037d9ba`) sustituyó esos eventos por `generate_lead` y `contact_click`, y Google Ads sigue esperando los nombres viejos. Se arregla de dos maneras: que las acciones escuchen `generate_lead` o que el sitio vuelva a enviar los nombres viejos. Es lo más barato y lo más rápido. Corregido el 2026-09-23: una versión anterior decía que no estaban configuradas.

2. **Número de desvío de Google en el sitio.** Google cambia el número del sitio por uno propio solo para quien llegó desde un anuncio, y cuenta como conversión las llamadas que duran más de un mínimo. Colombia está en la lista de países con números de desvío. Mide llamadas, no reservas, pero ligadas a la palabra clave y al grupo exactos. El costo es que los clientes ven otro número, y hay que acordarlo con el equipo.

3. **Subir las reservas hechas por asesores.** Google llama a esto «conversiones avanzadas de clientes potenciales», y es la versión actual de la importación sin conexión. Se sube la reserva con el gclid, si lo hay, y con el correo o el teléfono del cliente cifrados. Según la ayuda, el gclid es obligatorio si una etiqueta del sitio no recogió antes esos datos. Por eso, para quien solo llamó, esto funciona si se junta con el número de desvío o si el gclid viaja con el cliente. Desde el 15 de junio de 2026 estas subidas se hacen con el Administrador de datos o con la API de Data Manager.

4. **Que el gclid viaje por WhatsApp y el chat.** El chat del sitio ya manda la atribución con el gclid al dashboard. WhatsApp tiene un conector externo que registra cada clic, pero no sabemos si guarda el gclid ni si el asesor lo pega en la reserva. Si lo hiciera, la reserva de asesor heredaría el gclid y entraría en el punto 3. Falta revisar el conector, que no está en este repositorio.

5. **Contar la reserva utilizada, no solo la confirmada.** Como el 55 % de las reservas con gclid se cae, subir «reserva utilizada» como segunda conversión le enseña a Google qué clics terminan en alquiler real. No es poner valor a la conversión, que es una decisión cerrada. Es cambiar qué se cuenta.

6. **Leer cada sede con el dashboard al lado.** Mientras no exista la medición anterior, ninguna sede se pausa solo por su CPA en Google Ads. Primero se mira cuántas reservas de asesor tuvo esa sede.

7. **Comparar por temporada.** La campaña lleva poco más de tres meses y todavía no hay un año de historia. Mientras tanto, el CPA de un mes se compara con meses de la misma temporada, y las reservas del dashboard del año anterior sirven para saber qué temporada es cada mes. La revisión del 7 de octubre compara una ventana de temporada baja con otra que incluye puente festivo, y hay que tenerlo en cuenta.

## 2. Revisión de la campaña (agente con modelo Fable)

El agente trabajó solo con los archivos: los informes, las dos exportaciones de términos de búsqueda, las capturas de configuración y las reglas del negocio. Sus cifras se comprobaron contra los archivos. Donde algo no cuadró está indicado.

Ojo con todo lo que sigue: usa el CPA de Google Ads. Con lo de la parte 1, ese CPA está inflado de forma desigual según la sede.

### Mejoras en la campaña actual

1. **Recargar el saldo de prepago.** Es lo único que puede apagarlo todo.
2. **Bucaramanga.** Los usuarios que están en la ciudad hicieron 468 clics y 3,5 reservas (CPA 75.761). Al ritmo de la cuenta se esperaban unas 18. El grupo sí convierte, pero con gente que busca desde fuera. Propuesta del agente: decir en el anuncio dónde está la sede y, si sigue igual en 30 días, excluir Bucaramanga ciudad. El agente supone que la sede es la del aeropuerto, y eso no está verificado.
3. **Medellín.** Aparece arriba de todo el 6 % de las veces, tiene el CPC más alto y pierde el 57 % de impresiones por ranking, igual que en junio y julio. Propuesta: mejor anuncio, todos los recursos y revisar la landing en celular. El agente lo pone entre los grupos con CPA mayor a 22.000, pero el informe de grupos da 20.736. Su cifra sale solo de los términos visibles.
4. **Palabras inglesas de «genericos».** Las cinco inglesas costaron 25.590 por reserva y las seis españolas unos 19.500. En junio y julio el patrón fue el mismo: 32.231 contra 14.932. [rent car] y [car rental] tuvieron 28 clics y 0 reservas. Propuesta: juzgarlas aparte el 7 de octubre y pausar esas dos si siguen igual.
5. **Presupuesto, después del 7 de octubre.** Se gasta el 93 % del diario (316.651 COP de 341.000) y se pierde el 17,6 % de impresiones por presupuesto. Propuesta: subir un 15 % con un CPA objetivo de 20.000 en el mismo cambio.
6. **Cali y Pereira con regla de salida.** Entre junio y agosto fueron las más caras por clic después de Medellín (1.146 y 880 COP). Propuesta: a los 200 clics cada una, pausar la que supere un CPA de 30.000. Con la parte 1, esa regla debería mirar también las reservas de asesor de esas sedes.
7. **Palabras sin conversiones en dos periodos.** [alquiler de carros en valledupar] no convirtió en ninguno de los dos. Neiva exacta convierte muy por debajo de la cuenta. Hay que vigilarlas, con la salvedad de que Neiva es de las sedes con más reservas de asesor.

Lo que el agente recomienda no hacer: tocar horarios (excluir la madrugada ahorra un 1,4 %), tocar dispositivos (móvil y ordenador convierten igual), negativar «aeropuerto», «camioneta» o «precios» (ninguno se repite en los dos periodos) y crear Máximo Rendimiento, Display o partners.

### Campañas nuevas

**Extranjeros desde fuera.** El agente propone probarla aparte y pequeña. Los argumentos a favor salen de la cuenta: el viajero convierte mejor que el local (Santa Marta tiene pocos usuarios locales y el mejor CPA de la cuenta, y el 40 % de las reservas de Cartagena viene de gente que no está en Cartagena). En contra: no hay ningún dato del extranjero, afuera se compite con Booking y Kayak en su terreno, hay nombres ambiguos (Cartagena de Murcia, Medellín en España, Armenia el país) y no sabemos si las landings están en inglés. El diseño que propone: Estados Unidos, España y México, con 30.000 a 40.000 COP al día y solo palabras con ciudad más «colombia». Evaluación a las 4 semanas: al menos 5 reservas, CPA de hasta 35.000 y un ticket de al menos el doble del nacional, medido en el dashboard por campaña. Nunca «Presencia o interés» en la campaña actual.

**Partir la campaña por regiones.** Aún no. 540 conversiones al mes en una sola campaña alimentan bien la puja, y falta la cuota perdida por grupo para decidir.

**Campaña de marca aparte.** No hace falta: el grupo «Marca» con exactas ya resuelve el CPC.

### Otras observaciones del agente

- El CPA por ciudad cambia mucho entre periodos: Cartagena pasó de 12.330 a 27.293 y Manizales de 32.146 a 15.945. Hacen falta 90 días para decidir, no 30.
- Que una sede se quede sin carros podría explicar esos vaivenes. El dashboard tiene el dato de agotamiento por sede.

### Lo que no está comprobado

- Que «Maximiza las conversiones» ignore los ajustes de puja por día y hora.
- Que parte de la pérdida por ranking sea en realidad presupuesto.
- Que un clic en el extranjero cueste «varias veces» uno en Colombia.

## Orden sugerido para decidir

1. Recargar el saldo.
2. Importar `generate_lead` como conversión secundaria, para empezar a ver los contactos por grupo sin tocar la puja.
3. Decidir con el equipo si se usa el número de desvío de Google en el sitio.
4. Revisar si el conector de WhatsApp guarda el gclid y cómo pasa a la reserva del asesor.
5. El 7 de octubre, revisar los grupos nuevos con el dashboard al lado, por sede.
6. Solo después: presupuesto, Bucaramanga, Medellín y la campaña de extranjeros.

## Aclaraciones del 2026-09-23 (tarde)

**El saldo quedó recargado.** El aviso de saldo desapareció. La campaña aparece ahora «Apta (en fase de aprendizaje)» por los cambios del día: grupos nuevos, AI Max apagado, Cali y Pereira activos. Mientras siga aprendiendo, conviene no hacer más cambios de puja ni de estructura.

**Los extranjeros sí dejan más.** Reservas de alquilatucarro desde el 16 de junio, según el documento del cliente:

| Documento | Reservas | Utilizadas | Ticket medio utilizado | Días medios | Con seguro | Por Google Ads | Por asesor |
|---|---|---|---|---|---|---|---|
| Cédula (CC) | 2.208 | 39,4 % | 401.927 COP | 2,6 | 7,3 % | 47,5 % | 37,9 % |
| Pasaporte (PP) | 125 | 45,6 % | 663.312 COP | 4,2 | 16,8 % | 31,2 % | 47,2 % |

Con pasaporte el ticket es 1,65 veces mayor, alquilan más días y toman más seguro. También usan más al asesor, así que Google los ve todavía menos. El umbral de «ticket al menos el doble» que propuso el agente no lo cumple ni el extranjero de hoy. Uno de 1,5 veces es más realista.

**Uso de las reservas por sede.** Medellín utilizó solo 14 de 57 reservas (25 %), frente a 32 % en Bogotá y 46 a 49 % en Cartagena y Santa Marta. Vale averiguar por qué antes de gastar más en su anuncio.

**Cómo queda cada punto de la revisión con los datos del dashboard:**

- Saldo: resuelto.
- Bucaramanga: se sostiene a medias. El dato de Google es sólido, pero 8 de las 25 reservas de la sede las hizo un asesor, y el local puede estar llamando en vez de reservar en la web. No excluir la ciudad hasta medir las llamadas.
- Medellín: se sostiene. La posición no depende de cómo se cuenten las conversiones, y además es la sede que menos reservas convierte en alquiler.
- Palabras inglesas de «genericos»: se sostiene en Google, pero el extranjero usa más al asesor, así que Google lo subestima más. No pausar solo por eso.
- Presupuesto: se sostiene y se refuerza, porque el costo real por reserva es menor que el que muestra Google. Pero hay que esperar a que termine el aprendizaje y a la revisión del 7 de octubre.
- Cali y Pereira: se sostiene con un ajuste. Durante la pausa, Cali tuvo 11 reservas en el dashboard, 6 de asesor. La regla de salida tiene que mirar también esas reservas.
- Campaña de extranjeros: la premisa se confirma. Antes de lanzarla hay que arreglar la medición, porque también se vería por debajo de lo real.

## Fuentes

- Base de datos del dashboard, tabla `reservations` (y `referrals`, `locations`), consultada el 2026-09-23 en modo lectura.
- Código del sitio: la captura de atribución está en `packages/logic/src/utils/attribution/`, el envío con la reserva en `useRecordReservationForm.ts` y el evento de contacto en `packages/logic/src/utils/analytics.ts`.
- Ayuda de Google Ads: conversiones avanzadas de clientes potenciales (15713840), seguimiento de conversiones de llamadas (6100664 y 6095883) y países con número de desvío (2382961).
- Informes anteriores: `2026-09-23-estado-cuenta-google-ads.md` y `2026-09-23-grupos-genericos-y-marca.md`.
