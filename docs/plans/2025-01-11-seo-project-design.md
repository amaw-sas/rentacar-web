# Proyecto SEO: alquilatucarro.com

> Diseño aprobado: 2025-01-11
> Estado: Setup inicial completado ✓

## Objetivo

Posicionar alquilatucarro.com en primer lugar para búsquedas de "alquiler de carros [ciudad]" en Colombia (17 ciudades), aparecer en recomendaciones de IAs y establecer presencia en redes sociales.

## Prioridad

1. **SEO Google** (primeros 3 meses)
2. **IAs** (meses 4-6)
3. **Redes Sociales** (meses 4-6)

---

## 1. Estructura de Documentación

```
docs/seo/
├── README.md                    # Índice y guía rápida
├── estrategia/
│   ├── objetivos.md            # Metas SMART
│   ├── keywords.md             # Keywords target por ciudad
│   └── competidores.md         # Análisis competitivo
├── baseline/
│   └── 2025-01-inicial.md      # Punto de partida
├── mediciones/
│   └── 2025-XX.md              # Reportes mensuales
├── herramientas/
│   └── guia-uso.md             # Cómo usar cada herramienta
├── acciones/
│   ├── on-page.md              # Optimizaciones técnicas
│   ├── contenido.md            # Plan de contenido
│   └── backlinks.md            # Estrategia de enlaces
└── aprendizajes/
    └── insights.md             # Qué funciona, qué no
```

---

## 2. Fases del Proyecto

### Fase 1: Diagnóstico (Semanas 1-2)
- Baseline de posiciones actuales
- Auditoría técnica del sitio
- Análisis de competidores
- Identificación de keywords objetivo

### Fase 2: Optimización On-Page (Semanas 3-6)
- Meta títulos y descripciones por ciudad
- Estructura de encabezados H1-H3
- Schema markup (LocalBusiness, FAQs)
- Core Web Vitals
- Enlaces internos

### Fase 3: Contenido y Autoridad (Semanas 7-12)
- Contenido único por landing de ciudad
- Blog con artículos informativos
- Estrategia de backlinks locales
- Citaciones en directorios

### Fase 4: IAs y Social (Meses 4-6)
- Optimización para respuestas de IA
- Presencia en redes sociales
- Reviews y testimonios

---

## 3. Herramientas por Tarea

### Herramienta Principal: SEMRush Guru
Cubre ~70% de necesidades:
- Investigación de keywords
- Tracking de posiciones
- Auditoría técnica
- Análisis de competencia
- Análisis de backlinks

### Herramientas Complementarias

| Tarea | Herramienta | Uso |
|-------|-------------|-----|
| Auditoría técnica profunda | Screaming Frog | Crawl completo, errores 404, redirects |
| Métricas de autoridad | MOZ Pro | DA/PA comparativo |
| Ideas de contenido | Answer The Public | Preguntas de usuarios |
| Monitoreo de velocidad | Pingdom | Core Web Vitals |
| Diseño de assets | Canva Pro | Imágenes para social/blog |

### Acceso
Todas disponibles en SEO Conjuntas (credenciales se actualizan cada 5-7 días).

---

## 4. Skills de Claude Code a Crear

### 4.1 seo-baseline
**Propósito**: Capturar estado inicial del sitio
**Acciones**:
- Extraer posiciones actuales de GSC
- Registrar DA/PA con MOZ
- Listar errores técnicos
- Guardar en `docs/seo/baseline/`

### 4.2 seo-monthly
**Propósito**: Reporte mensual automatizado
**Acciones**:
- Comparar posiciones vs mes anterior
- Calcular cambios en tráfico
- Identificar keywords ganadas/perdidas
- Generar `docs/seo/mediciones/YYYY-MM.md`

### 4.3 seo-audit
**Propósito**: Auditoría técnica on-demand
**Acciones**:
- Verificar meta tags
- Revisar Schema markup
- Validar Core Web Vitals
- Detectar errores 404, redirects rotos

### 4.4 seo-competitors
**Propósito**: Análisis competitivo
**Acciones**:
- Identificar top 5-10 competidores
- Comparar métricas (DA, tráfico, keywords)
- Encontrar gaps de keywords
- Analizar estrategia de backlinks

### 4.5 seo-keywords
**Propósito**: Investigación de keywords
**Acciones**:
- Generar variaciones por ciudad
- Analizar volumen y dificultad
- Identificar long-tails
- Priorizar por ROI

### 4.6 seo-content
**Propósito**: Optimización de contenido
**Acciones**:
- Analizar contenido actual vs competencia
- Sugerir mejoras de copy
- Generar briefs de contenido
- Validar densidad de keywords

---

## 5. KPIs y Sistema de Medición

### KPIs Principales

| KPI | Baseline | Meta 3 meses | Meta 6 meses |
|-----|----------|--------------|--------------|
| Posición promedio keywords principales | Por medir | Top 10 | Top 5 |
| Tráfico orgánico mensual | Por medir | +50% | +150% |
| Keywords en top 10 | Por medir | 10 | 25 |
| Domain Authority | Por medir | +5 puntos | +10 puntos |
| CTR promedio | Por medir | +20% | +40% |

### Formato de Reporte Mensual

```markdown
# Reporte SEO - [Mes Año]

## Resumen Ejecutivo
- Cambio posición promedio: +/- X
- Cambio tráfico: +/- X%
- Keywords ganadas/perdidas: +X / -Y

## Posiciones por Ciudad
| Ciudad | Keyword | Posición | Cambio |
|--------|---------|----------|--------|
| Bogotá | alquiler de carros bogota | X | +/- |
...

## Acciones Realizadas
1. ...
2. ...

## Próximos Pasos
1. ...
2. ...

## Aprendizajes
- ...
```

---

## 6. Primeros Pasos (Semana 1)

### Día 1-2: Setup Inicial
- [ ] Crear estructura `docs/seo/`
- [ ] Configurar acceso a SEMRush (vía SEO Conjuntas)
- [ ] Verificar Google Search Console conectado
- [ ] Documentar acceso a herramientas

### Día 3-4: Baseline
- [ ] Ejecutar skill `/seo-baseline`
- [ ] Capturar posiciones actuales (17 ciudades)
- [ ] Extraer métricas GSC últimos 3 meses
- [ ] Auditoría técnica inicial con Screaming Frog

### Día 5-7: Análisis Competitivo
- [ ] Identificar top 5 competidores por ciudad principal (Bogotá)
- [ ] Comparar DA/PA con MOZ
- [ ] Analizar gaps de keywords con SEMRush
- [ ] Documentar hallazgos

### Entregables Semana 1
- [ ] `docs/seo/baseline/2025-01-inicial.md` completo
- [ ] `docs/seo/estrategia/competidores.md` con top 5
- [ ] `docs/seo/estrategia/keywords.md` con targets principales
- [ ] 6 skills creados y funcionales

---

## Ciudades Target (19)

Extraídas de `app/app.config.ts` (actualizado 2025-01-11):
1. Armenia
2. Barranquilla
3. Bogotá
4. Bucaramanga
5. Cali
6. Cartagena
7. Cúcuta
8. Floridablanca
9. Ibagué
10. Manizales
11. Medellín
12. Montería
13. Neiva
14. Palmira
15. Pereira
16. Santa Marta
17. Soledad
18. Valledupar
19. Villavicencio

---

## Recursos

- **Inventario de herramientas**: `seoconjuntas-herramientas.md`
- **Acceso herramientas**: https://seoconjuntas.com/member-tools/
- **Google Search Console**: Configurado en el dominio
