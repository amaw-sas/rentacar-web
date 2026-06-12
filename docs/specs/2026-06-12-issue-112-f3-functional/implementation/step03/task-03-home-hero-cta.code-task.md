## Status: PENDING
## Blocked-By:
## Completed:

# Task: Home hero — quitar engine inline, añadir CTA "Reservar"

## Description
Sacar el motor de búsqueda del hero del home (hoy un `<SelectBranch>` + rótulo "¿En qué ciudad…?") y reemplazarlo por un CTA primario "Reservar ahora" que navega a `/reservas`. El home queda puro-marketing; la búsqueda se centraliza en `/reservas`.

## Background
`home/Hero.vue` usa `<SelectBranch>` (selector de ciudad simple), NO el `Searcher` completo. Conserva además "Ver Precios" (`href="#fleet"`) y un botón WhatsApp de contacto (`franchise.whatsapp`, ya URL completa) + `ImagesFamily`. El test `home/__tests__/Hero.test.ts:42` afirma `<SelectBranch>` y `:46` `/ciudad/i` — ambos rompen con este cambio y deben reescribirse al comportamiento nuevo (Parte D de la spec), NO debilitarse.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (Parte B — Home Hero + Parte D)

**Additional References:**
- Plan Step 3; `packages/ui-alquilame/app/components/home/__tests__/Hero.test.ts`

**Note:** You MUST read the detailed design before implementing.

## Technical Requirements
1. `home/Hero.vue`: quitar el bloque `<SelectBranch>` + rótulo "¿En qué ciudad deseas recoger tu carro?".
2. Añadir CTA primario "Reservar ahora" como `<NuxtLink to="/reservas">` (navegación SPA), con el lenguaje visual del hero (botón blanco sobre rojo, estilo de "Ver Precios").
3. Conservar: "Ver Precios" (`#fleet`), el WhatsApp de contacto (`:href="franchise.whatsapp"`, `target="_blank"`, sin re-wrap de `wa.me`), `ImagesFamily`, h1/subcopy, `[--ctx-text-primary:#fff]`, `bg-linear`.
4. Reescribir `home/__tests__/Hero.test.ts`: el hero NO monta `SelectBranch`; SÍ monta CTA `to="/reservas"`; conserva `href="#fleet"`/"Ver Precios" (`:62-63`) y WhatsApp (`:69-72`). Sin debilitar contratos.
5. Sin `bg-gradient-to-*`.

## Dependencies
- **`/reservas`** (step02): destino del CTA. El path `/reservas` es estático; funciona aunque step02 se haga después (runtime 404 hasta entonces) — pero el CTA debe apuntar ahí.

## Implementation Approach
1. Editar `home/Hero.vue`: remover el bloque del engine, insertar el `<NuxtLink>` CTA.
2. Reescribir las dos aserciones rotas del test + añadir la del CTA.

**Note:** Suggested approach.

## Acceptance Criteria
1. **Sin engine inline**
   - Given el home hero renderizado
   - When se inspecciona
   - Then NO contiene `<SelectBranch>` ni el rótulo "ciudad"
2. **CTA Reservar**
   - Given el home hero
   - When se busca el CTA primario
   - Then existe "Reservar ahora" como `<NuxtLink to="/reservas">`; "Ver Precios" (`#fleet`) y WhatsApp de contacto se conservan
3. **Tests mode-aware**
   - Given `home/__tests__/Hero.test.ts`
   - When corre
   - Then pasa con las aserciones reescritas (sin SelectBranch, con CTA, conserva #fleet/WhatsApp), sin debilitar; `bg-gradient-to-` = 0

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: home, hero, cta, tests
- **Required Skills**: Vue 3, Nuxt, Tailwind 4, Vitest
- **Related Tasks**: step02 (destino del CTA)
- **Step**: 03 of 09
- **Files to Modify**: `packages/ui-alquilame/app/components/home/Hero.vue`, `packages/ui-alquilame/app/components/home/__tests__/Hero.test.ts`
- **Files to Read**: `docs/specs/2026-06-12-issue-112-f3-functional-design.md`
- **Context Estimate**: S
- **Scenario-Strategy**: required
