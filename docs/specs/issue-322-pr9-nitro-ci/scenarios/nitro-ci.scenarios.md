---
name: nitro-ci
created_by: agent
created_at: 2026-07-16T19:00:00Z
issue: 322
pr_package: 9
---

# Issue 322 · PR9 — Config Nitro coherente + e2e en CI

Holdout para prerender/ISR contradictorios, redirects 301 rotos, blog-cache
por marca y el job e2e ausente.

## SCEN-322-N01 — Una sola estrategia de render por ruta

**Given** la home y las 19 landings de ciudad en las 3 marcas
**When** se lee la config de Nitro
**Then** cada ruta tiene UNA estrategia (prerender O isr), no ambas — y la elegida queda documentada en el config

**Evidence**: nuxt.config.ts de las 3 marcas sin solapamiento prerender/isr.

## SCEN-322-N02 — Los redirects legacy responden 301, no 307

**Given** las 5 URLs legacy con backlinks (p. ej. `/tratamiento-datos-alquilatucarro.pdf`)
**When** se solicita la URL (`curl -I`)
**Then** la respuesta es `301 Moved Permanently` con Location correcto

**Evidence**: routeRules en forma `{ redirect: { to, statusCode: 301 } }` + verificación HTTP (preview o build local).

## SCEN-322-N03 — El guardarraíl de cache del blog protege a las 3 marcas

**Given** una petición a `/blog/<slug-inexistente>` en alquilame o alquicarros
**When** el post resuelve a null
**Then** la respuesta 404 NO se cachea 1 hora (el guardarraíl vive en packages/logic y lo heredan las 3 marcas)

**Evidence**: middleware compartido + test/curl -I con Cache-Control correcto.

## SCEN-322-N04 — CI ejecuta los specs e2e de payload de reserva

**Given** un push/PR al repo
**When** corre el workflow de CI
**Then** un job ejecuta al menos los specs e2e de payload de reserva con stubs deterministas (page.route), y su fallo marca el pipeline

**Evidence**: job en ci.yml + corrida local del subset verde.
