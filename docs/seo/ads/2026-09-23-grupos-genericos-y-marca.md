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

## Qué esperamos ver

La regla documentada de Google es que una palabra exacta idéntica a la búsqueda gana sobre cualquier amplia y sobre Máximo Rendimiento. Con eso:

1. «rent a car», «alquiler de carros» y las demás deberían aparecer en «genericos» y dejar de salir en los grupos de ciudad.
2. La marca debería aparecer solo en «Marca», con un CPC más bajo que los 685 a 3.269 COP de antes.
3. Parte del gasto de Máximo Rendimiento en esas búsquedas puede pasar a Búsqueda. Si pasa, no es gasto nuevo: es la misma plata cambiando de bolsillo.
4. El CPA de Bogotá puede verse algo peor en el comparativo. Pierde «alquila tu carro bogota», que le daba 11 clics y 1,6 conversiones al mes y ahora va a «Marca».

## Cómo revisar el 7 de octubre

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

## Pendientes que no son parte de este cambio

- Los anuncios de Barranquilla y Cartagena dicen «60% Dtos en **Alquier** de Carros». Llevan unos 2.400 clics con esa falta.
- Las negativas de ciudades ajenas de los grupos de ciudad están en una sola ortografía («medellín» sí, «medellin» no). En los 30 días no hubo ni un término con la ciudad cruzada, así que hoy no cuesta nada. Vale revisarlo si cambia.
- «aeropuerto» (41 clics, 0 conversiones) y «camioneta / suv» (102 clics, 0,5 conversiones). Antes de negativarlas conviene revisar a qué landing llegan.
- Amplia con cero conversiones en Ibagué, Neiva y Valledupar. Queda como candidata a pausar si sigue igual el 7 de octubre.
- Hay un aviso de saldo agotándose en la cuenta.
