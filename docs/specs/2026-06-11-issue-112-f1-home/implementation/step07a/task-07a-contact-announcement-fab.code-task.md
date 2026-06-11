## Status: COMPLETED
## Blocked-By: step01/task-01-hero-restyle.code-task.md
## Completed: 2026-06-11

# Task: F1 Step 7a — Contact + Announcement bar + FAB (restyle in-place)

## Description
Crear `app/components/home/Contact.vue` (CTA de contacto desde config) y `app/components/home/AnnouncementBar.vue` (barra descartable, client-only), y restilizar in-place el FAB de contacto existente (`ChatWidget`).

## Background
El diseño tiene un `#contact`, una barra de anuncio descartable arriba, y un FAB flotante. El `ChatWidget` YA está montado como FAB en `app/layouts/default.vue:126` (vía `LazyChatWidget`) y ya usa `franchise.whatsapp`/`franchise.phone` → restyle in-place, NO montar uno nuevo (evita duplicado). `franchise.whatsapp` es URL completa (`https://wa.me/…`, no re-envolver); `franchise.phone` (`+57 301…`) es distinto del número de WhatsApp.

## Reference Documentation
**Required:**
- Design: `docs/specs/2026-06-11-issue-112-f1-home-design.md` (SCEN-F1-03; filas announcement/contact/FAB)
**Additional:**
- `app/components/ChatWidget.vue` y `app/layouts/default.vue:126` (FAB ya montado)
- `app/app.config.ts` (`franchise.whatsapp`, `franchise.phone`)
- Diseño: `/tmp/alqui_f1_design/dist/index.html` (barra de anuncio, `#contact`, FAB)

**Note:** Leer el detailed design antes de implementar.

## Technical Requirements
1. `Contact.vue`: CTA de contacto con `franchise.whatsapp` (URL, sin re-envolver) y `franchise.phone`; estilo del diseño.
2. `AnnouncementBar.vue`: barra superior descartable; estado de cierre **client-only** (no hornear bajo SSR/ISR — lección #109). Montada arriba del layout/home.
3. `ChatWidget.vue`: restyle in-place al FAB del diseño; sigue usando config; **no** se monta un segundo FAB en `index.vue`.
4. Gradientes/fondos `bg-linear-*`; headings `.heading-*`.

## Dependencies
- **Step 1** (orquestación).
- **`franchise` config** y **`ChatWidget` existente**.

## Implementation Approach
1. Crear `Contact.vue` y `AnnouncementBar.vue`.
2. Estado del anuncio en `onMounted`/client-only (ref nula en SSR).
3. Restilizar `ChatWidget.vue` (no tocar su montaje en el layout).
4. Montar `<HomeContact/>` y `<HomeAnnouncementBar/>` en el orden del diseño.
5. Test: secciones presentes, sin número hardcoded, un solo FAB.

## Acceptance Criteria
1. **Contact + Announcement presentes (SCEN-F1-03 resto p1)**
   - Given el home
   - When se recorre
   - Then existen la barra de anuncio descartable y la sección de contacto, estilo diseño.
2. **Contacto desde config, FAB único**
   - Given Contact y el FAB
   - When se inspeccionan los datos/montajes
   - Then usan `franchise.whatsapp`/phone (sin número hardcoded ni re-envolver URL) y hay UN solo FAB (el del layout, restilizado).
3. **Anuncio client-only**
   - Given la barra de anuncio
   - When SSR/ISR renderiza
   - Then el estado de cierre no se hornea (sin mismatch de hidratación).
4. **Test de contrato**
   - Given los componentes
   - When corre el unit test
   - Then valida presencia, ausencia de número hardcoded, y un único FAB.

## Metadata
- **Complexity**: Medium
- **Estimated Effort**: M
- **Labels**: alquilame, f1, home, contact, fab, hydration
- **Required Skills**: Vue 3, Nuxt SSR/hydration
- **Related Tasks**: Blocked-By step 1
- **Step**: 07a of 11
- **Files to Modify**: `app/components/home/Contact.vue` (nuevo), `app/components/home/AnnouncementBar.vue` (nuevo), `app/components/ChatWidget.vue`, `app/pages/index.vue`, `app/components/home/__tests__/contact-announcement.test.ts` (nuevo)
- **Files to Read**: `app/components/ChatWidget.vue`, `app/layouts/default.vue`, `app/app.config.ts`, `/tmp/alqui_f1_design/dist/index.html`
- **Context Estimate**: M
- **Scenario-Strategy**: required
