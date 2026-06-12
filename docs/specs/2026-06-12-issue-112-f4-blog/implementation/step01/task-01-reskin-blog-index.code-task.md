## Status: PENDING
## Blocked-By:
## Completed:

# Task: Reskin `blog/index.vue` (listado) a marca alquilame + guard de marca

## Description
Reskin de la página de listado del blog a la marca alquilame (rojo #CC022B, Plus Jakarta Sans / DM Sans, tokens F0). Establece el patrón de card de marca que el detalle (step02) reusa en "relacionados". Preserva comportamiento, SEO, schema, textos y href.

## Background
F4 cierra el reskin de marca #112 (F0 fundación → F1 home → F2 city → F3 funcional → **F4 blog**). El blog está hoy en estilo genérico (grises + `red-*` default + sin font-heading). Tokens F0 en `app/assets/css/theme.css`: `brand-50..950` (600=#CC022B, 800=#94001E, 900=#7a001a), `surface-soft #edf0f5`, `surface-softer #f4f5f9`, `surface-softest #f8f9fc`. Regla Tailwind 4: NUNCA `bg-gradient-to-*` (usar `bg-linear-to-*`); `.heading-*` trae color oscuro (sobre oscuro requiere `[--ctx-text-primary:#fff]`).

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-12-issue-112-f4-blog-design.md` (decisiones 1-5, holdout SCEN-F4)
- Plan: `docs/specs/2026-06-12-issue-112-f4-blog/implementation/plan.md`

## Technical Requirements
1. **Hero (`:4-16`)**: contenido sobre el ground oscuro del layout (NO agregar fondo). h1 mantiene `text-white` + añade `font-heading`. Acento `text-red-500` (`:7`) → tono brand legible sobre oscuro (`text-brand-300`/`text-brand-400`). Descripción `text-white` se mantiene.
2. **Grounds de sección**: `bg-gray-100` (`:19`) → `bg-surface-soft`.
3. **Featured card (`:28-59`)** y **grid cards (`:92-123`)**: títulos `font-heading`; hover `text-red-700` → `text-brand-700`; badge categoría `text-red-700 bg-red-100` → `text-brand-700 bg-brand-100` (`:38`) y `bg-red-700` → `bg-brand-600` (`:100`). Texto neutro de body/meta (`text-gray-600/500/900`) se mantiene (legibilidad, NO chrome). Cards `bg-white` pueden quedar `bg-white`.
4. **Filtros (`:67-80`)**: activo `bg-red-700` → `bg-brand-600`; inactivo `bg-white ... border-gray-200` puede mantenerse o `bg-surface-softest`. Comportamiento de filtrado (`setCategory`, query `categoria`) INTACTO.
5. **Empty state (`:128-141`)**: acento `text-red-700` → `text-brand-700`.
6. **CTA footer (`:145-161`)**: panel `bg-gray-900` → `bg-brand-900` + `[--ctx-text-primary:#fff]` para heading blanco; botón `bg-red-700 hover:bg-red-800` → `bg-brand-600 hover:bg-brand-700`; **`to="/"` (`:155`) → `to="/reservas"`**. Texto `text-gray-300` puede mantenerse o `text-brand-100`.
7. **NO tocar**: `<script setup>` (SEO `useHead`/`useSeoMeta`/`useSchemaOrg`, data `useAsyncData`/`$fetch`, computeds de filtro), `definePageMeta({colorMode:'light'})`, textos visibles, href de navegación a posts.

## Implementation Approach
1. Editar el `<template>` aplicando los mapeos de arriba; no tocar `<script>`.
2. Crear `app/pages/blog/__tests__/index.test.ts` — **source-text asserts** (patrón F0 `tests/f0-chrome.test.ts`: leer el `.vue` como string con `readFileSync`, asercionar regex). Sin montar componente.

## Acceptance Criteria
1. **Hero brand (SCEN-F4-01)**
   - Given el source de `index.vue`
   - When se lee el bloque hero
   - Then h1 contiene `text-white` y `font-heading`, y el acento usa `text-brand-*` (no `text-red-500`).
2. **CTA centralizado + anti-reward-hack (SCEN-F4-04)**
   - Given el source
   - When se busca el target del CTA de reserva
   - Then contiene `to="/reservas"` y NO contiene ningún `to="/"` de reserva.
3. **Sin gradiente v3 + cards brand (SCEN-F4-02)**
   - Given el source
   - When se busca `bg-gradient-to-`
   - Then no hay coincidencias; y badges/hover/filtro-activo usan `brand-*` (no `red-700` crudo).
4. **Guard verde**
   - Given `vitest run app/pages/blog/__tests__/index.test.ts`
   - When corre
   - Then pasa; si falla, se corrige el componente, no el test.
5. **Comportamiento + typecheck preservados**
   - Given el diff
   - When se inspecciona `<script>` y typecheck
   - Then `<script>` sin cambios funcionales y `index.vue` con 0 errores TS (baseline 0).

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Files to Modify**: `app/pages/blog/index.vue`, `app/pages/blog/__tests__/index.test.ts` (NEW)
- **Files to Read**: design spec, `app/assets/css/theme.css`, `tests/f0-chrome.test.ts` (patrón de test)
- **Step**: 01 of 02
- **Scenario-Strategy**: required
