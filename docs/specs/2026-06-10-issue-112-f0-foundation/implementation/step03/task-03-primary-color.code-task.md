## Status: PENDING
## Blocked-By: step01/task-01-theme-tokens.code-task.md
## Completed:

# Task: Primario de marca en app.config (ui.colors.primary='brand')

## Description
Configurar `@nuxt/ui` para usar la escala `brand` como color primario de alquilame, sin tocar el `uiConfig` compartido en `logic`. Esto recolorea todos los componentes @nuxt/ui (botones, links, badges) a rojo de inmediato.

## Background
Hoy `app.config.ts` hace `ui: uiConfig` (compartido, sin `colors`). El override va en el app.config de marca via spread. RIESGO TS conocido (cluster histórico documentado en `logic/src/config/ui.config.ts:13-19`): `uiConfig` es `as const satisfies AppConfigInput['ui']` (`:55`); el spread `{ ...uiConfig, colors }` con `primary: 'brand'` (string fuera de la unión de colores de @nuxt/ui) puede disparar TS2322. @nuxt/ui usa el shade 500 (light)/400 (dark) por defecto para el primario.

## Reference Documentation
**Required:**
- Design: `../../2026-06-10-issue-112-f0-foundation-design.md` (§1 Tokens — bloque app.config + riesgo TS)

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. Añadir `colors: { primary: 'brand', neutral: 'zinc' }` al `ui` de `packages/ui-alquilame/app/app.config.ts` vía `{ ...uiConfig, colors: {...} }`.
2. Si `typecheck` falla por el spread/`as const`, aplicar `as const`/`satisfies AppConfigInput['ui']` local — NO silenciar con `any`.
3. Si el botón primario no queda exactamente `#CC022B`, ajustar el shade (`--ui-primary` o config de @nuxt/ui) hacia el 600.

## Dependencies
- **Step 01**: la escala `brand` debe existir en `theme.css`.

## Implementation Approach
1. Editar el `ui` del app.config con el spread + colors.
2. `pnpm --filter ui-alquilame typecheck` (vía `ionice -c3 nice -n19`) — gate del riesgo TS.
3. Servir y verificar visualmente un botón primario rojo.

## Acceptance Criteria
1. **Primario rojo (SCEN-F0-01)**
   - Given la home renderizada
   - When se inspecciona un botón/elemento primario @nuxt/ui
   - Then usa el rojo de marca (`#CC022B`/`brand`), no el azul anterior (`#000073`).
2. **Typecheck verde (gate riesgo TS, parte de SCEN-F0-07)**
   - Given el override de `ui.colors`
   - When `pnpm --filter ui-alquilame typecheck`
   - Then pasa sin TS2322 ni colapso de inferencia del app.config.
3. **Aislamiento**
   - Given el cambio
   - When `git diff --stat origin/main`
   - Then solo toca `packages/ui-alquilame/app/app.config.ts`; `logic/` intacto.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: app-config, nuxt-ui, colors, typescript-risk
- **Required Skills**: @nuxt/ui v4 theming, TS satisfies
- **Step**: 03 of 11
- **Files to Modify**: app/app.config.ts
- **Files to Read**: design doc §1, logic/src/config/ui.config.ts
- **Context Estimate**: S
- **Scenario-Strategy**: required
