---
brand: alquilame
slug: pico-y-placa-colombia-camaras-fotodeteccion
title: "1.339 cámaras de fotodetección y un pico y placa escrito a mano"
meta_title: "Pico y placa en Colombia: 1.339 cámaras y normas que nadie puede leer | Alquílame"
description: "El país publica dónde está cada una de sus 1.339 cámaras de fotodetección. Saber si hoy puedes sacar el carro es mucho más difícil. Revisamos las fuentes oficiales de 24 municipios."
image: /img/blog/pico-y-placa-fotodeteccion.webp
alt: "Cámara de fotodetección montada en un poste sobre una avenida arbolada, con el tráfico desenfocado al fondo"
author_name: Diego Melo
author_avatar: /img/blog/author-avatar.png
date: 2026-08-19
category: tips
tags:
  - pico-y-placa
  - datos-abiertos
  - movilidad
  - multas
  - colombia
reading_time: 12
featured: true
---

El país sabe dónde está cada una de sus 1.339 cámaras de fotodetección. Saber si hoy puedes sacar el carro es más difícil: el pico y placa cambia de ciudad en ciudad, y en varias toca revisar Facebook.

El decreto que hoy regula el pico y placa en Cali es el 4112.010.20.0814 de 2026. Son noventa y nueve páginas escaneadas: fondo gris de escáner, hojas ligeramente inclinadas, marcas de borde. En la primera página, el número 0814 y la fecha Junio 26 están escritos a mano con bolígrafo, en los espacios en blanco de un formato impreso.

![Encabezado de la primera página del Decreto 4112.010.20.0814 de 2026 de la Alcaldía de Santiago de Cali. Sobre el formato impreso, el número 0814 y la fecha Junio 26 aparecen escritos a mano con bolígrafo](/img/blog/decreto-cali-manuscrito.webp)

*Primera página del decreto que hoy regula el pico y placa en Cali. El número y la fecha están escritos a mano sobre el formato impreso. Captura del 18 de agosto de 2026. El archivo, de 99 páginas, se publica como `RuuRiuvHgo1785512563.pdf` — un nombre sin relación con el número del decreto.*

Ese documento es la única fuente autoritativa de qué placas pueden circular hoy en la tercera ciudad del país.

El mismo Estado, el mismo año, publica esto en `fotodeteccion.ansv.gov.co`: una tabla pública con **1.339 ubicaciones de cámaras de fotodetección**, que cualquiera puede descargar entera y sin registrarse. Cada una trae latitud y longitud, dirección exacta, tipo de tecnología, entidad administradora, fecha de inicio de operación, fecha de vencimiento de la autorización, enlace al oficio de aprobación y —lo más fino— el listado de códigos de infracción que ese punto específico está habilitado para detectar. Se descarga con un comando. Tiene marca de tiempo del día.

| | |
|---|---|
| **Cómo te sanciona** | **1.339** ubicaciones con coordenadas exactas y dirección, cada una con la lista de infracciones que puede sancionar. Se actualiza a diario. |
| **Qué te prohíbe** | **0** conjuntos de datos de pico y placa en datos.gov.co para Bogotá, Medellín o Cali. |

Esa asimetría es el tema de este artículo. No es una queja abstracta sobre gobierno digital: se puede medir, y la medimos.

## Qué hicimos

Entre el 18 y el 19 de agosto de 2026 revisamos **las fuentes oficiales de pico y placa de veinticuatro municipios colombianos**. Para cada uno buscamos cuatro cosas: si la medida está vigente, dónde vive la norma, qué tan fresca está esa fuente, y qué tan difícil es leerla de forma automatizada.

Todo el acceso se hizo navegando los sitios públicos, sin credenciales y sin eludir ningún control. Cada dato de este artículo tiene URL y cita textual. Donde no pudimos verificar algo, lo decimos: hay una sección de huecos declarados al final, y es deliberado — sería incoherente publicar un texto sobre verificación sin declarar la propia.

Las veinticuatro no son un censo. Nadie tiene el censo: no existe una lista oficial de municipios colombianos con restricción vehicular vigente. Ni el Ministerio de Transporte ni la Agencia Nacional de Seguridad Vial la publican. Cada alcaldía expide lo suyo y nadie consolida.

## Lo que el Estado hace bien

Conviene decirlo primero, porque el registro de la ANSV merece el elogio.

La Ley 1843 de 2017 obliga a autorizar y señalizar cada sistema de detección electrónica de infracciones. De esa obligación salió un registro público que hoy es, probablemente, uno de los mejores conjuntos de datos abiertos de infraestructura del país. Trae 813 solicitudes de autorización, 1.339 ubicaciones, y para cada una, la lista de códigos de infracción que está habilitada para detectar.

Contando sobre ese archivo: **355 cámaras están operando hoy en Colombia, y 314 de ellas están autorizadas para detectar el código C.14.**

El C.14 es el de pico y placa. Artículo 131 de la Ley 769 de 2002, modificado por el artículo 21 de la Ley 1383 de 2010:

> «C.14 Transitar por sitios restringidos o en horas prohibidas por la autoridad competente. Además, el vehículo será inmovilizado.»
>
> — Código Nacional de Tránsito, artículo 131 literal C

| Municipio | Cámaras operando con C.14 |
|---|---|
| Bogotá | 88 |
| Cali | 67 |
| Medellín | 39 |
| Barranquilla | 29 |
| Manizales | 23 |
| Cúcuta | 15 |
| Itagüí | 13 |
| Rionegro · Bello | 7 c/u |
| Barrancabermeja | 5 |
| Santa Marta · Sabaneta · Envigado | 4 c/u |
| Soledad · Popayán | 3 c/u |
| Pasto | 2 |
| Puerto Colombia | 1 |

*Conteo propio sobre el archivo de datos que publica la ANSV (`sast.json`), filtrando por estado de operación «Operando» y presencia de C.14 en la lista de infracciones autorizadas.*

**Una advertencia sobre este número.** El C.14 no es solo pico y placa. Es «transitar por sitios restringidos o en horas prohibidas», y cubre también restricciones a motocicletas, a carga y a corredores específicos. En Barranquilla, que no tiene pico y placa desde julio de 2025, el C.14 es la infracción número uno — y al desglosarlo por clase de vehículo, el 80% son motocicletas.

Cualquiera que use estas cifras debe desglosarlas por clase de vehículo y contrastarlas contra si el municipio tiene la medida. Nosotros lo hicimos y por eso lo advertimos.

## Lo que el Estado hace mal

Del otro lado está la norma. Esto es lo que encontramos en las veinticuatro fuentes oficiales:

| Municipio | Dónde vive la norma de pico y placa |
|---|---|
| Medellín | El propio sitio entrega los datos listos para consultar, con fecha de última modificación |
| Bucaramanga | Igual, aunque escondido en una dirección poco evidente |
| Cúcuta | Igual. Pero no ha publicado nada sobre pico y placa en todo 2026 |
| Bogotá | Consulta automática para las noticias; la tabla de dígitos, en un PDF mensual |
| Cartagena | Noticia HTML con la tabla en texto. La URL cambia de forma cada trimestre |
| Manizales | Noticia HTML con calendario día por día completo |
| Dosquebradas | Noticia HTML, publicada un día antes de entrar en vigencia |
| Tunja · Ibagué · Envigado | Noticia HTML en prosa |
| Cali | Buscador de decretos + PDF escaneado de 99 páginas con número manuscrito |
| Pasto | PDF en listado. Rota cada dos meses |
| Santa Marta | PDF de 12 páginas. El buscador oficial devuelve notas de 2018 |
| Bello · Sabaneta | PDF de más de veinte páginas |
| Itagüí | La regla vigente existe como imagen JPEG |
| Malambo | Un decreto municipal y uno departamental con horarios que se contradicen |
| Pereira | Cambió la medida el día del sismo y no la publicó en ningún sitio propio |
| Popayán | Una imagen en una biblioteca que la propia página no renderiza |
| Armenia | Un post diario en Facebook. El sitio web lleva congelado desde el 25 de junio |
| Soledad | No encontrado. El sitio del instituto de tránsito tiene 749 caracteres de texto en total |
| Neiva · Rionegro | Sin medida vigente |
| Barranquilla | Derogada en julio de 2025. Vuelve cuatro días en Carnaval |

*Veinticuatro municipios revisados en fuente oficial, 18–19 de agosto de 2026.*

### Cuatro casos que resumen el problema

**La página oficial de Cali publica hoy la rotación equivocada.** La sección de pico y placa de la Secretaría de Movilidad de Santiago de Cali no se modifica desde el 25 de julio de 2025. Publica la rotación del segundo semestre de 2025 — los cinco días de la semana están mal respecto a la vigente. En esa misma página conviven un encabezado que dice «primer semestre 2024», un texto que cita un decreto de 2025 y un PDF adjunto del segundo semestre de 2024.

**La norma de Armenia vive en Facebook.** El repositorio web de la Alcaldía lleva sin actualizarse desde el 25 de junio y la página de la Secretaría de Tránsito es de mayo de 2023. El dígito de cada día se publica como imagen en una red social privada, sin archivo consultable ni URL estable.

**La de Popayán está en una imagen que su propia página no muestra.** El archivo aparece nombrado en la vista de la biblioteca de documentos, pero su dirección no está enlazada en ninguna parte del sitio público. No es que sea difícil de leer automáticamente: es que un ciudadano con un navegador tampoco llega.

**Y Pereira cambió el pico y placa el día del terremoto sin publicarlo.** El 10 de agosto de 2026, un sismo de magnitud 7,4 con epicentro en San José del Palmar, Chocó, a 103 kilómetros de profundidad, sacudió una franja de quince departamentos. Varias ciudades ajustaron su restricción vehicular por decreto de emergencia. La medida de Pereira rige desde el 18 de agosto y no aparece en el sitio de la Alcaldía ni en el de Movilidad; su página de pico y placa tiene última modificación de octubre de 2024. El buscador del portal, además, exige iniciar sesión.

En cambio **Manizales lo hizo bien**: publicó el 13 de agosto una noticia con el calendario completo día por día, horarios y alcance, cinco días antes de que empezara a aplicar. Se puede leer, citar y automatizar. Es la prueba de que hacerlo bien no requiere presupuesto especial — requiere decidirlo.

## Bogotá: la regla que casi todo el mundo modela mal

Este hallazgo se lo debemos a intentar responder una pregunta simple —cada cuánto rota el pico y placa de Bogotá— y descubrir que la pregunta estaba mal hecha.

**Bogotá no asigna dígitos por día de la semana. Los asigna por paridad de la fecha.**

- **Día impar del mes:** restringidas las placas terminadas en 6, 7, 8, 9 y 0
- **Día par del mes:** restringidas las terminadas en 1, 2, 3, 4 y 5

Verificamos diez calendarios PDF consecutivos, de noviembre de 2025 a agosto de 2026, cruzando el cierre de año y el cambio de decreto. La asignación es idéntica en los diez.

Y el texto vigente —artículo 227 del Decreto Único del Sector Movilidad 652 de 2025, que compila el artículo 2 del Decreto 003 de 2023— dice que la rotación es facultativa:

> «La Administración Distrital periódicamente y de acuerdo a los estudios que elabore la Secretaría Distrital de Movilidad podrá establecer la rotación aplicable para la restricción de circulación. En este caso, el acto administrativo deberá ser publicado con mínimo 10 días calendario de antelación a la entrada en vigencia del cambio.»
>
> — Decreto 652 de 2025, artículo 227, parágrafo

No hay fecha de corte ni frecuencia obligatoria. Y no se ha rotado nunca desde enero de 2023.

La consecuencia práctica es que **un mismo día de la semana tiene grupos opuestos según la fecha**. El lunes 3 de agosto de 2026, impar, restringió 6-0. El lunes 10, par, restringió 1-5. Cualquier sistema que organice Bogotá como «lunes: tal, martes: tal» está usando el modelo equivocado para la ciudad más grande del país.

Hay incluso un caso borde que ocurre este mes: el 31 de agosto es impar y el 1 de septiembre también. Dos días seguidos con el mismo grupo restringido.

**Dos precisiones que se confunden seguido.** Desde 2024 no hay pico y placa de particulares los sábados en Bogotá: el Decreto 032 de 2024 lo estableció y el 053 del mismo año lo derogó. Y el pico y placa regional de los días de retorno usa **paridad del último dígito de la placa**, no de la fecha: de 12:00 a 16:00 los impares y de 16:00 a 20:00 los pares. Son dos lógicas de paridad distintas conviviendo en la misma ciudad.

## Por qué esto le importa a alguien

Una infracción de código C.14 cuesta hoy **$633.111**. Son 52,28 UVB, según la tabla de equivalencias que el Ministerio de Transporte publicó en concepto de su Oficina Asesora Jurídica con radicado 20261340213651 del 17 de febrero de 2026. Desde el 1° de enero de 2026 las multas ya no se calculan sobre el salario mínimo sino sobre la Unidad de Valor Básico creada por el artículo 313 de la Ley 2294 de 2023, fijada en $12.110 para este año.

Pero la multa no es lo peor. La norma dice, textual: «Además, el vehículo será inmovilizado.»

Piense en alguien que alquila un carro en Cali y maneja a Bogotá pasando por el Eje Cafetero y Medellín. No eligió la placa: se la entregaron en un mostrador y ya tenía el itinerario comprado. Cruza seis jurisdicciones con reglas distintas, horarios distintos y regímenes de excepción que en varias ciudades dependen de padrones que no son públicos.

Los municipios de esa ruta concentran **245 de las 314 cámaras** del país habilitadas para sancionar C.14. El 78%.

Una multa se paga y uno sigue el viaje. Una inmovilización a media mañana en una ciudad de paso es el viaje cancelado y el carro en patios.

## No es que falte ley

Es tentador leer todo esto como un problema de normativa pendiente. No lo es. La obligación existe y es explícita.

> «Datos Abiertos. Son todos aquellos datos primarios o sin procesar, que se encuentran en formatos estándar e interoperables que facilitan su acceso y reutilización […] puestos a disposición de cualquier ciudadano, de forma libre y sin restricciones, con el fin de que terceros puedan reutilizarlos y crear servicios derivados de los mismos.»
>
> — Ley 1712 de 2014, artículo 6 literal j

El artículo 11 de la misma ley obliga a los sujetos obligados —incluidos los municipios y distritos— a publicar «el contenido de toda decisión y/o política que haya adoptado y afecte al público», y a hacerlo en datos abiertos. El artículo 3 exige que la información sea «oportuna, objetiva, veraz, completa, reutilizable, procesable».

Y el artículo 41 de la Ley 23 de 1982 lleva más de cuarenta años diciendo que cualquiera puede reproducir decretos y actos administrativos, sin distinguir uso comercial, «bajo la obligación de conformarse puntualmente con la edición oficial».

El marco está. Lo que falta es operación.

## Qué costaría arreglarlo

Poco, y eso es lo frustrante. Tres cosas concretas, en orden de esfuerzo:

**Que el dato del día no viva en una imagen.** Un post de Facebook con una imagen, o un JPEG en una biblioteca, no es publicación en el sentido de la Ley 1712. No lo lee un lector de pantalla, no lo indexa un buscador, no lo archiva nadie y no se puede citar. Manizales demostró esta misma semana que basta con escribir el calendario en texto dentro de una noticia.

**Una fecha de última verificación en cada página.** El problema de Cali no es que su página esté mal: es que parece estar bien. Nada en ella indica que lleva trece meses sin tocarse. Un sello visible de «vigente al día X» convierte un error invisible en un error evidente, y no cuesta nada.

**Un formato mínimo común.** No hace falta una plataforma nacional. Con que cada municipio publique un archivo con seis campos —fecha de vigencia desde y hasta, tipo de vehículo, día o criterio, dígitos, horario, y enlace al acto administrativo— el problema desaparece. Es menos de lo que ya publica la ANSV por cada cámara.

**Y para el ciudadano que quiera el dato hoy:** el derecho de petición de información se resuelve en diez días hábiles, con silencio positivo, gratis y sin abogado — artículo 14 numeral 1 de la Ley 1755 de 2015. Cualquiera puede pedirle a su secretaría de movilidad el calendario vigente en formato reutilizable, invocando los artículos 3, 11 y 21 de la Ley 1712.

Si suficientes personas lo hacen, el archivo aparece.

## Metodología y huecos declarados

Sería incoherente publicar un texto sobre verificación sin declarar la propia. Esto es lo que no pudimos cerrar:

- **Veinticuatro municipios no son el país.** Los agregadores privados dicen cubrir entre 39 y 50, pero sus listas incluyen ciudades sin medida y omiten municipios que sí la tienen. Nuestra estimación es que entre 45 y 60 municipios tienen alguna forma de restricción por placa vigente. Es una estimación, no un dato.
- **Los textos de varios decretos no se leyeron completos.** Donde el PDF no se dejó extraer, tomamos el contenido operativo de boletines oficiales de la misma entidad y lo decimos aquí.
- **La Resolución 3488 de 2025 del Ministerio de Hacienda**, que fija la UVB en $12.110, no se pudo abrir: el sitio bloquea el acceso automatizado. El valor está confirmado por la tabla del Ministerio de Transporte y por al menos una secretaría de tránsito municipal, y cuadra aritméticamente en las catorce categorías.
- **No hay balance nacional consolidado de víctimas del sismo** publicado que hayamos encontrado, por lo que este artículo no cita ninguna cifra de afectación.
- **El estado de operación de algunas cámaras va con rezago** en el registro de la ANSV. Lo usamos como indicio, no como veredicto.

Las cifras de pico y placa citadas corresponden al 18 y 19 de agosto de 2026 y cambian sin previo aviso. Para decisiones reales, consulte siempre la fuente oficial de su municipio — que es, precisamente, el problema del que trata este artículo.

## Fuentes principales

- Registro de fotodetección — Agencia Nacional de Seguridad Vial · `fotodeteccion.ansv.gov.co`
- Ley 769 de 2002, art. 131 · Ley 1383 de 2010, art. 21 — Código Nacional de Tránsito
- Ley 1712 de 2014, arts. 3, 6, 11 y 21 — Transparencia y Acceso a la Información Pública
- Ley 23 de 1982, art. 41 — Derecho de autor sobre textos oficiales
- Ley 2294 de 2023, art. 313 — Unidad de Valor Básico
- Ministerio de Transporte, concepto radicado 20261340213651 del 17-02-2026 — tabla de multas en UVB
- Decreto 652 de 2025, arts. 226 a 229 — Régimen de Bogotá D.C.
- Decreto 4112.010.20.0814 de 2026 — Alcaldía de Santiago de Cali
- Servicio Geológico Colombiano — parámetros del sismo del 10 de agosto de 2026
- Portales oficiales de los veinticuatro municipios revisados
