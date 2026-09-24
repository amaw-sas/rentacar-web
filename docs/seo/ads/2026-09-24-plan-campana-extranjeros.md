# Plan: campaña de búsqueda para extranjeros (alquilatucarro)

Fecha: 2026-09-24. Es una propuesta y todavía no se ha tocado nada en la cuenta. El dueño decide cada paso.

## Lo que cambian los datos

La idea de partida era llegarle al turista mientras planea el viaje desde su país. Los datos dicen que la mayoría de los extranjeros que reservan ya están en Colombia.

**Reservan a última hora, igual que el cliente local.** Estas son las reservas de las tres marcas desde el 16 de junio, contando los días entre la reserva y la recogida:

| Documento | Reservas | Mediana de anticipación | Reservan con 2 días o menos | Reservan con 14 días o más | Días de alquiler (mediana) |
|---|---|---|---|---|---|
| Pasaporte | 259 | 1 día | 64,9 % | 12,4 % | 3 |
| Otros | 3.617 | 1 día | 62,2 % | 13,1 % | 2 |

Quien planea desde afuera suele reservar con semanas de antelación. Solo 1 de cada 8 reservas con pasaporte se ve así, unas 32 en tres meses sumando las tres marcas. El extranjero que alquila decide sobre la marcha y ya está en el país.

**Las visitas desde afuera convierten poco.** Esto dice Analytics de alquilatucarro entre el 25 de junio y el 22 de septiembre:

| País del usuario | Usuarios | Eventos clave | Usuarios con evento clave |
|---|---|---|---|
| Colombia | 30.090 | 3.357 | 5,74 % |
| Estados Unidos | 1.321 | 26 | 1,67 % |
| España | 215 | 11 | 3,72 % |
| Alemania | 153 | 1 | 0,65 % |
| Francia | 105 | 0 | 0 % |
| Canadá | 89 | 0 | 0 % |

Los eventos clave incluyen clics en llamar y WhatsApp, no solo reservas. España convierte mejor que Estados Unidos, probablemente porque el sitio está solo en español.

**El sitio no tiene páginas en inglés.** Un anuncio en inglés lleva a una página en español.

**Los términos en inglés ya entran y cuestan lo mismo.** En la campaña actual, entre el 23 de agosto y el 21 de septiembre:

| | Clics | Coste | Conversiones | Coste por conversión |
|---|---|---|---|---|
| Términos en inglés («rent a car», «car rental»…) | 528 | 416.278 COP | 22,9 | 18.200 COP |
| Toda la campaña | 11.052 | 7.661.517 COP | 433,2 | 17.700 COP |

«Rent a car» también lo escribe mucho el colombiano, así que esa cifra no sirve para medir extranjeros.

**El dashboard no guarda la campaña.** El sitio envía `utm_campaign`, pero la tabla de reservas solo guarda `utm_source`, `utm_medium` y `gclid`. La salida sin tocar el dashboard está en el paso 1: una etiqueta propia en `utm_medium`.

## Lo que muestra Search Console

Búsqueda orgánica del 24 de junio al 21 de septiembre de 2026, por país del usuario:

| País | alquilame.co | alquilatucarro.com | alquicarros.com |
|---|---|---|---|
| Colombia | 1.862 clics | 1.546 clics | 365 clics |
| España | 340 clics | 45 clics | 20 clics |
| Estados Unidos | 118 clics | 33 clics | 17 clics |
| Canadá | 45 clics | 12 clics | 2 clics |

- **España es el país de fuera que más busca, y lo hace en español.** Las búsquedas son del tipo «alquiler de coches en colombia», «alquiler coche colombia» o «alquiler de coches en colombia precios». La palabra «coche» es de España, así que no es un colombiano de viaje. Entre alquilame y alquilatucarro, las búsquedas con «coche» suman 4.229 impresiones desde España en tres meses, frente a 1.532 desde Colombia.
- **Las búsquedas en inglés vienen sobre todo de dentro de Colombia.** «Rent a car», «car rental» y similares suman 3.073 impresiones desde Colombia en alquilame y 1.811 en alquilatucarro. Desde Estados Unidos son 766 y 326. El extranjero que busca en inglés ya está en el país.
- **Desde Estados Unidos también se busca en español**, con frases como «renta de carros en bogota colombia» o «rentar carro en colombia». Parece la comunidad colombiana y latina en Estados Unidos.
- **alquilame gana el tráfico orgánico de España** y alquilatucarro casi no aparece ahí. Si alquilatucarro pauta en España, a veces saldrán los dos: el anuncio de alquilatucarro y el resultado orgánico de alquilame. Eso no choca con la política de Google, que habla de anuncios, no de resultados orgánicos.

## Respuestas del dueño (2026-09-24)

1. **Los asesores y el WhatsApp no atienden en inglés.**
2. **La campaña de extranjeros es dinero nuevo.** No sale de la campaña actual.
3. **La nacionalidad del cliente no se conoce.** Search Console es la mejor pista disponible, y apunta a España.

## El plan, reordenado

Las respuestas cambian el orden. Una campaña en inglés prometería un servicio que no existe: el anuncio en inglés lleva a una web en español y a un asesor que no habla inglés. España, en cambio, encaja: busca en español, el sitio está en español y el asesor le puede atender.

### Paso 1: «Viajeros – España», con dinero nuevo

| Ajuste | Valor |
|---|---|
| Campaña nueva | «Viajeros – España», en la cuenta de alquilatucarro |
| Ubicación | España, opción «Presencia». Excluir Colombia |
| Idioma | Español |
| Presupuesto | 30.000 COP al día, aparte del de la campaña actual, unos 900.000 al mes |
| Puja | Maximizar clics con un tope de CPC durante las 2 primeras semanas, porque la campaña empieza sin conversiones. Después, maximizar conversiones |
| Campaña actual | No se toca. Sigue en Colombia, en inglés y español |
| Grupos | Uno general («alquiler coche colombia») y uno por ciudad turística: Cartagena, Bogotá, Medellín, Santa Marta y Eje Cafetero |
| Palabras clave | Siempre con «colombia» o con una ciudad que no exista en España: «alquiler de coches en colombia», «alquiler coche colombia», «alquiler coches colombia precios», «alquiler de carros en colombia», «alquiler de coches cartagena colombia», «alquiler coche medellin colombia», «alquiler coche bogota». Exacta y frase |
| Negativas | «murcia», «cartagena murcia», «badajoz», «medellin badajoz», «yerevan», «armenia pais». Sin «colombia», «Cartagena» atrae búsquedas de la Cartagena de Murcia y «Medellín» las del pueblo de Badajoz |
| Anuncios | En español de España: «coche», «recogida en el aeropuerto», «reserva con pasaporte», «precio en pesos colombianos», «reserva ahora y paga al recoger» si es cierto. Nada en inglés |
| Landing | La página de la ciudad o la portada |
| Etiqueta de la campaña | Sufijo de URL de la campaña: `utm_source=google&utm_medium=cpc-exterior` |

**Cómo se mide sin tocar el dashboard.** El dashboard guarda `utm_medium` tal cual en cada reserva. Además marca como Google Ads cualquier reserva que llegue con el identificador de clic de Google (`gclid`), sea cual sea el `utm_medium`. Con el sufijo de arriba, las reservas de esta campaña siguen contando como Google Ads y se pueden filtrar por `utm_medium = 'cpc-exterior'`. Hoy todas las de Google Ads llevan `cpc`. Al crear la campaña hay que confirmar que el sufijo de la campaña manda sobre el de la cuenta.

**Se puede lanzar antes del 7 de octubre.** La campaña actual no se toca, así que no interfiere con su aprendizaje.

### Paso 2: Estados Unidos en español

Solo si España cumple. Tendría los mismos ajustes, con ubicación en Estados Unidos e idioma español. Las palabras clave serían las que usa esa comunidad, como «renta de carros en bogota colombia» o «rentar carro en colombia», con un presupuesto de 20.000 COP al día. En Analytics, el visitante de Estados Unidos convierte peor (1,67 %), así que va después.

### Descartado por ahora: anuncios en inglés

No mientras nadie atienda en inglés. Se vuelve a considerar si llegan a darse las dos cosas: alguien que atienda en inglés y una landing en inglés para Cartagena, Bogotá y Medellín.

## Cómo se juzga

A las 4 semanas, con las reservas del dashboard filtradas por `utm_medium = 'cpc-exterior'`:

En 4 semanas la campaña gasta unos 840.000 COP. El coste por reserva sale de dividir eso entre las reservas:

| Reservas en 4 semanas | Coste por reserva | Decisión |
|---|---|---|
| 24 o más | Hasta 35.000 COP | Funciona. Se sube el presupuesto y se prepara el paso 2 |
| De 8 a 23 | De 36.000 a 105.000 COP | Hay señal. Se deja 4 semanas más, se afinan palabras y anuncios, y se vuelve a medir |
| Menos de 8 | Más de 105.000 COP | Se pausa |

El tope de 35.000 sale de la campaña actual. Hoy cada reserva de Google Ads cuesta unos 18.000 COP y la reserva con pasaporte deja 1,65 veces más, así que pagar hasta el doble por ella tiene sentido.

Además, en cualquier caso:

- El precio medio de estas reservas debe ser al menos 1,5 veces el nacional.
- Al menos el 40 % de las reservas se debe utilizar, medido cuando pasen las fechas de recogida.

Quien planea desde España reserva con semanas de antelación, así que muchas recogidas caerán después de las 4 semanas. Las reservas se cuentan por fecha de creación. El porcentaje de utilizadas se revisa un mes después.

Si no se cumple, se pausa. Antes de cerrarla hay que mirar también las reservas de asesor con pasaporte en esas fechas, porque este cliente usa mucho al asesor y la llamada puede no llevar la etiqueta.

## Preguntas que quedan

1. ¿Se puede reservar y pagar al recoger? El anuncio lo diría solo si es cierto.
2. ¿El asesor sabe atender a alguien que llama o escribe desde España? El prefijo, el horario (España va 7 horas por delante de Bogotá en el verano europeo y 6 en invierno) y el WhatsApp internacional.

## Fuentes

- Dashboard, tabla `reservations`, reservas creadas desde el 2026-06-16, consultada el 2026-09-24 en modo lectura.
- Analytics, propiedad «alquilatucarro.com - GA4», informe «Detalles demográficos: País», del 25 de junio al 22 de septiembre de 2026.
- `docs/seo/data/ads/terminos-busqueda-2026-08-23_2026-09-21.csv`.
- Ajustes de la campaña: `2026-09-23-estado-cuenta-google-ads.md`.
- Search Console API, propiedades de dominio alquilame.co, alquilatucarro.com y alquicarros.com, del 2026-06-24 al 2026-09-21, consultada el 2026-09-24.
- Código del dashboard: `lib/attribution/derive-channel.ts` en rentacar-dashboard, regla 2 (el `gclid` manda).
- Política de Google Ads «Abuso de la red de publicidad: Ventaja desleal» (support.google.com/adspolicy/answer/15936768), leída el 2026-09-24. Por esta política el plan se queda en una sola marca.
