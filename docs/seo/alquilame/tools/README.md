# Verificación de contenido compartido por shingles

`shingle-check.mjs` compara dos archivos o URLs sin dependencias externas. Extrae el texto visible cuando la entrada es HTML, normaliza las palabras y calcula qué porcentaje de las secuencias de ocho palabras de A también aparece en B.

```bash
node docs/seo/alquilame/tools/shingle-check.mjs <archivo-o-url-a> <archivo-o-url-b>
node docs/seo/alquilame/tools/shingle-check.mjs --city bogota
node docs/seo/alquilame/tools/shingle-check.mjs --city bogota --region
node docs/seo/alquilame/tools/shingle-check.mjs --region <archivo-o-url-a> <archivo-o-url-b>
```

El modo `--city` compara `http://localhost:4002/{slug}` contra `https://alquilatucarro.com/{slug}`. El servidor de desarrollo de `ui-alquilame` debe estar activo en el puerto 4002.

`--region` limita ambas entradas al bloque editorial propio de ciudad. Empieza en `section#introduccion`, la primera sección que muestra `expandedContent` dentro de `CitySeoContent.vue`, y termina al cerrar `section#faqs`, renderizada por `city/Faq.vue`. Incluye introducción, destinos, consejos, temporada, ciudades cercanas y FAQs. Excluye `section#ventajas`, que aparece antes y contiene beneficios genéricos de marca, no el texto que reescriben W2–W4.

## Baseline W1 — 2026-07-27

Con la página SSR local y los placeholders idénticos al contenido compartido:

```text
Scope: full page
A: http://localhost:4002/bogota (1812 words, 1805 shingles)
B: https://alquilatucarro.com/bogota (1405 words, 1370 unique shingles)
Shared 8-word sequences from A: 861/1805 (47.70%)
```

Con `--region`, sobre el bloque `section#introduccion`–`section#faqs`:

```text
Scope: section#introduccion through section#faqs
A: http://localhost:4002/bogota (591 words, 584 shingles)
B: https://alquilatucarro.com/bogota (645 words, 638 unique shingles)
Shared 8-word sequences from A: 538/584 (92.12%)
```

El 47,70% reproduce el rango de 45–49% registrado en la auditoría del 2026-07-24.
