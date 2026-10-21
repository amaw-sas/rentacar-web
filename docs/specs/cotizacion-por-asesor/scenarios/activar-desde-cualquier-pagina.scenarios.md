---
name: activar-desde-cualquier-pagina
created_by: diego-alex-melo
created_at: 2026-10-21T00:00:00Z
---

# Escenarios: el enlace del asesor funciona desde cualquier página

Defecto encontrado por el dueño el 2026-10-21: `alquilame.co/?asesor=daniela` (la portada)
no activaba nada; solo se leía en la página de resultados. Cada escenario se prueba en las 3
marcas en producción o preview, con un navegador limpio.

## SCEN-016: activar desde la portada y ver el botón al cotizar
**Given**: un navegador sin modo asesor; `daniela` es `salesperson` activo
**When**: abre la portada con `?asesor=daniela`, y luego busca carros desde el buscador de la
portada sin escribir nada más en la dirección
**Then**: en la portada la dirección queda sin `asesor` y se guarda `{code:'daniela',
name:'Daniela'}`; en la página de resultados aparece «Copiar cotización» con «Asesor: Daniela»
**Evidence**: `localStorage['rentacar:asesor']` y `location.href` en la portada; DOM del panel
en resultados

## SCEN-017: activar desde cualquier otra página
**Given**: un navegador sin modo asesor
**When**: abre una página que no es de resultados (p. ej. una página de ciudad o del blog)
con `?asesor=daniela`, y después abre una página de resultados sin parámetro
**Then**: queda guardado el asesor y la página de resultados muestra el panel con su nombre
**Evidence**: `localStorage` tras la primera página; DOM del panel en la segunda

## SCEN-018: un código malo en la portada avisa
**Given**: un navegador sin modo asesor
**When**: abre la portada con `?asesor=danela`
**Then**: aparece el aviso «Código de asesor no encontrado», no se guarda nada y la dirección
queda sin `asesor`
**Evidence**: DOM (aviso), `localStorage` sin la clave, `location.href`

## SCEN-019: el visitante sigue sin pagar nada en ninguna página
**Given**: un navegador sin `?asesor` y sin asesor guardado
**When**: abre la portada y luego una página de resultados
**Then**: no hay ninguna petición a `/api/asesor/` en ninguna de las dos
**Evidence**: registro de red de ambas cargas
