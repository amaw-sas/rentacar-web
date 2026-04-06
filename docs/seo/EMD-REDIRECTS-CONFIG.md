# Configuracion de Redirects 301 para EMDs

**Fecha**: 2026-01-16
**Estado**: Fase A - Preparacion

---

## Resumen Ejecutivo

13 dominios EMD limpios listos para redirect 301 permanente a alquilatucarro.com.

---

## Opciones de Implementacion

### Opcion 1: Redirect a nivel de Registrar (RECOMENDADA)

| Aspecto | Detalle |
|---------|---------|
| **Complejidad** | Baja |
| **Costo** | Incluido en registro |
| **Tiempo** | 5 min por dominio |
| **SEO** | 301 nativo |

**Procedimiento**:
1. Acceder al panel del registrar (GoDaddy, Namecheap, etc.)
2. Buscar "URL Forwarding" o "Domain Forwarding"
3. Configurar redirect 301 a URL destino
4. Propagar DNS (24-48h)

### Opcion 2: Firebase Multi-hosting

| Aspecto | Detalle |
|---------|---------|
| **Complejidad** | Media |
| **Costo** | Gratis (Firebase) |
| **Tiempo** | 30 min setup + verificacion |
| **SEO** | 301 via Cloud Functions |

**Procedimiento**:
1. Agregar cada EMD como sitio en Firebase
2. Configurar hosting para cada sitio
3. Implementar redirects en Cloud Functions

### Opcion 3: Cloudflare Page Rules

| Aspecto | Detalle |
|---------|---------|
| **Complejidad** | Media |
| **Costo** | Gratis hasta 3 reglas |
| **Tiempo** | 15 min por dominio |
| **SEO** | 301 nativo |

---

## Configuracion de Redirects - 13 Dominios Verdes

### Tabla de Mapeo

| # | Dominio Origen | URL Destino | Tipo |
|---|---------------|-------------|------|
| 1 | alquilerdecarrosarmenia.com | https://alquilatucarro.com/armenia/ | 301 |
| 2 | alquilercarrosbucaramanga.com | https://alquilatucarro.com/bucaramanga/ | 301 |
| 3 | alquilercarrosmedellin.co | https://alquilatucarro.com/medellin/ | 301 |
| 4 | alquilercarroscali.net | https://alquilatucarro.com/cali/ | 301 |
| 5 | alquilercarrossantamarta.com | https://alquilatucarro.com/santa-marta/ | 301 |
| 6 | alquilerdecarrosibague.com | https://alquilatucarro.com/ibague/ | 301 |
| 7 | alquilerdecarrosmanizales.com | https://alquilatucarro.com/manizales/ | 301 |
| 8 | alquilerdecarrosneiva.com | https://alquilatucarro.com/neiva/ | 301 |
| 9 | alquilerdecarrosvalledupar.com | https://alquilatucarro.com/valledupar/ | 301 |
| 10 | alquilercarrosvillavicencio.com | https://alquilatucarro.com/villavicencio/ | 301 |
| 11 | alquilerdecarrosfloridablanca.com | https://alquilatucarro.com/floridablanca/ | 301 |
| 12 | alquilerdecarrospalmira.com | https://alquilatucarro.com/palmira/ | 301 |
| 13 | alquilerdecarrossoledad.com | https://alquilatucarro.com/soledad/ | 301 |

---

## Instrucciones por Registrar

### GoDaddy

1. Ir a "My Products" > "Domains"
2. Click en dominio > "Manage DNS"
3. Scroll hasta "Forwarding"
4. Click "Add" en "Domain"
5. Configurar:
   - Forward to: `https://alquilatucarro.com/[ciudad]/`
   - Redirect type: `301 (Permanent)`
   - Forward settings: `Forward only`
6. Save

### Namecheap

1. Domain List > Manage
2. "Redirect Domain" tab
3. Destination URL: `https://alquilatucarro.com/[ciudad]/`
4. Redirect Type: `Permanent (301)`
5. Save

### Cloudflare

1. Add site > Configure DNS
2. Rules > Page Rules
3. Create Rule:
   - URL: `*dominio.com/*`
   - Setting: Forwarding URL
   - Status: 301
   - Destination: `https://alquilatucarro.com/[ciudad]/`

---

## Checklist de Implementacion

### Pre-redirect

- [ ] Verificar que la pagina destino existe y carga correctamente
- [ ] Confirmar SSL activo en alquilatucarro.com
- [ ] Documentar metricas actuales de cada EMD en GSC
- [ ] Tomar screenshots de GSC Performance

### Durante redirect

- [ ] Configurar redirect 301 (NO 302)
- [ ] Verificar redirect con `curl -I dominio.com`
- [ ] Confirmar status code 301

### Post-redirect

- [ ] Verificar acceso desde navegador
- [ ] Submitar Change of Address en GSC (si aplica)
- [ ] Monitorear GSC de alquilatucarro.com por 4 semanas
- [ ] Documentar cualquier anomalia

---

## Verificacion de Redirects

### Comando curl

```bash
# Verificar redirect 301
curl -I https://alquilerdecarrosarmenia.com

# Resultado esperado:
# HTTP/2 301
# location: https://alquilatucarro.com/armenia/
```

### Herramientas online

- https://httpstatus.io/
- https://redirect-checker.org/
- https://www.redirect-check.org/

---

## Estado de Implementacion

| # | Dominio | Config | DNS | Verificado | Fecha |
|---|---------|--------|-----|------------|-------|
| 1 | alquilerdecarrosarmenia.com | Pendiente | - | - | - |
| 2 | alquilercarrosbucaramanga.com | Pendiente | - | - | - |
| 3 | alquilercarrosmedellin.co | Pendiente | - | - | - |
| 4 | alquilercarroscali.net | Pendiente | - | - | - |
| 5 | alquilercarrossantamarta.com | Pendiente | - | - | - |
| 6 | alquilerdecarrosibague.com | Pendiente | - | - | - |
| 7 | alquilerdecarrosmanizales.com | Pendiente | - | - | - |
| 8 | alquilerdecarrosneiva.com | Pendiente | - | - | - |
| 9 | alquilerdecarrosvalledupar.com | Pendiente | - | - | - |
| 10 | alquilercarrosvillavicencio.com | Pendiente | - | - | - |
| 11 | alquilerdecarrosfloridablanca.com | Pendiente | - | - | - |
| 12 | alquilerdecarrospalmira.com | Pendiente | - | - | - |
| 13 | alquilerdecarrossoledad.com | Pendiente | - | - | - |

---

## Notas Importantes

### SEO Best Practices

1. **Usar 301, nunca 302** - 301 transfiere autoridad de links
2. **Redirect a pagina especifica** - No a homepage generica
3. **Mantener dominios activos** - No dejar expirar por 12+ meses
4. **Monitorear GSC** - Verificar que impresiones/clicks migran

### Timing

- Propagacion DNS: 24-48 horas
- Recrawl Google: 1-4 semanas
- Transferencia completa de SEO: 2-3 meses

---

*Documento creado: 2026-01-16*
*Ultima actualizacion: 2026-01-16*
