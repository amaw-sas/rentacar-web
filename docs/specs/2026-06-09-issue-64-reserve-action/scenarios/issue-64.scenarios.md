# Scenarios — #64 ReserveAction + eliminar SearchAction falso

Holdout observable. Verificación sobre el **JSON-LD renderizado** (no el source).
Aplica a las 3 marcas (alquilatucarro, alquilame, alquicarros).

## SCEN-001 — No queda SearchAction falso
- **Given** el HTML renderizado de la home de una marca
- **When** se extrae el grafo JSON-LD (`<script type="application/ld+json">`)
- **Then** no existe ningún nodo con `"@type": "SearchAction"`
- **Verify:** `curl -s <url> | grep -o '"@type":"SearchAction"'` → vacío

## SCEN-002 — ReserveAction resoluble presente
- **Given** el grafo JSON-LD renderizado de la home
- **When** un agente busca un `potentialAction` de tipo `ReserveAction`
- **Then** existe un `ReserveAction` cuyo `target` es un `EntryPoint` con
  `urlTemplate` igual a una URL resoluble del sitio (`franchise.website`),
  **no** la raíz con `{search_term_string}`
- **And** declara `result` de tipo `RentalCarReservation`
- **Verify:** el JSON-LD contiene `"@type":"ReserveAction"` con
  `target.urlTemplate` == el dominio de la marca y sin `{search_term_string}`

## SCEN-003 — Schema válido
- **Given** el `ReserveAction` declarado
- **When** se valida contra Schema.org (typecheck `schema-dts` + validador estructural)
- **Then** los tipos son correctos: `ReserveAction.target: EntryPoint`,
  `EntryPoint.urlTemplate: string`, `EntryPoint.actionPlatform`,
  `ReserveAction.result: RentalCarReservation`; sin errores de tipo
- **Verify:** `pnpm --filter ui-<brand> typecheck` (build-mode) verde para el archivo;
  validación estructural del nodo

## Fuera de alcance (follow-up, gated por D2 = dashboard#73)
- `actionApplication` (WebAPI) apuntando a la API pública documentada.
- Deep-link `urlTemplate` parametrizado por ciudad (necesita directorio `slug↔code↔ciudad`).
