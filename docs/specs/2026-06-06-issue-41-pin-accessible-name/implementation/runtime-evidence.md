# Runtime evidence — issue #41 (captured 2026-06-06 via /agent-browser)

Dev servers: alquicarros `:4001`, alquilame `:4002`, alquilatucarro `:4000`
(`pnpm dev` per package). Page `/bogota` on each. Oracles run with
`agent-browser snapshot` (Chrome CDP accessibility tree → computed accessible
name) and `agent-browser eval` (DOM attributes + axe-core 4.10.2 from CDN).

## SCEN-001 — hero `<h1>` accessible name is the visible title only

Chrome-computed accessibility tree for the `level=1` heading (alquicarros):

```
- heading "ALQUILER DE CARROS EN BOGOTÁ COLOMBIA" [level=1, ref=e30]
  - StaticText "ALQUILER"
  - StaticText "DE CARROS EN"
  - StaticText "BOGOTÁ"
  - StaticText "COLOMBIA"
```

Accessible name = `"ALQUILER DE CARROS EN BOGOTÁ COLOMBIA"` — does NOT contain
`"Copiar datos de búsqueda para WhatsApp"`. No `button` node in the heading
subtree (only `StaticText`). ✅

## SCEN-002 — pin still triggers the copy action (alquicarros)

`navigator.clipboard.writeText` stubbed, then `pin.click()` dispatched on the
`<span>` wrapping `LocationIcon`. Captured argument:

```json
{
  "copied_isString": true,
  "copied_len": 163,
  "has_consulta": true,
  "has_lugar": true,
  "preview": "*Consulta de alquiler de carro*\n\n📍 Lugar: Bogotá Aeropuerto\n📅 Recogida: 7 de junio de 2026, 12:00 p. m.\n📅 Devolución: 14 de junio de 2026, 12:00 p. m.\n🗓 7 días"
}
```

`copySearchToWhatsapp` ran and produced the full WhatsApp message. "Datos
copiados" toast captured in `issue41-bogota-toast.png`. ✅
(This runtime oracle covers the behavioral path the source-shape unit tests
cannot — it dispatches a real click and asserts the copy actually happened.)

## SCEN-003 — axe-core: 0 violations in the hero (alquicarros)

`axe.run(<UPageHero data-slot="root">, { runOnly: [nested-interactive,
heading-order, aria-hidden-focus] })`:

```json
{
  "scope": "root",
  "violations": [],
  "nested_interactive": 0,
  "heading_order": 0,
  "aria_hidden_focus": 0,
  "passes": ["aria-hidden-focus", "heading-order", "nested-interactive"]
}
```
✅

## SCEN-004 — pin is inert: not focusable, not announced, no tooltip (alquicarros)

```json
{
  "pin_tagName": "SPAN",
  "pin_ariaHidden": "true",
  "pin_hasAriaLabel": false,
  "pin_hasTitle": false,
  "pin_tabIndex": -1,
  "buttonsInsideH1": 0,
  "leakAriaLabelAnywhereInH1": false,
  "leakTitleAnywhereInH1": false
}
```
`<span>` (not focusable, `tabIndex -1` → not reachable by Tab), `aria-hidden`,
no `aria-label`/`title`, zero buttons in the `<h1>`, no secret leak. ✅

## SCEN-005 — holds for all three brands

alquilatucarro `:4000` `/bogota`:
- heading: `"ALQUILER DE CARROS EN BOGOTÁ COLOMBIA"` [level=1]
- `{ pin_tag: "SPAN", pin_ariaHidden: "true", pin_hasAriaLabel: false, pin_hasTitle: false, pin_tabIndex: -1, buttonsInH1: 0, axe_violations: [] }`

alquilame `:4002` `/bogota`:
- heading: `"ALQUILER DE CARROS EN BOGOTÁ COLOMBIA"` [level=1]
- `{ pin_tag: "SPAN", pin_ariaHidden: "true", pin_hasAriaLabel: false, pin_hasTitle: false, pin_tabIndex: -1, buttonsInH1: 0, axe_violations: [] }`
✅

## Console / network

`/bogota` HTTP 200 on all three brands. Console: only pre-existing
`@nuxt/image` `image.screens` width warnings + one `<Suspense> experimental`
info — no `[error]`-level messages (same baseline as PR #40). Visual fidelity:
the red pin still renders next to "BOGOTÁ" — see `issue41-alquicarros-hero.png`.

## Artifacts
- `issue41-bogota-toast.png` — toast after pin click (alquicarros)
- `issue41-alquicarros-hero.png` — full hero, pin visible next to city name
