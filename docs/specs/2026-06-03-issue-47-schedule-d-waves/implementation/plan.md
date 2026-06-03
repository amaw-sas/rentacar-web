# Plan de implementación — Issue #47 olas D (lado de escritura, `rentacar-dashboard`)

**Fecha**: 2026-06-03
**Design source**: [`../../2026-06-03-issue-47-schedule-restrictions-design.md`](../../2026-06-03-issue-47-schedule-restrictions-design.md) (ADR + contrato).
**Alcance**: solo **D1–D3** (dashboard, lado de escritura). Las olas W (web, lectura + reglas + UI) se planean cuando D1–D3 estén en producción. No hay ola "D4 exponer en payload": la web lee `locations.schedule` de Supabase directamente (ver Nota de arquitectura del ADR).
**Repo objetivo**: `amaw-sas/rentacar-dashboard` (Next.js App Router + zod + Supabase). Este plan vive en `rentacar-web` como artefacto de coordinación; cada ola D genera su propio `docs/specs/<name>/` con scenarios **en el dashboard**.

Clarificación y research no se repiten aquí: las cinco preguntas abiertas del issue se resolvieron en el ADR (forma del contrato, festivos vía Ley Emiliani, sin buffer, fallback permisivo) y la auditoría de ambos repos ya está hecha (validación servidor existe, slots de 30 min existen, datos reales inspeccionados en Supabase).

---

## Mapa de archivos (`rentacar-dashboard`)

| Archivo | Responsabilidad | Ola |
|---|---|---|
| `lib/schemas/location.ts` | Reemplazar `schedule: z.record(z.string(), z.string())` por el schema v2 (`LocationSchedule`). Única fuente de validación del shape. | D1 |
| `scripts/migration/parse-schedule.ts` | Parser puro `display: string → LocationSchedule`. Unidad testeable (Vitest). Es el corazón de D2. | D2 |
| `scripts/migration/migrate-location-schedule.ts` (o `supabase/migrations/0NN_*.sql` que invoque el resultado) | Aplica el parser a las ~30 filas de `locations.schedule`, conservando `display`. Idempotente, con dump previo. | D2 |
| `components/forms/location-form.tsx` | Editor de horario por día + festivo, inputs restringidos a múltiplos de 30 min, estados cerrado/24 h. | D3 |
| `lib/actions/locations.ts`, `lib/queries/locations.ts` | Ajustar solo si el shape de lectura/escritura cambia (probablemente pass-through). | D1/D3 |

**Decisión de decomposición**: una ola por responsabilidad (contrato → datos → UI), no por capa técnica. Cada una es un PR independiente con su spec+scenarios propios en el dashboard. D1 fija el contrato del que dependen D2 y D3, así que va primero y sin dependencias.

---

## Pasos

### D1 — Schema v2 del contrato `schedule` | Size: M | Deps: ninguna

Reemplaza el genérico `z.record(z.string(), z.string())` por el schema estructurado. Un operador guarda el horario de una sucursal y el sistema solo acepta la forma v2 válida; un horario con borde fuera de la grilla de 30 min o un rango invertido es rechazado.

- `LocationSchedule` = objeto con claves opcionales `mon|tue|wed|thu|fri|sat|sun|hol`, cada una un array de rangos. Regex de cada rango (literal a copiar tal cual; la asimetría de hora inicio vs fin es **deliberada**, no un typo):
  ```
  /^([01]\d|2[0-3]):(00|30)-([01]\d|2[0-4]):(00|30)$/
  ```
  Inicio `00`–`23`; fin `00`–`24` (el `24` habilita el sentinel `24:00`); minutos `(00|30)` en ambos. Ejemplos: `"08:00-18:00"` matchea; `"08:15-18:00"` no (borde fuera de 30 min); `"23:30-24:30"` no (fin `24:30` no existe).
- Además del regex, validar `inicio < fin` por rango. **Comparar en minutos-desde-medianoche**, mapeando el borde `24:00 → 1440` (no es hora de reloj parseable; un comparador ingenuo de `Date`/string lo rompe). Así `"00:00-24:00"` cumple `0 < 1440` y pasa.
- Clave ausente o `[]` = cerrado. `["00:00-24:00"]` = 24 h.
- Conservar `display: z.string().optional()` en el objeto para no romper la lectura actual de la web (que lee `schedule.display`) antes de la ola W1.
- Exportar el tipo `LocationSchedule` derivado.

**Acceptance criteria**
- AC-D1.1 — `locationSchema.parse({ schedule: { mon: ["08:00-18:00"], sat: ["08:00-13:00"], hol: [] } })` pasa.
- AC-D1.2 — `schedule.mon = ["08:15-18:00"]` falla (borde fuera de 30 min).
- AC-D1.3 — `schedule.mon = ["18:00-08:00"]` falla (rango invertido, `1080 < 480` falso).
- AC-D1.4 — `schedule = {}` pasa (permisivo; sin horario).
- AC-D1.5 — `schedule = { display: "texto", mon: ["08:00-18:00"] }` pasa (coexistencia display + estructurado).
- AC-D1.6 — `schedule.mon = ["00:00-24:00"]` pasa (sentinel 24 h; `0 < 1440`). **Es la forma que D2 produce — si D1 la rechazara, D2 generaría datos inválidos.**
- AC-D1.7 — `schedule.mon = ["24:00-24:00"]` y `["23:30-24:30"]` fallan (inicio no puede ser fin-de-día; minuto `24:30` no existe). Documenta que la asimetría `2[0-3]`/`2[0-4]` es intencional.

---

### D2 — Migración de datos `{display}` → estructurado | Size: M | Deps: D1

Transforma las ~30 sucursales de texto libre a la forma v2, **conservando** `display`. Tras la migración, la columna tiene ambas formas; la web sigue leyendo `display` hasta W1. Implementa los escenarios SCEN-01/02/03 del ADR.

- Parser determinista de los patrones reales presentes en los datos: bloques de días `Lun-Vie`, `Lun-Sáb`, `Lun-Dom`; días sueltos `Sáb`, `Dom`; grupos con coma `Sáb, Dom y fest`, `Dom y fest`; `Todos los días`; literales `24 horas`, `Cerrado`; y `Festivos HH:MM-HH:MM`. (La forma coma-grupo `"Sáb, Dom y fest 08:00-16:00"` aparece en AARME/AABAN — no omitirla.)
- Las ~5 sucursales con `{}` quedan `{}` (no se inventa horario — permisivo). Una columna `schedule` en `NULL`/ausente se trata igual que `{}` (permisivo), no se rompe.
- Migración idempotente y con dump previo de `locations(code, schedule)` para rollback.
- **Revisión humana fila por fila** del resultado contra el horario operativo real (open question O3) — el texto es heterogéneo y el parser puede malinterpretar casos límite. **Esta revisión está en el camino crítico de D2: definir el validador humano antes de la corrida prod (no es solo un riesgo).**

**Acceptance criteria**
- AC-D2.1 (SCEN-01) — `"Lun-Vie 08:00-18:00 | Sáb 08:00-13:00 | Dom y fest Cerrado"` → `{mon..fri:["08:00-18:00"], sat:["08:00-13:00"], sun:[], hol:[]}`.
- AC-D2.2 (SCEN-02) — `"Lun-Dom 24 horas | Festivos 06:00-21:00"` → `{mon..sun:["00:00-24:00"], hol:["06:00-21:00"]}`.
- AC-D2.3 (SCEN-03) — `{}` permanece `{}`; `NULL`/ausente → `{}` (permisivo).
- AC-D2.3b — `"Sáb, Dom y fest 08:00-16:00"` (coma-grupo) → `{sat:["08:00-16:00"], sun:["08:00-16:00"], hol:["08:00-16:00"]}`.
- AC-D2.4 — toda fila migrada conserva su `display` original (D3 lo regenerará desde el estructurado; ver O2 resuelto).
- AC-D2.5 — re-ejecutar la migración no cambia el resultado (idempotente).
- AC-D2.6 — existe dump de rollback y un runbook de reversión (patrón `docs/migration-runs/` del dashboard).
- AC-D2.7 — toda salida del parser pasa `locationSchema` de D1 (el parser no produce nada que el schema rechace).

---

### D3 — UI de edición del horario | Size: M | Deps: D1 (datos de D2 para mostrar lo migrado)

Editor en el formulario de sucursal. Un operador abre una sucursal, ve/edita el horario por día + festivo con selección en bloques de 30 min, marca un día como cerrado o 24 h, y al guardar solo se persiste un `schedule` válido v2.

- Por cada día (`mon`…`sun`) + `hol`: toggle abierto/cerrado, toggle 24 h, y selección de rango con inputs limitados a múltiplos de 30 min (preserva la invariante del contrato).
- Validación con el schema D1 antes de enviar; errores inline.
- **O2 resuelto: el dashboard deriva `display` al guardar.** Al persistir, genera un `display` legible desde el estructurado (p. ej. `"Lun-Vie 08:00-18:00 | Sáb 08:00-13:00 | Dom y fest Cerrado"`). Así la web sigue leyendo `schedule.display` sin cambios y no se necesita una ola W para el texto; el estructurado es canónico y el `display` es siempre derivado. (Se descartó derivar en web porque dejaría `display` desincronizado durante D1–D3.)

**Acceptance criteria**
- AC-D3.1 — el selector de hora solo ofrece `:00` y `:30` (no `08:15`).
- AC-D3.2 — marcar un día "Cerrado" persiste `[]` (o clave ausente) para ese día.
- AC-D3.3 — marcar "24 h" persiste `["00:00-24:00"]`.
- AC-D3.4 — intentar guardar un horario inválido (rango invertido) muestra error y no persiste.
- AC-D3.5 — editar una sucursal ya migrada precarga sus rangos correctamente.
- AC-D3.6 — al guardar, `display` se regenera desde el estructurado y queda coherente con los rangos persistidos (un cambio de `sat` a "Cerrado" se refleja en el texto).

---

## Prerequisites

- Acceso de escritura al proyecto Supabase `rentacar-dashboard` (`ilhdholjrnbycyvejsub`) para D2.
- Confirmar zona horaria única `America/Bogota` (open question O1) antes de cualquier cómputo de fecha — no afecta D1–D3 (escritura), pero sí W3.

## Testing strategy

Tooling confirmado en la raíz del repo dashboard: `vitest.config.ts`, `playwright.config.ts`, `e2e/` (verificado en el árbol de `amaw-sas/rentacar-dashboard@main`).
- **D1**: unit (Vitest) sobre `locationSchema` — los AC-D1.* como casos.
- **D2**: unit (Vitest) sobre el parser puro `parse-schedule.ts` (AC-D2.1–3b, AC-D2.7), más verificación de la corrida (dry-run + diff revisado, patrón `docs/migration-runs/dry-run-*.md`). Nota: el parser es código TS justamente para ser unit-testeable; una migración SQL pura no lo permitiría.
- **D3**: component/e2e (Playwright) — AC-D3.* sobre el formulario.
- Cada ola arranca con su `*.scenarios.md` como holdout (SDD) en el dashboard.

## Rollout

1. D1 (schema) — sin efecto en datos; despliega solo y permite que D3 valide.
2. D2 (migración) — dry-run → revisión humana → corrida prod con dump de rollback. La web sigue leyendo `display` (intacto).
3. D3 (UI) — despliega tras D2 para que los operadores editen sobre datos ya estructurados.
4. Señal de desbloqueo de #47: D1–D3 en prod con datos revisados → planear olas W (empezando por W1, la lectura estructurada en la web).

## Riesgos

- **Parser de D2 malinterpreta texto** → mitigado por revisión humana fila por fila (O3, en el camino crítico) + dump de rollback.
- **Drift display vs estructurado** → resuelto: `display` se deriva del estructurado en cada save (D3, AC-D3.6); el estructurado es la única fuente canónica.
- **Cambio de shape rompe lectura web antes de W1** → mitigado conservando `display` en D1/D2 (la web no lee las claves nuevas hasta W1).
- **Comparador `inicio<fin` no maneja el sentinel `24:00`** → mitigado mapeando `24:00→1440` minutos en D1 (AC-D1.6).
