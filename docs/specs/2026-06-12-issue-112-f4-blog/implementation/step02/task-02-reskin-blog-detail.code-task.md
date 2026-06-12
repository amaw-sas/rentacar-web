## Status: PENDING
## Blocked-By: step01/task-01-reskin-blog-index.code-task.md
## Completed:

# Task: Reskin `blog/[...slug].vue` (detalle) + `blog.css` a marca + guard

## Description
Reskin de la página de detalle del post + el CSS de callouts a la marca alquilame. Reusa el patrón de card de marca de step01 en "relacionados". Preserva data contract, JSON-LD (BlogPosting + BreadcrumbList), article meta, TOC, reading-progress, render MDC, textos y href.

## Background
Ver step01. El detalle (`[...slug].vue`, 670 L) tiene un `<style>` global (`:526-670`) dueño del prose MDC con acentos red-700 `rgb(185,28,28)`, y `blog.css` (34 L) dueño de callouts (`div.bg-muted`, `article.prose > div.group`). Selectores DISJUNTOS — confirmado. Share buttons: 4×2 ubicaciones (sidebar `:109-134` + barra móvil `:242-269`), colores de plataforma se CONSERVAN (verde/azul/negro), solo copy gris rebrandea.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f4-blog-design.md` (decisiones 1-5, holdout SCEN-F4)
- Plan: `docs/specs/2026-06-12-issue-112-f4-blog/implementation/plan.md`
- Patrón de card: `app/pages/blog/index.vue` ya reskineado en step01 (reusar clases exactas en relacionados)

## Technical Requirements
1. **Hero overlay (`:19`)**: `bg-gradient-to-t from-gray-900/80` → `bg-linear-to-t from-gray-900/80` (overlay sobre imagen, debe seguir visible). Título sobre imagen: `font-heading` + blanco (si usa `.heading-*`, con `[--ctx-text-primary:#fff]`). Meta autor/fecha/tiempo INTACTA.
2. **Reading progress bar**: si usa `bg-red-700` → `bg-brand-600`.
3. **Sidebar**: 3 paneles `bg-gray-50` (`:65/:90/:104`) → `bg-surface-softer`. TOC + tags brand (hover/acentos `red-*`→`brand-*`; pills `bg-gray-200`→`bg-surface-soft`). **Share**: WhatsApp `bg-green-500`, FB `bg-blue-600`, X `bg-black` se CONSERVAN; copy `bg-gray-600 hover:bg-gray-700` (`:130` y `:265`) → token brand (`bg-brand-600 hover:bg-brand-700`). **CTA sidebar (`:138-148`)**: caja `bg-red-700` → `bg-brand-600`; texto `text-red-100`→`text-brand-100`; botón `text-red-700`→`text-brand-700`; **`to="/"` (`:143`) → `to="/reservas"`**.
4. **Bio autor (`:155-193`)**: card `bg-gray-50` (`:158`) → `bg-surface-softer`; botón CTA `bg-red-700 hover:bg-red-800` → `bg-brand-600 hover:bg-brand-700`; **`to="/"` (`:175`) → `to="/reservas"`**; link "Más artículos" hover `text-red-700`→`text-brand-700`; `to="/blog"` INTACTO.
5. **Relacionados (`:195-223`)**: ground `bg-gray-100`→`bg-surface-soft`; cards **reusan el patrón brand de step01** (título `font-heading`, hover `text-brand-700`).
6. **Back button (`:225-236`)**: `bg-gray-200 hover:bg-gray-300 text-black` → `bg-surface-soft` + texto/acento brand; `to="/blog"` INTACTO.
7. **404 (`:274-286`)**: ground `bg-gray-100`→`bg-surface-soft`; botón `bg-red-700 hover:bg-red-800`→`bg-brand-600 hover:bg-brand-700`; `to="/blog"` INTACTO.
8. **`<style>` prose (`:526-670`)**: acentos red-700 → brand #CC022B — `.prose a` `rgb(185,28,28)`→`#cc022b`, `.prose a:hover` `rgb(153,27,27)`→`#94001e`, `.prose blockquote` border `rgb(185,28,28)`→`#cc022b`, `.prose code` color `rgb(185,28,28)`→`#cc022b`. Headings/texto neutro se mantienen (legibilidad).
9. **`blog.css`**: acentos de callout a brand donde aplique; mantener legibilidad (bg claro, texto oscuro). Selectores siguen disjuntos del `<style>`.
10. **NO tocar**: `<script setup>` (SEO `useSeoMeta`/`useSchemaOrg` BlogPosting+BreadcrumbList, article meta, `copyLink`/share fns, TOC/reading-progress logic, fetch), textos visibles, href de navegación.

## Implementation Approach
1. Editar `<template>` + `<style>` de `[...slug].vue` con los mapeos; no tocar `<script>`.
2. Editar `blog.css` acentos.
3. Crear `app/pages/blog/__tests__/slug.test.ts` — source-text asserts (leer `[...slug].vue` + `blog.css` como string).

## Acceptance Criteria
1. **Overlay Tailwind 4 + prose brand (SCEN-F4-05/06/14)**
   - Given el source de `[...slug].vue`
   - When se busca `bg-gradient-to-` y los acentos prose
   - Then no hay `bg-gradient-to-` (sí `bg-linear-to-t`), y `.prose a`/`blockquote`/`code` usan `#cc022b` (no `rgb(185, 28, 28)`).
2. **Share platform preservado + copy debrandado (SCEN-F4-08)**
   - Given el source
   - When se inspeccionan los share buttons
   - Then `bg-green-500`, `bg-blue-600`, `bg-black` siguen presentes (ambas ubicaciones) y el botón copy usa `bg-brand-*` (no `bg-gray-600`).
3. **CTAs centralizados + anti-reward-hack (SCEN-F4-07)**
   - Given el source
   - When se buscan los CTAs de reserva (sidebar + bio)
   - Then ambos `to="/reservas"` y NO queda ningún `to="/"` de reserva. (`to="/blog"` permitido.)
4. **Chrome rebrandeado (SCEN-F4-14)**
   - Given el source
   - When se inspeccionan back button, 404 y bio card
   - Then no usan `bg-gray-200 text-black` ni `bg-gray-50` crudos (usan tokens surface/brand).
5. **SEO preservado (SCEN-F4-11)**
   - Given el `<script setup>`
   - When se compara con baseline
   - Then `defineBlogPosting`/`BlogPosting`, `defineBreadcrumb` y todos los `articleXxx`/`og`/`twitter` meta intactos.
6. **Guard verde + typecheck**
   - Given `vitest run app/pages/blog/__tests__/slug.test.ts` y typecheck
   - When corren
   - Then guard pasa y `[...slug].vue` con 0 errores TS (baseline 0).

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Files to Modify**: `app/pages/blog/[...slug].vue`, `app/assets/css/rentacar-main/blog.css`, `app/pages/blog/__tests__/slug.test.ts` (NEW)
- **Files to Read**: design spec, `app/pages/blog/index.vue` (step01, patrón card), `app/assets/css/theme.css`
- **Step**: 02 of 02
- **Scenario-Strategy**: required
