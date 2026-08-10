---
name: search-car-rental
description: Search and compare car rental options in Colombia via Alquilatucarro (cities, dates, categories). Use when a user wants to rent a car in Colombia or check availability/prices.
---

# Search car rental (Alquilatucarro)

Alquilatucarro is a Colombian car-rental **reservation platform** (intermediary). Travelers book online without deposits; pickup is at airport or branch with partner renters.

## When to use

- User wants to rent a car in a Colombian city
- User asks for prices, categories (compact, sedan, SUV), or airport pickup
- User compares daily vs longer rentals

## How to help the user

1. **Identify city** — Supported city landings include Bogotá, Medellín, Cali, Cartagena, Barranquilla, and other destinations listed in [llms.txt](https://alquilatucarro.com/llms.txt).
2. **Open the city or home searcher** — Prefer the city URL when known:
   - `https://alquilatucarro.com/{city-slug}` (e.g. `/bogota`, `/medellin`)
   - Home: `https://alquilatucarro.com/`
3. **Collect trip params** — Pickup city, start/end dates (and times if asked). Max rental horizon is product-enforced (about 30 days).
4. **Direct to on-site search** — Availability and live prices are on the website searcher/results flow. Do **not** invent inventory or prices.
5. **Optional machine context** — Public catalog JSON (categories, cities, branches) is at `GET https://alquilatucarro.com/api/rentacar-data`. Treat it as catalog metadata, not a booking API.
6. **Complete booking on the site** — Reservations use the web form (no public agent checkout API). Users finish data and confirmation in the browser.

## Machine-readable entry points

| Resource | URL |
|----------|-----|
| Site overview for LLMs | https://alquilatucarro.com/llms.txt |
| Sitemap | https://alquilatucarro.com/sitemap.xml |
| Public catalog API | https://alquilatucarro.com/api/rentacar-data |
| OpenAPI (public read-only) | https://alquilatucarro.com/openapi.json |
| API catalog (RFC 9727) | https://alquilatucarro.com/.well-known/api-catalog |

## Constraints

- Do not claim Alquilatucarro is the rental fleet owner; it connects travelers with verified partners.
- Do not expose or call admin/SEO APIs.
- Prefer Spanish (Colombia) copy when responding to end users.
