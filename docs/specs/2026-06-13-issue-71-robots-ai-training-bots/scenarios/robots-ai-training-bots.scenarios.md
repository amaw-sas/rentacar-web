---
name: robots-ai-training-bots
created_by: claude
created_at: 2026-06-13T00:00:00Z
issue: 71
---

# robots.txt: abrir bots de entrenamiento IA en las 3 marcas (#71)

Decisión de negocio del épico #63 (origen: auditoría agéntica 2026-05-26, #7).

**Decisión tomada (operador, 2026-06-13): abrir las 3.** Permitir `GPTBot`,
`CCBot`, `Google-Extended` (y los demás bots de entrenamiento) para maximizar
*mindshare* en respuestas de IA. El contenido es comercial/transaccional, no IP
propietaria — estar en el recall de los modelos es upside, no hay nada que
proteger del training.

## Estado previo (verificado en código)

La política descrita en el issue **solo existía en 1 de las 3 marcas**:

- `alquilatucarro` — `nuxt.config.ts` con `robots.groups` que **bloqueaba**
  `GPTBot, Google-Extended, CCBot, Bytespider, Amazonbot` (`Disallow: /`).
- `alquilame` / `alquicarros` — `robots` con `allow/disallow` plano sobre `*`,
  **sin** grupos por-bot → ya permitían a todos los bots.

La inconsistencia ya existía y 2/3 marcas ya estaban abiertas. "Abrir las 3"
solo requiere quitar el grupo de bloqueo de `alquilatucarro`; las otras dos solo
reciben un comentario que documenta la política para evitar que una auditoría
futura reintroduzca el bloqueo (regresión cross-issue).

## Nota de testing

Los e2e corren contra el dev server (`pnpm --filter ui-* dev`), y en dev
`nuxt-robots` fuerza `User-agent: *  Disallow: /` (indexación bloqueada). Para
observar las reglas reales de producción el test usa el query `?mockProductionEnv`.

## SCEN-001: GPTBot/CCBot/Google-Extended reciben Allow en las 3 marcas
**Given**: el `robots.txt` generado de cada marca (`alquilatucarro`, `alquilame`, `alquicarros`), reglas de producción
**When**: se evalúa la regla efectiva de robots.txt para `GPTBot`, `CCBot` y `Google-Extended` sobre el path `/`
**Then**: cada uno está **permitido** (cae bajo `User-agent: *` con `Allow: /`); ningún grupo les aplica `Disallow: /`
**Evidence**: `e2e/seo.spec.ts` → test "robots.txt debe permitir bots de entrenamiento IA (#71)", parametrizado por `BRAND`, parser de robots.txt que evalúa la regla efectiva por user-agent. Verificado: 3/3 marcas `passed`.

## SCEN-002: el grupo de bloqueo desaparece del robots.txt de alquilatucarro
**Given**: el `robots.txt` de producción de `alquilatucarro` (`?mockProductionEnv`)
**When**: se inspecciona el contenido renderizado
**Then**: **no** existe el grupo `User-agent: GPTBot / Google-Extended / CCBot / Bytespider / Amazonbot` con `Disallow: /`; el grupo de búsqueda IA (`OAI-SearchBot, PerplexityBot, Applebot-Extended → Allow: /`) se conserva intacto
**Evidence**: `curl http://localhost:4000/robots.txt?mockProductionEnv` (2026-06-13) — el bloque de training bots ya no aparece; `User-agent: *` queda con `Allow: /` y `Disallow: /seo`.

## SCEN-003: consistencia documentada en las 3 marcas
**Given**: los `nuxt.config.ts` de las 3 marcas
**When**: se revisa el bloque `robots`
**Then**: ninguna marca bloquea bots de entrenamiento IA, y cada config lleva un comentario que marca la política abierta como deliberada (decisión #71) para impedir reintroducir el bloqueo
**Evidence**: diff de `packages/ui-{alquilatucarro,alquilame,alquicarros}/nuxt.config.ts`.

## Blast radius

`nuxt.config.ts` de las 3 marcas (3 archivos) + el test e2e. Reversible.
