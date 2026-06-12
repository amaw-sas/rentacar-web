// Prefill the WhatsApp contact link with a per-page message so the sales rep
// instantly sees which page the lead came from.
//
// HOW: a single capture-phase click listener rewrites the wa.me/<number>
// anchor's `?text=` right before navigation — same event-delegation pattern as
// the connector beacon. This means it works for lazily-rendered anchors (the
// floating chat modal) and survives SPA route changes without re-binding, with
// zero edits to the button components.
//
// SCOPE: only the contact-number anchors (`wa.me/573016729250`). The "share"
// links (`wa.me/?text=...`) and any other numbers are left untouched.
//
// NOTE ON ATTRIBUTION: page + paid keyword attribution comes from the click
// beacon (landing_url + utm_term), independent of this text. So the wording is
// free-form for the human reading the chat — it does NOT need to match the
// connector's parse templates.

// Display names (with accents) for the 19 city landing routes. Any other path
// (home, blog, gana, …) falls back to the generic message.
const CITY_BY_PATH: Record<string, string> = {
  '/armenia': 'Armenia',
  '/barranquilla': 'Barranquilla',
  '/bogota': 'Bogotá',
  '/bucaramanga': 'Bucaramanga',
  '/cali': 'Cali',
  '/cartagena': 'Cartagena',
  '/cucuta': 'Cúcuta',
  '/ibague': 'Ibagué',
  '/manizales': 'Manizales',
  '/medellin': 'Medellín',
  '/monteria': 'Montería',
  '/neiva': 'Neiva',
  '/pereira': 'Pereira',
  '/santa-marta': 'Santa Marta',
  '/valledupar': 'Valledupar',
  '/villavicencio': 'Villavicencio',
  '/floridablanca': 'Floridablanca',
  '/palmira': 'Palmira',
  '/soledad': 'Soledad',
}

const WA_NUMBER = '573016729250'

function buildMessage(): string {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const city = CITY_BY_PATH[path]
  const base = 'Hola, vi su página de alquiler de carros'
  return city
    ? `${base} en ${city} y quiero saber los requisitos`
    : `${base} y quiero saber los requisitos`
}

export default defineNuxtPlugin(() => {
  document.addEventListener(
    'click',
    (e) => {
      try {
        const target = e.target as Element | null
        if (!target || typeof target.closest !== 'function') return
        const anchor = target.closest(
          `a[href*="wa.me/${WA_NUMBER}"]`,
        ) as HTMLAnchorElement | null
        if (!anchor) return
        // Strip any existing query (so re-clicks don't stack ?text=) and set the
        // page-specific message. Never preventDefault → native navigation, the
        // GA4 conversion event, and the attribution beacon all still fire.
        const base = (anchor.getAttribute('href') || '').split('?')[0]
        anchor.setAttribute('href', `${base}?text=${encodeURIComponent(buildMessage())}`)
      } catch {
        /* never block navigation */
      }
    },
    true,
  )
})
