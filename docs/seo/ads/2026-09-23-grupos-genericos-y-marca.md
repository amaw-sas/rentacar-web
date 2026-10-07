# Google Ads: grupos «genericos» y «Marca» (2026-09-23)

Cuenta 685-952-6548 (Alquilatucarro.com), campaña «Búsqueda».

**Revisión pendiente: miércoles 7 de octubre de 2026.** Ese día se cumplen 14 días completos con los cambios vivos (del 23 de septiembre al 6 de octubre). Cómo hacerla está al final.

## Por qué se hizo

El 22 de septiembre revisamos los 3.178 términos de búsqueda del 23 de agosto al 21 de septiembre. La exportación está en `docs/seo/data/ads/terminos-busqueda-2026-08-23_2026-09-21.csv`.

La cuenta no tenía basura de intención. Uber, venta, con conductor, sin depósito y parecidos sumaban menos de 15.000 COP en el mes, así que las listas de negativas ya hacían su trabajo. El gasto que sobraba venía de la estructura:

- **Cada grupo de ciudad tiene una palabra en concordancia amplia** («alquiler de carros bogota», «alquiler de carros en barranquilla», y así). Google trata la ciudad como prescindible, así que «rent a car» o «alquiler de carros» sin ciudad entraban por cualquiera de los 14 grupos. Cuál ganaba lo decidía la subasta, no nosotros, y la persona de Bogotá podía terminar en la landing de Neiva.
- **La marca no era palabra clave.** «alquila tu carro» y «alquilatucarro» entraban por esas mismas amplias, con CPC de 685 COP en Bogotá y hasta 3.269 en Barranquilla.

El dueño decidió **no tocar las amplias de ciudad** porque traen el tráfico correcto. El arreglo fue sacar las búsquedas de cabeza a grupos propios.

## Línea base (23 ago – 21 sep, 30 días)

| Segmento | Clics | Coste (COP) | Conv. | CPA (COP) |
|---|---|---|---|---|
| Cuenta completa | 13.939 | 9.499.524 | 540,2 | 17.586 |
| Búsquedas sin ciudad, todos los grupos | 1.367 | 947.142 | 41,6 | 22.751 |
| Amplia de Bogotá, solo búsquedas sin ciudad | 701 | 474.222 | 18,0 | 26.360 |
| Búsquedas de marca | 181 | 116.821 | 9,6 | 12.118 |

Las 11 búsquedas genéricas que ahora tienen palabra exacta propia sumaban 629 clics, 451.156 COP y 20,1 conversiones de ese total. El resto es cola larga («renta de vehiculos cerca de mi», «alquiler de carro economico») y sigue entrando por las amplias de ciudad. Eso es a propósito.

Un 19 % del gasto (1,84 M COP) cae en «otros términos de búsqueda», que Google no muestra. No se puede auditar.

## Línea base por grupo

Con dos grupos nuevos, el total de la cuenta mezcla efectos. Cada grupo se compara contra sí mismo.

### Los dos grupos nuevos

No tienen historia propia. Su base son las mismas búsquedas que ahora les tocan, medidas en los 30 días anteriores dentro de los grupos de ciudad:

| Grupo | Búsquedas que absorbe | Clics | Coste (COP) | Conv. | CPA (COP) |
|---|---|---|---|---|---|
| genericos | las 11 exactas genéricas | 629 | 451.156 | 20,1 | 22.423 |
| Marca | las 5 exactas de marca | 181 | 116.821 | 9,6 | 12.118 |

### Los 14 grupos de ciudad

Datos del informe de grupos de anuncios, 23 ago – 21 sep, que cuadran con el total de la campaña. Las columnas «se va» salen del informe de términos y son la parte de cada grupo que ahora debería caer en «genericos» o en «Marca». La última columna es la base justa para comparar el 7 de octubre: el grupo sin esa parte.

| Grupo | Clics | Coste (COP) | Conv. | CPA | Se va a «genericos» | Se va a «Marca» | Base sin lo que se va · CPA |
|---|---|---|---|---|---|---|---|
| Bogotá | 4.005 | 2.717.504 | 142,6 | 19.064 | 206.579 COP · 5,0 conv | 79.729 COP · 7,3 conv | 2.431.196 COP · 18.660 |
| Barranquilla | 1.274 | 977.889 | 58,9 | 16.597 | 41.416 COP · 2,4 conv | 6.967 COP · 0,0 conv | 929.506 COP · 16.454 |
| Cartagena | 1.152 | 924.386 | 34,9 | 26.487 | 28.733 COP · 2,0 conv | 144 COP · 0,0 conv | 895.509 COP · 27.219 |
| Medellín | 668 | 663.773 | 32,0 | 20.736 | 60.500 COP · 3,8 conv | 21.937 COP · 0,4 conv | 581.336 COP · 20.859 |
| Montería | 885 | 585.979 | 24,5 | 23.937 | 5.080 COP · 1,0 conv | 1.533 COP · 0,0 conv | 579.366 COP · 24.675 |
| Santa Marta | 697 | 582.329 | 53,6 | 10.858 | 5.990 COP · 1,0 conv | 858 COP · 1,0 conv | 575.481 COP · 11.146 |
| Bucaramanga | 958 | 538.942 | 25,9 | 20.849 | 24.032 COP · 0,3 conv | 2.588 COP · 0,0 conv | 512.322 COP · 20.075 |
| Villavicencio | 833 | 474.605 | 46,2 | 10.275 | 16.002 COP · 2,5 conv | 0 | 458.603 COP · 10.487 |
| Ibagué | 868 | 419.863 | 32,2 | 13.031 | 10.728 COP · 0,0 conv | 1.047 COP · 0,0 conv | 408.088 COP · 12.666 |
| Cúcuta | 627 | 391.180 | 17,8 | 21.939 | 11.310 COP · 1,0 conv | 1.683 COP · 0,0 conv | 378.187 COP · 22.471 |
| Manizales | 685 | 360.298 | 28,2 | 12.772 | 25.993 COP · 1,1 conv | 319 COP · 1,0 conv | 333.986 COP · 12.811 |
| Valledupar | 467 | 308.422 | 15,9 | 19.385 | 2.176 COP · 0,0 conv | 16 COP · 0,0 conv | 306.230 COP · 19.248 |
| Armenia | 329 | 283.479 | 13,3 | 21.266 | 3.293 COP · 0,0 conv | 0 | 280.186 COP · 21.019 |
| Neiva | 491 | 270.874 | 14,1 | 19.157 | 9.324 COP · 0,0 conv | 0 | 261.550 COP · 18.497 |

Lo que dice la tabla:

- **Bogotá es donde más se mueve.** Suelta 286.000 COP, y su parte de marca convertía muy bien: 7,3 conversiones por 79.729 COP. Bogotá pierde conversiones baratas, así que su CPA puede subir un poco sin que haya empeorado nada.
- **Medellín suelta el 12 % de su gasto**, casi todo genérico. Es el grupo con más cuota perdida por ranking (57 %), así que el presupuesto liberado puede volver a Medellín en búsquedas con ciudad.
- **En Montería, Santa Marta, Valledupar, Armenia y Neiva casi no se mueve nada**, menos del 4 % del gasto. Si su CPA cambia mucho, la causa no son los grupos nuevos.
- **Ibagué, Valledupar, Armenia y Neiva no sacaban conversiones de estas búsquedas.** Para ellos el cambio solo ahorra gasto.

Los grupos Cali y Pereira siguen en pausa y quedan fuera de la comparación.

## Qué quedó en la cuenta

Verificado leyendo la cuenta el 2026-09-23.

### Grupo «genericos» (habilitado)

- **11 palabras exactas:** [alquiler de carros], [alquiler de carro], [alquiler carros], [renta de carros], [rentar carro], [alquiler de vehiculos], [rent a car], [renta car], [rentacar], [rent car], [car rental].
- **24 negativas del grupo:** las 14 ciudades en amplia, con y sin tilde (19 en total), y las 5 de marca en exacta.
- **Un anuncio adaptable «Apto»** con URL final en la portada, 15 títulos y 4 descripciones. Cada palabra clave aparece al menos una vez en el texto. La eficacia marcó «Buena».
- **La «concordancia de términos de búsqueda» está desactivada.** El asistente la traía marcada, y con ella las exactas se amplían a amplia.
- **7 enlaces de sitio** hacia secciones de la portada: #video (descuento del 60 %), #requisitos, #categorias, #arriendos-mensuales, #testimonios, #faqs y #sedes. Estaban «En proceso de revisión» al cierre.

### Grupo «Marca» (habilitado)

- **5 palabras exactas:** [alquila tu carro], [alquilatucarro], [alquila tu carro com], [alquilatucarro com], [alquila tu carro bogota]. «com» sin punto es a propósito: el informe de términos guarda así las búsquedas de «alquilatucarro.com», y Google ignora el punto.
- **Un anuncio de marca «Apto»** con el título «Alquila tu Carro Sitio Oficial». Reemplazó a una copia del anuncio de Bogotá.
- **Los mismos 7 enlaces de sitio**, reutilizados. Es un solo recurso asociado a dos grupos.
- **Sin negativas propias.** Con palabras exactas no hace falta.

### Los 16 grupos de ciudad (incluidos Cali y Pereira, en pausa)

Cada uno tiene 34 negativas propias. De ellas, **16 son las exactas del plan**: las 11 genéricas y las 5 de marca. Las otras 18 son las ciudades ajenas, que ya estaban antes de estos cambios. Revisamos los 16 grupos y a ninguno le falta una.

Una negativa exacta como [alquiler de carros] bloquea solo esa búsqueda sin más palabras. «alquiler de carros bogota» sigue entrando por la amplia de Bogotá.

## Cambios del mismo día que afectan la revisión

El 2026-09-23, después de crear los grupos, el dueño hizo dos cambios más. Los verifiqué en la cuenta:

- **AI Max quedó desactivado en la campaña.** Con él se apagan la personalización de texto y la expansión de URL final. Desde ese día cada anuncio lleva a su propia URL.
- **Cali y Pereira quedaron habilitados** y en estado «Apto». Son grupos sin base comparable: entre junio y agosto estuvieron activos poco tiempo (Cali 50 clics y 1 conversión, Pereira 127 clics y 2). El 7 de octubre se miran aparte, sin mezclarlos con el comparativo de los otros 14. Sus anuncios también llevan el título con «Alquier».

Los dos cambios mueven el total de la campaña. Por eso la revisión se hace grupo por grupo, como está en la tabla de arriba.

## Qué esperamos ver

La regla documentada de Google es que una palabra exacta idéntica a la búsqueda gana sobre cualquier amplia. La cuenta no tiene campaña de Máximo Rendimiento: «máximo rendimiento» era la puja «Maximiza las conversiones». Con eso:

1. «rent a car», «alquiler de carros» y las demás deberían aparecer en «genericos» y dejar de salir en los grupos de ciudad.
2. La marca debería aparecer solo en «Marca», con un CPC más bajo que los 685 a 3.269 COP de antes.
3. El CPA de Bogotá puede verse algo peor en el comparativo. Pierde «alquila tu carro bogota», que le daba 11 clics y 1,6 conversiones al mes y ahora va a «Marca».

## Cómo revisar el 7 de octubre

**Fase de aprendizaje.** El 23 de septiembre por la noche, Google mostraba la campaña «Apta (en fase de aprendizaje)», con 5 días restantes. La causa son los cambios de ese día: los grupos nuevos, AI Max apagado y Cali y Pereira activas. El aprendizaje debería terminar hacia el 28 o 29 de septiembre. En la revisión, compara sobre todo del 29 de septiembre al 6 de octubre: los días anteriores están distorsionados por el aprendizaje. Hasta que termine no se cambian presupuesto, puja, grupos ni palabras clave, porque cada cambio lo reinicia.

Periodo: **23 sep – 6 oct (14 días)**. La línea base es de 30 días, así que se compara por día o se multiplica la base por 14/30.

| Qué mirar | Dónde | Funcionó si |
|---|---|---|
| CPA de «genericos» | Grupos de anuncios | Menor de 22.423 COP, su propia base. Ideal si queda por debajo de 17.586, el de la cuenta |
| CPA de «Marca» | Grupos de anuncios | Cerca o por debajo de 12.118 COP, con más conversiones por el CPC más bajo |
| CPA de cada grupo de ciudad | Grupos de anuncios, mismo rango | Contra la última columna de la tabla por grupo, no contra su CPA total. Bogotá puede subir un poco por perder la marca |
| Búsquedas genéricas en grupos de ciudad | Términos de búsqueda, filtrar las 11 frases | Aparecen solo en «genericos» |
| Marca fuera de «Marca» | Términos de búsqueda, filtrar «alquila tu carro» y «alquilatucarro» | Aparecen solo en «Marca» |
| CPC de marca | Grupo «Marca» | Por debajo de 685 COP |
| Enlaces de sitio | Recursos › Enlaces de sitio | Los 7 «Aptos». Si Google rechaza alguno por apuntar a la misma página, cambiar #arriendos-mensuales por /tarifas |
| Gasto total diario | Campaña | Similar al de antes. Una caída fuerte indicaría que la cola larga dejó de entrar |
| Términos nuevos de marca | Términos de búsqueda | Si aparece una variante nueva con clics, añadirla a «Marca» y a las negativas |

Para la extracción: la tabla de Google Ads es virtual. Solo pinta unas 12 filas a la vez y hay que recorrerla con scroll. La flecha suelta junto a las fechas cambia el rango a «hoy». Para paginar, usar la flecha que está dentro del paginador de la tabla.


## Cambio del 2026-09-24: textos destacados y extractos de la campaña principal

Con el visto bueno del dueño. Según su experiencia, estos recursos no afectan el rendimiento. Se corrigieron en «Búsqueda» con vocabulario colombiano.

- **7 textos destacados reemplazados:**
  - «Ahorra Seperando hoy» → «Ahorra reservando antes»
  - «Planees diario y mensual» → «Alquiler diario y mensual»
  - «Cotiza y Reserva Rapido» → «Cotiza y reserva rápido»
  - «Carros Excelente Estado» → «Carros en perfecto estado»
  - «Usalo en Todo Colombia» → «Úsalo en toda Colombia»
  - «Camionetas 7 Puestos» → «Camionetas de 7 puestos»
  - «Kilometraje Sin Limite» → «Kilometraje sin límite». Se mantiene la promesa, que ya estaba. Falta confirmar que es cierta.
- **Quedan igual:** Precios sin sorpresas · Paga en Sede Sin Anticipo · Entrega en el aeropuerto · Flota nueva y variada · Soporte todos los días · Atención personalizada.
- **Extracto «Tipos».** Decía «Compacto Economico, Sedán Mecanico… Camioneta 4x4», pero la web hoy solo lista automáticos. Ahora dice «Compacto automático, Sedán automático, Sedán híbrido, Camioneta automática, Camioneta híbrida, Camioneta 7 puestos».
- **Los textos nuevos empiezan sin historial.** Los viejos tenían CTR y conversiones desde el 16 de junio. En la revisión del 7 de octubre, mira los recursos por separado de los grupos.


## Lectura temprana: términos del 23 al 26 de septiembre

Se leyó el informe de términos de búsqueda de «Búsqueda». En el periodo hubo 962 términos, 1.118 clics y 942.041 COP. Se extrajeron los 300 términos con más clics, que suman 1.002 clics, el 90 %. El resto tiene 1 clic o ninguno. La campaña estaba en fase de aprendizaje, así que las conversiones de estos días no sirven todavía para juzgar.

| Grupo | Términos | Clics | Coste | Conversiones |
|---|---|---|---|---|
| genericos | 22 | 59 | 59.559 COP | 1,19 |
| Marca | 7 | 29 | 27.543 COP | 0,18 |
| 16 grupos de ciudad | 271 | 914 | 746.013 COP | 39,25 |

**«genericos» está limpio.** Los 22 términos son genéricos y ninguno lleva ciudad. Los principales son «alquiler de carros» (14 clics), «rent a car» (8), «rentacar» (6) y «renta car» (5). Todos entran por sus exactas o por variantes cercanas, como «renta carro», «carros en alquiler» o «donde puedo alquilar un carro». No hace falta ninguna negativa. Su coste por conversión, unos 50.000 COP, es alto frente a los ~19.000 de la campaña, pero lleva 4 días y en aprendizaje. Se juzga el 7 de octubre.

**«Marca» tiene una fuga.** La exacta [alquila tu carro bogota] atrae, como variante cercana, búsquedas genéricas de Bogotá sin marca: «renta de carros bogota», «rentar carro bogota» y «rentar carros bogota». Suman 6 clics y 7.092 COP. Esas búsquedas ven el anuncio de marca «Sitio Oficial» en lugar del de Bogotá, y además compiten con el grupo Bogotá, donde «renta de carros bogota» tuvo 14 clics. Por su propio texto, esa exacta solo trajo 2 clics.

**La marca ya no se cuela en los grupos de ciudad.** Ninguna búsqueda con «alquilatucarro» o «alquila tu carro» cayó fuera de «Marca». Las negativas exactas funcionan.

**Los grupos de ciudad siguen recibiendo algunos genéricos por la amplia.** Son 24 términos, 33 clics (el 3,6 % de sus clics), 22.112 COP y 3 conversiones. Por ejemplo, «alquiler de carros colombia», «carros en alquiler» o «alquiler vehiculos» entran por la amplia de Bogotá. Las exactas de «genericos» no los bloquean, porque son variantes más largas. Por ahora el volumen es pequeño. También aparecen marcas de la competencia en la amplia de Barranquilla, como «quilla rent a car» y «quillami rent car» (6 clics, 0 conversiones).

**Propuesta. El dueño decide y se hace de una vez, después del aprendizaje (hacia el 29 de septiembre):**

1. **Pausar la exacta [alquila tu carro bogota] en «Marca».** Así se cierra la fuga, y las búsquedas genéricas de Bogotá vuelven a su grupo. Si prefieres conservarla, la alternativa es poner [renta de carros bogota], [rentar carro bogota] y [rentar carros bogota] como negativas exactas en «Marca».
2. **Opcional: negativas de competidores en Barranquilla,** «quilla» y «quillami».
3. **No hace falta ningún cambio en «genericos».** Se evalúa el 7 de octubre con los criterios de este informe.
4. **Los genéricos que entran por la amplia de ciudad se miran el 7 de octubre.** Si crecen, se decide si pasan a frase en «genericos».

## Pendientes que no son parte de este cambio

- Los anuncios de Barranquilla y Cartagena dicen «60% Dtos en **Alquier** de Carros». Llevan unos 2.400 clics con esa falta.
- Las negativas de ciudades ajenas de los grupos de ciudad están en una sola ortografía («medellín» sí, «medellin» no). En los 30 días no hubo ni un término con la ciudad cruzada, así que hoy no cuesta nada. Vale revisarlo si cambia.
- «aeropuerto» (41 clics, 0 conversiones) y «camioneta / suv» (102 clics, 0,5 conversiones). Antes de negativarlas conviene revisar a qué landing llegan.
- Amplia con cero conversiones en Ibagué, Neiva y Valledupar. Queda como candidata a pausar si sigue igual el 7 de octubre.
- Hay un aviso de saldo agotándose en la cuenta.

## Lectura de «Marca» del 2026-10-06 (desde el 23-sep)

Totales del grupo: 115 clics, 98.306 COP y 5,92 conversiones. Hay 4 palabras habilitadas.

| Palabra (exacta) | Clics | Coste | Conv. | Calidad |
|---|---|---|---|---|
| [alquila tu carro] | 43 | 33.830 COP | 3,98 | 10/10 |
| [alquilatucarro] | 38 | 30.671 COP | 0,56 | 10/10 |
| [alquilatucarro com] | 13 | 11.866 COP | 0 | 10/10 |
| [alquila tu carro com] | 7 | 7.019 COP | 0,38 | 8/10 (relevancia del anuncio por debajo de la media) |
| [alquila tu carro bogota], ya no habilitada | 14 | 14.920 COP | 1 | — |

- **La fuga de [alquila tu carro bogota] está cerrada.** De sus 31 términos, solo 1 era de marca. Los otros 30 eran genéricos de Bogotá («alquiler de carros bogota», «renta de carros bogota», «rent a car bogota»). Ya no está habilitada, así que el punto «pausarla» del día de cambios queda hecho.
- **Las 4 que quedan están limpias.** [alquila tu carro] solo recogió «renta tu carro» y «arrienda tu auto» (660 COP).
- **No se pausan las variantes «com».** Las 4 son negativas exactas en los 16 grupos de ciudad y en «genericos». Si se pausa una, su búsqueda puede quedarse sin anuncio, porque las negativas exactas no se amplían a variantes. Además no hay ahorro, y cualquier cambio reinicia el aprendizaje de «Búsqueda».

**Añadido a la revisión del 7 de octubre:** abrir la «Comparativa de subastas» de «Marca». Si ningún competidor puja por la marca, el orgánico ya sale primero y se puede hablar de pagar menos por marca. [alquilatucarro] convierte poco (CPA 54.817 COP contra 8.506 de [alquila tu carro]). Si alguien puja, se deja como está.

## Revisión del 2026-10-07 (periodo 29 sep – 6 oct, 8 días)

Leído en la cuenta y en el dashboard. No se cambió nada.

### Lo estructural funcionó

- **Las genéricas solo aparecen en «genericos».** De 1.571 términos, ninguna de las 11 búsquedas exactas sale en un grupo de ciudad.
- **La marca solo aparece en «Marca».** Hay dos excepciones de cola larga («alquila tu carro santa marta», 1.804 COP).
- **Lo genérico sin ciudad en los grupos de ciudad bajó.** Pasó de unos 365 clics y 253.000 COP esperables en 8 días a 58 clics y 38.924 COP. Bogotá concentra 25.382 COP.
- **El 1-oct Google quitó [renta car] de «genericos»** al aplicar una recomendación de «palabra clave redundante». Esa búsqueda ahora entra por [rentacar] como variante. Quedan 10 exactas.
- **«genericos» rinde mejor que su base:** CPA 17.879 COP contra 22.446, con 12,26 conversiones.

### Lo que no funcionó: el gasto subió y las reservas no lo siguieron

El dueño subió el presupuesto de «Búsqueda» el 1-oct (dos veces) y el 2-oct. Hoy está en 468.875 COP/día.

| Periodo | Gasto/día | Conv. Ads/día | CPA Ads | Reservas con gclid/día (dashboard) |
|---|---|---|---|---|
| Base 23 ago – 21 sep | 316.651 | 18,0 | 17.592 | 15,7 |
| 29 sep – 2 oct (antes de la subida) | 345.781 | 15,7 | 21.960 | 13,3 |
| 3 – 6 oct (después) | 576.260 | 19,6 | 29.449 | 18,3 |

- **Cada reserva extra salió cara.** La subida añadió unos 230.000 COP/día y trajo unas 4 conversiones de Ads más por día (5 reservas con gclid en el dashboard): entre 46.000 y 59.000 COP por reserva adicional, contra un promedio de unos 20.000.
- **Comparación de solo 4 días contra 4.** El segundo bloque incluye fin de semana y el primero no. Hay que confirmarlo con una semana completa.
- **Por grupo, contra la base sin lo que se fue:** el gasto diario subió en casi todos (Bogotá +54 %, Medellín +80 %, Neiva +81 %, Manizales +54 %). El CPA subió entre 26 % y 88 % en la mayoría. Bucaramanga (−8 %) y Neiva (−6 %) mejoraron.
- **Santa Marta se cayó de verdad:** 3 reservas con gclid en el dashboard contra 11,5 esperables, CPA de 73.118 COP en Ads. Barranquilla también bajó (9 contra 14,9). Medellín (11 contra 7,5) y Villavicencio (12 contra 10,4) subieron. Hay que investigar Santa Marta por separado: disponibilidad de la sede, precio o anuncio.
- **Cali y Pereira, sin base:** Cali gastó 73.725 COP, con 2 conversiones (CPA 36.863) y 65 % de impresiones perdidas por ranking. Pereira gastó 117.772 COP, con 5,76 conversiones (CPA 20.447). En el dashboard, 3 y 4 reservas con gclid. Pereira está en el promedio de la cuenta. Cali necesita más tiempo.

### «Marca»

- 58 clics, 48.498 COP y 0,38 conversiones. El CPC es de 836 COP, por encima del objetivo de 685. No cumple el criterio. Del 23 al 28 de septiembre había hecho unas 5,5 conversiones, así que 8 días es una muestra corta.
- **Comparativa de subastas (3 – 6 oct): sí hay competidores pujando en las búsquedas de marca.** Skyscanner aparece en el 60 %, Alkilautos en el 55 %, LATAM en el 52 %, Kayak en el 33 %, Booking en el 26 % y Viajes Falabella en el 19 %. Nosotros estamos en la posición superior absoluta el 95 % de las veces, y ellos el 0 %. Si se deja de pujar por la marca, esos anuncios quedarían encima del resultado orgánico. **Se mantiene «Marca».**

### Pendiente para decidir con el dueño

1. **Presupuesto de «Búsqueda».** Volver a unos 350.000 – 400.000 COP/día, o mantenerlo si la ganancia por reserva supera los ~50.000 COP que cuesta cada reserva extra. El dueño conoce el margen. Cualquier cambio reinicia el aprendizaje.
2. **Investigar Santa Marta** antes de tocar su grupo.
3. **Revisar de nuevo con una semana completa** (3 – 9 oct) antes de cambiar puja o grupos.

### Respuestas del dueño (2026-10-07) y cuenta de rentabilidad

- **Santa Marta:** hubo un problema de orden público. La caída no viene de la cuenta, así que no se toca el grupo. Se excluye de la evaluación hasta que se normalice.
- **Ganancia por reserva.** Depende de los días de alquiler y de la gama. Datos del dueño:

  | Mes | Reservas | Alquiler total | Columna 3 | Columna 4 |
  |---|---|---|---|---|
  | Septiembre 2026 | 472 | 208.390.381 | 31.258.557 | 34.401.097 |
  | Agosto 2026 | 444 | 229.250.569 | 34.387.585 | 37.538.843 |

  La columna 3 es el 15,0 % del alquiler. Se toma como la ganancia, entre 66.000 y 77.000 COP por alquiler realizado; con la columna 4 serían entre 73.000 y 85.000. Esta lectura falta confirmarla con el dueño.
- **Solo una parte de las reservas por anuncio se realiza.** De las 470 reservas con gclid del 23-ago al 21-sep: 164 «utilizado», 187 «no_recogido», 87 «cancelado» y 28 todavía «reservado». Se realiza entre el 35 % y el 41 %. Así, una reserva con gclid vale entre 23.000 y 30.000 COP de ganancia esperada.
- **Cuenta:** el costo promedio de 20.000 COP por reserva con gclid deja ganancia. Las reservas extra de la subida costaron entre 46.000 y 59.000 COP con gclid, y eso da pérdida. Pero ese mismo bloque también subió las reservas sin gclid (asesor y llamadas): el total pasó de 25,5 a 35,5 por día. Si esas también vienen de los anuncios, el costo extra cae a unos 23.000 COP por reserva, cerca del punto de equilibrio. **Se decide el 10-oct con la semana completa del 3 al 9 de octubre, mirando el total de reservas y no solo las que tienen gclid.**
