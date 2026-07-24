# Los avisos del middleware de rutas tienen que llegar al usuario — Issue #406

Fecha: 2026-07-24. Marcas afectadas: las tres.

## El problema

`packages/logic/src/middleware/validateSearchParams.ts` corrige deep-links rotos y avisa con
`createMessage` en cinco sitios (`:112`, `:141`, `:196`, `:242`, `:301`). Ninguno de los cinco avisos
se ve. El usuario acaba mirando una búsqueda distinta de la que pidió —otra sede, otras fechas— sin
que nada se lo diga.

## Diagnóstico: son dos causas, no una

El issue nombra el flush de `doSearch`. Es real, pero solo explica uno de los dos caminos de entrada,
y no el que reproduce el propio issue.

### RC-1 — carga dura: el 302 descarta el aviso antes de que exista un cliente

El middleware corre en servidor. `createMessage` escribe en el estado de toasts del render SSR y
acto seguido `navigateTo` responde una redirección. Una respuesta 302 no lleva payload: el estado
muere ahí. El navegador pide la URL ya corregida, el middleware no encuentra nada que corregir, y
no se emite ningún aviso.

```
$ curl -sI ".../lugar-recogida/sede-que-no-existe/..."
302 -> .../lugar-recogida/bogota-aeropuerto/...fecha-recogida/2026-07-25...
```

Observado en navegador sobre la URL de la reproducción: «Ubicación inválida» no aparece nunca. Lo
único que sale es el toast de disponibilidad, a los 975 ms. El flush ni siquiera participa.

Los cinco `createMessage` van seguidos de `return navigateTo(...)`, así que RC-1 los alcanza a todos.

### RC-2 — navegación cliente: aquí sí es el flush

Muestreo del DOM cada 25 ms durante un `router.push()` a la misma URL:

```
t=  0  PUSH -> sede-que-no-existe
t= 25  TOASTS[6]: ... || "Ubicación inválida. Se ajustó a la sede por defecto."   <- nace
t= 64  PUSH resuelto, url = .../bogota-aeropuerto/...
t= 78  TOASTS[28]: (vacío)                                                        <- flushMessages()
t=125  TOASTS[4]: "No pudimos completar la búsqueda..."                           <- el que sobrevive
```

El aviso vive 53 ms. Es exactamente el mecanismo que describe el issue, y coincide con el que en
#402 obligó a mover el aviso de sede a después de la decisión de buscar.

### Por qué la prueba existente no lo atrapó

`validateSearchParams.test.ts:130` afirma `expect(TOAST_ADD).toHaveBeenCalledTimes(1)`. La aserción
es cierta y aun así el usuario no ve nada: mide el mecanismo (se llamó a `toast.add`) en lugar del
resultado (el aviso llega). El bug sobrevivió a su propia prueba.

## Lo que se descartó

`useCookie` era el candidato obvio —una cookie flash sobrevive a un 302 por construcción— y no
sirve. En servidor, Nuxt difiere la escritura al hook `app:rendered`
(`nuxt/dist/app/composables/cookie.js:121`), y un `navigateTo` en middleware redirige **sin
renderizar**. La cookie no llegaría a emitirse. Quedaría llamar a `setCookie(event, ...)` de h3 a
mano, con rama servidor/cliente dentro de `packages/logic`, y sin forma de asertarlo sin fabricar un
evento H3 falso. Coste alto para el mismo resultado.

Arreglar solo RC-2 también se descartó: deja roto el camino de los enlaces compartidos, que es el
que reporta el issue.

## Diseño

Un parámetro de query efímero transporta el aviso a través del redirect. Un solo camino cubre RC-1 y
RC-2.

### Catálogo compartido

`packages/logic/src/utils/searchParamNotices.ts` mapea código estable a mensaje. El middleware emite
códigos; quien lo consume traduce.

| Sitio | Código | Mensaje (sin cambios respecto a hoy) |
|---|---|---|
| `:112` sede desconocida | `sede` | «Ubicación inválida. Se ajustó a la sede por defecto.» |
| `:141` sede ajena a la ciudad (#129) | `sede-ciudad` | «La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.» |
| `:196` formato de hora inválido | `hora` | «Formato de hora inválido. Se ajustó al valor por defecto.» |
| `:242` parámetros malformados | `parametros` | «Parámetros inválidos. Se ajustaron a los valores por defecto.» |
| `:301` ventana mayor de 30 días | `duracion` | «La fecha de devolución ha sido ajustada a 30 días después de la fecha de recogida.» |

La traducción es **por whitelist**. Un `?aviso=` hecho a mano que no case con un código conocido se
ignora, y el valor crudo no se renderiza nunca. La URL se limpia igual.

### El middleware deja de emitir toasts

Se van los cinco `createMessage` y con ellos el import de `useMessages`. Cada sitio acumula su código
en la query del `navigateTo`.

Acumula, no sobrescribe. Un enlace con la hora mal formada **y** un rango de 35 días encadena dos
redirects; sobrescribir perdería el primer aviso, que es el bug que estamos cerrando. Dedupe, y tope
de 3 códigos.

### El drenaje vive en un solo sitio

`useSearchByRouteParams` es el driver compartido de las 13 páginas que declaran el middleware en las
tres marcas. Ahí, después de `doSearch()`: limpiar la URL con `router.replace` y emitir cuando
resuelva.

Ese orden importa. Si algún día el `replace` llegara a remontar la página, el flush del segundo
`doSearch` ocurriría antes de que el toast exista, en vez de matarlo recién nacido.

Hoy no remonta. Medido:

```
POSTs antes del replace: 1, search=?aviso=sede
replace OK, search=(vacío)
POSTs 2s despues: 1          <- sin remonte, sin segunda búsqueda
history.length: 26 -> 26     <- sin entrada de historial
```

El aviso se emite gane o pierda `doSearch`. Un aviso de corrección de URL y un aviso de guard hablan
de ejes distintos —qué se cambió del enlace frente a por qué no hay cotización—, los dos son
accionables, y Nuxt UI apila hasta cinco toasts.

### Lo que no se toca

La superficie query de `/reservas` en alquilame y alquicarros no declara este middleware. El watcher
de `useSearchByQueryParams` observa solo las seis claves de búsqueda, así que `aviso` no lo dispara.
Los canonicals de estas páginas son fijos y las rutas van `noindex,follow`: un parámetro de más es
neutro para SEO.

## Escenarios observables

El holdout vive en `docs/specs/issue-406-middleware-route-notices/scenarios/`.

- **SCEN-406-01** — carga dura con sede inexistente: la URL se corrige y el aviso está en el DOM.
- **SCEN-406-02** — navegación cliente a la misma URL: el aviso sobrevive al flush.
- **SCEN-406-03** — tras mostrarse, `?aviso` desaparece, los demás params se conservan, sin entrada
  de historial ni segundo POST.
- **SCEN-406-04** — `?aviso` inventado: ningún toast, URL limpia igual.
- **SCEN-406-05** — hora inválida más rango de 35 días: llegan los dos avisos.
- **SCEN-406-06** — deep-link válido: cero avisos, cero redirect.
- **SCEN-406-07** — `doSearch` aborta por fecha pasada: conviven los dos mensajes.

## Riesgos

El parámetro es visible durante un render antes de limpiarse. Si alguien copia la URL en esa ventana
y la comparte, el receptor ve un aviso que no le corresponde. El `replace` corre en el mismo tick del
montaje, así que la ventana es de milisegundos.

Repinar `validateSearchParams.test.ts:130,144` de `TOAST_ADD` a `target.query.aviso` mueve el punto
de medición al portador que sí alcanza al cliente. Mismo invariante observable, no más débil.
