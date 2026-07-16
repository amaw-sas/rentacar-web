---
name: seo-auth-headers
created_by: agent
created_at: 2026-07-16T14:30:00Z
issue: 322
pr_package: 4
---

# Issue 322 · PR4 — Seguridad del servidor (panel SEO + cabeceras + IP)

## SCEN-322-S01 — Endpoints /api/seo/* requieren sesión (excepto login)

**Given** un cliente sin cookie de sesión SEO válida
**When** llama a `GET /api/seo/metrics` o `POST /api/seo/update`
**Then** recibe 401 Unauthorized
**And** no se escriben ficheros ni se consultan APIs externas

**Evidence**: middleware/server guard + tests estructurales/unitarios.

## SCEN-322-S02 — Cookie de sesión no es el literal `authenticated`

**Given** un login exitoso con `SEO_PASSWORD`
**When** el servidor setea la cookie `seo-auth`
**Then** el valor es un token firmado (HMAC) con expiración, no la cadena fija `authenticated`
**And** la cookie es `httpOnly`, `sameSite=lax`, y `secure` en producción

**Evidence**: `auth.post.ts` + helper de sesión.

## SCEN-322-S03 — OAuth GSC exige state y sesión SEO

**Given** un atacante sin sesión SEO
**When** abre `/api/auth/gsc/authorize`
**Then** es rechazado (401/redirect login)

**Given** un usuario SEO autenticado inicia OAuth
**When** Google redirige a `/api/auth/gsc/callback` con un `state` distinto al cookie
**Then** no se guardan tokens (redirect error)

**Evidence**: authorize + callback + cookie de state.

## SCEN-322-S04 — Cabeceras de seguridad en las 3 marcas

**Given** una respuesta HTML del sitio
**When** se inspeccionan las cabeceras (routeRules nitro)
**Then** existen al menos: `X-Content-Type-Options: nosniff`, `X-Frame-Options` o CSP `frame-ancestors`, `Referrer-Policy`, y HSTS en config de producción

**Evidence**: `nuxt.config.ts` de las 3 marcas.

## SCEN-322-S05 — Rate-limit del blog usa IP real en Vercel

**Given** el middleware `blog-api-auth` en Vercel
**When** se extrae la IP del cliente
**Then** se usa `getRequestIP(event, { xForwardedFor: true })` (no solo el socket)
**And** el rate-limit no colapsa a una sola IP de edge

**Evidence**: `blog-api-auth.ts` en las 3 marcas + tests.
