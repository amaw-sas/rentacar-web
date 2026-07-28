# Plan de publicación de alquilame.co

**Fecha:** 2026-07-27 · **Estado:** propuesto, pendiente de aprobación del dueño
**Contexto:** el contenido propio está terminado y verificado (ver `mision-contenido-propio-2026-07-27.md`); el blog tiene su primer artículo. Falta el único paso que toca producción: publicar el sitio en el dominio real.

## Hechos verificados (no supuestos)

- `alquilame.co` está en Cloudflare (NS casey/barbara) y la landing legacy **ya se sirve desde Vercel** (`x-vercel-id` presente, `cf-cache-status: DYNAMIC`). La migración es mover el dominio entre proyectos de Vercel, no un cambio de DNS en el registrador. Cutover y rollback en minutos.
- `preview/alquilame-todo` está a **104 commits** de `origin/main`. Toca 196 archivos de `ui-alquilame`, pero también **27 archivos compartidos**: `packages/logic` (11, incluye el fix del precio mensual y chat status), `ui-alquicarros` (10), `ui-alquilatucarro` (6). **Mergear a main redespliega alquilatucarro.com y alquicarros en producción con esos cambios.**
- El merge NO publica alquilame: el proyecto Vercel `rentacar-web-alquilame` no tiene dominio de producción. Publicar = fase F4, separada y reversible.
- La otra sesión de trabajo está en `rentacar-dashboard`: este plan **no toca ese repo** y el merge se hace por PR en GitHub, sin cambiar de rama el checkout compartido de rentacar-web.

## Criterios de éxito

| # | Escenario observable |
|---|---|
| P1 | alquilatucarro.com y alquicarros siguen operando igual tras el merge (smoke: home, ciudad, flujo de reserva hasta el resumen, precios diario y mensual) |
| P2 | alquilame.co sirve el sitio nuevo: home 200, 19 ciudades 200, blog con el post |
| P3 | Las 4 URLs legacy con historial responden 301 a su destino |
| P4 | robots.txt correcto y sitemap.xml accesible en el dominio real; ninguna página clave con noindex |
| P5 | Search Console recibe el sitemap sin errores |
| P6 | Rollback documentado y ensayado mentalmente: re-adjuntar el dominio al proyecto legacy (<10 min) |

## Registro de ejecución

- **F1 ✅** (2026-07-27): redirecciones 301 de URLs legacy implementadas con tests y verificadas en vivo; robots/sitemap OK en modo producción.
- **F0 ✅** (2026-07-28): 4 rondas de revisión adversarial. Hallazgos corregidos: WhatsApp fallar-abierto (antes: el botón de las marcas vivas dependía de un fetch al dashboard), botón "Llámanos" restaurado en las marcas vivas (decisión del dueño: solo alquilame lo elimina; guards codifican la regla y atrapan deriva — probado con mutación), flag del wizard de alquicarros condicionado al viewport de la barra móvil (antes escondía TODO el contacto en desktop), import de useMediaQuery que faltaba (verificado montando el wizard en runtime), `.mission/` fuera del repo público, guard vacuo del timer arreglado y probado con mutación. Trabajo concurrente de la otra sesión (integración de main + extras mensuales) unido sin pérdidas. Suites finales: logic 1255/1255, alquilatucarro 301/301, alquicarros 683/683, alquilame solo los 7 rojos preexistentes. **Veredicto: APTO PARA MERGE A MAIN** (e23c654).
- Seguimientos no bloqueantes ticketeados: los mount-tests con jsdom no corren en local (`ERR_REQUIRE_ESM` de html-encoding-sniffer — confirmar en CI del PR); `shiftLeft` es código muerto en el ChatWidget.

- **F2 🔄** (2026-07-28): dueño verificó en Vercel — proyecto legacy identificado: **"alquilame.co"** (tiene alquilame.co Production + www con 308 + alquilameco.vercel.app; Cloudflare proxy delante). Variables de `rentacar-web-alquilame`: Supabase, admin URL/key, image domains, blog key — todas Production ✓. **Falta 1**: `NUXT_RESEND_API_KEY` quedó solo en el proyecto legacy (añadida allí el 23-jul por error); el dueño debe crear key NUEVA en Resend (rotación pendiente) y añadirla al proyecto nuevo (Production+Preview, Sensitive).
- **F2 ✅** (2026-07-28): cerrada con evidencia E2E. Las 3 variables de correo en `rentacar-web-alquilame` (Production+Preview): key NUEVA de Resend (rotación hecha), TO/FROM. Prueba real: POST /api/contact → {"ok":true} 200 en el deployment fresco (verificado con build marker). Nota: la key vieja quedó en el proyecto legacy — borrarla en Resend y en Vercel post-lanzamiento.
- **F3-checks ✅** (2026-07-28): PR #419 con TODO el tablero en verde (Quality Checks + E2E + 3 builds Vercel). Para llegar: los 7 tests que fijaban el diseño viejo de alquilame se alinearon al rediseño aprobado (939/939, primera corrida totalmente verde de la rama), y la suite jsdom que solo corre en CI (whatsappSchedule montado) se adaptó a la decisión del teléfono. El lint de CI es continue-on-error (ruido histórico: eslint no es dep de los paquetes de marca) — seguimiento, no bloqueo.

## Fases

### F0 — Revisión del paquete compartido (bloquea todo)
Los 27 archivos de logic/otras marcas llevan semanas en preview sin pisar producción.
1. Diff dirigido de esos 27 archivos + revisión adversarial (agente fresco) con pregunta única: ¿algo de esto puede romper alquilatucarro/alquicarros en prod?
2. Vitest completo de los 3 paquetes de marca + logic sobre la rama.
3. Smoke visual de alquilatucarro y alquicarros en sus deployments de preview de la rama (ya construyen verde; falta mirarlos con ojos).
4. Decidir qué hacer con `.mission/` (20 archivos de una orquestación vieja en la rama): limpiar o dejar.

### F1 — Preparativos en el repo (sin publicar nada)
1. Redirecciones legacy como `routeRules` 301 en `ui-alquilame/nuxt.config.ts`:
   - `/registratuflota` → `/aliados`
   - `/aviso-proteccion-de-datos` → `/politica-privacidad`
   - `/terminos-condiciones.html` → `/terminos-condiciones`
   (la 4ª, `/terminos-condiciones`, ya existe con el mismo path — no necesita nada)
   Con tests.
2. Verificar robots/meta-robots/sitemap del preview con `?mockProductionEnv`.

### F2 — Vercel y entorno (manual, en el dashboard de Vercel; yo guío)
1. Identificar qué proyecto Vercel tiene hoy el dominio alquilame.co (el de la landing legacy). Anotar su nombre exacto — es el botón de rollback.
2. Checklist de variables del proyecto `rentacar-web-alquilame` con alcance **Production** (hoy funcionan en preview: Supabase, API del dashboard, Resend de alquilame, WATI). Confirmar que ninguna esté scoped solo a Preview.
3. Exportar/capturar los registros DNS actuales de Cloudflare para el rollback.
4. Recordatorio pendiente de la misión anterior: la key de Resend estaba para rotar; buen momento.

### F3 — Merge a main (el envío; aún no publica alquilame)
1. **PR `preview/alquilame-todo` → `main` en GitHub** (nunca merge local: el checkout compartido no se toca y los checks de Vercel corren para los 3 proyectos).
2. Esperar los 3 builds verdes del PR; merge.
3. Tras el merge: **smoke de alquilatucarro.com en producción** (P1) — home, una ciudad, /reservas hasta el resumen, precio mensual (el fix del precio viaja en este merge). Igual alquicarros.
4. Si algo se rompe en P1: revert del merge en GitHub (un clic) — alquilame aún no está expuesto, no hay daño de marca nueva.
5. Los builds de las 3 marcas serializan en Vercel (concurrencia 1): contar 10-30 min.

### F4 — Cutover del dominio (la migración real; ~10 min, reversible)
Ventana sugerida: hora de bajo tráfico (madrugada o antes de 7 AM Colombia); coordinar para que la sesión del dashboard no esté desplegando en ese momento (el sitio consume su API).
1. En Vercel: quitar `alquilame.co` (y `www`) del proyecto legacy → añadirlos a `rentacar-web-alquilame`. Vercel emite el certificado; Cloudflare no debería necesitar cambios (ya apunta a Vercel) — verificar que el registro apex/CNAME siga el patrón que Vercel indique.
2. Verificación inmediata (P2, P3, P4): home, 3 ciudades, blog, las 3 redirecciones 301, robots.txt, sitemap.xml, og:image de una ciudad compartida en WhatsApp.
3. Consola y red limpias en el dominio real (navegador embebido).
4. **Rollback:** re-adjuntar el dominio al proyecto legacy. Minutos. Sin tocar DNS.

### F5 — Post-lanzamiento (mismo día)
1. Search Console (`sc-domain:alquilame.co`, ya verificada): enviar sitemap; pedir indexación de home + bogotá + 3 ciudades fuertes.
2. Revisar logs de Vercel por 404s de URLs legacy no mapeadas (si aparecen con tráfico, añadir redirecciones).
3. Vigilancia 48h: cobertura en GSC, tasa de error, formularios (Resend) y WhatsApp.

### F6 — Después (semanas; plan aparte)
Confirmada la indexación de las 19 ciudades → arranca el plan de redirecciones de los 19 satélites por olas (orden y precauciones ya documentados en la auditoría). El primer artículo mensual del blog sale del banco de ideas aprobado.

## Reparto

| Quién | Qué |
|---|---|
| Claude (esta sesión) | F0 completo, F1 completo, PR de F3, verificaciones de F3/F4/F5, monitoreo |
| Dueño | Aprobación del plan · pasos de UI en Vercel/Cloudflare (F2, F4.1) con guía paso a paso · decisión go/no-go del cutover |
| Sesión dashboard | Nada. Solo no desplegar el dashboard durante la ventana de F4 |

## Qué NO se hace en este plan
- No se redirige ningún satélite (eso es F6, con su propio plan).
- No se toca rentacar-dashboard.
- No se cambia nada en el registrador del dominio ni en los NS de Cloudflare.
