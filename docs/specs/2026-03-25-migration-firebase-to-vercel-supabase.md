# Migración rentacar-main: Firebase → Vercel/Supabase

## Motivación

Directiva de centralizar deployments en Vercel/Supabase — reducir proveedores (Firebase, AWS, GCloud), reducir costos. Pain point principal: gestión manual de imágenes (formatos AVIF/WebP/JPG, tamaños por breakpoint). Sospecha de mejora SEO con Vercel (sin confirmar).

## Decisiones

| Decisión | Resultado | Razón |
|----------|-----------|-------|
| Framework | Conservar Nuxt 4 | Reescribir en React = meses de trabajo sin retorno. Único dev con expertise Vue/Nuxt |
| Repo | Nuevo repo (copia del original) | Producción sigue en Firebase como fallback |
| FAQs | Hardcodeadas | Pendiente directiva sobre dinamización |
| Reservas | Endpoints de rentacar-dashboard (env vars) | Transición suave. Evaluar query directo a Supabase como mejora futura |
| Dashboard SEO/GSC | Se conserva | Feature existente, migrar storage de tokens a Supabase |
| Marcas | Las 3 juntas | Comparten lógica. Solo alquilatucarro en producción |

## Dependencia: rentacar-dashboard

rentacar-main depende de rentacar-dashboard (Vercel/Supabase — reemplazo del legacy rentacar-admin):
- **Schema Supabase** — tablas de sucursales, ciudades, categorías, tarifas
- **Endpoints de reservas** — rentacar-main apunta a los de rentacar-dashboard

**Fases independientes de rentacar-dashboard** (pueden ejecutarse ya): 1, 2, 5
**Fases que requieren rentacar-dashboard listo**: 3, 4, 6, 7

## Arquitectura objetivo

```
Nuxt 4 (monorepo, 3 marcas)
  ├─ Deploy: Vercel (SSR serverless + CDN estáticos)
  ├─ Datos: Supabase PostgreSQL (compartido con rentacar-dashboard)
  ├─ Storage: Supabase Storage (imágenes dinámicas) + /public/ (estáticas)
  ├─ Imágenes: Vercel Image Optimization (automático: formato + tamaño)
  ├─ Cache: ISR por route rules (3600s para páginas de ciudad/home)
  └─ CI: GitHub Actions (lint + tests) + Vercel (build + deploy + preview)
```

## Fases de implementación

### Fase 1: Copiar proyecto y limpiar Firebase
- Copiar proyecto original a este repo
- Eliminar: `firebase.json`, `.firebaserc`, `.github/workflows/deploy.yml`
- Eliminar dependencias: `firebase-admin`, `firebase-functions`

### Fase 2: Configurar Vercel
- Crear `vercel.json` para monorepo (3 proyectos, uno por marca)
- Eliminar `nitro.preset: 'firebase'` de cada `nuxt.config.ts` (Vercel auto-detecta)
- Agregar ISR route rules: `'/'`, `'/[city]'` → `{ isr: 3600 }`
- Configurar `@nuxt/image` con `provider: 'vercel'`
- Eliminar lógica de procesamiento de imágenes con Sharp en server-side

### Fase 3: Integrar Supabase (requiere rentacar-dashboard)
- Instalar `@supabase/supabase-js`
- Crear `server/utils/supabase.ts` (reemplaza `firebase.ts`)
- Migrar `gsc.ts`: tokens OAuth de Firestore → tabla Supabase
- Reescribir server routes del blog: Firestore → Supabase queries
- Reescribir server routes del SEO dashboard donde usen Firestore
- Migrar upload de imágenes: Firebase Storage → Supabase Storage

### Fase 4: Dinamizar datos de configuración (requiere rentacar-dashboard)
- ~~`branches.config.ts`~~ → ya migrado vía `useFetchRentacarData()` (tabla `locations`); archivo borrado por código muerto.
- `cities.config.ts` → query Supabase (pendiente)
- `categories.config.ts` → query Supabase (pendiente — ojo: nombre real del archivo pendiente, los datos ya vienen de `vehicle_categories` vía `useFetchRentacarData`)
- `tarifas.config.ts` → query Supabase (pendiente; periodo vencido en hardcode actual)
- ~~`faqs.config.ts`~~ → migrado a tabla `faqs` en Supabase vía `useFetchRentacarData` (#12, ver `docs/specs/2026-05-06-faqs-supabase-migration-design.md`). Revoca decisión original de "mantener hardcoded" — la directiva del usuario es evitar islas de información.
- Mantener hardcodeados: `organization.config.ts`, `ui.config.ts`. ~~`admin.config.ts`~~ borrado: `adminDataConfig` no tenía consumers y duplicaba datos hoy provistos por Supabase.
- ISR garantiza rendimiento SEO equivalente al hardcode

### Fase 5: Actualizar CI/CD
- Simplificar `ci.yml`: mantener lint + tests, quitar build jobs
- Deploy lo maneja la integración nativa Vercel-GitHub

### Fase 6: Migración de datos y variables de entorno (requiere rentacar-dashboard)
- Script one-time: blog posts Firestore → tabla `blog_posts` Supabase
- Script one-time: tokens GSC Firestore → tabla `seo_config` Supabase
- Configurar env vars en Vercel dashboard por proyecto
- Configurar RLS en Supabase: policy SELECT para anon en tablas de lectura

### Fase 7: Migración de imágenes (requiere rentacar-dashboard)
- Imágenes estáticas (branding) → `/public/images/`
- Imágenes dinámicas (blog) → Supabase Storage
- Actualizar URLs hardcodeadas de Firebase Storage
- Simplificar componentes `NuxtImg`/`NuxtPicture`: solo `sizes` prop, sin lógica manual
- Eliminar dependencia `sharp` si no se usa

## Lo que NO cambia

- Estructura del monorepo y `packages/logic/`
- Composables, stores Pinia, tipos TypeScript
- Nuxt UI + Tailwind CSS
- Layouts, middleware de cliente, plugins
- SEO: schema.org, meta tags, sitemap
- Playwright + Vitest
- `organization.config.ts`, `ui.config.ts` (`faqs.config.ts` migrado a Supabase vía #12)

## Mejoras futuras (fuera de scope)

- Query directo a Supabase para disponibilidad/reservas (bypass API rentacar-dashboard)

## Verificación

1. `pnpm build` exitoso para las 3 marcas
2. `pnpm dev` funciona, páginas cargan con datos de Supabase
3. `NuxtImg` con provider Vercel renderiza correctamente en preview deployment
4. ISR funciona: primera visita consulta, siguientes sirven cache
5. Blog CRUD funciona contra Supabase
6. SEO Dashboard: GSC OAuth + métricas cargan
7. Lighthouse SEO score ≥ 90 en páginas principales
8. Tests de Playwright pasan
9. Vercel genera preview URL por PR
10. Formulario de reserva envía correctamente al endpoint de rentacar-dashboard
