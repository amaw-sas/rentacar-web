# F3 — Funcional (`/reservas` + reskin resultados/reserva/estados) · Plan de implementación

**Spec (detailed design):** `docs/specs/2026-06-12-issue-112-f3-functional-design.md` (aprobada, spec-review 2 iter).
**Rama:** `feat/issue-112-f3-functional` (worktree `.worktrees/issue-112-f3`, desde main con F0+F1+F2) · **Holdout:** SCEN-F3-01..12.
**Approach:** centralizar búsqueda en `/reservas` (nueva, solo alquilame); sacar el engine de los heroes (home + city landing → CTA "Reservar"); resultados conserva engine; reskin grilla/slideover/estados. Único toque al motor: derivar ciudad de la sucursal elegida, local a `Searcher.vue`. `packages/logic` y otras 2 marcas intactas. Tests existentes → mode-aware sin debilitar (Parte D de la spec).

---

## Chunk 1: File structure + steps

### File-structure map

Todo bajo `packages/ui-alquilame/` (aislamiento F3 — `logic/`, otras 2 marcas, y las URLs profundas `buscar-vehiculos` intactas).

**NUEVOS:**
| Archivo | Responsabilidad |
|---|---|
| `app/pages/reservas/index.vue` | Página `/reservas`: hero rojo + `<Searcher>` prominente (ClientOnly + fallback altura fija, #109) + secciones de confianza F1 (`HomeHowItWorks`/`HomeRequirements`/`HomeStats`/`HomeContact`). SEO propio (title/description/canonical/og); NO emite Product/FAQPage city. |
| `app/pages/reservas/__tests__/index.test.ts` | Contrato: hero `bg-linear` + `[--ctx-text-primary:#fff]`, `<Searcher>` montado, guard #109 (`<ClientOnly>` + `<PlaceholdersSearcher>` + `h-[\d+px]`), sin Product/FAQPage city. |

**MODIFICADO (motor — único toque, local a marca):**
| Archivo | Cambio |
|---|---|
| `app/components/Searcher.vue` | Tras copiar `searchComposable.searchLinkParams` al ref local (~`:414`), sobrescribir `city` con `searchBranchByCode(lugarRecogida)?.city` cuando `route.params.city` es `undefined`. `searchLinkName` sin cambio. `data-testid` `pickup/return-location-test` intactos. `sortedBranches` (global) sin cambio. CERO cambio en `packages/logic`. |

**MODIFICADO (heroes + orquestador + page files):**
| Archivo | Cambio |
|---|---|
| `app/components/home/Hero.vue` | Quitar `<SelectBranch>` + rótulo "¿En qué ciudad…?"; añadir CTA primario "Reservar ahora" `<NuxtLink to="/reservas">`. Conservar "Ver Precios" (`#fleet`), WhatsApp contacto, `ImagesFamily`, h1/subcopy. |
| `app/components/city/Hero.vue` | Prop `mode: 'landing' \| 'results'` (default `'results'`). `results` → idéntico a F2 (`<Searcher>` + `#searcher` + #109). `landing` → sin Searcher; CTA "Reservar ahora" `<NuxtLink to="/reservas">`; conservar h1 city + pin #41 + `<div id="searcher" aria-hidden>` vacío. |
| `app/components/CityPage.vue` | Aceptar prop `mode` (default `'results'`), reenviar `<CityHero :city :mode>`. `reserveAnchor` del `HomeContact` city = condicional al modo (`/reservas` en landing, `#searcher` en results). |
| `app/pages/[city]/index.vue` | `<CityPage :city mode="landing" />` |
| `app/pages/[city]/buscar-vehiculos/…/index.vue` (×4: con/sin `categoria` × con/sin `referido`) | `<CityPage :city mode="results" />` |

**MODIFICADO (reskin flujo funcional — sin cambiar comportamiento ni `data-testid`):**
| Archivo | Cambio |
|---|---|
| `app/components/CategorySelectionSection.vue` | Tokens marca (rojo, Jakarta, `bg-linear`, `[--ctx-text-primary:#fff]` en fondos oscuros). Preservar testids `reservation-next-test`/`reservation-resume-back-test`/`reservation-form-back-test` + slideover único (#65). |
| `app/components/CategoryCard.vue` | Reskin tarjeta (carrusel + precios) a la marca. |
| `app/components/ReservationResume.vue` | Reskin resumen+precios; testids `extra-driver-line`/`baby-seat-line`/`wash-line` intactos. |
| `app/components/ReservationForm.vue` | Reskin form datos cliente; schemas valibot + campos intactos. |
| `app/pages/pendiente.vue` | Reskin marca (Jakarta, acentos rojos); icono reloj + notif WhatsApp/email + copy intactos. |
| `app/pages/sindisponibilidad.vue` | Reskin marca; icono X + CTA "Modificar búsqueda" + WhatsApp intactos. |
| `app/pages/reservado/[reserveCode]/index.vue` | Reskin marca; icono check + código reserva + js-confetti lazy + CTAs intactos. |

**MODIFICADO (chrome):**
| Archivo | Cambio |
|---|---|
| `app/layouts/default.vue` | CTA "Reservar" → `/reservas` (nav desktop + menú móvil). |

**TESTS existentes a actualizar (Parte D — mode-aware, NO debilitar):**
| Archivo | Cambio |
|---|---|
| `app/components/home/__tests__/Hero.test.ts` | `:42` `<SelectBranch>` y `:46` `/ciudad/i` → reescribir: home NO monta `SelectBranch`, SÍ CTA `to="/reservas"`; conserva `#fleet`/"Ver Precios"/WhatsApp. |
| `app/components/city/__tests__/Hero.test.ts` | Mode-aware: `mode="results"` preserva `<Searcher>`/import/`id="searcher"`/#109/`h-[410px]`/`h-[360px]`; `mode="landing"` afirma ausencia de `<Searcher>`/`pickup-location-test`, presencia CTA `to="/reservas"`, `id="searcher"` vacío + h1 + pin #41 conservados. |
| `app/components/__tests__/CityPage.test.ts` · `home/__tests__/contact-announcement.test.ts` | **Verificar, probablemente sin cambio** (reserveAnchor condicional vive en CityPage, no en `Contact.vue`; el CTA landing es `NuxtLink` aparte). Confirmar verde, no debilitar. |

> `app/pages/{pendiente,sindisponibilidad,reservado}` **no exponen `data-testid`** (grep=0) → reskin solo-visual; sin contrato de testid que preservar.

### Pasos de implementación (SDD)

> Cada paso ≤ M, independientemente testeable, deja la marca verde. Los CTAs apuntan a `/reservas` (existe tras el paso 2). El paso 4 **bundlea** el cambio de `mode` de CityHero con CityPage-forward + page files + tests, porque tocar CityHero sin sus consumidores deja la suite roja (mantener verde por paso). Sin cambios en `packages/logic`.

1. **Searcher: derivación de ciudad** | S | deps: none
   - Escenario (SCEN-F3-01 parcial): cuando no hay `route.params.city` (caso `/reservas`), el `Searcher` arma la URL profunda usando `pickupBranch.city`; en city pages (con `route.params.city`) el comportamiento es idéntico a hoy.
   - AC: override local tras copiar `searchLinkParams` (sin tocar `useSearch`/`packages/logic`). **Wiring**: `Searcher.vue` hoy NO importa `useRoute` ni `searchBranchByCode`; añadir `const route = useRoute()` y resolver la sucursal vía `storeAdminData.searchBranchByCode(lugarRecogida)` (`storeAdminData` ya está en `:381`; `searchBranchByCode` es **método del store**, no función auto-importada). `data-testid` `pickup/return-location-test` intactos; test guard: `city = pickupBranch.city` cuando ruta sin city, sin cambio cuando hay city; `git diff packages/logic` vacío.

2. **Página `/reservas`** | M | deps: 1
   - Escenario (SCEN-F3-01): `/reservas` rinde hero rojo + `<Searcher>` prominente; elegir sucursal+fechas+horas y enviar navega a `/{ciudad-de-la-sucursal}/buscar-vehiculos/...` correcta.
   - AC: `app/pages/reservas/index.vue` monta hero `bg-linear-to-br from-hero-from to-hero-to [--ctx-text-primary:#fff]` + `<Searcher>` en `<ClientOnly>` + `<PlaceholdersSearcher>` fallback altura fija (#109, sin `Date`/`today()`); secciones confianza F1; SEO propio sin Product/FAQPage city; test (`__tests__/index.test.ts`) cubre hero/Searcher/#109/sin-schema-city; sin `bg-gradient-to-`.

3. **Home hero → CTA Reservar** | S | deps: none
   - Escenario (SCEN-F3-02): el hero del home ya NO contiene `SelectBranch`; contiene CTA "Reservar ahora" `<NuxtLink to="/reservas">`; conserva "Ver Precios"+WhatsApp.
   - AC: `home/Hero.vue` sin `SelectBranch` ni rótulo "ciudad"; CTA `to="/reservas"`; `home/__tests__/Hero.test.ts` reescrito mode-aware (ausencia SelectBranch, presencia CTA, conserva `#fleet`/WhatsApp) — sin debilitar; sin `bg-gradient-to-`.

4. **City hero `mode` + CityPage forward + page files (+ tests)** | M | deps: none
   - Escenario (SCEN-F3-03, F3-04): `city/Hero.vue` gana prop `mode`; en `landing` el hero NO tiene `Searcher` (cero `pickup-location-test`) y muestra CTA `to="/reservas"`, conservando h1 city + pin #41 + `<div id="searcher">` vacío; en `results` conserva `<Searcher>`+`#searcher`+#109 idéntico a F2. `CityPage` reenvía `mode` (default `results`) + `reserveAnchor` condicional. `[city]/index.vue` pasa `landing`; las 4 rutas `buscar-vehiculos` pasan `results`.
   - **Nota CTA contact (hard-nav aceptado):** el `HomeContact` city, con `reserveAnchor="/reservas"` en landing, renderiza `<a :href="reserveAnchor">` → navegación de página completa, no SPA. **Se acepta**: es el CTA secundario de la sección de contacto (full-nav a `/reservas` es correcto); el CTA **primario** de reserva en el hero landing SÍ es `<NuxtLink to="/reservas">` (SPA). `contact-announcement.test.ts` queda verde (el binding/default vive en `Contact.vue`, sin tocar).
   - AC: landing sin `<Searcher>`/testids + CTA; results con `<Searcher>`+testids+#searcher+#109; CityPage forwards + reserveAnchor condicional; 5 page files pasan `mode` correcto; `city/__tests__/Hero.test.ts` reescrito mode-aware (ambas ramas) sin debilitar; CityPage/contact tests confirmados verde; suite de marca verde.

5. **Header: CTA Reservar** | S | deps: none
   - Escenario (SCEN-F3-07): el header muestra un CTA "Reservar" (desktop + menú móvil) → `/reservas`.
   - AC: `default.vue` con CTA `to="/reservas"` en ambos viewports; **el CTA respeta los guards f0-chrome que escanean `default.vue` entero**: `tests/f0-chrome.test.ts:152-160` (SCEN-F0-06 cero-azul) y `:142-150` (bg-linear) → el `<NuxtLink>` no usa tokens azules ni `bg-gradient-to-`; test de chrome cubre presencia + destino del CTA. (Verificado: el header no tiene CTA "Reservar" previo → net-new, sin conflicto.)

6. **Reskin grilla de resultados** | M | deps: none
   - Escenario (SCEN-F3-05): la grilla (`CategorySelectionSection` + `CategoryCard`) tiene estilo de marca (rojo, Jakarta, gradientes renderizan), y los `data-testid` `reservation-next-test`/`reservation-resume-back-test`/`reservation-form-back-test` siguen presentes.
   - **Decisión de color (verde):** los CTAs `bg-green-*` de `CategorySelectionSection.vue:104,149,173` ("Solicitar reserva" + avanzar + botón redondo +9) son la **acción de confirmar/avanzar** (verde = "go/confirmar", convención de acción positiva, distinta de los CTAs rojos navegacionales). **Se CONSERVAN verdes intencionalmente**; el reskin de marca aplica al chrome de la tarjeta/grilla (bordes, headings Jakarta, precios, fondos), NO al color de la acción de confirmar. → El contrato de loading de `__tests__/CategorySelectionSection.test.ts:22-31` (`disabled:bg-green-700`/`aria-disabled:bg-green-700`/`disabled:opacity-80`/`aria-disabled:opacity-80`, que vencen el `disabled:bg-inverted` neutro de Nuxt UI) **se PRESERVA tal cual** — sin cambio de test, sin reward-hacking (mantener verde es la decisión, no evasión). *(Si el usuario prefiere CTA de confirmar en rojo de marca, es un cambio acotado posterior: recolorear los 3 sitios + re-encodear el override de loading en rojo + actualizar esas aserciones al nuevo color sin debilitar el contrato disabled/opacity.)*
   - AC: testids intactos; CTAs de confirmar verdes preservados + su contrato de loading intacto; resto de la grilla con tokens de marca; `bg-linear` (no `bg-gradient-to-`); headings Jakarta legibles (`[--ctx-text-primary:#fff]` en fondos oscuros); slideover único (#65) sin cambio de comportamiento; `CategorySelectionSection.test.ts` verde sin debilitar.

7. **Reskin slideover de reserva** | M | deps: none
   - Escenario (SCEN-F3-05): `ReservationResume` + `ReservationForm` con estilo de marca; testids `extra-driver-line`/`baby-seat-line`/`wash-line` presentes; campos + schemas valibot intactos.
   - AC: testids intactos; styling marca. **Contratos load-bearing a preservar** (no son styling incidental): `ReservationForm.test.ts:13-21` — el `<u-form>` mantiene `class="light"` y NO añade `scheme-dark` (fix de contraste de labels: los tokens Nuxt UI resuelven a neutral-700 aun con la página en colorMode dark); `ReservationResume.test.ts:11-33` — `leading-tight`/`!leading-none` en los bloques de totales. Ambos tests verdes sin debilitar; sin `bg-gradient-to-`.

8. **Reskin páginas de estado** | M | deps: none
   - Escenario (SCEN-F3-06): `pendiente`/`sindisponibilidad`/`reservado/[reserveCode]` con estilo de marca (Jakarta, acentos rojos), conservando íconos semánticos (reloj/X/check), CTAs (modificar búsqueda, WhatsApp, código de reserva) y el `js-confetti` lazy de `reservado`.
   - AC: styling marca; íconos + CTAs + copy intactos; comportamiento sin cambio; sin `bg-gradient-to-`; (no hay testids que preservar).

9. **Integración + verificación runtime (preview)** | M | deps: 1–8
   - Escenario: holdout SCEN-F3-01..12 satisfecho en el alias Vercel `-git-feat-issue-112-f3-functional-…`.
   - AC: `agent-browser` + `/dogfood` en `/reservas`, `/`, `/{city}` (landing) y `/{city}/buscar-vehiculos/...` (results): `/reservas` arma la URL profunda correcta desde la sucursal; home/landing sin engine inline + CTA → /reservas; results conserva engine; reskin grilla/slideover/estados (gradientes renderizan, headings Jakarta blancos sobre rojo); header CTA; JSON-LD city (#68 Product/FAQPage/AggregateRating) intacto + URLs profundas 200 sin redirect; CLS ≤ baseline; cero errores de consola / requests fallidos. Aislamiento: `git diff main --stat` solo `ui-alquilame/**`+`docs/specs`, `packages/logic` y otras marcas vacío; grep `bg-gradient-to-` (archivos tocados) = 0; `data-testid` intactos. E2E `BRAND=alquilame` contra el preview (`PLAYWRIGHT_BASE_URL`), flujo búsqueda→resultados→reserva vía `/reservas` y vía ruta directa, sin regresión vs baseline. Cierre con `/verification-before-completion`.

### Prerequisitos
- Worktree `.worktrees/issue-112-f3` (desde main con F0+F1+F2). Setup node_modules del worktree (symlinks a primary: `node_modules`, `packages/ui-alquilame/node_modules/@rentacar-main/logic`→primary `packages/logic`, `node_modules/sharp`) + `npx nuxt prepare` para typecheck/test/E2E. Sin nuevas deps. Preview Vercel push-gated.
- Typecheck una marca: `ionice -c3 nice -n19 pnpm --filter ui-alquilame typecheck` (NUNCA root typecheck — pico de disco WSL2).

### Testing
- **Unit (estático)**: por paso, contratos observables — derivación de ciudad (Searcher), `/reservas` hero+#109, home sin SelectBranch + CTA, city hero mode-aware (landing/results), header CTA, testids de grilla/slideover, sin `bg-gradient-to-`. Tests Parte D reescritos sin debilitar.
- **Runtime**: paso 9, `agent-browser` + `vitals` + `/dogfood` en preview, incl. derivación de ciudad real, ausencia/presencia de engine por ruta, reskin, JSON-LD, CLS, consola limpia.
- **E2E**: `BRAND=alquilame` contra el preview, flujo completo vía `/reservas` y vía URL profunda directa, comparar vs baseline.

### Rollout
- Commits faseados (`feat(alquilame): F3 step NN …`, `Refs #112`). Push gated (autorización explícita del usuario). PR `Refs #112` (NO `Closes` — el blog queda para F4, que cierra #112; decisión confirmable al abrir el PR). Merge tras runtime verde + `/verification-before-completion`.
