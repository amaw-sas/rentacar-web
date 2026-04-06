# Acciones Técnicas SEO - alquilatucarro.com

**Fecha**: 2026-01-16
**Proyecto**: rentacar-main
**Objetivo**: Implementar mejoras técnicas para consolidación SEO

---

## Modelo de Negocio (Contexto Crítico)

```
AMAW (alquilatucarro) = Comisionista/Afiliado digital
Localiza = Operador físico (marca independiente)

- Sin contrato de representación
- Cada uno opera bajo su propia marca
- AMAW NO tiene sedes físicas propias
```

**Implicación SEO**: NO usar LocalBusiness schema (sería incorrecto para este modelo).

---

## Resumen de Análisis

### ✅ Lo que YA EXISTE (bien implementado)

| Componente | Archivo | Estado |
|------------|---------|--------|
| Organization Schema | `app/composables/useBaseSEO.ts` | ✅ AMAW como empresa |
| Product Schema | `app/composables/useCityProductSchema.ts` | ✅ Completo con precios por ciudad |
| FAQ Schema | `app/composables/useCityFAQs.ts` | ✅ FAQPage schema por ciudad |
| Breadcrumbs | `app/composables/useCityBreadcrumbs.ts` | ✅ Implementado |
| City SEO base | `app/composables/useCityPageSEO.ts` | ✅ Titles, metas, canonicals |
| Contenido ciudades | `app/composables/useCityContent.ts` | ✅ 19 ciudades con contenido único |
| Datos de branches | `app/app.config.ts` | ✅ 40+ sucursales (para mostrar info, no schema) |

### ✅ Decisión Correcta en el Código

En `useCityPageSEO.ts` línea 50-51:
```typescript
// LocalBusiness removido: modelo de negocio es agregador digital, no sedes físicas
```

**Esta decisión es CORRECTA** para el modelo de comisionista. Google penaliza usar LocalBusiness para ubicaciones que no operas.

### ❌ LocalBusiness - NO APLICA

| Razón | Explicación |
|-------|-------------|
| No operan ubicaciones | AMAW es digital, Localiza opera las sedes |
| Guidelines de Google | LocalBusiness solo para negocios que operas |
| Riesgo de penalización | Información engañosa = violación de políticas |

El archivo `useLocalBusiness.ts` existe pero **no debe usarse** en este modelo de negocio.

---

## Schemas Apropiados para Agregador Digital

### ✅ Usar estos schemas:

| Schema | Propósito | Estado |
|--------|-----------|--------|
| **Organization** | Identidad de AMAW/alquilatucarro | ✅ Implementado |
| **WebSite** | Sitio web con SearchAction | ✅ Implementado |
| **Product** | Categorías de vehículos disponibles | ✅ Implementado |
| **AggregateOffer** | Rangos de precios por ciudad | ✅ Implementado |
| **FAQPage** | Preguntas frecuentes | ✅ Implementado |
| **BreadcrumbList** | Navegación estructurada | ✅ Implementado |
| **Service** | Servicio de reservas online | ⚠️ Considerar agregar |

### ❌ NO usar:

| Schema | Razón |
|--------|-------|
| LocalBusiness | No operan ubicaciones físicas |
| AutoRental (como LocalBusiness) | Mismo motivo |

---

## Acciones Técnicas Pendientes

### Prioridad Alta

| # | Acción | Archivo | Esfuerzo |
|---|--------|---------|----------|
| 1 | Verificar Organization schema completo | `useBaseSEO.ts` | Bajo |
| 2 | Considerar Service schema para el servicio de reservas | Nuevo composable | Medio |
| 3 | Optimizar meta descriptions por ciudad | `useCityPageSEO.ts` | Bajo |

### Prioridad Media

| # | Acción | Descripción |
|---|--------|-------------|
| 4 | Testimonios por ciudad | Actualmente genéricos, mejorar con testimonios locales |
| 5 | Imágenes locales | Agregar fotos representativas de cada ciudad |
| 6 | Contenido de blog local | Artículos específicos por destino |

### Migración de EMDs (Ver documento principal)

La consolidación de dominios EMD a subdirectorios sigue siendo el objetivo principal:
- Documento: `docs/seo/SEO-STRATEGY-CONSOLIDATION.md`
- 20+ dominios EMD → 1 dominio con /[ciudad]/

---

## Service Schema (Opcional - Para Considerar)

Si quieren agregar más contexto sobre el servicio:

```typescript
// app/composables/useServiceSchema.ts
export const useServiceSchema = () => {
  const { franchise } = useAppConfig()

  useSchemaOrg([{
    '@type': 'Service',
    '@id': `${franchise.website}#service`,
    name: 'Reserva de Alquiler de Carros',
    description: 'Servicio de reservas online para alquiler de vehículos en Colombia',
    provider: {
      '@type': 'Organization',
      name: franchise.name,
      url: franchise.website
    },
    serviceType: 'Car Rental Booking',
    areaServed: {
      '@type': 'Country',
      name: 'Colombia'
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: franchise.website,
      servicePhone: franchise.phone
    }
  }])
}
```

**Prioridad**: Baja - los schemas actuales ya cubren lo esencial.

---

## Validación

### Herramientas
- Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/

### Checklist
- [ ] Verificar que NO hay LocalBusiness en producción
- [ ] Confirmar Organization schema válido
- [ ] Confirmar Product schema con precios
- [ ] Confirmar FAQPage schema por ciudad
- [ ] Sin errores en Google Search Console

---

## Resumen Ejecutivo

| Aspecto | Estado | Acción |
|---------|--------|--------|
| LocalBusiness | ❌ Correctamente deshabilitado | Ninguna |
| Organization | ✅ Implementado | Verificar |
| Product/Offers | ✅ Implementado | Ninguna |
| FAQPage | ✅ Implementado | Ninguna |
| Contenido ciudades | ✅ Implementado | Mejorar testimonios |
| Migración EMDs | 🔄 Pendiente | Ver doc principal |

**El proyecto está técnicamente bien configurado para el modelo de negocio actual.**

---

*Documento actualizado: 2026-01-16*
*Corrección: LocalBusiness NO aplica para modelo comisionista*
