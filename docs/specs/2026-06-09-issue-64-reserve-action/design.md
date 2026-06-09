# Diseño — #64: ReserveAction + eliminar SearchAction falso

> Épico #63 (auditoría agéntica 2026-05-26, hallazgo W1) · Layer `logic` → 3 marcas

## Problema

El JSON-LD de las marcas declara un `SearchAction` cuyo `urlTemplate` apunta a
`${franchise.website}/{search_term_string}`. No existe un buscador por término
libre en el sitio: un agente que ejecute esa acción falla. Además, no se declara
ninguna `ReserveAction`, así que un agente que lee el grafo no descubre que el
sitio permite reservar.

## Decisión

1. **Eliminar** el `SearchAction`. Verificado en código: no hay buscador por
   texto libre. La búsqueda real del sitio es de *disponibilidad* (estructurada:
   ciudad × lugares × fechas × horas), que no es lo que modela `SearchAction`
   (caja de búsqueda de contenido por término libre). Repuntarlo seguiría siendo
   semánticamente falso; construir un buscador de contenido es una feature aparte,
   fuera del alcance de #64. Lo honesto es quitarlo.

2. **Declarar** un `ReserveAction` en el nodo `AutoRental` (la entidad de negocio
   que ofrece la reserva — ubicación semánticamente correcta para `potentialAction`):
   - `target` → `EntryPoint` con `urlTemplate: franchise.website` (la home, donde
     arranca el flujo de reserva). **Resoluble hoy**, sin dependencias.
   - `actionPlatform` → desktop + mobile web.
   - `result` → `RentalCarReservation` (declara qué produce la acción).

3. **Diferir** `actionApplication` (WebAPI programática) a D2
   (`amaw-sas/rentacar-dashboard#73`, hoy OPEN). Cuando D2 cierre, se enriquece el
   `ReserveAction` con la API pública documentada y un deep-link parametrizado por
   ciudad (que necesita el directorio `slug↔code↔ciudad` de D2). Se registra como
   follow-up en #64 — no bloquea el cierre de los criterios de aceptación actuales.

## Por qué no esperar a D2

Los criterios de aceptación de #64 piden "`SearchAction` falso eliminado" y
"`ReserveAction` presente y válido". Ambos se cumplen con un `EntryPoint` web
resoluble hoy. La capa WebAPI es enriquecimiento, no requisito de #64.

## Alcance

- **Archivo:** `packages/logic/src/composables/useBaseSEO.ts` (único).
- **Blast radius:** `useBaseSEO` corre en `app.vue` de las 3 marcas (todas las
  páginas) + home + city/search SEO. El `ReserveAction` aparece site-wide
  (consistente: el `SearchAction` también lo era). Sin consumidores de código;
  solo cambia el output JSON-LD/SEO. Sin cambios de API ni de datos.
- **Imports:** quitar `SearchAction`; añadir `ReserveAction`, `RentalCarReservation`.

## Escenarios observables (holdout)

Ver `scenarios/issue-64.scenarios.md`.
