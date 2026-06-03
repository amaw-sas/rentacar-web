# Restricción de fechas/horas por horario de sucursal — ADR + contrato cross-repo

**Fecha**: 2026-06-03
**Issue**: [#47](https://github.com/amaw-sas/rentacar-web/issues/47)
**Tipo**: ADR (decisión de arquitectura) + contrato de datos + plan de migración por olas. No incluye código — el alcance acordado es decisión + contrato + secuencia. La implementación de cada ola se autoriza por separado.
**Repos involucrados**: `rentacar-web` (consumer), `rentacar-dashboard` (admin / fuente de verdad del catálogo y de las sucursales).
**Referente de patrón**: `docs/specs/2026-06-02-issue-28-category-restrictions-source-of-truth-design.md` (mismo patrón: la web va detrás del dashboard, el dashboard es la fuente de verdad).

---

## TL;DR

El issue pide que el formulario restrinja fechas y horas válidas según el `schedule` de la sucursal, y lista cinco "preguntas abiertas" más una dependencia upstream. Al auditar ambos repos antes de planear aparecieron tres datos que reescriben el alcance:

1. **La validación de servidor que pide el punto 5 ya existe.** El admin API (Localiza) rechaza combinaciones fuera de horario y devuelve errores estructurados — `out_of_schedule_pickup_date_error`, `out_of_schedule_pickup_hour_error`, `out_of_schedule_return_date_error`, `out_of_schedule_return_hour_error`, más las variantes de festivo `holiday_pickup_date_error`, `holiday_out_of_schedule_pickup_date_error` y simétricas de devolución (`utils/types/data/LocalizaErrorResponse.ts:7-16`). La web ya las superficie vía la spec `2026-05-04-availability-error-feedback`. La defensa en profundidad del servidor no hay que construirla.

2. **La granularidad de 30 min que el issue marca como "decisión tomada" ya está implementada.** `useSearch.ts:29` (`generateHourOptions`) genera los slots de media hora alineados a 30 min. Solo falta poder *restringirlos* por sucursal; los slots mismos ya existen. (Ojo: el rango efectivo es `00:00`–`23:00` por la condición `< 23:30` del loop, son 47 slots; el comentario del código que dice "48" está mal y conviene corregirlo al implementar W4.)

3. **El `schedule` NO es estructurado.** En producción es un único string de texto libre en español bajo una clave `display`, con formatos heterogéneos y **~5 sucursales con `{}` vacío**. El dashboard **no tiene UI para editarlo** (el campo solo aparece en `lib/schemas/location.ts` como `z.record(z.string(), z.string()).default({})`, un genérico que nadie escribe estructuradamente).

**Consecuencia:** el núcleo del issue — restringir el calendario y el selector de hora **proactivamente en el cliente** — está **bloqueado upstream**. La web no puede derivar reglas por sucursal de un string libre. El trabajo real, en orden, es: definir un contrato estructurado, migrar los datos en el dashboard, exponerlo en el payload, y solo entonces consumirlo en la web. Este ADR fija ese contrato y la secuencia.

### Muestra de los datos reales (producción, tabla `locations`)

```
AARME Armenia Aeropuerto   {"display":"Lun-Vie 06:00-19:00 | Sáb, Dom y fest 08:00-16:00"}
AABAN Barranquilla Aerop.  {"display":"Todos los días 07:00-20:00"}
AABOT Bogotá Aeropuerto    {"display":"Lun-Dom 24 horas | Festivos 06:00-21:00"}
ACKAL Cali Sur Camino Real {"display":"Lun-Vie 08:00-17:00 | Sáb 08:00-14:00 | Dom y fest Cerrado"}
ACMCL Medellín Éxito Col.  {"display":"Lun-Vie 08:00-15:00 | Sáb 08:00-13:00 | Dom y fest Cerrado"}
ACBED Bogotá Fontibón      {}
AAMDL Medellín Aeropuerto  {}
```

Patrones observados: agrupación por bloques de días (`Lun-Vie`, `Sáb`, `Dom`), festivos casi siempre tratados aparte (`Dom y fest`, `Festivos 06:00-21:00`), literales `24 horas` y `Cerrado`. **Ningún horario parte el día** (no hay cierres de mediodía tipo `08:00-12:00 | 14:00-18:00`).

---

## Decisión (el ADR)

> El horario de una sucursal es un **dato operacional del catálogo**, no una invariante de UI. Su dueño es operaciones y su sistema de registro ya es el dashboard sobre Supabase. Por tanto el `schedule` estructurado se define y administra en `rentacar-dashboard`, y la web pasa a **leerlo del payload `/api/rentacar-data`** para construir las restricciones de fecha/hora. La web no hardcodea horarios ni los infiere parseando el texto libre.

**Estado**: propuesta. Implementación pendiente de autorización por ola.

**Por qué consumir del dashboard y no parsear el `display` en la web:** el `display` es prosa libre, con seis o más formas distintas y varios huecos. Un parser sobre ese texto sería frágil y no cubriría los `{}`. Peor: dejaría la regla de negocio escondida en una expresión regular sin dueño, el mismo anti-patrón que el filtro mensual roto que documenta el ADR de #28. El horario es un dato; merece ser editable y observable, no un efecto secundario de un string.

**Por qué la web no puede entregar el issue hoy:** sin el dato estructurado no hay de dónde sacar qué días deshabilitar ni qué horas ofrecer. El fallback permisivo (decisión 4) mantiene el comportamiento actual mientras el dashboard se pone al día, y el servidor sigue validando de respaldo. La web hoy no hace ninguna promesa proactiva, así que no rompe ninguna.

---

## Estado real (verificado en código, ambos repos)

| Pieza | Web hoy | Dashboard hoy | Brecha real |
|---|---|---|---|
| Validación servidor fuera de horario | superficie errores `out_of_schedule_*`/`holiday_*` vía `extractStructuredError` | Localiza valida y devuelve los errores | **Ya hecho.** No es trabajo de este issue. |
| Slots de 30 min | `generateHourOptions()` genera los slots de 30 min, `00:00`–`23:00` (`useSearch.ts:29`) | n/a | **Ya hecho.** Falta filtrarlos por sucursal. |
| Dato `schedule` | transformer lee `row.schedule?.display \|\| ''` (`transformers.ts:123`), tipado `{ display?: string }` | texto libre `{display}`; ~5 vacíos; sin UI de edición | **El trabajo.** Definir contrato estructurado + migrar + UI + exponer. |
| Uso del `schedule` en la web | solo se muestra como texto en `CityPage.vue:197` | n/a | El `display` pasa a derivarse del estructurado (decisión 1). |
| Restricción proactiva calendario/hora | inexistente (calendario solo aplica `min/max`; horas = los 48 slots) | n/a | A construir en la web tras exponer el dato (olas W). |

---

## Contrato `schedule` v2 (la decisión de datos)

Forma estructurada que el dashboard persiste y expone en `/api/rentacar-data`:

```jsonc
{
  "mon": ["06:00-19:00"],
  "tue": ["06:00-19:00"],
  "wed": ["06:00-19:00"],
  "thu": ["06:00-19:00"],
  "fri": ["06:00-19:00"],
  "sat": ["08:00-16:00"],
  "sun": ["08:00-16:00"],
  "hol": ["08:00-16:00"]
}
```

**Reglas del contrato:**

- **Claves**: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`, `hol`. `hol` = horario aplicable en festivos colombianos (ver decisión 2).
- **Valor**: array de rangos `"HH:MM-HH:MM"`. Cada borde alineado a múltiplos de 30 min (invariante que la UI de edición del dashboard debe forzar; bajo esta invariante los bordes siempre coinciden con un slot del selector y no se requiere redondeo).
- **Cerrado**: array vacío `[]` o clave ausente. Equivalentes.
- **Abierto 24 h**: `["00:00-24:00"]`. El borde superior `24:00` denota fin-de-día inclusivo.
- **Array, no string** (decisión 1): aunque hoy ningún horario parte el día, el array soporta un futuro cierre de mediodía (`["08:00-12:00","14:00-18:00"]`) sin una segunda migración. El costo en JSON es nulo; el costo de re-migrar ~30 filas no lo es.
- **`display` derivado**: el string humano de `CityPage` se genera a partir del estructurado (en el transformer o en el dashboard), no se edita aparte. Elimina el riesgo de drift entre el texto mostrado y el horario aplicado.

### Decisiones puntuales

1. **Forma**: array de rangos por día + clave `hol`. *(Alternativas descartadas: string de un solo rango — calza con los datos de hoy pero exige re-migración si aparece un cierre de mediodía; estructura rica con excepciones por fecha — YAGNI, no existen datos de excepción y los festivos se cubren con el calendario.)*

2. **Festivos**: las **fechas** de festivo las computa un util determinista en `packages/logic` que implementa el calendario colombiano **incluyendo la Ley Emiliani** (festivos trasladables al lunes). En una fecha festiva, la disponibilidad aplica el rango `hol`. El servidor (`holiday_*`) queda de respaldo. *(Alternativas descartadas: solo respaldo del servidor — rompe la promesa "ves disponibilidad real" justo en festivos; tabla de festivos en Supabase — agrega otra pieza de datos + UI sin necesidad, los festivos colombianos son computables.)*

3. **Buffer operativo**: ninguno. El último slot seleccionable es la hora de cierre (cierra 18:00 → 18:00 es válido). Se podrá agregar un buffer (cierre − N min) más adelante si operaciones lo pide; no se asume hoy.

4. **Sucursal sin horario (`{}`/ausente)**: **permisivo** — la web no restringe (todos los slots abiertos, comportamiento actual) y el servidor valida como respaldo. No se pierden reservas por una sucursal sin configurar. La promesa proactiva no aplica en esas sucursales hasta que se les cargue horario. *(Alternativas descartadas: restrictivo/bloquear — riesgo alto de perder reservas por mala configuración; default 24/7 explícito — igual de permisivo pero mete un horario falso al modelo.)*

---

## Secuencia cross-repo (olas)

Las olas **D** son del dashboard y **bloquean** a las **W**. Cada ola es un PR independiente con su propio holdout de escenarios.

### Dashboard (`rentacar-dashboard`) — upstream, bloqueante

- **D1 — Contrato + schema.** Reemplazar `schedule: z.record(z.string(), z.string())` por el schema v2 (claves día/`hol`, arrays de rangos validados a 30 min). Tipo derivado `LocationSchedule`.
- **D2 — Migración de datos.** Parsear los ~30 strings `display` existentes a la forma estructurada (script puntual, revisión manual del resultado dado lo heterogéneo del texto). Las ~5 sucursales con `{}` quedan `{}` (permisivo). Conservar/derivar `display` para retrocompatibilidad de lectura.
- **D3 — UI de edición.** Formulario de sucursal con inputs por día + festivo, restringidos a múltiplos de 30 min (preserva la invariante del contrato). Estados cerrado/24 h explícitos.
- **D4 — Exponer en payload.** Incluir `schedule` estructurado en `/api/rentacar-data`. Recordar la cache Nitro de 1 h: los cambios tardan hasta `maxAge` en propagarse (ver `rentacar-data.get.ts:55`).

### Web (`rentacar-web`) — tras D4

- **W1 — Lectura.** `transformBranches` lee el `schedule` estructurado a `BranchData`; `display` derivado para `CityPage`. Actualizar el tipo `BranchData.schedule`.
- **W2 — Reglas en logic.** Util puro en `packages/logic` (testeable en aislamiento), sin dependencia de Vue:
  - `openRangesForDate(schedule, date)` → los rangos abiertos para esa fecha (resuelve festivo vs día de semana vía W3).
  - `isDayOpen(schedule, date)` → `true` si `openRangesForDate` no está vacío para la clave efectiva de esa fecha.
  - `bookableSlotsForDate(schedule, date)` → intersección de los slots de 30 min con los rangos abiertos.
- **W3 — Festivos.** Util de calendario colombiano (Ley Emiliani) en `packages/logic`, consumido por W2 para elegir `hol`.
- **W4 — Integración Searcher.** El calendario deshabilita días cerrados (`isDateDisabled`/`disabledDates`) y el selector de hora ofrece solo los slots válidos, **por sucursal e independientes** entre recogida (`location_recogida`) y devolución (`location_devolucion`).
- **W5 — Invalidación al cambiar sucursal.** Si la fecha/hora ya elegida cae fuera del nuevo `schedule`, limpiar el valor y pedir reselección con feedback visible; nunca enviar el form con un valor inválido.

**Nota de acoplamiento (memoria de equipo):** una ola que cambie el shape de la respuesta de `/api/rentacar-data` interactúa con el deploy-scope de la cache (`docs/specs/2026-05-26-rentacar-data-cache-deploy-scope-design.md`): una entrada de cache vieja con el shape anterior no debe servirse a código nuevo. D4/W1 deben verificar que el `getKey` por `buildId` cubre el cambio de schema.

---

## Escenarios observables (puente a SDD)

Derivados de los escenarios del issue + las decisiones de este ADR. Cada uno es un holdout para la ola que lo implementa. Sucursal de referencia **A**: `mon–fri 08:00–18:00`, `sat 08:00–13:00`, `sun []`, `hol []`.

**Contrato y migración (D1–D2)**
- **SCEN-01** — Dado el string `"Lun-Vie 08:00-18:00 | Sáb 08:00-13:00 | Dom y fest Cerrado"`, cuando se migra, entonces `{mon..fri:["08:00-18:00"], sat:["08:00-13:00"], sun:[], hol:[]}`.
- **SCEN-02** — Dado `"Lun-Dom 24 horas | Festivos 06:00-21:00"`, cuando se migra, entonces `mon..sun:["00:00-24:00"]` y `hol:["06:00-21:00"]`.
- **SCEN-03** — Dado `{}`, cuando se migra, entonces queda `{}` (no se inventa horario).

**Reglas en logic (W2–W3)**
- **SCEN-04** — Dado el `schedule` de A y un domingo, cuando se pide `bookableSlotsForDate`, entonces `[]` (cerrado).
- **SCEN-05** — Dado A y un sábado, cuando se piden slots, entonces incluye `13:00` y excluye `13:30` y `15:00`.
- **SCEN-06** — Dado A y un lunes, cuando se piden slots, entonces excluye `07:30` e incluye `08:00`.
- **SCEN-06b** (buffer = 0, decisión 3) — Dado A un sábado (cierra 13:00), cuando se piden slots, entonces `13:00` es el último slot incluido. Este escenario es el holdout de "sin buffer": el último slot es exactamente la hora de cierre, no cierre − N.
- **SCEN-07** — Dado A y una fecha festiva (Ley Emiliani, p. ej. festivo trasladado a lunes), cuando se piden slots, entonces aplica `hol` (`[]` → cerrado), no el horario de lunes.
- **SCEN-08** — Dado `schedule = {}`, cuando se piden slots para cualquier fecha, entonces todos los slots de 30 min disponibles (permisivo, comportamiento actual).

**Integración Searcher (W4–W5)**
- **SCEN-09** — Dado recogida en A (cerrada domingo), cuando se abre el calendario de recogida, entonces el domingo está deshabilitado.
- **SCEN-10** — Dado recogida en A y devolución en B (abierta domingo), cuando se abren ambos calendarios, entonces recogida bloquea domingo y devolución lo permite (independientes).
- **SCEN-11** — Dado recogida lunes 16:00 ya elegida, cuando se cambia la sucursal a una que cierra 14:00, entonces el campo recogida se invalida y pide reselección; el form no se puede enviar con 16:00.
- **SCEN-12** — Dado el selector de hora de cualquier sucursal, cuando se listan opciones, entonces solo bloques de 30 min (no `08:15` ni `10:37`).

---

## Consecuencias

- **Hasta D4**, la web queda como está: sin restricción proactiva, con validación de servidor como única barrera. El fallback permisivo (decisión 4) garantiza que esto no es una regresión.
- **El issue #47 en `rentacar-web` está bloqueado** por D1–D4 en `rentacar-dashboard`. Conviene abrir los issues D1–D4 en ese repo y enlazarlos como dependencia de #47.
- **No se escribe código en esta entrega.** El alcance acordado es ADR + contrato + secuencia, espejo de #28.

---

## Preguntas abiertas (no bloquean el ADR; se resuelven al planear las olas)

- **O1 — Zona horaria.** Toda Colombia es `America/Bogota` (UTC−5, sin DST), así que los cómputos de festivo/slot se hacen en hora local sin conversión. Confirmar que no hay sucursal fuera de esa zona antes de W3.
- **O2 — Derivación de `display`.** ¿El `display` se genera en el transformer de la web (una sola implementación, formato controlado por la web) o en el dashboard (editable/override manual)? Recomendación: derivarlo en la web para una sola fuente de formato; decidir en W1.
- **O3 — Revisión de la migración D2.** Dado lo heterogéneo del texto, el script de migración necesita revisión humana fila por fila. ¿Quién valida el resultado contra el horario operativo real de cada sucursal?
