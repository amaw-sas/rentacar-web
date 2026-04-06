# Estrategia de Consolidación SEO - AMAW

**Fecha**: 2026-01-16
**Empresa**: AMAW
**Marcas**: alquilatucarro, alquilame, alquicarros
**Proyecto actual**: rentacar-main (alquilatucarro)
**Dominio destino**: alquilatucarro.com

---

## Resumen Ejecutivo

### Modelo de Negocio
- **AMAW**: Empresa comisionista/afiliada de rentadoras
- **Proveedor actual**: Localiza Rent a Car (white-label)
- **Modelo**: Usuario reserva en marca AMAW, servicio prestado por Localiza
- **Plan 2026**: Incorporar más rentadoras (multi-proveedor)

### Situación Actual
- **3 marcas** con identidad gráfica y redes sociales propias
- **~60+ dominios EMD** (Exact Match Domains) distribuidos en las 3 marcas
- **Estructura por marca**: 1 dominio principal + ~20 dominios por ciudad
- **Problema**: Backlinks comprados ya no funcionan, posicionamiento débil
- **Riesgo**: Alto - patrón de Doorway Abuse según políticas de Google

### Diagnóstico
| Problema | Severidad | Política Google Violada |
|----------|-----------|------------------------|
| Múltiples dominios EMD por ciudad | Crítico | Doorway Abuse |
| Backlinks comprados | Crítico | Link Spam |
| Contenido similar entre dominios | Alto | Scaled Content Abuse |
| 3 marcas sin diferenciación de producto | Medio | Thin Content |

### Decisión Tomada
**Mantener 3 marcas separadas** (equity de marca, redes sociales, clientes existentes) pero **consolidar cada marca en 1 dominio** con subdirectorios por ciudad.

```
ANTES:                           DESPUÉS:
60+ dominios EMD                 3 dominios consolidados
├── alquilatucarro (20+)         ├── alquilatucarro.com
├── alquilame (20+)              │   └── /[ciudad]/
└── alquicarros (20+)            ├── alquilame.com
                                 │   └── /[ciudad]/
                                 └── alquicarros.com
                                     └── /[ciudad]/
```

---

## Estado Actual: alquilatucarro.com

### Estructura Técnica (YA IMPLEMENTADA ✓)

```
rentacar-main/
├── app/
│   ├── pages/
│   │   ├── [city]/              ← Rutas dinámicas por ciudad ✓
│   │   ├── blog/                ← Blog con contenido ✓
│   │   └── index.vue            ← Home ✓
│   ├── components/
│   └── layouts/
├── nuxt.config.ts               ← SSR + Prerender configurado ✓
└── server/
```

### Ciudades Configuradas (19 ciudades)
| Principales | Secundarias |
|-------------|-------------|
| Bogotá | Armenia, Bucaramanga, Cúcuta |
| Medellín | Ibagué, Manizales, Montería |
| Cali | Neiva, Pereira, Valledupar |
| Cartagena | Villavicencio, Floridablanca |
| Barranquilla | Palmira, Soledad, Santa Marta |

### Configuración SEO Actual
- ✅ SSR habilitado
- ✅ Prerender de todas las ciudades
- ✅ Sitemap configurado con prioridades
- ✅ Robots.txt configurado
- ✅ Meta tags dinámicos
- ✅ Blog con artículos
- ⚠️ Schema markup básico (mejorable)
- ❌ Contenido único por ciudad (por implementar)
- ❌ LocalBusiness Schema por ciudad (por implementar)

---

## Plan de Diferenciación de Marcas

### Estrategia Cuando se Agreguen Más Rentadoras

| Marca | Posicionamiento | Rentadoras | Audiencia |
|-------|-----------------|------------|-----------|
| **alquilatucarro** | Premium/Variedad | Localiza + Hertz + Avis | Corporativo, turismo alto |
| **alquilame** | Económico | Localiza + Budget + locales | Turistas budget |
| **alquicarros** | Comparador | TODAS | Quien busca mejor precio |

### Diferenciación de Contenido (Obligatorio)

Cada marca debe tener:
- [ ] Tono de voz diferente
- [ ] Propuesta de valor única en copy
- [ ] Blog con temas específicos para su audiencia
- [ ] Testimonios de su segmento
- [ ] Ofertas/promociones diferenciadas

---

## Plan de Migración: alquilatucarro

### Fase 0: Auditoría GSC Pre-Migración (Semana 1-2) ⚠️ CRÍTICO

> **IMPORTANTE**: No redirigir ningún dominio sin completar esta auditoría.
> Documento detallado: `docs/seo/EMD-AUDIT-CHECKLIST.md`

#### Objetivo
Identificar dominios con problemas que podrían transferir señales negativas al dominio principal.

#### Proceso
1. **Revisar GSC de cada dominio EMD**:
   - Acciones manuales (penalizaciones)
   - Problemas de seguridad (malware, hacking)
   - Perfil de backlinks (tóxicos vs limpios)
   - Métricas de rendimiento (valor del dominio)

2. **Clasificar cada dominio**:
   - 🟢 Limpio → Redirigir
   - 🟡 Backlinks dudosos → Disavow primero, esperar 2-4 semanas
   - 🔴 Penalizado/Comprometido → NO redirigir nunca

3. **Crear Disavow** para dominios 🟡 antes de redirigir

#### Riesgo de omitir esta fase
```
Dominio penalizado → 301 → alquilatucarro.com
                            ↓
              Penalización heredada al dominio principal
```

---

### Fase 0.5: Inventario de Dominios EMD (Semana 1-2)

#### Inventario de Dominios EMD
Documentar TODOS los dominios actuales de alquilatucarro:

| Dominio EMD | Ciudad | Tráfico mensual | Estado |
|-------------|--------|-----------------|--------|
| alquilerdecarrosbogota.com | Bogotá | ? | Activo |
| alquilerdecarrosmedellin.com | Medellín | ? | Activo |
| alquilerdecarroscali.com | Cali | ? | Activo |
| ... | ... | ... | ... |

**Acción requerida**: Crear lista completa de dominios EMD actuales.

#### Baseline de Métricas
- [ ] Exportar datos de Google Search Console de cada dominio
- [ ] Documentar impresiones, clicks, posición promedio
- [ ] Identificar keywords que rankean

### Fase 1: Contenido Único por Ciudad (Semana 3-6)

#### Objetivo
Crear contenido diferenciado para cada página de ciudad en alquilatucarro.com

#### Estructura de Contenido por Ciudad

```markdown
## /[ciudad]/ - Estructura de Página

### Above the fold
- H1: "Alquiler de Carros en [Ciudad]"
- Subtítulo con propuesta de valor
- CTA de búsqueda/reserva
- Hero image local

### Contenido único (500+ palabras)
1. Introducción a la ciudad (2-3 párrafos)
2. Por qué alquilar un carro en [Ciudad]
3. Lugares para visitar en carro
4. Tips de manejo local (tráfico, peajes, etc.)
5. Información de la sede/aeropuerto

### Elementos de confianza
- Testimonios de clientes de esa ciudad
- Rating/estrellas
- Logos de rentadoras disponibles

### SEO
- LocalBusiness Schema
- FAQs estructuradas
- Breadcrumbs
```

#### Prioridad de Ciudades
1. **Alta prioridad**: Bogotá, Medellín, Cali, Cartagena, Barranquilla
2. **Media prioridad**: Santa Marta, Bucaramanga, Pereira
3. **Baja prioridad**: Resto de ciudades

### Fase 2: Schema Markup (Semana 4-6)

#### LocalBusiness Schema por Ciudad

```json
{
  "@context": "https://schema.org",
  "@type": "AutoRental",
  "name": "Alquila Tu Carro - [Ciudad]",
  "image": "https://alquilatucarro.com/images/sede-[ciudad].jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Dirección de la sede Localiza]",
    "addressLocality": "[Ciudad]",
    "addressRegion": "[Departamento]",
    "postalCode": "[Código postal]",
    "addressCountry": "CO"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[lat]",
    "longitude": "[lng]"
  },
  "telephone": "[Teléfono local]",
  "url": "https://alquilatucarro.com/[ciudad]/",
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    }
  ],
  "areaServed": {
    "@type": "City",
    "name": "[Ciudad]"
  }
}
```

### Fase 3: Redirects 301 (Semana 7-10)

#### Proceso de Migración por Dominio

1. **Preparar** contenido único en alquilatucarro.com/[ciudad]/
2. **Verificar** que la página está indexada y funcionando
3. **Configurar** redirect 301 en el dominio EMD
4. **Agregar** dominio a Google Search Console
5. **Solicitar** cambio de dirección en GSC
6. **Monitorear** 30 días

#### Configuración de Redirects

**Opción A: Redirect a nivel DNS (Cloudflare/Registrar)**
```
alquilerdecarrosbogota.com/* → 301 → alquilatucarro.com/bogota/$1
```

**Opción B: Redirect a nivel servidor (.htaccess si Apache)**
```apache
RewriteEngine On
RewriteRule ^(.*)$ https://alquilatucarro.com/bogota/$1 [R=301,L]
```

#### Orden de Migración
| Semana | Ciudades | Riesgo |
|--------|----------|--------|
| 7 | Armenia, Neiva, Montería | Bajo |
| 8 | Ibagué, Manizales, Valledupar | Bajo |
| 9 | Pereira, Villavicencio, Cúcuta | Medio |
| 10 | Bucaramanga, Barranquilla, Santa Marta | Medio |
| 11 | Cali, Cartagena | Alto |
| 12 | Bogotá, Medellín | Alto |

### Fase 4: Limpieza Post-Migración (Semana 13+)

- [ ] Verificar todos los redirects funcionando
- [ ] Eliminar contenido duplicado de dominios EMD
- [ ] Desautorizar backlinks tóxicos (Disavow)
- [ ] Mantener dominios EMD (solo redirect) por 1+ año
- [ ] Monitorear métricas semanalmente

---

## Acciones Técnicas en Este Repositorio

### 1. Mejorar Páginas de Ciudad

**Archivo**: `app/pages/[city]/index.vue`

Agregar:
- Contenido único por ciudad (actualmente genérico)
- Sección de testimonios locales
- FAQs específicas de la ciudad
- Mapa de ubicación de sede

### 2. Implementar LocalBusiness Schema

**Archivo**: Crear `app/composables/useCitySchema.ts`

```typescript
export function useCitySchema(city: CityData) {
  return useSchemaOrg([
    defineLocalBusiness({
      '@type': 'AutoRental',
      name: `Alquila Tu Carro - ${city.name}`,
      address: {
        streetAddress: city.address,
        addressLocality: city.name,
        addressRegion: city.department,
        addressCountry: 'CO',
      },
      // ... resto del schema
    }),
  ])
}
```

### 3. Crear Datos de Ciudades

**Archivo**: Crear `app/data/cities.ts`

```typescript
export const cities = {
  bogota: {
    name: 'Bogotá',
    department: 'Cundinamarca',
    airport: 'El Dorado',
    address: '...', // Dirección de sede Localiza
    phone: '...',
    coords: { lat: 4.7110, lng: -74.0721 },
    content: {
      intro: '...',
      attractions: ['...'],
      tips: ['...'],
    }
  },
  // ... resto de ciudades
}
```

### 4. Blog: Contenido Local

Crear artículos específicos por ciudad:
- `/blog/que-hacer-en-bogota-con-carro`
- `/blog/mejores-rutas-desde-medellin`
- `/blog/playas-cerca-de-cartagena-en-carro`

---

## Métricas de Éxito

### KPIs Principales

| Métrica | Baseline | Objetivo 3 meses | Objetivo 6 meses |
|---------|----------|------------------|------------------|
| Dominios activos | 20+ | 1 | 1 |
| Impresiones totales | X | ≥ 80% de X | ≥ 100% de X |
| Tráfico orgánico | Y | ≥ 70% de Y | ≥ 90% de Y |
| Posiciones top 10 | Z | ≥ 60% de Z | ≥ 80% de Z |
| Errores GSC | ? | 0 | 0 |

### Monitoreo Semanal

- [ ] Revisar impresiones/clicks en GSC
- [ ] Verificar errores de cobertura
- [ ] Comprobar redirects funcionando
- [ ] Revisar Core Web Vitals

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Caída temporal de tráfico | Alta | Medio | Migración gradual, monitoreo |
| Penalización por EMDs existentes | Media | Alto | Consolidar antes de penalización |
| Pérdida de rankings en ciudades | Media | Medio | Contenido único antes de redirect |
| Backlinks tóxicos heredados | Alta | Medio | Disavow proactivo |

---

## Próximos Pasos Inmediatos

### Esta Semana
1. [ ] Crear inventario completo de dominios EMD de alquilatucarro
2. [ ] Exportar métricas de GSC de cada dominio
3. [ ] Definir contenido único para Bogotá (piloto)

### Próxima Semana
4. [ ] Implementar LocalBusiness Schema
5. [ ] Crear datos estructurados de ciudades
6. [ ] Escribir contenido único para 3 ciudades piloto

### Mes 1
7. [ ] Completar contenido de ciudades principales
8. [ ] Iniciar redirects de ciudades de bajo tráfico
9. [ ] Monitorear métricas

---

## Apéndice: Dominios EMD a Documentar

### alquilatucarro
| # | Dominio | Ciudad | Redirect a |
|---|---------|--------|------------|
| 1 | alquilerdecarrosencolombia.com | Nacional | alquilatucarro.com/ |
| 2 | alquilerdecarrosbogota.com | Bogotá | alquilatucarro.com/bogota/ |
| 3 | alquilerdecarrosmedellin.com | Medellín | alquilatucarro.com/medellin/ |
| 4 | ... | ... | ... |

*Completar con lista real de dominios*

---

*Documento actualizado: 2026-01-16*
*Próxima revisión: 2026-01-23*
