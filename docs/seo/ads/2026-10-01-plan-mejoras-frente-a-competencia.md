# Plan: mejoras de Google Ads frente a la competencia (alquilatucarro)

Fecha: 2026-10-01. Pedido del dueño: apuntar las tareas y ejecutarlas una por una. No se hace ningún cambio en la cuenta sin su visto bueno. Los cambios en la campaña principal «Búsqueda» se agrupan en un solo día, porque reinician el aprendizaje de la puja (ver `2026-09-23-grupos-genericos-y-marca.md`).

## Tareas

| # | Tarea | Dónde | ¿Reinicia el aprendizaje? |
|---|---|---|---|
| 1 | Enlaces de sitio en los 16 grupos de ciudad. Hoy solo los tienen «genericos» y «Marca» | Búsqueda | No. Son recursos |
| 2 | Anuncios más ajustados a cada ciudad y con más variedad: la ciudad y la diferencia en los títulos | Búsqueda, grupo por grupo | Puede influir. Hacerlo el mismo día que la tarea 4 |
| 3 | Medir la velocidad en móvil y escritorio frente a la competencia: Booking, LATAM, Kayak, Localiza, Alkilautos, Rentcars, Renting Colombia y Evolution. Usar PageSpeed Insights con las páginas de ciudad equivalentes | Fuera de la cuenta | No |
| 4 | Propuesta de puja para mejorar o sustituir «Maximiza las conversiones». Hoy se pierde el 36 % de las impresiones por ranking y el 17 % por presupuesto | Búsqueda | Sí. Va después de la revisión del 7 de octubre |
| 5 | Mensajes que muestren la diferencia con Booking, Budget, Green Motion y Localiza | Anuncios, textos destacados y extractos | No, salvo lo que diga la tarea 2 |

## Argumentos de diferencia: estado de la verificación

Vienen de otra sesión, con datos del 30 de septiembre. Antes de ponerlos en un anuncio, cada uno tiene que ser cierto, porque una promesa falsa se paga en el mostrador.

| Argumento | Comprobado contra | Estado |
|---|---|---|
| Conductor adicional y silla de bebé a $12.000 al día cada uno | Reservas de alquilatucarro desde el 1 de agosto: mediana de $12.000 al día en todas las gamas | ✔ Confirmado |
| Se paga al recoger, sin pago por adelantado | Portada: «Reserva Ahora, Paga Después», «sin pago anticipado» | ✔ Confirmado |
| Se paga en pesos | La tarifa sale en COP | ✔ Confirmado. Que Booking cobre en dólares viene de la otra sesión y no lo comprobé aquí |
| «No bloqueamos cupo en la tarjeta» | La FAQ de la portada dice que la tarjeta «debe tener cupo disponible suficiente para cubrir el valor del alquiler», y que el cliente debe «presentarse con cupo disponible» | ⚠ **Sin confirmar.** No es un bloqueo de garantía como el de Budget, pero sí exige cupo. Hay que confirmar con el dueño si en la sede se retiene algo. Si se retiene el valor del alquiler, la frase correcta sería «Sin depósito de garantía», y solo si es cierto |
| Seguro Total por $38.000 al día en la gama C | Reservas: mediana de $29.000 al día en las gamas C, CX, F y FX, y de $49.000 en las camionetas (GC, G4, GY, LE, LU) | ⚠ **No cuadra.** Puede ser una cuestión de IVA o una tarifa nueva. Confirmar antes de publicar un precio |
| Seguro Total con deducible en $0 | La portada no lo dice. La FAQ habla del «seguro Protección» y de lo que no cubre | ⚠ **Sin confirmar** |

**Dónde perdemos:** según la otra sesión, Budget y Green Motion salen entre $100.000 y $159.000 más baratos en el primer precio que ve el cliente. Ningún anuncio debe decir «más barato».

## Textos propuestos (otra sesión) y si se pueden usar ya

| Texto | ¿Se puede usar? |
|---|---|
| Pagas al recoger el carro | Sí |
| Nada que pagar por adelantado | Sí |
| Pagas en pesos, no en dólares | Sí. La comparación con Booking queda implícita |
| Silla de bebé $12.000 por día | Sí |
| Conductor extra $12.000/día | Sí |
| No bloqueamos cupo / Sin bloqueo en tu tarjeta | No, hasta que el dueño lo confirme |
| Seguro Total: deducible en $0 | No, hasta que el dueño confirme el deducible |
| «Reserva hoy sin pagar nada. Pagas en la sede, en pesos, y no te bloqueamos cupo.» | Solo la primera parte. Quitar «no te bloqueamos cupo» hasta confirmarlo |
| «Con Seguro Total tu deducible queda en cero…» | No, hasta confirmarlo |
| «Agrega conductor adicional o silla de bebé por $12.000 al día cada uno.» | Sí |
| «Tu tarjeta queda libre para el viaje: no congelamos cupo…» | No, hasta confirmarlo |

## Preguntas para el dueño

1. **El cupo.** Al entregar el carro, ¿se retiene o se cobra algo en la tarjeta? ¿Solo el valor del alquiler, o hay además un depósito de garantía?
2. **El Seguro Total.** ¿Cuánto cuesta hoy al día en la gama C, con IVA? ¿El deducible queda en $0?

## Respuestas del dueño y verificación (2026-10-01)

- **El cupo.** El dueño confirma que en la sede solo se cobra el valor del alquiler y que no se bloquea ningún valor en la tarjeta. «No bloqueamos cupo» y «Sin depósito de garantía» quedan confirmados. La FAQ de la web («cupo disponible suficiente para cubrir el valor del alquiler») se refiere al cobro del alquiler, no a un bloqueo.
- **El deducible.** En el paso de cobertura del asistente de reserva, el Seguro Total dice «Cubre el 100% del vehículo, daño o robo» y «Sin participación obligatoria». Deducible $0 confirmado.
- **Ojo: con el Seguro Básico el deducible NO es bajo.** Es $3.570.000 en carros y $4.200.000 en camionetas (tabla `rental_companies` del dashboard). Ningún anuncio puede decir «nuestros deducibles son bajos». Hay que decir «con Seguro Total, deducible $0».
- **El precio del Seguro Total.** La web pública no lo muestra: el recargo diario sale de la tarifa de cada mes y cambió el 1 de octubre. Las reservas de agosto y septiembre dan una mediana de $29.000 al día en carros y $49.000 en camionetas. Mientras no se mire en el asistente, los anuncios no llevan precio del seguro.
- **Lo que confirma la página de Bogotá:** el precio incluye seguro básico, impuestos y kilometraje ilimitado («Sin cargos ocultos ni sorpresas»), y el aeropuerto de Bogotá abre las 24 horas.

## Ideas de mensajes «otros… / nosotros…»

Todos los títulos tienen 30 caracteres o menos y todas las descripciones 90 o menos. Ninguno nombra a la competencia: se dice «otros» o «otras rentadoras».

**Títulos**

| Tema | Títulos |
|---|---|
| Tarjeta | No bloqueamos cupo · Tu tarjeta sin bloqueos · Cero bloqueo en tu tarjeta · Otros bloquean, aquí no · Sin congelar tu cupo |
| Pago | Pagas al recoger el carro · Nada que pagar por adelantado · Reserva gratis, paga después · Pagas en pesos, no en dólares · Precio en pesos, sin sorpresa |
| Seguro | Seguro Total: deducible $0 · Deducible $0 con Seguro Total · Sin reembolsos ni reclamos |
| Precio claro | Kilometraje ilimitado · IVA y seguro básico incluidos · Precio final, sin cargos extra |
| Extras | Conductor extra $12.000/día · Silla de bebé $12.000 por día |
| Cobertura y servicio | Aeropuerto Bogotá 24 horas · 19 ciudades de Colombia · Recoge en el aeropuerto · Chat 24 horas · Alquila desde los 18 años · Hasta 60 % reservando antes |

**Descripciones**

- Otras rentadoras bloquean millones en tu tarjeta. Nosotros no: pagas solo el alquiler.
- Otros cobran antes y en dólares. Aquí reservas gratis y pagas al recoger, en pesos.
- Otros cobran el daño y lo reembolsan después. Con Seguro Total tu deducible es $0.
- Con Seguro Total tu deducible es $0: sin reembolsos ni reclamos después.
- Reserva sin pagar nada. Pagas en la sede, en pesos, y no te bloqueamos cupo en la tarjeta.
- Tu cupo queda libre para el viaje: no congelamos dinero al entregarte el carro.
- Sin depósito de garantía: en la sede pagas el alquiler y te llevas el carro.
- El precio que ves ya trae IVA, seguro básico y kilometraje ilimitado. Sin cargos ocultos.
- Agrega conductor adicional o silla de bebé por $12.000 al día cada uno.
- Recoge en el aeropuerto de Bogotá, abierto 24 horas. 19 ciudades y más de 30 agencias.
- Reserva con antelación y ahorra hasta un 60 %. Sin pagar nada hasta el día de recogida.

**Límites:**
- «Aeropuerto Bogotá 24 horas» y la descripción del aeropuerto solo van en el grupo Bogotá.
- Los $12.000 de los extras valen para alquileres de hasta 3 días. Desde el cuarto día, Budget y Green Motion salen más baratos en extras, porque cobran una tarifa por todo el alquiler. Este argumento se usa como dato, no como «más barato».
