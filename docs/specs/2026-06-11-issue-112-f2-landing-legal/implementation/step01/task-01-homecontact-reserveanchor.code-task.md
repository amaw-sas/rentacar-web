## Status: COMPLETED
## Blocked-By:
## Completed: 2026-06-11

# Task: F2 Step 1 — HomeContact `reserveAnchor` prop (F1 reuse prereq)

## Description
Añadir una prop `reserveAnchor?: string` a `app/components/home/Contact.vue` para que el CTA "Reserva Ahora" pueda anclar a un target distinto según la página. Default `'#hero'` (home intacto); la city landing pasará `'#searcher'` (su hero no tiene `#hero`).

## Background
`HomeContact` se reusará en la city landing (F2). Hoy hardcodea `href="#hero"` (id del home); en la city page ese id NO existe (el scroll target es `#searcher`) → ancla muerta. Esta prop lo hace reusable sin romper el home.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (mapeo `#contact`, nota `reserveAnchor`)
**Additional:**
- Plan: `docs/specs/2026-06-11-issue-112-f2-landing-legal/implementation/plan.md` (paso 1)
- `app/components/home/Contact.vue` (hoy `href="#hero"`)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `defineProps` con `reserveAnchor?: string` default `'#hero'`.
2. El CTA "Reserva Ahora" usa `:href="reserveAnchor"`.
3. Backward-compat: el home (sin pasar la prop) sigue anclando a `#hero` — cero cambio visible.
4. Sin `bg-gradient-to-*`.

## Dependencies
- **F1 mergeado**: `home/Contact.vue` existe.

## Implementation Approach
1. Añadir `const props = withDefaults(defineProps<{ reserveAnchor?: string }>(), { reserveAnchor: '#hero' })`.
2. Cambiar el `href="#hero"` del CTA a `:href="reserveAnchor"`.
3. Test: default `#hero`, override aplica al `:href`.

## Acceptance Criteria
1. **Prop con default**
   - Given `HomeContact` sin props
   - When renderiza
   - Then el CTA "Reserva Ahora" ancla a `#hero` (home intacto).
2. **Override**
   - Given `<HomeContact reserveAnchor="#searcher" />`
   - When renderiza
   - Then el CTA ancla a `#searcher`.
3. **Test de contrato**
   - Given el componente
   - When corre el unit test
   - Then valida default `#hero` + override + ausencia de `bg-gradient-to-`.

## Metadata
- **Complexity**: Low
- **Estimated Effort**: S
- **Labels**: alquilame, f2, reuse, contact
- **Required Skills**: Vue 3
- **Related Tasks**: bloquea steps 2,6
- **Step**: 01 of 08
- **Files to Modify**: `app/components/home/Contact.vue`, `app/components/home/__tests__/contact-announcement.test.ts` (extender)
- **Files to Read**: `app/components/home/Contact.vue`
- **Context Estimate**: S
- **Scenario-Strategy**: required
