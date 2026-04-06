# Guía de Uso - Herramientas SEO

## Acceso

**Portal:** https://seoconjuntas.com/member-tools/

> Las credenciales se actualizan cada 5-7 días

---

## Herramienta Principal: SEMRush Guru

Cubre ~70% de necesidades SEO.

### Usos Principales

| Tarea | Cómo hacerlo |
|-------|--------------|
| Tracking de posiciones | Projects > Position Tracking > Add keywords |
| Investigación keywords | Keyword Magic Tool > Enter seed keyword |
| Auditoría técnica | Site Audit > Enter domain |
| Análisis competencia | Domain Overview > Enter competitor |
| Gap de keywords | Keyword Gap > Enter domains to compare |
| Análisis backlinks | Backlink Analytics > Enter domain |

### Configuración Recomendada

1. **Proyecto:** Crear proyecto para alquilatucarro.com
2. **Position Tracking:**
   - Device: Mobile (prioridad)
   - Location: Colombia
   - Keywords: 17 keywords principales (1 por ciudad)
3. **Site Audit:** Programar semanalmente

---

## Herramientas Complementarias

### MOZ Pro

**Uso:** Métricas de autoridad (DA/PA)

| Tarea | Ubicación |
|-------|-----------|
| Domain Authority | Link Explorer > Enter domain |
| Comparar DA | Link Explorer > Compare domains |
| Spam Score | Link Explorer > Spam Score tab |

### Screaming Frog

**Uso:** Auditoría técnica profunda (desktop app)

| Análisis | Configuración |
|----------|---------------|
| Crawl completo | Enter URL > Start |
| Errores 404 | Response Codes > Client Error (4xx) |
| Redirects | Response Codes > Redirection (3xx) |
| Meta duplicados | Page Titles > Duplicate |
| Images sin alt | Images > Missing Alt Text |

### Answer The Public

**Uso:** Ideas de contenido basadas en preguntas

1. Enter keyword: "alquiler de carros"
2. Select country: Colombia
3. Export results para plan de contenido

### Pingdom

**Uso:** Monitoreo de velocidad

1. Enter URL: alquilatucarro.com
2. Select region: South America
3. Run test
4. Guardar Grade, Load time, Page size

---

## Flujo de Trabajo Semanal

### Lunes
- Revisar posiciones en SEMRush
- Verificar alertas de Site Audit

### Miércoles
- Analizar GSC (impresiones, clics)
- Identificar oportunidades quick-win

### Viernes
- Revisar backlinks nuevos
- Documentar insights en `aprendizajes/insights.md`

---

## Flujo de Trabajo Mensual

1. Ejecutar `/seo-monthly` para generar reporte
2. Crawl completo con Screaming Frog
3. Actualizar DA/PA con MOZ
4. Revisar Core Web Vitals
5. Ajustar estrategia según resultados

---

## Tips

- **Exportar datos:** Siempre exportar a CSV para histórico
- **Screenshots:** Guardar capturas de métricas clave
- **Credenciales:** Verificar acceso antes de empezar sesión de trabajo
- **Límites:** Respetar límites de API/crawling de cada herramienta
