# Punto 2: el andamiaje del blog y escribir de verdad

**Fecha:** 2026-08-03

**Dirigido a:** el dueño del negocio

## La idea corta

Este punto tiene dos trabajos distintos y los dos hacen falta.

El primero es montar el andamiaje: una forma ordenada y comprobable de escribir un artículo, revisar que no salga roto y copiarlo a Supabase para que aparezca en la web. El segundo es usar esa forma de trabajo para producir los doce artículos reales de la primera tanda: seis para Alquílame y seis para AlquilaTuCarro.

El andamiaje no es el blog visible. La vitrina ya existe. Hoy las páginas `/blog` de las dos marcas piden a Supabase la lista de artículos de su propia marca. Cuando alguien abre `/blog/nombre-del-articulo`, el sitio busca en la tabla `blog_posts` la combinación de marca y `slug`; el *slug* es el nombre corto que va en la dirección de internet, por ejemplo `alquiler-de-carros-en-cali`. Luego toma el texto guardado, lo interpreta como markdown —un archivo de texto sencillo con títulos, párrafos, listas y enlaces— y lo muestra con la imagen, la fecha, el autor, la tabla de contenido y los artículos relacionados.

Eso ya funciona en las dos marcas. No hay que rediseñar el blog ni reemplazar la forma como el cliente lo lee. Lo que falta está antes de esa vitrina: hoy el contenido vive únicamente en Supabase y no hay en el repositorio una copia original que se pueda revisar, comparar y proteger con pruebas automáticas.

El nuevo camino tampoco reemplaza el endpoint actual que recibe contenido de WordPress ni modifica las páginas que muestran el blog. El spec deja esas piezas por fuera. Los entregables técnicos nuevos están en la zona de producción de contenido: archivos, validador y sincronizador.

En producción el punto de partida es este: AlquilaTuCarro tiene 16 artículos, Alquílame tiene 1 y Alquicarros no tiene blog. Alquicarros no entra en este trabajo.

## Qué quiere decir “andamiaje”

Piensa en la publicación como una pequeña línea de producción. El archivo markdown es el original aprobado. El validador es el control de calidad. El script de sincronización es el mensajero que lleva una copia exacta a Supabase. Supabase sigue siendo lo que consulta la página, pero deja de ser el lugar donde se redacta.

El flujo acordado va en una sola dirección:

```text
archivo markdown en el repositorio
              ↓
      revisión y validador
              ↓
 script de sincronización
              ↓
  copia en Supabase, tabla blog_posts
              ↓
      blog visible en la web
```

La regla sencilla es: **el archivo manda; Supabase publica**. Nadie abre una fila en Supabase para “arreglar una comita”. Si el cambio vale, se hace en el archivo, pasa revisión y vuelve a subir por el mismo camino.

Se aceptó tener dos copias a cambio de ganar algo que hoy no existe: poder demostrar automáticamente que los enlaces y varias reglas editoriales están bien antes de publicar. No se pretende fingir que las dos copias nunca se pueden separar. Sí se pretende detectar esa separación antes de cada tanda y tener una respuesta clara cuando ocurra.

### Primera pieza: los markdown versionados

Los artículos nuevos se guardan en carpetas separadas por marca, bajo una estructura como `content/blog/alquilame/` y `content/blog/alquilatucarro/`. Cada artículo es un archivo markdown.

“Versionado” quiere decir que el repositorio conserva la historia: quién cambió el texto, qué cambió, cuándo cambió y cuál era la versión anterior. Si una cifra se corrige mal o se borra un párrafo útil, se puede ver la diferencia y recuperar la versión buena. También permite que la revisión del texto y la revisión técnica ocurran en la misma propuesta de cambio, antes de tocar producción.

Arriba de cada archivo habrá una ficha corta con los datos que la web necesita. En el mundo técnico esa ficha se llama *frontmatter*, pero no es más que el formulario del artículo: marca, título, descripción que aparece en Google, slug, imagen, texto alternativo de la imagen, autor, fecha, categoría, etiquetas y tiempo estimado de lectura, entre otros campos que cierre el formato definitivo. Debajo va el texto que leerá el cliente.

Junto a los artículos habrá dos archivos editoriales de apoyo. La parrilla, prevista como `docs/seo/parrilla-editorial.json`, dice qué tema y qué palabra clave le corresponden a cada artículo, a qué ciudad debe ayudar y con cuáles artículos se conecta. La lista negra, prevista como `docs/seo/lista-negra.json`, dice qué temas no se publican porque traen clientes que el negocio no puede atender, y distingue entre vetos duros y vetos suaves. Un veto duro, como alquilar para trabajar en aplicaciones o prestar servicio con conductor, bloquea el tema. Un veto suave, como “sin tarjeta de crédito”, permite conservar una respuesta existente que filtra al cliente, pero prohíbe crear un artículo nuevo para atraer más de esa búsqueda.

Esta primera pieza resuelve el problema de autoría y control. Sin ella, Supabase sigue siendo a la vez borrador, original y publicación. No habría una revisión clara, una historia confiable ni una base sobre la cual correr el validador. También volveríamos a depender de copiar y pegar texto a mano en una tabla.

En esfuerzo relativo, esta es la pieza técnica más pequeña de las tres. No significa crear doce archivos vacíos y ya. Hay que definir la ficha del artículo de forma compatible con las columnas que la web ya lee, separar bien las dos marcas, documentar el formato y preparar ejemplos que fallen de manera entendible cuando falte un dato. Aun así, es un trabajo acotado comparado con construir todo el validador o redactar los doce artículos.

### Segunda pieza: el validador de enlaces y reglas

El validador, previsto como `scripts/validate-blog-grid.ts`, es un programa que revisa los archivos antes de permitir su publicación. Corre en el computador de quien prepara el artículo y también en CI. CI significa la revisión automática que hace GitHub cada vez que se propone un cambio: si una prueba falla, la propuesta no se puede dar por buena hasta corregirla.

Su primer trabajo es revisar enlaces. Si alguien escribe `/calii` en vez de `/cali`, debe fallar y decir en qué archivo y línea está el error. Si enlaza a otro artículo del blog, ese destino tiene que estar entre los artículos nuevos de la parrilla o entre los que ya existen en producción. Si enlaza a una página externa que no existe, también debe avisar. La idea no es solo contar enlaces; es comprobar que llevan a un lugar real.

Su segundo trabajo es revisar la estructura de la parrilla. Debe avisar si un artículo queda huérfano, es decir, si nadie lo enlaza; si una ciudad prioritaria no recibe ningún enlace; si se intenta publicar un satélite antes de su pilar; o si se declara una conexión sin explicar por qué un lector querría seguirla. Esto último evita poner enlaces solo porque convienen en una hoja de SEO. Un enlace tiene que ayudar a continuar la lectura.

Su tercer trabajo es cuidar la separación de las marcas. Alquílame y AlquilaTuCarro tienen calendarios independientes. Un artículo de una marca no puede mencionar por error la otra. Tampoco se debe asignar la misma ciudad o el mismo tema a las dos marcas. La regla acordada es un artículo, un dominio. Si se publican dos textos casi iguales en dos sitios del mismo dueño, Google puede escoger uno y dejar el otro sin visibilidad; además, se paga dos veces por una sola oportunidad.

El validador también hace cumplir la lista negra, vigila que no se use siempre el título exacto como texto de enlace y detecta bloques artificiales de ciudades puestos al final solo para repetir palabras clave. Para los artículos de eventos, debe impedir que el año quede amarrado al slug, porque una dirección recurrente puede acumular historia y actualizarse la temporada siguiente.

Hay otro grupo de controles para los datos propios. La parrilla se diferencia porque usa reservas, búsquedas y preguntas reales del negocio. Eso exige tres límites: nunca se publica información personal; una cifra atribuida a una ciudad necesita por lo menos 100 reservas detrás; y toda cifra publicada debe guardar la consulta con la que se calculó, para poder repetirla más adelante. El diseño también contempla controles para no comparar sedes cuando una ciudad tiene una sola y para marcar cifras que ya no coinciden cuando se recalculan.

Sin esta pieza, los markdown serían apenas otra forma de guardar texto. Podríamos conservar la historia, pero todavía publicaríamos enlaces rotos, artículos huérfanos, datos sin respaldo o un satélite que apunta a un pilar inexistente. La razón principal por la que se aceptaron dos copias —archivo y Supabase— desaparecería.

Esta es la parte técnica de mayor esfuerzo. Hay muchas reglas, varios tipos de destino y mensajes de error que deben servirle a una persona, no solo decir “falló”. Además, cada regla necesita su propia prueba: un ejemplo que debe pasar y otro que debe fallar. Después hay que conectarlo a la revisión automática de GitHub. El trabajo no es difícil por la cantidad de código, sino por la cantidad de errores reales que debe distinguir sin bloquear un artículo correcto por accidente.

### Tercera pieza: el script de sincronización a Supabase

El script de sincronización, previsto como `scripts/sync-blog-posts.ts`, toma un markdown ya aprobado, traduce su ficha a las columnas de `blog_posts` y copia el cuerpo del artículo. La llave es marca más slug. Esa combinación evita mezclar, por ejemplo, un artículo de Alquílame con uno de AlquilaTuCarro.

La operación acordada es un *upsert*, que en palabras corrientes significa “créalo si no existe; actualiza esa misma fila si ya existe”. Debe ser idempotente, otra palabra técnica que aquí solo quiere decir que correrlo dos veces con el mismo archivo no crea dos artículos ni produce un resultado diferente.

El script tendrá un modo de comprobación, `sync --check`. Ese modo compara los archivos que administra el repositorio con sus copias en Supabase y reporta diferencias sin publicar. Se corre antes de cada tanda. Si alguien cambió una fila por fuera, el proceso se detiene hasta aclarar cuál texto es correcto. Como el archivo es el original, lo normal será restaurar Supabase desde el archivo. Si el cambio manual sí era válido, primero se pasa al markdown, se revisa y luego se sincroniza.

El sincronizador debe aceptar únicamente las dos marcas del alcance. No puede “descubrir” una tercera marca y publicar en Alquicarros. Tampoco debe borrar filas porque no encuentre un archivo. Su trabajo acordado es crear o actualizar por marca y slug, no igualar la tabla mediante borrados.

Sin este script, alguien tendría que pasar a mano el título, la descripción, el cuerpo y todos los demás datos a Supabase. Ese paso manual podría cambiar un slug, escoger la marca equivocada, perder un enlace o subir una versión anterior. También permitiría saltarse el validador. En poco tiempo dejaríamos de saber si el archivo y la fila dicen lo mismo.

En esfuerzo relativo, esta pieza es mediana. Es más trabajo que abrir las carpetas y acordar el formato, pero menos que cubrir todas las reglas del validador. Hay que mapear los campos, limitar las marcas, implementar la comparación, manejar errores sin dejar al usuario adivinando y comprobar que, después de subir, las rutas públicas de lista y detalle devuelven el artículo correcto.

El diseño todavía no define quién tendrá permiso para ejecutar el script ni si se disparará manualmente o desde una automatización después de aprobar el cambio. Tampoco fija el comando final aparte de los nombres propuestos para el script y su modo `--check`. Eso se debe decidir al implementarlo; no conviene inventarlo en esta explicación.

## Cómo será publicar un artículo en el día a día

Una vez montado el andamiaje, publicar deja de ser “entrar a Supabase y pegar un texto”. El recorrido normal será este.

### 1. Escoger el artículo en el calendario de su marca

Primero se trabaja sobre la parrilla aprobada de Alquílame o sobre la de AlquilaTuCarro. No se toma un tema de la otra marca ni se duplica una ciudad. Para cada tanda se confirma la palabra clave con datos recientes; comprometer hoy la palabra clave del artículo 28 sería fingir que las búsquedas no cambian.

Antes de escribir prosa se aprueban el tema, el título principal, el ángulo, la ciudad que recibirá apoyo y los enlaces previstos. También se revisa que el tema no esté vetado y que no repita uno de los artículos vivos.

### 2. Investigar y guardar el respaldo

El redactor no arranca llenando páginas con consejos genéricos. Reúne las cifras propias que sostienen el artículo, revisa las consultas reales de búsqueda, las preguntas de clientes y las fuentes externas que hagan falta. Si usa una cifra interna, guarda al lado la consulta con la que salió. Si el dato de una ciudad no llega al piso de 100 reservas, no lo publica como una conclusión sobre esa ciudad.

No hay un número obligatorio de palabras para estos doce artículos en el diseño principal. La medida es que el artículo responda bien la pregunta y aporte algo que un agregador no pueda copiar, no que llegue a una cuota de relleno.

### 3. Escribir primero el pilar

Dentro de cada clúster se empieza por el pilar. Un clúster es un pequeño grupo de tres artículos sobre un mismo asunto: un pilar y dos satélites. El pilar responde la pregunta amplia y sirve como centro. Los satélites responden preguntas más puntuales y enlazan de vuelta al pilar.

Si el satélite se escribe primero, queda obligado a enlazar una página que todavía no existe o sale sin el enlace que le da contexto. Por eso el orden no es decorativo. Se puede publicar todo el clúster en una misma tanda, pero el pilar debe existir y estar validado antes de soltar un satélite por separado.

### 4. Crear el markdown y completar su ficha

Se crea el archivo en la carpeta de la marca correcta. La ficha superior lleva los datos del artículo y el texto va debajo. El slug no se improvisa al final: sale de la parrilla y, una vez publicado, se trata como una dirección estable. Cambiarlo después puede dejar enlaces y resultados de Google apuntando a una ruta vieja.

Las imágenes también deben tener una dirección válida y una descripción útil para quien no puede verlas. El texto incluye sus enlaces dentro de párrafos donde tengan sentido; no termina con una lista mecánica de ciudades.

### 5. Pasar la revisión local

Antes de proponer el artículo, se corre el validador. El redactor corrige los enlaces rotos, los campos faltantes, las reglas de marca, los datos sin respaldo y cualquier error de estructura. También abre una vista local para leer el artículo como lo verá el cliente: títulos, imagen, tabla de contenido, enlaces, llamada a reservar y versión móvil.

El validador no reemplaza una lectura humana. Puede comprobar que una URL existe; no puede decidir por sí solo si un párrafo es claro, si una afirmación comercial es cierta o si el tono suena a la marca.

### 6. Proponer el cambio y dejar que CI lo revise

El artículo entra al repositorio mediante una propuesta de cambio. Ahí se ve exactamente qué texto se agrega. GitHub vuelve a correr el validador en CI, la revisión automática, para que nadie dependa de haber ejecutado todo correctamente en su computador.

El dueño o la persona responsable revisa el contenido, las cifras, las promesas al cliente y los enlaces estratégicos. Cuando el texto y las pruebas están aprobados, el markdown se integra al repositorio. Desde ese momento esa versión es el original oficial.

### 7. Comparar y sincronizar

Antes de publicar se ejecuta `sync --check`. Si aparecen cambios inesperados en una fila que ya estaba administrada por archivos, se para y se resuelve la diferencia. Después se corre la sincronización real. El script crea o actualiza la fila con la combinación correcta de marca y slug.

La misma sincronización se puede repetir sin duplicar el artículo. Si falla a mitad del proceso, no se debe asumir que todo quedó bien: se revisa qué alcanzó a subir, se corrige la causa y se vuelve a correr. El diseño no dice si toda una tanda quedará protegida como una sola operación indivisible, así que esa conducta debe probarse durante la implementación.

### 8. Comprobar la publicación

Al final se abre el listado del blog de la marca y la dirección individual del artículo. Se revisan el título, la imagen, el cuerpo, los enlaces y la marca. El código actual también obtiene de `blog_posts` el contenido del sitemap —la lista que ayuda a los buscadores a descubrir páginas— y del RSS —el canal de novedades del blog—, así que la fila correcta alimenta esas salidas sin mantener listas manuales separadas.

Que el artículo aparezca en la web no significa que Google lo posicione ese mismo día. Publicar es inmediato para el negocio; rastrear, indexar y ganar posiciones puede tomar días o semanas.

### 9. Actualizar por el mismo camino

Si después cambia una cifra, un enlace o una explicación, se edita el markdown. Se repiten revisión, CI, comparación y sincronización. No se abre Supabase para saltarse el proceso. Una fecha visible solo cambia cuando el contenido cambió de manera sustancial; agregar un enlace técnico no convierte un texto viejo en un artículo “nuevo”.

## Qué puede salir mal y cómo lo evitamos

### Alguien edita directamente en Supabase

Este es el riesgo más obvio de haber aceptado dos copias. La web puede llegar a mostrar ese cambio porque lee la tabla, pero el repositorio no lo conoce. La edición no pasó por validación, no tiene historia y puede incluir un enlace roto o una promesa no aprobada.

En la siguiente comparación, `sync --check` debe reportar que la fila y el archivo ya no coinciden. Si luego se ejecuta la sincronización sin pasar el cambio al archivo, la versión del markdown pisa la edición manual. Esa pérdida no es un error del sistema: es la consecuencia deliberada de que el archivo sea el original.

La prevención tiene tres capas. La regla operativa prohíbe editar filas a mano. La comparación descubre la diferencia antes de cada tanda. Y los permisos de Supabase deberían dejar la escritura en pocas manos, aunque el detalle de esos permisos no está definido en el spec de la parrilla.

### El sincronizador toca los 16 artículos vivos

No debe hacerlo. Los 16 artículos actuales de AlquilaTuCarro son posiciones y tráfico reales del sitio que factura. La decisión es enlazar hacia ellos, no reescribirlos, migrarlos ni “mejorarlos” dentro de este punto.

Esos 16 siguen en Supabase como contenido legado, es decir, contenido anterior al nuevo flujo. El validador conoce sus slugs para permitir que los artículos nuevos los enlacen, pero el sincronizador solo administra los markdown nuevos. Como la operación es crear o actualizar por marca y slug, y no borrar lo que falte en el repositorio, los 16 permanecen intactos.

Para hacer cumplir esa decisión, la implementación debe rechazar un markdown nuevo que use por accidente la misma combinación de marca y slug de uno de esos 16. El documento rector no explica el mecanismo exacto de esa protección, pero el resultado exigido sí es claro: una colisión no puede sobrescribir un artículo vivo.

El artículo que ya existe en Alquílame tampoco hace parte de los doce nuevos. El trabajo de esta primera tanda no necesita borrarlo ni reemplazarlo. Si más adelante se decide convertir un artículo legado al nuevo flujo, primero habrá que traer su versión publicada a un markdown, revisarla y tratar esa migración como una misión aparte.

Si los doce nuevos se publican sin retirar nada, AlquilaTuCarro pasaría de 16 a 22 artículos y Alquílame de 1 a 7. Alquicarros seguiría sin blog.

### Se cruza una marca o se repite un tema

Un archivo puede quedar en la carpeta equivocada, llevar una marca incorrecta en su ficha o hablar de la otra empresa. También puede aparecer la misma ciudad en los dos calendarios. El validador debe bloquear esas tres situaciones. Separar carpetas ayuda, pero no basta; la regla se comprueba con los datos de la parrilla y con el contenido.

### Se publica un satélite sin centro

Un satélite publicado antes de su pilar queda débil y obliga a reparar enlaces después. El validador bloquea ese orden. Si una tanda completa contiene los tres artículos, los enlaces se prueban contra los tres antes de sincronizar. Si la publicación se parte, sale primero el pilar.

### Un enlace “sirve para SEO” pero no para el lector

Agrupar ciudades porque al negocio le dan números parecidos no crea una relación útil. Ya ocurrió en el diseño inicial con Bogotá y Barranquilla: estaban juntas por desempeño interno, pero al lector de una ciudad no le resolvía nada la otra. La parrilla exige declarar la razón de lectura de cada conexión y el validador bloquea un enlace sin esa razón.

### Una cifra es cierta hoy, pero no se puede defender mañana

Si no se guarda la consulta, dentro de seis meses nadie sabrá cómo se calculó un porcentaje. Si se publica con pocos casos, puede parecer una regla cuando solo fue una casualidad. El piso de 100 reservas, la consulta guardada y el recálculo periódico reducen ese riesgo. Los datos personales nunca entran al artículo; solo se usan totales y promedios permitidos.

### El script falla o se ejecuta dos veces

Ejecutarlo dos veces no debe duplicar nada porque usa la misma combinación de marca y slug. Si hay un error de conexión o un dato inválido, debe detenerse con un mensaje claro. Después se comprueba la tabla y la ruta pública antes de declarar publicada la tanda. Lo que no se debe hacer es completar a mano las filas que faltaron, porque eso vuelve a romper la dirección única.

## Qué significa “escribir de verdad”

Montar carpetas, pruebas y scripts no produce tráfico por sí solo. “Escribir de verdad” significa entregar doce artículos completos, investigados, revisados, con imágenes y enlaces útiles; no doce títulos, esquemas o borradores inflados.

La estructura acordada para la primera tanda es la misma en cada marca: dos clústeres. Cada clúster tiene un pilar y dos satélites. Eso da tres artículos por clúster, seis por marca y doce en total. Las marcas tienen calendarios independientes, así que un clúster de Alquílame no obliga a AlquilaTuCarro a cubrir lo mismo.

El pilar es la respuesta amplia que queremos convertir en referencia. Recibe enlaces de sus satélites y concentra autoridad. Un satélite toma una necesidad más específica, la responde a fondo y lleva al lector al pilar cuando necesita el panorama completo. El satélite no es un artículo corto por definición; es específico por función.

Para AlquilaTuCarro, la tabla actual sí muestra dos clústeres completos de la primera tanda:

1. Tolima y Llano parte de **Alquiler de carros en Villavicencio** como pilar. Sus satélites son **Alquiler de carros en Ibagué** y **Reservar hoy para hoy: qué queda**.
2. Eje Cafetero parte de **Alquiler de carros en Armenia** como pilar. Sus satélites son **Alquiler de carros en Manizales** y **Con cuánta anticipación reservar, según la ciudad**.

Cada título tiene una razón basada en datos del negocio. Villavicencio muestra mucha búsqueda para el mismo día; Ibagué se comporta distinto en anticipación; Armenia y Manizales permiten comparar demanda y variedad; el artículo de anticipación conecta esas diferencias sin fingir que todas las ciudades reservan igual.

Para Alquílame, el documento marca hoy seis artículos como primera tanda:

1. **Alquiler de carros en Medellín**.
2. **Alquiler de carros en Santa Marta**.
3. **Alquiler de carros en Cali**.
4. **Buscan una semana, reservan tres días**.
5. **Guía de alquiler para el visitante extranjero en Colombia**, que es la reformulación acordada del título que antes se apoyaba solo en la palabra “coches”.
6. **Alquiler de carros en Pereira**.

Aquí hay un descuadre que se debe resolver antes de escribir. En esa misma tabla, Medellín y Cali aparecen como pilares de dos silos, Santa Marta y el artículo de duración aparecen como sus satélites, pero la guía para extranjeros y Pereira aparecen como pilares de otros silos. Así, los seis títulos marcados no forman dos grupos completos de un pilar y dos satélites, aunque esa estructura sí es una decisión confirmada.

No conviene tapar ese hueco con criterio del redactor. Antes de la primera línea de prosa hay que aprobar cuáles serán los dos satélites que completan los clústeres de Medellín y Cali, o aprobar una reorganización expresa de los seis. La decisión de fondo no cambia: Alquílame entrega dos clústeres completos, no cuatro inicios de silo.

También hay un descuadre aritmético en el mapa completo. La decisión confirmada habla de 11 silos y 32 espacios, pero las tablas visibles del spec enumeran 14 espacios de Alquílame y 17 de AlquilaTuCarro, para un total de 31. Para este trabajo manda la decisión confirmada de 32; falta agregar o identificar el espacio que no quedó enumerado. Esto no cambia que la primera tanda sea de doce, pero sí debe quedar limpio antes de que el validador use la parrilla como fuente de verdad.

El orden recomendado dentro de la tanda es cerrar primero los cuatro pilares —dos por marca—, validarlos y luego escribir sus ocho satélites. Si todo se publica en una sola salida, los doce pueden sincronizarse juntos después de que el grafo completo pase. Si se publican por partes, cada pilar sale antes que sus dos satélites. Nunca al revés.

## Cuánto trabajo es y en qué orden conviene hacerlo

El spec no trae estimaciones de horas o días. Dar una cifra cerrada sería inventar precisión. Sí permite comparar el tamaño de las partes y ordenar el trabajo con sentido.

| Parte | Esfuerzo relativo | Por qué |
|---|---|---|
| Cerrar la parrilla de la tanda | Bajo a medio | La estrategia ya existe, pero hay que corregir los dos descuadres y aprobar la asignación final de Alquílame. Bloquea todo lo demás. |
| Definir carpetas y formato markdown | Medio | Hay que hacer compatible la ficha del archivo con lo que `blog_posts` y la web ya esperan. Es acotado y se hace una vez. |
| Construir el validador y conectarlo a CI | Alto | Es la pieza técnica más grande: enlaces, marcas, silos, vetos, datos propios, orden de publicación y mensajes útiles, cada uno con pruebas. |
| Construir `sync` y `sync --check` | Medio | El mapeo es directo, pero la comparación, los límites de marca, los errores y la protección del contenido legado necesitan pruebas cuidadosas. |
| Investigar y respaldar los doce artículos | Alto | Cada artículo necesita datos frescos, consultas reproducibles, revisión de intención y fuentes. Parte del material ya existe en `docs/seo/`, pero no reemplaza el cierre de cada texto. |
| Redactar, ilustrar y revisar los doce | Muy alto | Es el bloque más grande en volumen humano. Son doce productos editoriales completos, no una sola plantilla repetida. |
| Publicar y comprobar la tanda | Medio | Incluye comparación, sincronización, revisión en las dos marcas y corrección de cualquier diferencia. |

El orden práctico sería este:

1. Corregir la parrilla: completar los 32 espacios en el mapa y convertir los seis de Alquílame en los dos clústeres acordados.
2. Cerrar el formato del markdown y las reglas de la ficha del artículo.
3. Construir el validador con sus pruebas y conectarlo a CI.
4. Construir el sincronizador, incluido `--check`, y demostrar que no toca los 16 artículos vivos.
5. Hacer pasar por el flujo un artículo controlado antes de confiarle una tanda completa. El spec no define si esa prueba usa un entorno aparte o una fila de prueba; ese detalle se decide en la implementación sin experimentar a ciegas sobre un artículo vivo.
6. Investigar y escribir primero los cuatro pilares aprobados.
7. Escribir los ocho satélites con sus enlaces hacia los pilares y las ciudades correspondientes.
8. Revisar los doce como un conjunto: enlaces, huérfanos, cruces de marca, datos, imágenes y promesas comerciales.
9. Sincronizar y comprobar una marca a la vez, aunque los doce viajen en una misma propuesta de cambio. Así, si algo falla, se sabe en cuál calendario ocurrió.

No conviene escribir los doce primero y construir el control al final. Eso obligaría a adaptar textos ya terminados a reglas que todavía no se probaron y multiplicaría las correcciones. Tampoco conviene publicar uno por uno mientras el mapa sigue incompleto. Primero se construye la carretera; después se mueve la carga.

## Qué queda al terminar este punto

El resultado no es solo “doce artículos arriba”. Queda una forma repetible de producir el artículo 13, el 20 o el 32 sin volver a inventar el proceso.

Al terminar habrá dos calendarios independientes, archivos originales revisables, un control automático que bloquea enlaces y decisiones rotas, y una copia de publicación en Supabase que se puede comparar con el repositorio. Los 16 artículos vivos de AlquilaTuCarro quedan intactos y disponibles como destinos de enlace. Alquicarros queda fuera. Y los doce nuevos salen como cuatro clústeres completos: dos por marca, cada uno con su pilar antes de sus satélites.

La ganancia real del andamiaje no es técnica. Es comercial: reduce la posibilidad de pagar por contenido que termina invisible, roto, duplicado entre marcas o sustentado en una cifra que nadie puede volver a explicar.
