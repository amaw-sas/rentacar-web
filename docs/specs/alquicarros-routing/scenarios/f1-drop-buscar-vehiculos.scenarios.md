# Holdout — alquicarros: quitar `buscar-vehiculos` (independencia de enrutamiento)

Directiva: `/{city}/buscar-vehiculos/...` debe existir **solo en alquilatucarro**. En
alquicarros esa ruta hoy monta el wizard (`CityPage mode="results"` → `ReservationWizard
external-search`), duplicando la superficie de `/reservas`. Esta fase la elimina en alquicarros
y redirige 301 → `/reservas`, sin tocar alquilatucarro/alquilame ni `logic`.

Decisiones: deep-links → **301 a `/reservas`** (sin traducir params); alcance **acotado**
(borrar rutas + dead-code; dejar `mode="results"` de CityPage/Hero/Searcher como dead-code
inalcanzable para follow-up).

---

## SCEN-AC-01 — `buscar-vehiculos` responde 301 → `/reservas`
- **Given** el sitio alquicarros servido
- **When** se hace `GET /{city}/buscar-vehiculos/<cualquier combinación de params>` — incl.
  las variantes `.../referido/{referido}/...` y `.../categoria/{categoria}/...`
- **Then** la respuesta es **HTTP 301** con `Location: /reservas`, y **no** se renderiza
  ninguna página de resultados/wizard bajo esa URL.

## SCEN-AC-02 — el wizard en `/reservas` sigue intacto
- **Given** alquicarros con backend de disponibilidad disponible
- **When** se entra a `/reservas` (limpio) y a `/reservas?lugar_recogida=…&…&paso=vehiculo`
- **Then** el wizard funciona igual que antes: Paso 1 (búsqueda) → Paso 2 (tiles de segmento:
  Compactos/Sedanes/Camionetas·SUV/Camionetas de Lujo) → Seguro → Adicionales → Datos. Sin
  regresión de comportamiento.

## SCEN-AC-03 — el landing de ciudad sigue intacto
- **Given** alquicarros
- **When** se entra a `/{city}` (landing, `CityPage mode="landing"`)
- **Then** renderiza 200 con su marketing city y el CTA "Reservar ahora" apunta a `/reservas`.
  No aparece el bloque de resultados/wizard.

## SCEN-AC-04 — ningún enlace vivo de alquicarros apunta a `buscar-vehiculos`
- **Given** el código de `packages/ui-alquicarros/app`
- **When** se busca cualquier **target de navegación** hacia `buscar-vehiculos`
  (`:to`, `navigateTo`, `router.push`, `href`, reconstrucción de URL)
- **Then** no existe ninguno: `sindisponibilidad.vue` reconstruye `/reservas?query`; `SelectBranch`
  eliminado. Solo quedan referencias en comentarios y en el dead-code diferido (rama
  `mode==='results'` de CityPage/Hero/Searcher), que es inalcanzable.

## SCEN-AC-05 — independencia: alquilatucarro/alquilame/logic intactos
- **Given** el diff de esta rama
- **When** se lista `git diff --name-only` contra `origin/main`
- **Then** solo toca `packages/ui-alquicarros/**`, `e2e/**` y `docs/specs/**`. NADA en
  `packages/logic/**`, `packages/ui-alquilatucarro/**`, `packages/ui-alquilame/**`. Y
  `/{city}/buscar-vehiculos/...` **sigue resolviendo (200/render, no 301)** en alquilatucarro.

## SCEN-AC-06 — build/tests verdes
- **Given** la rama implementada
- **When** se corren typecheck (alquicarros), unit (alquicarros) y e2e `BRAND=alquicarros`
- **Then** pasan: unit sin `SelectBranch.test`; wizard spec verde con la aserción de 301; los
  specs compartidos que hard-assert `buscar-vehiculos` saltan en alquicarros (siguen corriendo
  para las otras marcas); ninguno falla.
