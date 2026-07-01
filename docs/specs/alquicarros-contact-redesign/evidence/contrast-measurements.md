# SCEN-CONTACT-06 — contrast measurements (runtime, /agent-browser)

Dev server: worktree feat/alquicarros-contact-redesign @ localhost:4000
Measured 2026-07-01 via getComputedStyle + WCAG relative-luminance ratio.

| Surface | Foreground | Background | Ratio | AA (normal 4.5) |
|---|---|---|---|---|
| Tile A body/heading (white text) | #ffffff | #c2410c (gradient dark stop) | 5.18 | PASS |
| "Reserva Ahora" label | brand-800 #9a5811 | #ffffff | 5.56 | PASS |
| "Habla con un Asesor" label | #ffffff | #090 (brand green) | 3.78 | FAIL (4.5) / PASS large-text 3:1 |

Decision (user, 2026-07-01): keep #090 as the mandated brand green (documented in
theme.css as "el único verde legítimo de marca"; the white-on-#090 pairing already
ships site-wide on every WhatsApp CTA across the 3 brands). The WhatsApp label is
therefore exempted from the 4.5 threshold in SCEN-06; contrast remediation for #090
is a site-wide a11y item, out of scope for this section. AA (4.5) remains required
for the Tile A white text and the "Reserva Ahora" label — both PASS.
