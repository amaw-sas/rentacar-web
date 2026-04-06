# Investigación CLS Desktop - 16 Enero 2025

## Resumen Ejecutivo

**Problema inicial**: CLS Desktop = 1.006 (zona roja)
**Estado actual**: CLS Desktop = 0.285 (zona roja, pero 72% mejora)
**Objetivo**: CLS < 0.1 (zona verde)

## Fix Aplicado (PR #48)

### Causa Raíz Identificada
El critical CSS en `nuxt.config.ts` usaba la propiedad `children` pero Nuxt 3/unhead requiere `innerHTML`.

**Antes (NO funcionaba)**:
```typescript
style: [
  {
    children: `...CSS...`,
  },
],
```

**Después (FUNCIONA)**:
```typescript
style: [
  {
    key: 'critical-cls',
    innerHTML: `...CSS...`,
  },
],
```

### Resultado
- CLS mejoró de 1.006 → 0.285 (~72% mejora)
- Critical CSS ahora se renderiza correctamente en el HTML

## Métricas Actuales (Desktop)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Performance | 82 | 🟠 |
| Accessibility | 100 | 🟢 |
| Best Practices | 100 | 🟢 |
| SEO | 100 | 🟢 |
| FCP | 0.5s | 🟢 |
| LCP | 0.9s | 🟢 |
| TBT | 140ms | 🟢 |
| Speed Index | 0.5s | 🟢 |
| **CLS** | **0.285** | 🔴 |

## Trabajo Pendiente

### Investigar causas del CLS restante (0.285)

Posibles culpables a revisar:

1. **Componente `SelectBranch.vue`**
   - Puede causar CLS durante hydration
   - Revisar si tiene dimensiones reservadas

2. **Carga de fuentes**
   - Si las fuentes web causan FOIT/FOUT
   - Verificar `font-display` en configuración

3. **UPageHero clases internas**
   - Puede haber clases de Nuxt UI no cubiertas por critical CSS
   - Verificar qué clases aplica internamente

4. **Animaciones/transiciones**
   - `colombia-sweep` animation ya fue diferida
   - Verificar si hay otras animaciones causando shifts

### Cómo verificar CLS

```bash
# PageSpeed Insights (simula 3G lento sin cache)
https://pagespeed.web.dev/analysis?url=https://alquilatucarro.com

# Verificar critical CSS en browser:
# Abrir DevTools > Console > ejecutar:
document.querySelector('style[key="critical-cls"]')?.innerHTML
```

## Archivos Relevantes

| Archivo | Propósito |
|---------|-----------|
| `nuxt.config.ts` | Critical CSS, preloads, Vitalizer config |
| `app/pages/index.vue` | Homepage con aspect-ratio containers |
| `app/components/Images/Family.server.vue` | Hero image con dimensiones |
| `app/components/Hero/Headline.server.vue` | Stars rating (server component) |
| `app/components/SelectBranch.vue` | **PENDIENTE DE REVISAR** |

## PRs Relacionados

| PR | Descripción | Estado |
|----|-------------|--------|
| #44 | Hydration keys para v-for | ✅ Merged |
| #45 | Aspect-ratio containers para lazy images | ✅ Merged |
| #46 | CLS fix para UPageHero horizontal | ✅ Merged |
| #47 | Defer colombia-sweep animation | ✅ Merged |
| #48 | Fix critical CSS (children → innerHTML) | ✅ Merged |

## Verificaciones Completadas

- [x] Critical CSS se renderiza en HTML (confirmado via JS)
- [x] Redirect www → non-www funcionando (301)
- [x] Hero image tiene aspect-ratio container
- [x] Server components para reducir hydration JS
- [ ] SelectBranch hydration shifts
- [ ] Font loading shifts
- [ ] UPageHero internal classes

## Próximos Pasos

1. Leer `SelectBranch.vue` y verificar reserva de espacio
2. Analizar sección "Causantes de los cambios de diseño" en PageSpeed
3. Considerar agregar más clases al critical CSS si se identifican gaps
4. Meta: Reducir CLS de 0.285 a <0.1

---
*Documento generado: 2025-01-16*
*Branch: fix/form-accessibility-labels*
