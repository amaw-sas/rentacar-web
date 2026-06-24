---
name: f2-legales
created_by: pablo
created_at: 2026-06-24T00:00:00Z
---

# F2 — Páginas legales de alquicarros (diseño nuevo, contenido preservado)

Holdout observable para F2 (legales). Las legales actuales de alquicarros ya son
config-driven y su contenido legal es IDÉNTICO (verificado por diff) al de
alquilame: misma entidad AMAW S.A.S, mismas cláusulas. F2 solo cambia la
PRESENTACIÓN al diseño nuevo (Montserrat, prose-custom, header con fecha, accents
naranjas). La landing de ciudad NO entra aquí (acoplada a resultados vía CityPage
→ se reslotea a F3).

## SCEN-F2-01: /terminos-condiciones con el diseño nuevo
**Given**: un visitante abre `/terminos-condiciones`
**When**: la página carga
**Then**: renderiza el diseño nuevo (titular `font-heading` = Montserrat, layout
`max-w-3xl`, secciones espaciadas, eyebrow "Última actualización"); el nombre de
marca visible es "Alquicarros" (de `franchise.*`), sin literal "Alquilame"
**Evidence**: DOM + computed `font-family` (Montserrat) + texto renderizado

## SCEN-F2-02: /politica-privacidad con el diseño nuevo
**Given**: un visitante abre `/politica-privacidad`
**When**: la página carga
**Then**: idem SCEN-F2-01 para la política de privacidad
**Evidence**: DOM + computed + texto

## SCEN-F2-03: contenido legal preservado (sin cambiar wording)
**Given**: ambas páginas legales renderizadas
**When**: se lee el texto legal
**Then**: se conserva la entidad operadora "AMAW S.A.S" + "NIT 900.665.917-7" y el
conjunto de cláusulas existente; los datos de contacto usan el teléfono y correo
de alquicarros (`franchise.phone` / `franchise.email`), no los de otra marca
**Evidence**: texto renderizado (AMAW S.A.S, NIT, alquicarros@gmail.com, +57 301 672 9250)

## SCEN-F2-04: accents de marca en naranja, sin rojo
**Given**: las páginas legales renderizadas
**When**: se inspeccionan enlaces/acentos de marca (p.ej. "← Volver al inicio")
**Then**: usan el naranja de marca (`brand-600`/`brand-700` → naranja), sin
literales rojos de alquilame (`#cc022b`, etc.) ni clases `text-red-*`
**Evidence**: computed color + grep sobre los 2 archivos

## SCEN-F2-05: runtime limpio
**Given**: un dev server sirviendo ambas páginas legales
**When**: se cargan
**Then**: cero errores de consola y cero requests fallidos
**Evidence**: consola del browser + network requests

## SCEN-F2-06: SEO por página preservado
**Given**: ambas páginas legales
**When**: se inspecciona el head
**Then**: cada una tiene title y canonical config-driven (`${franchise.shortname}`
/ `${franchise.website}/terminos-condiciones` y `/politica-privacidad`)
**Evidence**: `<title>` + `<link rel=canonical>` en el HTML renderizado
