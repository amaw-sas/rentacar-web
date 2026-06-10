# Planning Summary — F0 Fundación de marca alquilame (issue #112)

**Fecha:** 2026-06-10
**Goal:** Establecer la fundación de la nueva identidad de marca de alquilame (tokens rojos, fuentes, chrome reskinneado, assets) como primera de 4 fases del reskin Astro→Nuxt, aislada a `ui-alquilame`.

## Artifacts Created

- `../2026-06-10-issue-112-f0-foundation-design.md` — diseño aprobado (v3, 3 iteraciones de spec-review); 8 escenarios observables SCEN-F0-01..08 como holdout.
- `implementation/plan.md` — plan de 11 pasos SDD (v2, 2 iteraciones de plan-review); file map + grafo de dependencias.
- `summary.md` — este documento.

> Nota: los pasos 1–6 de sop-planning (clarificación, research, diseño detallado) se satisficieron con el design doc aprobado en brainstorming; este ciclo produjo file map (6.5), plan (7) y review loop (7.5).

## Key Decisions

1. **4 fases incrementales a `main`** (F0 fundación → F1 home → F2 landing+legales → F3 funcional), verificadas en alias `-git-main-` sin impacto público (alquilame.co sigue legacy). F0 primero porque establece tokens/fuentes globales.
2. **Tokens vía escala `brand` 50–950 en `@theme`** (`#CC022B`=600) + `ui.colors.primary='brand'` en el app.config de marca, sin tocar `uiConfig` compartido. Tokens semánticos para gradientes/neutros del diseño.
3. **Enlaces de ciudad internos `/[city]`** (preservar 19 enlaces SEO), no WhatsApp — el WhatsApp del diseño era artefacto del build estático Astro.
4. **El azul de marca está en `default.vue`/`typography.css`/`error.vue`, no en `base.css`** (corrección de diagnóstico cazada en spec-review). F0 des-azula solo el chrome global; cuerpos F1–F3 y `/gana` = deuda declarada.
5. **`/gana` fuera de #112** (decisión del usuario) — no está en la lista de páginas del issue; queda azul con costura documentada.
6. **Step 8 partido en 8a/8b** para aislar el guard de hidratación #109 (money-landmine) del restyle estructural.

## Correcciones a premisas del issue (verificadas)

- **#108 ya cerrado** (2026-06-09) — F0 no lo cierra; solo mejora el asset og-image.
- `Logo.vue` ya es SVG inline; `public/images/brand/` no existe (404 latentes que `app.config` ya referencia).
- `svglogo`/`oglogo` sin consumidor SEO (higiene, no cierre de 404 activo).

## Complexity Estimate

- **Overall:** M (fundación acotada, sin lógica de negocio).
- **Duration:** ~11 pasos × ≤2h = 1–2 días de implementación + verificación.
- **Risk Level:** Bajo-medio. Riesgos vivos: spread TS `{...uiConfig,colors}` (Step 3), guard #109 (Step 8b), CLS de fuentes (Step 2). Mitigados con gates.

## Recommended Next Steps

1. **`sop-task-generator`** → convertir `implementation/plan.md` en archivos `.code-task.md` por paso (con escenarios embebidos).
2. Ejecutar con `/scenario-driven-development` (asistido) o `ralph-orchestrator` (autónomo) dentro del worktree `.worktrees/issue-112-f0`.
3. `pnpm install` como paso 0 (materializa `@nuxt/fonts`).
4. Cierre con `/verification-before-completion` contra SCEN-F0-01..08 (Step 10) antes de PR.
5. PR a `main` con `Refs #112` (NO `Closes` hasta F3).

## Open Questions

- Shade exacto del primario y valores finos de la escala `brand` → se afinan visualmente contra el CSS del diseño durante Steps 3/7.
- `og-logo.png` se genera por rasterización SVG→PNG (sin fuente en `dist/`).
