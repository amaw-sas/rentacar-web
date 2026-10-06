---
name: chat-viewport-restore
created_by: orchestrator
created_at: 2026-10-05
---

# Leaving /chat restores the site's viewport

Found while verifying chat-keyboard-header (2026-10-05, local dev, in-app
navigation): `/chat` overrides `<meta name="viewport">` with `useHead`. Nuxt
renders the default viewport from `app.head` on the server only, so the client
has no entry to fall back on. Navigating `/chat` → `/` without a reload left the
document with ZERO viewport tags — on a phone the rest of the site would render
as a zoomed-out desktop page until a full reload. The chat's close button
(`router.back()`) takes exactly this path.

---

## SCEN-001: closing the chat brings back the normal viewport
**Given**: a visitor on the home page `/` who opens the chat with in-app navigation (no reload) to `/chat`
**When**: they close the chat and land back on `/` (in-app navigation, no reload)
**Then**: the document has exactly one `<meta name="viewport">` with content `width=device-width, initial-scale=1` — the page is laid out at phone width, not as a zoomed-out desktop page
**Evidence**: `document.querySelectorAll('meta[name=viewport]')` length and content in the embedded browser after `$router.push('/chat')` then `$router.push('/')`

## SCEN-002: inside /chat the keyboard opt-in still wins after in-app navigation
**Given**: a visitor on `/` (in-app navigation, no reload)
**When**: they open `/chat`
**Then**: the document has exactly one `<meta name="viewport">` and it contains `interactive-widget=resizes-content`
**Evidence**: same DOM query in the embedded browser on `/chat`

## SCEN-003: loading /chat directly still serves the opt-in, and pages loaded directly keep the default
**Given**: a fresh load (no in-app navigation)
**When**: the visitor opens `/chat`, and separately `/`
**Then**: `/chat` has one viewport tag with `interactive-widget=resizes-content` both in the SSR HTML and after hydration; `/` has one viewport tag `width=device-width, initial-scale=1` in both
**Evidence**: `curl` of the SSR HTML + DOM query after hydration
