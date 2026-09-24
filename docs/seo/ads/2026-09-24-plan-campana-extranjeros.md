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

**El dashboard no guarda la campaña.** El sitio envía `utm_campaign`, pero la tabla de reservas solo guarda `utm_source`, `utm_medium` y `gclid`. Hoy no se puede separar en el dashboard una reserva de la campaña nueva de una de la actual.

## El plan en tres pasos

### Paso 0: requisitos antes de gastar

1. **Pasar la revisión del 7 de octubre.** La campaña actual está en aprendizaje por los cambios del 23 de septiembre. No conviene moverla antes.
2. **Guardar la campaña en el dashboard.** Es un cambio pequeño en rentacar-dashboard: una columna para `utm_campaign`. Sin eso, el resultado solo se ve en Google Ads, y ya sabemos que Google no ve casi la mitad de las reservas.
3. **Confirmar si los asesores atienden en inglés.** Casi la mitad de los clientes con pasaporte reservan con un asesor. Si el anuncio dice «English support» y nadie contesta en inglés, se pierde la venta.

### Paso 1: «Viajeros en Colombia», en inglés

Es el paso con más probabilidad de funcionar, porque va a donde está el cliente que ya reserva.

| Ajuste | Valor |
|---|---|
| Campaña nueva | «Viajeros – inglés», en la misma cuenta de alquilatucarro |
| Ubicación | Colombia, opción «Presencia», igual que la actual |
| Idioma | Solo inglés |
| Cambio en la campaña actual | Pasar el idioma de «Inglés y español» a «Español». Así las dos campañas no se pisan: quien usa Google en inglés ve la nueva, y el resto ve la actual |
| Presupuesto | Unos 20.000 COP al día. Hoy los términos en inglés gastan unos 14.000 al día dentro de la campaña actual, así que es sobre todo dinero que se mueve de una campaña a otra |
| Puja | Maximizar conversiones, sin CPA objetivo, igual que la actual |
| Grupos | Uno por ciudad con más reservas de pasaporte: Bogotá, Cartagena, Medellín, Armenia (Eje Cafetero) y Santa Marta |
| Palabras clave | Inglés con ciudad, en exacta y frase: «car rental cartagena», «rent a car cartagena airport», «cartagena car hire»… |
| Anuncios | En inglés. Deben decir que se recoge en el aeropuerto, que se reserva con pasaporte, los días y el seguro. Si el paso 0.3 lo confirma, también «Support in English on WhatsApp» |
| Landing | La página de la ciudad, que está en español. Es el punto débil de esta fase |

Por qué primero esto: el extranjero con pasaporte deja 1,65 veces más por reserva, alquila más días y toma más seguro. Hoy ve anuncios en español. Un anuncio en inglés en el momento de buscar debería subir el porcentaje de clics sin salir de Colombia.

Riesgo: cambiar el idioma de la campaña actual es tocar algo que funciona. Si al comparar dos semanas antes y después la campaña actual pierde más del 10 % de conversiones, se vuelve a «Inglés y español».

### Paso 2: prueba pequeña desde el exterior

Solo si el paso 1 funciona y el dashboard ya guarda la campaña.

| Ajuste | Valor |
|---|---|
| Campaña nueva | «Viajeros – exterior» |
| Ubicación | Estados Unidos y España, opción «Presencia». Excluir Colombia |
| Idioma | Inglés y español |
| Presupuesto | 30.000 COP al día |
| Palabras clave | Siempre con ciudad y «colombia»: «car rental cartagena colombia», «alquiler de carros cartagena colombia». Sin «colombia», «Cartagena» atrae búsquedas de la Cartagena de Murcia, «Medellín» las de Medellín en España y «Armenia» las del país |
| Negativas | «murcia», «españa», «spain», «yerevan», «armenia country» |
| Anuncios | Los del paso 1, más reserva anticipada y precio fijo en pesos |

España va por delante de Estados Unidos: tiene menos usuarios, pero convierte más del doble, y el sitio en español le sirve.

## Cómo se juzga

Cada campaña se evalúa a las 4 semanas contra la campaña actual, con los datos del dashboard y no solo con los de Google.

| Criterio | Paso 1 | Paso 2 |
|---|---|---|
| Reservas atribuidas | 8 o más | 5 o más |
| Coste por reserva en el dashboard | Hasta 25.000 COP | Hasta 35.000 COP |
| Precio medio de la reserva | 1,5 veces el nacional o más | 1,5 veces el nacional o más |
| Reservas que se usan | 40 % o más | 40 % o más |

Si no se cumple, se pausa la campaña y el presupuesto vuelve a la actual. Si la campaña se queda muy por debajo, hay que medir las llamadas del asesor antes de cerrarla, porque este cliente usa más al asesor.

## El paso que más movería la aguja

Una landing en inglés para Cartagena, Bogotá y Medellín. Con el sitio solo en español, el paso 2 parte con desventaja: Estados Unidos convierte al 1,67 % y Colombia al 5,74 %. Es un proyecto aparte, en el código del sitio, y conviene decidirlo según lo que muestre el paso 1.

## Preguntas para el dueño

1. ¿Los asesores y el WhatsApp atienden en inglés?
2. ¿El presupuesto del paso 2 es dinero nuevo o sale de la campaña actual?
3. ¿De qué países cree que vienen sus clientes con pasaporte? El dashboard no guarda la nacionalidad, solo el tipo de documento.

## Fuentes

- Dashboard, tabla `reservations`, reservas creadas desde el 2026-06-16, consultada el 2026-09-24 en modo lectura.
- Analytics, propiedad «alquilatucarro.com - GA4», informe «Detalles demográficos: País», del 25 de junio al 22 de septiembre de 2026.
- `docs/seo/data/ads/terminos-busqueda-2026-08-23_2026-09-21.csv`.
- Ajustes de la campaña: `2026-09-23-estado-cuenta-google-ads.md`.
- Política de Google Ads «Abuso de la red de publicidad: Ventaja desleal» (support.google.com/adspolicy/answer/15936768), leída el 2026-09-24. Por esta política el plan se queda en una sola marca.
