---
name: dead-code
created_by: agent
created_at: 2026-07-16T15:00:00Z
issue: 322
pr_package: 6
---

# Issue 322 · PR6 — Código muerto entre marcas

## SCEN-322-D01 — alquicarros no monta el grid muerto

**Given** las páginas de resultados de alquicarros
**When** se inspecciona el árbol de render (CityPage / reservas)
**Then** no se importa ni renderiza `CategorySelectionSection`
**And** los archivos del grid muerto no existen o quedan fuera del árbol de app

**Evidence**: CityPage + file absence / no imports.

## SCEN-322-D02 — Rama de vuelo no valida campos invisibles

**Given** el formulario de reserva en las 3 marcas
**When** el usuario envía sin campos de aerolínea/vuelo en la plantilla
**Then** la validación no exige `aerolinea` / `numeroVueloIda` (schema de vuelo no se aplica)

**Evidence**: ReservationForm / FormSection siempre usan el schema sin vuelo.
