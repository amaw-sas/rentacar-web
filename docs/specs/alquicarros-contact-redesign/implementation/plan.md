# Implementation Plan — alquicarros `#contact` doble-ruta CTA

**Fecha:** 2026-07-01
**Diseño (fuente de verdad):** `docs/specs/2026-07-01-alquicarros-contact-doble-ruta-design.md` (commit `dada100`)
**Branch / worktree:** `feat/alquicarros-contact-redesign` · `.worktrees/alquicarros-contact-redesign`
**Scenarios:** SCEN-CONTACT-01..07 (definidos en el spec)

> Nota de proceso: las fases de clarificación/research/detailed-design de sop-planning se colapsan — el diseño ya está escrito, revisado (2 iteraciones) y aprobado. Este plan produce solo el file-structure + pasos + estrategia de test/rollout.

---

## Chunk 1: File structure y pasos

### File Structure

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `packages/ui-alquicarros/app/components/home/Contact.vue` | **Reescribir** | Sección `#contact` en layout doble-ruta: encabezado centrado + 2 tiles de acción (uno por CTA) + fila de trust badges. Conserva prop `reserveAnchor` y ambos CTA con sus atributos. Único componente tocado. |
| `packages/ui-alquicarros/app/components/home/__tests__/contact.test.ts` | **Crear** | Test source-reading (patrón `reskin-invariants`/`presentational`: `readFileSync`+regex) que encoda SCEN-01/02/03/04/05 y el uso de token `brand-*`. |

Sin archivos nuevos de assets, config, ni cambios en hosts. `cta-suv.webp` queda huérfano en alquicarros (no se borra; alquilame lo usa).

### Steps

1. **Test de contrato del rediseño (holdout) — `contact.test.ts`** | Size: S | Deps: none
   Escribir el test source-reading ANTES de tocar el componente (SDD: scenario primero). Debe fallar contra el `Contact.vue` actual (banda con SUV) y pasar contra el diseño doble-ruta. Asserts:
   - **SCEN-03** — `Contact.vue` NO contiene `cta-suv.webp`; SÍ contiene un grid de 2 columnas en `md+` (`md:grid-cols-2`).
   - **SCEN-01** — existen los dos `href`: uno `:href="reserveAnchor"` (CTA Reserva) y uno `:href="franchise.whatsapp"` con `target="_blank"` y `rel="noopener noreferrer"`; labels "Reserva Ahora" y "Habla con un Asesor" presentes; `<h2>` "Reserva tu Carro Hoy".
   - **SCEN-02** — el CTA Reserva bindea `reserveAnchor` **verbatim** (`:href="reserveAnchor"`), sin envolverlo ni concatenarlo (nada de `` `#${reserveAnchor}` ``, `'/' + reserveAnchor`, ni template strings alrededor) → neutralidad ancla-vs-ruta pinneada estáticamente.
   - **SCEN-04** — usa `<UIcon` con `i-lucide-` (car, message-circle, wallet, shield-check, headset, map-pinned); NO quedan los `<svg ... viewBox` dibujados a mano de los badges.
   - **SCEN-05** — referencia `useCityCount` y renderiza `cityCount.value` (no un número literal en el badge de ciudades).
   - **brand token** — el source usa al menos un token `brand-*`.
   - **invariantes locales** — no `bg-gradient-to-`, no hex de `RED_HEX`, no `Alquilame`.
   Acceptance: `pnpm --filter ui-alquicarros test contact` rojo ahora (documenta el gap), verde tras Step 2.

2. **Reescribir `Contact.vue` al layout doble-ruta** | Size: M | Deps: Step 1
   Implementar el diseño del spec:
   - `<section id="contact" class="py-16 md:py-24 bg-linear-to-b from-[#fff7ee] to-[#fdeede] [--ctx-text-primary:#7c2d12]">`.
   - Encabezado centrado: accent bar `h-1 w-10 rounded-full bg-brand-600` + `<h2 class="font-heading text-3xl md:text-4xl font-extrabold text-brand-900">Reserva tu Carro Hoy</h2>` + subtítulo.
   - Grid `grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto`:
     - **Tile A** (online): fondo gradiente naranja (`:style` inline con radial + `linear-gradient(160deg,#ff8a00,#e35d0a 60%,#c2410c)`), badge `UIcon i-lucide-car`, título "Reserva online", microcopy, CTA `<a :href="reserveAnchor" ...>Reserva Ahora</a>` (botón blanco, `text-brand-700`, full-width).
     - **Tile B** (WhatsApp): `bg-white border`, badge `UIcon i-lucide-message-circle` (`bg-[#e9f9ec] text-[#090]`), título "¿Prefieres hablar?", microcopy, CTA `<a :href="franchise.whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Habla con un asesor por WhatsApp">` con `<WhatsappIcon cls="size-5" />` + "Habla con un Asesor" (botón `bg-[#090]`, full-width).
   - Trust badges: `<ul>` en fila `flex flex-wrap justify-center gap-x-7 gap-y-3`, cada `<li>` con `UIcon` (wallet/shield-check/headset/map-pinned) + texto; el de ciudades usa `` `+${cityCount.value} ciudades` ``.
   - Script: conservar `withDefaults(defineProps<{ reserveAnchor?: string }>(), { reserveAnchor: '#hero' })`, `useAppConfig()` (franchise), `import { IconsWhatsappIcon as WhatsappIcon } from '#components'`, añadir `const cityCount = useCityCount()`.
   - Eliminar: SUV desktop block, glow, viñeta, textura, `bgStyle` naranja de banda, los `<svg>` de badges.
   Acceptance: `contact.test.ts` verde; `reskin-invariants.test.ts` verde; typecheck del brand limpio.

3. **Validación runtime — SCEN-06/07 (contraste + consola + secciones)** | Size: M | Deps: Step 2
   Dev server del worktree (`PORT=4000 pnpm --filter ui-alquicarros dev`, `.env.local` copiado a la raíz del worktree). `/agent-browser`:
   - Home `/` y city landing → sección `#contact` renderiza los 2 tiles, desktop (2 col) y mobile (apilado, breakpoint `md`).
   - **SCEN-06** — computed contrast del texto blanco del Tile A (sobre el extremo `#e35d0a`→`#c2410c`) y de ambos labels de CTA ≥ AA (≥4.5:1 body / ≥3:1 título). Cero errores de consola, cero requests fallidos.
   - **SCEN-02** — en city landing el CTA "Reserva Ahora" tiene `href="/reservas"`; en home `href="#hero"` (verificar en el DOM renderizado por host).
   - **SCEN-07** — orden de secciones intacto (`HomeContact` pos. 10).
   - `/dogfood` exploratorio de la sección.
   Acceptance: evidencia fresca (screenshots desktop+mobile, contraste medido, consola limpia) vía `/verification-before-completion`.

## Prerequisites
- Worktree ya creado; `pnpm install` dentro del worktree; copiar `.env.local` a la raíz del worktree (si no, el plugin rentacar-data lanza y toda página da 500 — ver `[[reference_worktree_dev_server_runtime_validation]]`).
- Dev port 4000 vía `PORT=4000 pnpm --filter ui-alquicarros dev` (NO `dev -- --port` → NuxtWelcome, ver `[[reference_worktree_dev_port_arg_nuxtwelcome]]`).

## Testing Strategy
- **Unit (SDD holdout):** `contact.test.ts` source-reading (Step 1) — scenario antes que código.
- **Invariantes:** `reskin-invariants.test.ts` verde sin tocarlo.
- **Regresión de hosts:** `pnpm --filter ui-alquicarros test` completo — `reservas/__tests__/index.test.ts`, `city/__tests__/Hero.test.ts` deben seguir verdes (prop `reserve-anchor` y mount incondicional preservados).
- **Runtime:** `/agent-browser` (SCEN-06/02/07) + `/dogfood`.
- **Typecheck:** `ionice -c3 nice -n19 pnpm --filter ui-alquicarros typecheck` (nunca root typecheck — ver `[[feedback_typecheck_disk_spike]]`).

## Rollout Plan
- Commit por step (SDD). PR con `Closes`/referencia al épico #210 tras verificación.
- Push gated (autorización explícita del usuario; `gh` con `pabloandi` para crear PR — ver `[[reference_gh_pr_account_switch]]`).
- Rollback: `git revert` del commit de `Contact.vue` (cambio aislado a un archivo; sin migraciones ni estado).
- Monitoreo: ninguno especial; sección estática sin llamadas de red nuevas.
