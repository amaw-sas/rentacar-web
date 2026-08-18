# Datos de Google Ads — insumos de la auditoría de contenido

Exportados el 2026-08-07 por el dueño de la cuenta. Son la evidencia detrás de `docs/specs/2026-08-07-rejilla-auditada-alquilame.md`.

## Qué es cada archivo

**`planificador-*.tsv`** (11 archivos, ~5.310 palabras únicas) — Planificador de Palabras Clave, periodo **jul-2025 → jun-2026**. Da volumen de búsqueda de cualquier término, se puje o no. Es la fuente de descubrimiento.

⚠️ **Vienen en UTF-16LE separados por tabuladores.** Ya están convertidos a UTF-8 aquí; el original de Google no se puede leer con `head` sin `iconv -f UTF-16LE -t UTF-8`. Tres líneas de cabecera. Columna 1 = término, columna 3 = búsquedas mensuales, columna 6 = competencia.

⚠️ **El planificador NO incluye las palabras que ya están en la cuenta de Ads.** «alquiler de carros bogotá», «rent a car» y «alquilar carro» no aparecen. Sirve para temas vecinos, no para medir lo central del alquiler.

**`terminos-busqueda-2026-06-12_2026-08-06.csv`** (3.207 filas) — frases reales que la gente tecleó y dispararon anuncios. Separado por comas, 3 líneas de cabecera.

⚠️ Está filtrado por cuatro cosas: las negativas, las keywords por las que se puja, la segmentación geográfica y el umbral de privacidad de Google. Sirve para saber **cómo** escribe la gente, no para medir el mercado. Y cubre solo 2 meses, así que no muestra estacionalidad.

**`negativas-lista-*.csv`** (10 listas, 335 términos únicos) — palabras clave negativas de la cuenta.

Se dividen en dos grupos: marcas de competencia (conduapps, carsfort, eurocarental, localiza, hertz…), que no aportan nada; y búsquedas informativas bloqueadas por economía publicitaria (soat, tecnomecánica, destinos sin sede), que **sí son buenos temas de blog**. Una negativa significa «no sirve para pagar un anuncio», no «no sirve para contenido».

## Fuentes que NO están aquí

Search Console se consulta en vivo con `gcloud auth application-default print-access-token` más el header `x-goog-user-project: diego-seo-audit` (sin ese header devuelve 403). Los datos propios están en Supabase, proyecto `ilhdholjrnbycyvejsub`.
