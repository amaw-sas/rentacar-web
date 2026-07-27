# Verificación de contenido compartido por shingles

`shingle-check.mjs` compara dos archivos o URLs sin dependencias externas. Extrae el texto visible cuando la entrada es HTML, normaliza las palabras y calcula qué porcentaje de las secuencias de ocho palabras de A también aparece en B.

```bash
node docs/seo/alquilame/tools/shingle-check.mjs <archivo-o-url-a> <archivo-o-url-b>
node docs/seo/alquilame/tools/shingle-check.mjs --city bogota
```

El modo `--city` compara `http://localhost:4002/{slug}` contra `https://alquilatucarro.com/{slug}`. El servidor de desarrollo de `ui-alquilame` debe estar activo en el puerto 4002.

## Baseline W1 — 2026-07-27

Con la página SSR local y los placeholders idénticos al contenido compartido:

```text
A: http://localhost:4002/bogota (1812 words, 1805 shingles)
B: https://alquilatucarro.com/bogota (1405 words, 1370 unique shingles)
Shared 8-word sequences from A: 861/1805 (47.70%)
```

El 47,70% reproduce el rango de 45–49% registrado en la auditoría del 2026-07-24.
