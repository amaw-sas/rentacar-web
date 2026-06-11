# F2 — City landing + legales · Plan de implementación

**Spec (detailed design):** `docs/specs/2026-06-11-issue-112-f2-landing-legal-design.md` (aprobada).
**Rama:** `feat/issue-112-f2-landing-legal` · **Holdout:** SCEN-F2-01..12 (+07b).
**Approach:** restyle preservando engine + todo el SEO; reusar componentes `home/*` de F1; legales = estilo del diseño sobre contenido de intermediación actual.

---

## Chunk 1: File structure + steps

### File-structure map

Todo bajo `packages/ui-alquilame/` (aislamiento F2 — `logic/`, rutas y otras marcas intactas).

**MODIFICADO (F1 reuse — prereq):**
| Archivo | Cambio |
|---|---|
| `app/components/home/Contact.vue` | Añadir prop `reserveAnchor?: string` (default `'#hero'`); el CTA "Reserva Ahora" usa `:href="reserveAnchor"`. En city se pasa `#searcher`. Backward-compat con el home (sin prop = `#hero`). |

> `HomeReviews` **NO** se modifica ni se reusa en city: el `#testimonios` city se restila in-place con `props.city.testimonials` (ver City Testimonios abajo).

**MODIFICADO (página principal F2):**
| Archivo | Cambio |
|---|---|
| `app/components/CityPage.vue` | Orquestador: hero (preservar `Searcher`/#41/#109), secciones SEO restiladas, montar marketing F1 (`HomeFleet`/`HomeHowItWorks`/`HomeRequirements`/`HomeContact reserveAnchor="#searcher"`), **restyle in-place** `#testimonios` (city.testimonials) y `#faqs` (`useCityFAQs`), preservar `#seleccion-categorias`/`cityBranches`. Regla "replace not append" para los marketing nuevos (sin `id` duplicado). |

**NUEVOS (extracción de secciones city SEO — decomposición, opcional pero recomendada):**
| Archivo | Responsabilidad |
|---|---|
| `app/components/city/Hero.vue` | Hero city restilizado (city name + `Searcher` + pin #41) |
| `app/components/city/Intro.vue` | `#intro`/descripcion + introduccion (texto SEO city) |
| `app/components/city/SeoContent.vue` | ventajas/destinos/consejos/temporada/ciudades-cercanas (texto SEO, restilizado) — o un componente por sección si crece |
| `app/components/city/DeliveryPoints.vue` | `#puntos-entrega` (`cityBranches`) |
| `app/components/city/Faq.vue` | `#faqs` city (`useCityFAQs`, restilizado in-place) |
| `app/components/city/Testimonios.vue` | `#testimonios` city (`props.city.testimonials` + heading city, restilizado) |

> CityPage queda como **orquestador** (mirror del patrón `home/*` de F1): monta `city/*` + los `home/*` reusados + preserva el bloque condicional de resultados. Cada sección = componente con responsabilidad única, testeable.

**MODIFICADOS (legales):**
| Archivo | Cambio |
|---|---|
| `app/pages/terminos-condiciones.vue` | Estilo del diseño (layout legal, `font-heading` h2s numerados) sobre el **contenido actual** (intermediación preservada) |
| `app/pages/politica-privacidad.vue` | Igual |

### Pasos de implementación (SDD)

> **Ordering**: los pasos 2–5 **cablean cada componente `city/*` en CityPage como drop-in replacement** de la sección inline equivalente (incremental → CityPage renderiza verde tras cada paso). El paso 6 monta las secciones de marketing F1 **nuevas** (no existían en city). Cada paso preserva el engine. Tamaño ≤ M. Tests en `app/components/city/__tests__/` o `tests/`.

1. **HomeContact reserveAnchor prop** | S | deps: none
   - Escenario: `HomeContact` acepta `reserveAnchor` (CTA "Reserva Ahora" ancla ahí; default `#hero` → home intacto).
   - AC: prop backward-compat; el home (sin prop) no cambia; test: default `#hero`, override aplica al `:href`; sin `bg-gradient-to-`.

2. **City hero restyle** | M | deps: 1
   - Escenario (SCEN-F2-01, F2-06): `city/Hero.vue` con estilo del diseño (rojo `bg-linear`, h1 "Alquiler de carros en {city}"), `Searcher` preservado (testids `pickup/return-location-test`, navega a `buscar-vehiculos`), pin #41 inerte (`<span aria-hidden>`), `[--ctx-text-primary:#fff]`, sin `Date` horneado (#109).
   - AC: hero montado en CityPage; Searcher + #41 intactos; test: Searcher presente con testids, pin es `<span aria-hidden>` no `<button>`, bg-linear, ctx-text-primary.

3. **City SEO content restyle** | M | deps: 1
   - Escenario (SCEN-F2-02): `city/Intro.vue` + `city/SeoContent.vue` restilan intro/descripcion/ventajas/destinos/consejos/temporada/ciudades-cercanas al diseño, **texto SEO preservado** (indexable).
   - AC: todas las secciones presentes con su texto; test: cada sección/heading presente, sin pérdida de copy; `.heading-*`, bg-linear.

4. **Puntos-entrega restyle** | S | deps: 1
   - Escenario (SCEN-F2-04): `city/DeliveryPoints.vue` restila `#puntos-entrega` con `cityBranches` reales.
   - AC: itera `cityBranches`, estilo diseño; test: v-for branches, presente solo si `cityBranches.length > 0`.

5. **FAQ + Testimonios city restyle (in-place)** | M | deps: 1
   - Escenario (SCEN-F2-02): `city/Faq.vue` restila `#faqs` **manteniendo `useCityFAQs(city.name)`** (NO HomeFaq; el schema `useCityFAQSchema` en `useCityPageSEO` no se toca); `city/Testimonios.vue` restila `#testimonios` **manteniendo `props.city.testimonials`** + heading city-targeted (`useCityAggregateRating` consistente).
   - AC: ambos cableados en CityPage (drop-in); FAQ usa `useCityFAQs` (no `useData().faqs`); Testimonios usa `city.testimonials` (no `franchiseTestimonials`); test: fuentes correctas, heading city, `.heading-*`, bg-linear.

6. **Mount F1 marketing (nuevas) + orquestación** | M | deps: 1,2,3,4,5
   - Escenario (SCEN-F2-03, F2-05): CityPage orquesta — monta las secciones de marketing **nuevas** `HomeFleet`/`HomeHowItWorks`/`HomeRequirements`/`HomeContact reserveAnchor="#searcher"`, **preserva** `#seleccion-categorias` condicional intacto. Sin `id` duplicado (`#contact`/`#requisitos` no existían en city; verificar).
   - AC: secciones marketing montadas; "Reserva Ahora" ancla a `#searcher`; resultados condicionales intactos; test: componentes montados, cero `id` duplicado, reserveAnchor=#searcher, CategorySelectionSection preservado.

7. **Legales restyle** | M | deps: none
   - Escenario (SCEN-F2-07, F2-07b): `terminos-condiciones.vue` + `politica-privacidad.vue` con estilo del diseño (layout legal, `font-heading` h2s) sobre el **contenido actual** — encuadre de intermediación preservado ("no somos empresa de alquiler / plataforma de intermediación").
   - AC: estilo aplicado, contenido de intermediación intacto; test: presencia del disclaimer de intermediación, h2 `font-heading`, sin reemplazo por copy operador-directo.

8. **Integración + verificación runtime (preview)** | M | deps: 1–7
   - Escenario: holdout SCEN-F2-01..12 (+07b) satisfecho en el preview.
   - AC: `agent-browser` en `/{city}` y `/{city}/buscar-vehiculos/...` (con params): hero+searcher navega, secciones SEO presentes, puntos-entrega, marketing F1, resultados condicionales con params, gradientes+contraste (headings blancos sobre rojo), JSON-LD #68/FAQPage/canonical/og preservados, legales estilo+intermediación, CLS ≤ baseline; aislamiento `git diff main --stat` solo `ui-alquilame`+`docs/specs`; grep `bg-gradient-to-` (home/city/legales tocados) = 0; E2E `BRAND=alquilame` (city+legales) sin regresión + `data-testid` intactos. Cierre con `/verification-before-completion`.

### Prerequisitos
- Worktree `.worktrees/issue-112-f2` (desde main con F0+F1). Sin nuevas deps. Preview Vercel push-gated.

### Testing
- **Unit (estático)**: por paso, contratos observables (Searcher/testids, #41 span, useCityFAQs, reserveAnchor, intermediación en legales, sin id duplicado, bg-linear).
- **Runtime**: paso 8, `agent-browser` + `vitals` en preview, incl. la ruta `buscar-vehiculos` con params (resultados).
- **E2E**: `BRAND=alquilame` contra el preview (city + legales), comparar vs baseline.

### Rollout
- Commits faseados (`feat(alquilame): F2 step NN …`, `Refs #112`). Push gated. PR `Refs #112` (NO Closes — F3 cierra #112). Merge tras runtime verde.
