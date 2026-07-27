# Misión: contenido propio de Alquílame (19 ciudades)

**Fecha inicio:** 2026-07-27
**Orquestador:** Claude (Fable) — sesión C-level. Los trabajadores son agentes Codex en worktrees de Orca. NINGÚN agente debe confiar en su contexto de conversación: este archivo es la fuente de verdad.
**Rama de integración:** `diego-alex-melo/alquilame-contenido-mision` (base: `preview/alquilame-todo` @ 19b386c)
**Informe origen:** `docs/seo/alquilame/auditoria-onpage-2026-07-24.md` (leerlo antes de trabajar)

---

## Meta

Eliminar la duplicación de contenido entre alquilame y alquilatucarro ANTES de publicar alquilame.co. Hoy el 92% del texto de cada página de ciudad ya está publicado en alquilatucarro.com. Los testimonios son inventados y compartidos entre marcas.

### Criterios de éxito (observables, no negociables)

| # | Escenario | Cómo se verifica |
|---|---|---|
| S1 | Coincidencia de secuencias de 8 palabras con `alquilatucarro.com/{ciudad}` **< 15%** en cada una de las 19 ciudades | `docs/seo/alquilame/tools/shingle-check.mjs` contra la página renderizada (SSR) en dev y la página prod de alquilatucarro |
| S2 | **Cero testimonios inventados**: cada reseña mostrada existe textualmente en el perfil de Google (CID 11824841242913553901) | Diff contra `docs/seo/alquilame/data/gmaps-reviews-2026-07-27.json` — citas VERBATIM, nombres reales |
| S3 | El schema `FAQPage` emite exactamente las preguntas/respuestas visibles en pantalla | Test automatizado que compara schema vs render |
| S4 | Los 58 tests existentes de ui-alquilame siguen pasando + tests nuevos de los cambios | `vitest run` en el worktree de integración |
| S5 | Las otras 2 marcas (alquilatucarro, alquicarros) **no cambian ni un byte** | `git diff` no toca `packages/ui-alquilatucarro`, `packages/ui-alquicarros`, ni datos compartidos de `packages/logic` que ellas consuman |
| S6 | Dev server de alquilame: 19 ciudades renderizan sin errores de consola ni requests fallidos | QA de runtime al final |
| S7 | Cada ciudad muestra un trío de reseñas distinto al de sus vecinas; Santa Marta y Montería muestran las 2 reseñas que las mencionan | Test de la función de selección |
| S8 | Datos factuales intactos: peajes, pico y placa, aeropuertos, distancias NO se alteran al reescribir | Revisión adversarial por agente fresco |

**Reward hacking prohibido:** bajar el shingle borrando contenido no cuenta — cada ciudad conserva ~1.700 palabras (±15%). Debilitar un escenario para que pase = fallo de la misión.

---

## Arquitectura aprobada (decisión del dueño, 2026-07-27)

**Enfoque "todo en código":** el contenido propio vive en `packages/ui-alquilame`. Cero migraciones de Supabase, cero cambios en `packages/logic` compartido (solo se permite añadir archivos NUEVOS ahí si fuera imprescindible — por defecto, no).

- Texto largo → `packages/ui-alquilame/app/data/cityContent/{slug}.ts` (un archivo por ciudad + `index.ts` con la misma forma que `CityExpandedContent` de `packages/logic/src/composables/useCityContent.ts`)
- FAQs → `packages/ui-alquilame/app/data/cityFAQs/{slug}.ts` + índice con la misma interfaz `FAQ` (las respuestas dinámicas de precio/sedes siguen viniendo de datos vivos, solo cambia la redacción)
- Meta descripciones → cada archivo de ciudad exporta también `metaDescription` (≤155 chars, única); un override en la capa alquilame la aplica donde hoy se usa `city.description` (alimenta meta y pull-quotes)
- Testimonios → `packages/ui-alquilame/app/data/googleReviews.ts`: reseñas reales curadas + `pickCityReviews(slug)` determinística
- Los componentes de alquilame (`CityPage.vue`, `city/Testimonios.vue`, `home/Reviews.vue`, el componente de FAQs) cambian su import del composable compartido al módulo local. Un import por frente.

**Encabezado honesto en testimonios:** la ciudad va en el H2 y el copy de la sección ("…en {ciudad}…"); las tarjetas se presentan como "Opiniones verificadas de clientes de Alquílame en Google". NUNCA afirmar que el reseñador rentó en esa ciudad (salvo Santa Marta y Montería, cuyas reseñas sí lo dicen).

---

## Reglas para TODOS los trabajadores

1. Lee este archivo y la auditoría ANTES de tocar código. No confíes en el prompt que te llegó: verifica aquí.
2. **NO** ejecutes `pnpm install` (rompe en `oxc-parser`). Si necesitas correr tests: `pnpm install --ignore-scripts --prefer-offline` y `pnpm --filter @rentacar-main/ui-alquilame exec vitest run`. Si no puedes, deja los tests escritos y márcalo en tu reporte — el orquestador los corre en integración.
3. **NO** toques `packages/ui-alquilatucarro`, `packages/ui-alquicarros`, ni modifiques archivos existentes de `packages/logic`.
4. **NO** hagas `git push`. Commit local en tu rama del worktree; el orquestador integra.
5. Commits en inglés, convencionales. Código y comentarios en inglés; el contenido/copy en español (es el texto del sitio).
6. Citas de reseñas VERBATIM del JSON — con sus errores de ortografía originales. No "mejorar" citas.
7. Datos factuales (peajes, pico y placa, aeropuertos, rutas, tiempos) se COPIAN del contenido original, no se inventan ni se "actualizan".
8. Al terminar: escribe un resumen de lo hecho + rutas de archivos + resultado de tus verificaciones en tu último mensaje de terminal.

### Voz de marca para el copy nuevo (frentes A/B/C)

- Español colombiano, cercano y directo; "tú", no "usted". Frases cortas. Nada de relleno corporativo ("nuestro compromiso es…"), nada de muletillas de IA ("sumérgete", "descubre un mundo de", "sin embargo, es importante destacar").
- Cada ciudad abre con algo ESPECÍFICO de esa ciudad (geografía, clima, costumbre local), no con una plantilla.
- H2 nuevos que digan lo mismo con otras palabras que los actuales (los H2 actuales son idénticos a alquilatucarro).
- Palabra clave natural: "alquiler de carros en {ciudad}" y variantes aparecen con naturalidad, sin keyword stuffing.
- Extensión por ciudad: 500-800 palabras reescritas por completo; total de página ~1.700 (±15%).

---

## Tareas

### W1 — Infraestructura y herramienta de verificación · Codex · BLOQUEA TODO
**Entregables:**
1. Scaffolding: los 19 archivos por ciudad en `app/data/cityContent/` y `app/data/cityFAQs/` de ui-alquilame, inicialmente con el contenido ACTUAL copiado del compartido (placeholder que renderiza idéntico), + índices con la misma forma/interfaz.
2. Swap de imports en los componentes de alquilame que consumen `useCityExpandedContent` y `getCityFAQs`/`useCityFAQSchema`/`useCityFAQs` → módulos locales. El schema FAQPage debe alimentarse de la MISMA lista local (S3).
3. Override de `metaDescription`: cada archivo de ciudad exporta `metaDescription` (por ahora la actual); wiring para que alimente meta + pull-quotes en alquilame.
4. `app/data/googleReviews.ts` con tipos + `pickCityReviews(slug)` determinística (placeholder con lista vacía → fallback al comportamiento actual hasta W5).
5. Herramienta: `docs/seo/alquilame/tools/shingle-check.mjs` — node puro, sin deps: dado un archivo/URL A y B, extrae texto visible del HTML y reporta % de secuencias de 8 palabras de A presentes en B. Modo `--city <slug>` que compara `http://localhost:4002/{slug}` contra `https://alquilatucarro.com/{slug}`.
6. Baseline documentado: correr la herramienta en bogotá y anotar el % (esperado ~45-50%).
**Aceptación:** render idéntico al actual (los placeholders son copias), tests existentes pasan, S5 intacto, herramienta reproduce el baseline de la auditoría.

### W2 / W3 / W4 — Reescritura de contenido · Codex ×3 · dependen de W1
Cada worker reescribe SUS ciudades: contenido largo + FAQs + metaDescription, en los archivos por ciudad (sin tocar archivos de otras ciudades → sin conflictos).
- **W2 (7):** bogota, medellin, cali, cartagena, barranquilla, bucaramanga, santa-marta
- **W3 (6):** pereira, manizales, armenia, ibague, cucuta, monteria
- **W4 (6):** neiva, valledupar, villavicencio, palmira, soledad, floridablanca
(Verificar slugs reales en los datos; si alguno difiere, usar el real y anotarlo.)
**Gate por ciudad:** `shingle-check.mjs --city {slug}` **< 15%** con el dev server local corriendo, o en su defecto comparación del texto nuevo del archivo contra el HTML prod de alquilatucarro. Anotar el % logrado por ciudad en el reporte final.
**Aceptación:** S1 (por sus ciudades), S8, voz de marca, extensión conservada.

### W5 — Testimonios reales · Codex · depende de W1
**Fuente:** `docs/seo/alquilame/data/gmaps-reviews-2026-07-27.json` (56 entradas extraídas del perfil real el 2026-07-27).
**Curaduría:** incluir solo reseñas 5★ CON texto del cliente. OJO: en ~14 entradas el campo `text` capturó la RESPUESTA del propietario (empiezan tipo "¡Gracias por…", "¡Hola, {nombre}!…") — esas son reseñas sin texto: EXCLUIR. La de 3★ y la de 1★ no se muestran (pero no se borran del JSON). Resultado esperado: ~20-25 reseñas utilizables.
**Entregables:** `googleReviews.ts` poblado (nombre real, cita verbatim, fecha relativa opcional); `pickCityReviews` con trío distinto por ciudad, pins: santa-marta → reseña de Gael Joaquín Vargas Moreno; monteria → reseña de Daniela Madrid; `city/Testimonios.vue` (encabezado honesto, ver Arquitectura) y `home/Reviews.vue` pasan a esta fuente; tests (S2, S7).
**Aceptación:** S2, S7, render correcto de las tarjetas, link al CID intacto.

### W6 — Integración y verificación final · Orquestador + agentes de revisión frescos
1. Revisión adversarial de cada entrega ANTES de mergear (agentes Claude frescos: code-reviewer para W1/W5; jueces de contenido para W2-W4 contra S1/S8/voz/es-CO).
2. Merge de ramas de workers → rama de integración; vitest completo + tsc.
3. Dev server: crawl de las 19 ciudades, shingle-check completo, consola/network limpias (S6).
4. Actualizar este archivo con resultados; limpiar worktrees mergeados.

---

## Registro de progreso (lo escribe el orquestador)

| Fecha/hora | Evento |
|---|---|
| 2026-07-27 | Misión creada. Rama de integración y worktree de control listos. Reseñas de Google extraídas (56) y commiteadas en `data/`. |

### Bloqueos / errores
_(ninguno aún)_

### Hitos
- [ ] W1 entregado y revisado
- [ ] W2 entregado y revisado
- [ ] W3 entregado y revisado
- [ ] W4 entregado y revisado
- [ ] W5 entregado y revisado
- [ ] Integración: tests + shingle global + QA runtime
- [ ] Worktrees mergeados limpiados
