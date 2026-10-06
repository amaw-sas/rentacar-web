---
name: chat-keyboard-header
created_by: orchestrator
created_at: 2026-10-05
---

# /chat on Android: the keyboard must not push the header off-screen

Owner report (2026-10-05, Android Chrome, alquilatucarro.com/chat): opening the
chat focuses the composer, the keyboard comes up and the header ("¿En qué te
ayudamos?") and every message scroll out of view; only the input and the
keyboard remain. Dismissing the keyboard brings the header back; focusing the
input again hides it again.

Root cause: since Chrome 108 on Android the virtual keyboard resizes only the
*visual* viewport (`interactive-widget=resizes-visual`, the default). The
`/chat` page is `position: fixed; height: 100dvh`, so the layout keeps its full
height and the browser pans the visual viewport up to reveal the focused input,
taking the header with it. The fix opts `/chat` into
`interactive-widget=resizes-content`, so the keyboard shrinks the layout
viewport and the existing flex column (header / scrolling messages / composer)
fits above the keyboard.

Scope: `app/pages/chat.vue` in the three brands. Desktop panel and every other
page keep the default viewport. iOS Safari ignores `interactive-widget`; it is
out of scope here.

---

## SCEN-001: header, greeting and composer share the screen with the keyboard open
**Given**: an Android phone with Chrome, on any page of alquilatucarro.com
**When**: the visitor taps the chat button and lands on `/chat`, with the keyboard coming up automatically
**Then**: the header (avatar, "¿En qué te ayudamos?", "En línea · Disponible 24/7", close button) is visible at the top, the greeting "¡Hola! 👋 Pregúntame…" is visible in the middle, and the composer sits right above the keyboard — all in one screen, without dismissing the keyboard
**Evidence**: screenshot from the owner's phone on the preview deployment

## SCEN-002: the conversation grows above the keyboard and the header stays
**Given**: SCEN-001's state, keyboard open
**When**: the visitor sends "hola", the bot answers, and the visitor taps the input to type again
**Then**: the header stays visible, the visitor's "hola" bubble and the bot's reply are visible between the header and the composer, and as more messages arrive the message area scrolls internally while header and composer stay fixed
**Evidence**: screenshot from the owner's phone after the second tap on the input

## SCEN-003: the opt-in reaches the served HTML of /chat in all three brands, once, without losing the base viewport
**Given**: the SSR HTML of `/chat` for alquilatucarro, alquilame and alquicarros
**When**: counting `<meta name="viewport">` tags
**Then**: there is exactly one, and its content contains `width=device-width`, `initial-scale=1` and `interactive-widget=resizes-content`
**Evidence**: `curl` of `/chat` on the preview (or local dev server) for each brand; vitest guard over each brand's `app/pages/chat.vue`

## SCEN-004: other pages keep the default viewport
**Given**: the SSR HTML of the home page (`/`) of alquilatucarro
**When**: reading its `<meta name="viewport">`
**Then**: its content does NOT contain `interactive-widget` (reservation forms are not affected by this change)
**Evidence**: `curl` of `/` on the preview or local dev server
