# Auditoría de dominios satélite

**Fecha de verificación:** 2026-07-30

**Ventana de Search Console:** 2026-04-29 a 2026-07-28, ambos inclusive

**Alcance:** issues #442, #446, #447 y verificación de #443

**Naturaleza del trabajo:** lectura y medición. No se cambió DNS, Cloudflare, redirecciones ni código de aplicación.

## Veredicto ejecutivo

**Sí: el montaje actual encaja en el ejemplo publicado por Google de `doorway abuse`.** La razón no es que los textos sean copias literales —la prueba de shingles muestra lo contrario donde existe una página comparable— sino la arquitectura medida:

- 42 de las 43 propiedades son dominios de coincidencia exacta por ciudad.
- Esos dominios se enlazan entre sí y llevan la conversión a unas pocas páginas comunes: 18 satélites de Alquilame a `alquilame.co/reservas`, 17 de Alquicarros a rutas de `reservatuvehiculo.com/c/{ciudad}`, otros a `alquicarros.com/precios.html`, y los WordPress de Bogotá a `reservatuauto.com`, `reservatuvehiculo.com` o `reservatucarro.com`.
- Es, literalmente, una colección de dominios dirigida a regiones o ciudades que canaliza al usuario hacia una parte final común del servicio. Esa es una de las formas que Google enumera en su política de [doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies#doorway-abuse). Google aclara además que una campaña puede existir como páginas, como varios dominios o como ambos en su [guía sobre doorway pages](https://developers.google.com/search/blog/2015/03/an-update-on-doorway-pages).

Esto **no significa que Google haya sancionado el portafolio**. Las 43 pantallas de Acciones manuales dicen “No se ha detectado ningún problema”. Doorway es aquí una evaluación de encaje con la política y de riesgo futuro, no el reporte de una penalización presente.

Tampoco autoriza una migración masiva. Estos 43 dominios suman **10.192 clics en 90 días** y, usando las cifras rectoras del brief (727 para alquilatucarro.com y 612 para alquilame.co), representan **88% del tráfico orgánico considerado**. La recomendación conservadora es congelar cambios, preparar destinos equivalentes y validar una migración por cohortes pequeñas. Apagar o redirigir los 43 a la vez no es una opción responsable.

## Método y límites de interpretación

1. **HTTP y metadatos.** Se hizo `GET https://{dominio}/`, se siguieron redirecciones y se extrajeron `<title>`, `link[rel=canonical]` y `meta[name=robots]` del HTML final. `robots` ausente significa `index, follow` por defecto; no se interpreta como bloqueo.
2. **Search Console.** Para cada propiedad `sc-domain:` se consultó `searchAnalytics/query` con `startDate=2026-04-29`, `endDate=2026-07-28`, sin dimensiones y `rowLimit=1`. La suma de las 43 filas reproduce exactamente los **10.192 clics** del brief.
3. **Solapamiento.** Se usó `docs/seo/alquilame/tools/shingle-check.mjs`, página completa, secuencias de ocho palabras. El porcentaje es la proporción de shingles del satélite (A) que aparece en la página de ciudad de la marca (B). Es una prueba de copia literal, no una medida semántica ni una decisión automática de política.
4. **Acciones manuales.** Se abrió el informe `manual-actions` de cada una de las 43 propiedades en Search Console con la cuenta propietaria y se leyó su estado el 2026-07-30.
5. **Recomendaciones.** Son de análisis. No se ejecutó ninguna.

### Códigos de recomendación usados en el inventario

- **A — congelar y preparar consolidación gradual en Alquilame.** El satélite muestra Alquilame y lleva a `alquilame.co/reservas`; existe una página de ciudad equivalente. No tocar ahora. Cuando haya línea base de conversiones, probar primero una cohorte de bajo tráfico con 301 a la página exacta de ciudad y exigir recuperación antes de continuar.
- **B — congelar; falta destino de ciudad de Alquicarros.** `alquicarros.com/{ciudad}` devuelve 404 en las 20 rutas probadas. Redirigir a la home sería menos relevante y reproduciría el funnel que la política cuestiona. Crear o decidir el destino exacto antes de cualquier migración.
- **C — recomendar 301 controlado a `alquilatucarro.com/bogota`.** Es el caso de `alquilerdecarrosbogota.com`: 67 clics, página equivalente existente y el peor cociente riesgo/beneficio del conjunto. Requiere decisión del dueño y línea base; no requiere subir a ciegas el disavow.
- **D — mantener y auditar aparte.** `reservatucarro.com` es el portal nacional de búsqueda/conversión, no un dominio de ciudad. No encaja por sí solo en el ejemplo regional de doorway.
- **K — corregir canonical si el dominio se conserva.** Se añade a A o B cuando el canonical es `#`, apunta a un hostname IDN distinto del dominio real o contiene una URL inválida.

## Inventario completo de las 43 propiedades

`AM` significa Acciones manuales. `N/V` significa que el porcentaje no se pudo calcular porque no existe una página de ciudad comparable en la marca; no se reemplazó por una comparación contra la home.

| # | Dominio | Marca / ciudad | HTTP y destino final | `<title>` | Canonical | `robots` | Clics | Impr. | Shingles vs. página de marca | AM | Recomendación |
|---:|---|---|---|---|---|---|---:|---:|---:|---|---|
| 1 | `alquilercarrobogota.com` | Alquicarros / Bogotá | 200, sin redirección | Alquiler Carros Bogotá - Blog - Los Mejores Precios en Alquiler de Carros Bogota, Descuentos hasta 60% | `https://alquilercarrobogota.com/` | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` | 17 | 2.123 | N/V: `alquicarros.com/bogota` = 404 | Limpio | B; arriesga 17 clics |
| 2 | `alquilercarrosarmenia.com` | Alquicarros / Armenia | 308→200, `https://www.alquilercarrosarmenia.com/` | ALQUILER DE CARROS EN ARMENIA 【$129k/día】 ALQUICARROS RENT A CAR | `#` **roto** | ausente → index/follow | 356 | 10.278 | N/V: destino de ciudad = 404 | Limpio | B+K; arriesga 356 clics |
| 3 | `alquilercarroscali.com` | Alquicarros / Cali | 308→200, `https://www.alquilercarroscali.com/` | Alquiler de carros en Cali | `https://alquilercarroscali.com/` | ausente → index/follow | 57 | 4.802 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 57 clics |
| 4 | `alquilercarroscancun.com` | Alquicarros / Cancún | 308→200, `https://www.alquilercarroscancun.com/` | ALQUILER DE CARROS EN CANCÚN 【$50.000】 ALQUICARROS RENT A CAR | `#` **roto** | ausente → index/follow | 1 | 81 | N/V: destino de ciudad = 404 | Limpio | B+K; arriesga 1 clic; destino/país requiere decisión propia |
| 5 | `alquilercarroscartagena.com` | Alquicarros / Cartagena | 308→200, `https://www.alquilercarroscartagena.com/` | Alquiler de carros en Cartagena | `https://alquilercarroscartagena.com/` | ausente → index/follow | 99 | 9.995 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 99 clics |
| 6 | `alquilercarroscucuta.com` | Alquicarros / Cúcuta | 308→200, `https://www.alquilercarroscucuta.com/` | Alquiler de carros en Cúcuta | `https://alquilercarroscucuta.com/` | ausente → index/follow | 439 | 10.254 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 439 clics |
| 7 | `alquilercarrosenbarranquilla.com` | Alquicarros / Barranquilla | 308→200, `https://www.alquilercarrosenbarranquilla.com/` | Alquiler de carros en Barranquilla | `https://alquilercarrosenbarranquilla.com/` | ausente → index/follow | 360 | 21.693 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 360 clics |
| 8 | `alquilercarrosenbogota.com` | Alquicarros / Bogotá | 308→200, `https://www.alquilercarrosenbogota.com/` | Alquiler de carros en Bogotá | `https://alquilercarrosenbogota.com/` | ausente → index/follow | 352 | 21.458 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 352 clics |
| 9 | `alquilercarrosenmedellin.com` | Alquicarros / Medellín | 308→200, `https://www.alquilercarrosenmedellin.com/` | Alquiler de carros en Medellín | `https://alquilercarrosenmedellin.com/` | ausente → index/follow | 63 | 4.648 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 63 clics |
| 10 | `alquilercarrosfloridablanca.com` | Alquicarros / Floridablanca | 308→200, `https://www.alquilercarrosfloridablanca.com/` | Alquiler de carros en Floridablanca | `https://alquilercarrosfloridablanca.com/` | ausente → index/follow | 58 | 1.582 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 58 clics |
| 11 | `alquilercarrosibague.com` | Alquicarros / Ibagué | 308→200, `https://www.alquilercarrosibague.com/` | Alquiler de carros en Ibagué | `https://alquilercarrosibague.com/` | ausente → index/follow | 516 | 12.003 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 516 clics |
| 12 | `alquilercarrosmanizales.com` | Alquicarros / Manizales | 308→200, `https://www.alquilercarrosmanizales.com/` | Alquiler de carros en Manizales | `https://alquilercarrosmanizales.com/` | ausente → index/follow | 570 | 11.526 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 570 clics |
| 13 | `alquilercarrosmonteria.com` | Alquicarros / Montería | 308→200, `https://www.alquilercarrosmonteria.com/` | Alquiler de carros en Montería | `https://alquilercarrosmonteria.com/` | ausente → index/follow | 374 | 10.918 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 374 clics |
| 14 | `alquilercarrosneiva.com` | Alquicarros / Neiva | 308→200, `https://www.alquilercarrosneiva.com/` | Alquiler de carros en Neiva | `https://alquilercarrosneiva.com/` | ausente → index/follow | 225 | 7.718 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 225 clics |
| 15 | `alquilercarrospalmira.com` | Alquicarros / Palmira | 308→200, `https://www.alquilercarrospalmira.com/` | Alquiler de carros en Palmira | `https://alquilercarrospalmira.com/` | ausente → index/follow | 204 | 5.142 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 204 clics |
| 16 | `alquilercarrospereira.com` | Alquicarros / Pereira | 308→200, `https://www.alquilercarrospereira.com/` | Alquiler de carros en Pereira | `https://alquilercarrospereira.com/` | ausente → index/follow | 348 | 17.239 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 348 clics |
| 17 | `alquilercarrossoledad.com` | Alquicarros / Soledad | 308→200, `https://www.alquilercarrossoledad.com/` | Alquiler de carros en Soledad | `https://alquilercarrossoledad.com/` | ausente → index/follow | 23 | 815 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 23 clics |
| 18 | `alquilercarrosvalledupar.com` | Alquicarros / Valledupar | 308→200, `https://www.alquilercarrosvalledupar.com/` | Alquiler de carros en Valledupar | `https://alquilercarrosvalledupar.com/` | ausente → index/follow | 110 | 5.307 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 110 clics |
| 19 | `alquilerdecarrosbogota.com` | Alquila tu Carro / Bogotá | 200, sin redirección | Alquiler de carros bogotá - Blog - Servicio confiable de renta de vehículos en Bogotá y todo Colombia | `https://alquilerdecarrosbogota.com/` | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` | 67 | 2.191 | **0,00%** vs. `alquilatucarro.com/bogota` | Limpio | C; arriesga 67 clics |
| 20 | `alquilerdecarrosbucaramanga.com` | Alquicarros / Bucaramanga | 308→200, `https://www.alquilerdecarrosbucaramanga.com/` | ALQUILER DE CARROS EN BUCARAMANGA COP【$129k/día】 ALQUICARROS RENT A CAR | `#` **roto** | ausente → index/follow | 262 | 18.056 | N/V: destino de ciudad = 404 | Limpio | B+K; arriesga 262 clics |
| 21 | `alquilerdecarrosenarmenia.com` | Alquilame / Armenia | 308→200, `https://www.alquilerdecarrosenarmenia.com/` | ALQUILER DE CARROS EN ARMENIA USD $30 DIA/MES | `https://www.alquilerdecarrosenarmenia.com/` | ausente → index/follow | 645 | 12.384 | **0,00%** vs. `alquilame.co/armenia` | Limpio | A; arriesga 645 clics |
| 22 | `alquilerdecarrosenbarranquilla.com` | Alquilame / Barranquilla | 308→200, `https://www.alquilerdecarrosenbarranquilla.com/` | ALQUILER DE CARROS EN BARRANQUILLA USD $30 DIA/MES | `https://www.alquilerdecarrosenbarranquilla.com/` | ausente → index/follow | 96 | 8.982 | **0,00%** vs. `alquilame.co/barranquilla` | Limpio | A; arriesga 96 clics |
| 23 | `alquilerdecarrosenbogota.com` | Alquilame / Bogotá | 200, sin redirección | Alquiler de carros en bogotá - Blog - Alquilame, Agencia de Alquiler de Carros en Bogota | `https://alquilerdecarrosenbogota.com/` | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` | 14 | 2.116 | **0,06%** vs. `alquilame.co/bogota` | Limpio | A; candidato de cohorte por 14 clics |
| 24 | `alquilerdecarrosenbogota.info` | Alquilame / Bogotá | 308→200, `https://www.alquilerdecarrosenbogota.info/` | ALQUILER DE CARROS EN BOGOTA USD $30 DIA/MES | `https://www.alquilerdecarrosenbogota.info/` | ausente → index/follow | 6 | 3.248 | **0,00%** vs. `alquilame.co/bogota` | Limpio | A; candidato de cohorte por 6 clics |
| 25 | `alquilerdecarrosenbucaramanga.com` | Alquilame / Bucaramanga | 308→200, `https://www.alquilerdecarrosenbucaramanga.com/` | ALQUILER DE CARROS EN Bucaramanga USD $30 DIA/MES | `https://www.alquilerdecarrosenBucaramanga.com/` | ausente → index/follow | 457 | 18.144 | **0,00%** vs. `alquilame.co/bucaramanga` | Limpio | A; arriesga 457 clics |
| 26 | `alquilerdecarrosencali.com` | Alquilame / Cali | 308→200, `https://www.alquilerdecarrosencali.com/` | ALQUILER DE CARROS EN CALI USD $30 DIA/MES | `https://www.alquilerdecarrosencali.com/` | ausente → index/follow | 268 | 22.710 | **0,00%** vs. `alquilame.co/cali` | Limpio | A; arriesga 268 clics |
| 27 | `alquilerdecarrosencartagena.com` | Alquilame / Cartagena | 308→200, `https://www.alquilerdecarrosencartagena.com/` | ALQUILER DE CARROS EN Cartagena USD $30 DIA/MES | `https://www.alquilerdecarrosenCartagena.com/` | ausente → index/follow | 153 | 17.746 | **0,00%** vs. `alquilame.co/cartagena` | Limpio | A; arriesga 153 clics |
| 28 | `alquilerdecarrosencucuta.com` | Alquilame / Cúcuta | 308→200, `https://www.alquilerdecarrosencucuta.com/` | ALQUILER DE CARROS EN Cúcuta USD $30 DIA/MES | `https://www.alquilerdecarrosenCúcuta.com/` **hostname IDN distinto** | ausente → index/follow | 79 | 5.937 | **0,00%** vs. `alquilame.co/cucuta` | Limpio | A+K; arriesga 79 clics |
| 29 | `alquilerdecarrosenfloridablanca.com` | Alquilame / Floridablanca | 308→200, `https://www.alquilerdecarrosenfloridablanca.com/` | ALQUILER DE CARROS EN FLORIDABLANCA USD $30 DIA/MES | `https://www.alquilerdecarrosenfloridablanca.com/` | ausente → index/follow | 20 | 1.205 | **0,00%** vs. `alquilame.co/floridablanca` | Limpio | A; candidato de cohorte por 20 clics |
| 30 | `alquilerdecarrosenibague.com` | Alquilame / Ibagué | 308→200, `https://www.alquilerdecarrosenibague.com/` | ALQUILER DE CARROS EN Ibagué USD $30 DIA/MES | `https://www.alquilerdecarrosenIbagué.com/` **hostname IDN distinto** | ausente → index/follow | 739 | 10.315 | **0,00%** vs. `alquilame.co/ibague` | Limpio | A+K; arriesga 739 clics |
| 31 | `alquilerdecarrosenmanizales.com` | Alquilame / Manizales | 308→200, `https://www.alquilerdecarrosenmanizales.com/` | ALQUILER DE CARROS EN Manizales USD $30 DIA/MES | `https://www.alquilerdecarrosenManizales.com/` | ausente → index/follow | 606 | 11.361 | **0,00%** vs. `alquilame.co/manizales` | Limpio | A; arriesga 606 clics |
| 32 | `alquilerdecarrosenmedellin.info` | Alquilame / Medellín | 308→200, `https://www.alquilerdecarrosenmedellin.info/` | Alquiler de carros en Medellín | `https://alquilerdecarrosenmedellin.info/` | ausente → index/follow | 22 | 2.573 | **1,17%** vs. `alquilame.co/medellin` | Limpio | A; candidato de cohorte por 22 clics |
| 33 | `alquilerdecarrosenmonteria.com` | Alquilame / Montería | 308→200, `https://www.alquilerdecarrosenmonteria.com/` | ALQUILER DE CARROS EN Montería USD $30 DIA/MES | `https://www.alquilerdecarrosenMontería.com/` **hostname IDN distinto** | ausente → index/follow | 359 | 9.670 | **0,00%** vs. `alquilame.co/monteria` | Limpio | A+K; arriesga 359 clics |
| 34 | `alquilerdecarrosenneiva.com` | Alquilame / Neiva | 308→200, `https://www.alquilerdecarrosenneiva.com/` | ALQUILER DE CARROS EN Neiva USD $30 DIA/MES | `https://www.alquilerdecarrosenNeiva.com/` | ausente → index/follow | 305 | 7.788 | **0,00%** vs. `alquilame.co/neiva` | Limpio | A; arriesga 305 clics |
| 35 | `alquilerdecarrosenpalmira.com` | Alquilame / Palmira | 308→200, `https://www.alquilerdecarrosenpalmira.com/` | ALQUILER DE CARROS EN PALMIRA USD $30 DIA/MES | `https://www.alquilerdecarrosenpalmira.com/` | ausente → index/follow | 374 | 5.548 | **0,00%** vs. `alquilame.co/palmira` | Limpio | A; arriesga 374 clics |
| 36 | `alquilerdecarrosenpereira.com` | Alquilame / Pereira | 200, sin redirección | ALQUILER DE CARROS EN Pereira USD $30 DIA/MES | `https://www.alquilerdecarrosenPereira.com/` | ausente → index/follow | 105 | 7.945 | **0,00%** vs. `alquilame.co/pereira` | Limpio | A; arriesga 105 clics |
| 37 | `alquilerdecarrosensantamarta.com` | Alquilame / Santa Marta | 308→200, `https://www.alquilerdecarrosensantamarta.com/` | ALQUILER DE CARROS EN Santa Marta USD $30 DIA/MES | `https://www.alquilerdecarrosenSanta Marta.com/` **URL inválida** | ausente → index/follow | 217 | 17.531 | **0,00%** vs. `alquilame.co/santa-marta` | Limpio | A+K; arriesga 217 clics |
| 38 | `alquilerdecarrosensoledad.com` | Alquilame / Soledad | 308→200, `https://www.alquilerdecarrosensoledad.com/` | ALQUILER DE CARROS EN SOLEDAD USD $30 DIA/MES | `https://www.alquilerdecarrosensoledad.com/` | ausente → index/follow | 35 | 1.292 | **0,00%** vs. `alquilame.co/soledad` | Limpio | A; candidato de cohorte por 35 clics |
| 39 | `alquilerdecarrosenvalledupar.com` | Alquilame / Valledupar | 308→200, `https://www.alquilerdecarrosenvalledupar.com/` | ALQUILER DE CARROS EN Valledupar USD $30 DIA/MES | `https://www.alquilerdecarrosenValledupar.com/` | ausente → index/follow | 397 | 6.321 | **0,00%** vs. `alquilame.co/valledupar` | Limpio | A; arriesga 397 clics |
| 40 | `alquilerdecarrosenvillavicencio.com` | Alquilame / Villavicencio | 308→200, `https://www.alquilerdecarrosenvillavicencio.com/` | ALQUILER DE CARROS EN Villavicencio USD $30 DIA/MES | `https://www.alquilerdecarrosenVillavicencio.com/` | ausente → index/follow | 319 | 8.874 | **0,00%** vs. `alquilame.co/villavicencio` | Limpio | A; arriesga 319 clics |
| 41 | `alquilerdecarrossantamarta.com` | Alquicarros / Santa Marta | 308→200, `https://www.alquilerdecarrossantamarta.com/` | ALQUILER DE CARROS EN SANTA MARTA COP【$129k/día】 ALQUICARROS RENT A CAR | `#` **roto** | ausente → index/follow | 184 | 17.786 | N/V: destino de ciudad = 404 | Limpio | B+K; arriesga 184 clics |
| 42 | `alquilerdecarrosvillavicencio.com` | Alquicarros / Villavicencio | 308→200, `https://www.alquilerdecarrosvillavicencio.com/` | Alquiler de carros en Villavicencio | `https://alquilerdecarrosvillavicencio.com/` | ausente → index/follow | 284 | 8.342 | N/V: destino de ciudad = 404 | Limpio | B; arriesga 284 clics |
| 43 | `reservatucarro.com` | Alquila tu Carro / portal nacional | 308→200, `https://www.reservatucarro.com/` | ALQUILER DE CARROS EN COLOMBIA ❌ COP 106.833 día/mes | `https://www.reservatucarro.com/` | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` | 7 | 741 | N/A: no es página de ciudad | Limpio | D; arriesga 7 clics |
|  | **Total** |  |  |  |  |  | **10.192** | **386.388** |  | **43/43 limpias** |  |

### Comprobaciones del inventario

- Las 43 filas y sus clics suman 10.192.
- Los dominios vivos son indexables: cuatro declaran `index, follow`; los otros 39 no tienen `meta robots`, lo que también permite indexación.
- Hay ocho canonicals que requieren atención si se decide conservar esas páginas: cuatro `#`, tres hostnames IDN distintos de los dominios reales y una URL con un espacio dentro del hostname.
- El caso confirmado de `alquilercarrosarmenia.com` queda corregido respecto de las notas antiguas: muestra **Alquicarros**, no Alquilame, y su canonical es `#`.

## Resultado de solapamiento

### Resumen cuantitativo

| Grupo | Dominios | Resultado |
|---|---:|---|
| Satélites Alquilame con página equivalente | 20 | 18 en 0,00%; `alquilerdecarrosenbogota.com` en 0,06%; `alquilerdecarrosenmedellin.info` en 1,17% |
| `alquilerdecarrosbogota.com` vs. Alquila tu Carro Bogotá | 1 | 0,00% |
| Satélites Alquicarros | 21 | N/V: las 20 rutas únicas de ciudad probadas en `alquicarros.com/{slug}` devuelven 404 |
| `reservatucarro.com` | 1 | N/A: portal nacional, sin ciudad equivalente |

La prueba concreta que propone Google —si las páginas duplican agregaciones útiles que ya existen— **no encontró duplicación literal relevante** en los 21 pares que sí pueden compararse. Eso reduce el riesgo de contenido copiado y contradice cualquier afirmación de que estas páginas sean clones palabra por palabra.

No elimina el diagnóstico de doorway. Google separa esa pregunta de otras señales: finalidad de captar consultas parecidas, papel de página intermedia, islas dentro de una red y funnel hacia la porción realmente utilizable. La red medida cumple el ejemplo de múltiples dominios por ciudad y, además, cada familia comparte destino de reserva y enlazado cruzado.

## Acciones manuales

**Resultado: 43/43 limpias el 2026-07-30.** Cada propiedad mostró exactamente “No se ha detectado ningún problema” en `Search Console → Seguridad y Acciones manuales → Acciones manuales`.

Esto amplía la auditoría limpia de enero, que solo cubría 19 nombres. No se repitió la auditoría histórica de backlinks tóxicos; únicamente se verificó el estado actual pedido.

## Los 19 nombres del documento de enero (#446)

La verificación del 2026-07-30 confirma 14 redirecciones, cuatro fallos Cloudflare 525 y un WordPress vivo. Hay una diferencia frente al hallazgo del issue del 2026-07-29: **hoy diez, no catorce, hacen doble salto**. Barranquilla, Cartagena, Cúcuta y Montería ya apuntan directamente a la URL sin barra y completan un solo salto. No se atribuye este cambio a una persona porque no se verificó quién modificó la configuración.

Los cuatro 525 no son nombres inventados:

| Dominio 525 | Registro RDAP | Registrador / DNS | Vencimiento | Propiedad GSC actual | Dominio parecido que sí produce |
|---|---|---|---|---|---|
| `alquilerdecarrosarmenia.com` | 2017-08-16 | Cloudflare, Inc.; `BARBARA`/`CASEY.NS.CLOUDFLARE.COM` | 2027-08-16 | No | `alquilercarrosarmenia.com`: 356 clics |
| `alquilerdecarrospereira.com` | 2016-07-12 | Cloudflare, Inc.; mismos NS | 2027-07-12 | No | `alquilercarrospereira.com`: 348 clics |
| `alquilerdecarrosmanizales.com` | 2016-07-16 | Cloudflare, Inc.; mismos NS | 2027-07-16 | No | `alquilercarrosmanizales.com`: 570 clics |
| `alquilerdecarrosneiva.com` | 2018-08-02 | Cloudflare, Inc.; mismos NS | 2027-08-02 | No | `alquilercarrosneiva.com`: 225 clics |

Conclusión: son dominios registrados y renovados, pero **no hay evidencia para atribuirles las cifras de enero ni para afirmar pérdida de tráfico**. La cuenta pagadora, la fecha desde la que fallan y su historial de Search Console no se pudieron verificar.

## `alquilerdecarrosbogota.com` y el disavow (#447)

Estado medido: 200, 173.991 bytes, WordPress, canonical propio, `index, follow`, 67 clics y 2.191 impresiones. Su CTA “Reservar” lleva a `reservatucarro.com`; el contenido muestra la marca Alquila tu Carro y compite con `alquilatucarro.com/bogota`.

El repositorio contiene `docs/seo/disavow/disavow-alquilerdecarrosbogota.txt`. La documentación de enero dice en una sección que el archivo fue “subido”, mientras el issue #447 dice que no consta ejecutado. **No fue posible resolver esa contradicción con evidencia de Google:** la cuenta hoy solo tiene `sc-domain:alquilerdecarrosbogota.com`, y la [documentación oficial de Disavow](https://support.google.com/webmasters/answer/2648487) dice que la herramienta no soporta propiedades de dominio. Al seleccionar esa propiedad, la herramienta vuelve al selector y no muestra un estado ni una lista histórica. Por tanto, el upload histórico queda **no verificado**.

Google recomienda disavow solo cuando hay un volumen considerable de enlaces artificiales **y** estos han causado o probablemente causarán una acción manual. Hoy la propiedad está limpia. **Recomendación: no subir ni reemplazar un disavow a ciegas.** Si el dueño aprueba consolidar, hacer un 301 directo a `https://alquilatucarro.com/bogota`, conservar una línea base de tráfico y revisar backlinks actuales solo si aparece evidencia nueva de enlaces artificiales o una acción manual.

## Verificación de bloques de ciudades (#443)

Se revisaron en vivo los 16 posts de `alquilatucarro.com`, el único post de `alquilame.co`, las 19 páginas de ciudad de cada marca y sus elementos globales.

### Dentro de artículos

- **No existe un bloque genérico de 19 ciudades pegado al pie de todos los artículos.**
- Los enlaces múltiples encontrados están ligados al tema del artículo:
  - costa Caribe: Cartagena, Barranquilla y Santa Marta; tres enlaces contextuales y una lista de tres sedes dentro del artículo;
  - eje cafetero: Pereira, Armenia y Manizales dentro de párrafos;
  - requisitos: Bogotá, Medellín y Cartagena dentro de un párrafo;
  - tipos de carros: Bogotá, Medellín, Cartagena y Cali dentro de un párrafo;
  - pico y placa: 16 ciudades, cada una dentro del contenido que compara reglas locales;
  - puentes de junio de Alquilame: seis ciudades dentro del relato de datos.
- Según la distinción pedida en el issue, estos son enlaces editoriales en el cuerpo y no un bloque repetido añadido para rankear. El post de pico y placa merece conservarse como caso de vigilancia por volumen, aunque su tema sí exige comparar ciudades.

### Navegación y páginas de ciudad

- `alquilatucarro.com` sirve en todas las páginas revisadas una sección global con el encabezado **“Ciudades donde ofrecemos alquiler de carros”** y 19 botones. Está después de `</main>` y antes de `<footer>`, fuera de `<article>`. Es navegación global, aunque no usa la etiqueta semántica `<nav>` ni está dentro del `<footer>`.
- `alquilame.co` sirve 19 enlaces de ciudad dentro del `<footer>` bajo el encabezado “Ciudades”. Eso es navegación estructural.
- Cada página de ciudad de Alquilame añade dentro del contenido un bloque “También puedes revisar el alquiler de carros en las demás ciudades” con las otras 18 ciudades, además de tres o cuatro ciudades cercanas con tiempos de conducción. El bloque sí está en `<main>`, pero no en un artículo de blog; se documenta como navegación de servicios.
- Las páginas de ciudad de Alquila tu Carro contienen tres o cuatro ciudades cercanas con tiempo de conducción. No se encontró el bloque de “otras 18” dentro de `<main>`.

Google define keyword stuffing como llenar una página con palabras o números para manipular rankings y pone como ejemplo los [bloques de texto que enumeran ciudades o regiones](https://developers.google.com/search/docs/essentials/spam-policies#keyword-stuffing). Lo medido no muestra el patrón específico de “bloque al pie de cada artículo”; sí confirma listas globales de navegación y el bloque de otras ciudades en las páginas de Alquilame. Este frente solo deja la evidencia y no modifica nada.

## Plan de decisión recomendado, sin ejecución

1. **Congelar DNS y redirecciones** mientras se instrumenta una línea base por dominio: clics, consultas, reservas y valor. GSC solo da tráfico, no ingreso.
2. **Resolver primero el destino de Alquicarros.** Sin páginas de ciudad en la marca principal, no hay un 301 exacto y seguro para 21 dominios.
3. **Piloto Alquilame de bajo tráfico:** si el dueño decide consolidar, comenzar por `alquilerdecarrosenbogota.info` (6), `alquilerdecarrosenbogota.com` (14), `alquilerdecarrosenfloridablanca.com` (20), `alquilerdecarrosenmedellin.info` (22) y `alquilerdecarrosensoledad.com` (35). Total máximo inicial: 97 clics/90d. No avanzar si el destino no recupera consultas/clics y conversiones.
4. **Bogotá ATC como decisión separada:** 301 exacto del dominio de 67 clics; no hacer depender la consolidación de un disavow histórico no verificable.
5. **No mezclar los cuatro 525 con los 43 productivos.** Son dominios reales, pero no hay evidencia de tráfico actual ni histórico atribuible; arreglarlos o redirigirlos requiere una decisión de cartera, no una emergencia de tráfico.
6. **Corregir canonicals solo si se decide conservar los dominios.** No tiene sentido invertir en on-page de una URL elegida para migrar enseguida.

## Lo que no se pudo verificar

- Quién paga o administra en Cloudflare los cuatro dominios 525; RDAP prueba registrador y nameservers, no la cuenta ni el pagador.
- Desde qué fecha exacta fallan los cuatro 525.
- Las cifras mensuales de enero atribuidas a esos cuatro nombres; no están en las 89 propiedades actuales de Search Console.
- Si el disavow de Bogotá fue subido en enero; no existe hoy una propiedad URL-prefix disponible con la cual consultar su estado.
- Conversiones, reservas e ingreso por satélite. GA4 no se intentó, según la restricción del brief.
- La causa de la discrepancia entre las cifras rectoras del brief para las marcas (727/612) y la respuesta agregada actual de la API para esas dos propiedades. Se conservaron 727/612 para el cálculo del 88%, como ordena el brief; el total de los 43 sí coincidió exactamente.
- La intención histórica con la que se crearon los dominios. El veredicto de doorway se basa en la arquitectura y los funnels observables, no en atribuir intención a una persona.
