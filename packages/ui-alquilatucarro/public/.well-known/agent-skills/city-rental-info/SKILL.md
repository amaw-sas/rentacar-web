---
name: city-rental-info
description: Explain car rental context for a Colombian city served by Alquilatucarro (airport pickup, local tips, landing page). Use when the user names a city or airport in Colombia.
---

# City car rental info (Alquilatucarro)

## When to use

- User asks about renting in a specific Colombian city or airport
- User wants local rental tips (airport pickup, coverage)

## Steps

1. Map the city to a slug used on the site (examples):
   - Bogotá → `/bogota` (Aeropuerto El Dorado)
   - Medellín → `/medellin` (José María Córdova)
   - Cali → `/cali`
   - Cartagena → `/cartagena`
   - Barranquilla → `/barranquilla`
   - Full list: https://alquilatucarro.com/llms.txt (section Lugares)
2. Point the user to the city landing: `https://alquilatucarro.com/{slug}`
3. For markdown-friendly agents: request that URL with `Accept: text/markdown` to get a text summary when available.
4. For booking, follow the **search-car-rental** skill (on-site searcher + form).

## Notes

- City pages describe pickup points and local context; live fleet/prices come from the search UI / catalog API.
- If the city is not listed in llms.txt, say coverage may be limited and send the user to the home searcher.
