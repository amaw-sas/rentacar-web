# Cotización por asesor: código propio, atribución y texto por marca

Fecha: 2026-10-20 · Marcas: alquilame, alquilatucarro, alquicarros · Sigue a
`docs/specs/copiar-cotizacion/design.md` (PR #519).

## Para qué

Dos problemas del botón «Copiar cotización» que salió en el PR #519:

1. **`?asesor=1` no dice quién es el asesor.** Es confuso, se olvida, y la venta que sale de
   la cotización no queda a nombre de nadie.
2. **El texto es idéntico en las 3 marcas.** Un cliente que cotiza en las 3 recibe la misma
   cotización palabra por palabra.

## Lo que ya existe y se reutiliza

- **Referidos del panel de control** (`public.referrals`: `code` en minúscula, `name`,
  `type`, `status`). Daniela ya existe con `code = 'daniela'`, `type = 'salesperson'`,
  `status = 'active'`.
- **Enlaces con referido en las 3 webs:** `/reservas/referido/{code}/lugar-recogida/...`
  (alquilame y alquicarros) y `/{city}/buscar-vehiculos/referido/{code}/lugar-recogida/...`
  (alquilatucarro). El código viaja en la reserva como `user`. El panel lo resuelve con
  `resolveReferral` (trim + minúscula, solo activos) y la reserva queda con `referral_id`.
  Si no lo encuentra, guarda el texto en `referral_raw`.
- **Cliente de servicio en el servidor de la web** (`useSupabaseAdminClient`), que ya usa
  `exists.get.ts` en producción. En producción `anon` no tiene permiso de lectura sobre
  `referrals` (la política `Anon can read referrals` de la migración 016 ya no existe en la
  base; verificado el 2026-10-20 con `pg_policies` y una consulta REST que responde 42501).
- **Tope por IP** de `server/api/reservations/[reserveCode]/exists.get.ts` (30 por minuto).

## Decisiones del dueño (2026-10-20)

1. **El código del asesor es su código de referido del panel**, no un número.
2. **La web confirma el código contra el panel** antes de activar el botón. Un código mal
   escrito no activa nada.
3. **La cotización no lleva enlace ni firma.** La venta se cierra en la conversación; un
   enlace sacaría al cliente de ella. Cuando el cliente escoge un carro, el asesor usa el
   botón compartir que ya existe en el resumen de la reserva.
3b. **La atribución va en lo que ya existe:** la reserva hecha desde un navegador de asesor,
   y el enlace del botón compartir del resumen, salen con el código del asesor.
4. **Texto propio por marca** (las 3 versiones de abajo, aprobadas palabra por palabra).
5. **En las 3 marcas:** sin mención del deducible, precios con «COP» y sin códigos de gama de
   Localiza.

## Modo asesor

- **Activar:** abrir cualquier página de la marca con `?asesor={code}`. La web normaliza el
  código igual que `resolveReferral` del panel (trim + minúscula). Rechaza sin consultar solo
  lo que no puede ser un código: vacío, más de 60 caracteres, o con espacios, `/`, `?` o `#`.
  Después llama `GET /api/asesor/{code}` (código codificado con `encodeURIComponent`).
  Esta regla es más laxa a propósito que el formulario del panel
  (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), porque la base no exige ese patrón y hay códigos viejos con
  `_`. El tope de 60 caracteres es solo de la web.
  - 200 → guarda `{ code, name }` en `localStorage` (`rentacar:asesor`, vía
    `getLocalStorageSafe()`) y muestra el panel.
  - 404 → no guarda nada y muestra el aviso «Código de asesor no encontrado».
  - Error de red o 5xx → no guarda nada y muestra el aviso «No se pudo verificar el código,
    intenta de nuevo».
  - En todos los casos el parámetro se **quita de la URL** (`router.replace`, el resto de la
    query se conserva), igual que en el #519.
- **Apagar:** `?asesor=0` borra la clave.
- **Revalidar:** si hay un asesor guardado, el panel aparece de inmediato con el nombre
  guardado (en `onMounted`; el render del servidor sigue en `false`, como en el #519) y la
  web lo vuelve a consultar una vez por carga de página. Un 404 lo borra y oculta el panel,
  por ejemplo si el asesor quedó inactivo en el panel. Un 200 con otro nombre actualiza el
  guardado. Un error de red, 5xx o 429 lo conserva, para que un fallo momentáneo no lo apague.
  Lo que ya se copió antes del 404 no se puede retirar; es aceptable porque el 404 solo
  llega cuando el asesor ya no está activo.
- **El valor viejo `'1'`** (del #519) no es un asesor: se borra y el panel no aparece.
- **El panel muestra «Asesor: {name}»** junto al botón. El nombre sale del panel, no del
  código.
- **Los clientes no pagan nada:** sin `?asesor` y sin clave guardada no hay llamada al
  servidor ni se carga el panel (sigue lazy detrás de `v-if`).

### `GET /api/asesor/{code}` (capa `logic`, servidor)

- Consulta `referrals` con `useSupabaseAdminClient()` (service role, solo en el servidor) y
  `.select('code,name')`:
  `code = {code}`, `status = 'active'`, `type = 'salesperson'`, y el código **no termina en
  `-bot`** (los bots del chat, como `camila-bot`, son `salesperson` activos y no son
  asesores). Responde `{ code, name }` o 404. `resolveReferral` del panel no filtra por tipo;
  este endpoint sí, a propósito: solo los vendedores humanos activan el botón.
- Solo expone el nombre de un código exacto. No lista asesores ni devuelve contacto ni notas.
- Mismo tope por IP que `exists.get.ts` (30 por minuto) → 429. Detrás de Cloudflare ese tope
  cuenta IPs de Cloudflare, así que es una protección parcial contra enumerar códigos.
- `Cache-Control: no-store`, para que inactivar a un asesor tenga efecto en la siguiente
  carga.
- Código con formato inválido → 404 sin consultar la base.

### Panel de control (otro repo, PR aparte)

En la lista de referidos, cada fila `salesperson` activa muestra 3 enlaces: «Activar en
Alquilame», «Activar en Alquilatucarro» y «Activar en Alquicarros». Cada uno abre
`https://{dominio}/?asesor={code}`. La web no depende de este PR.

## Atribución

Ningún enlace nuevo. El código del asesor activo se pega en dos cosas que ya existen:

1. **Reservas hechas desde el navegador del asesor.** Si hay asesor activo, la reserva se
   envía con `user = {code}` (`useRecordReservationForm`, el mismo campo que hoy llena el
   referido de la ruta). El panel la resuelve con `resolveReferral` y queda a su nombre. Si
   la ruta trae otro referido, gana el asesor activo: quien cierra la reserva es él.
2. **Botón compartir del resumen de la reserva** (`getReservationShareUrl` en
   `CategorySelectionSection.vue` de alquilame y alquilatucarro; en alquilame
   `ReservationResume.vue` solo emite el evento y la URL la arma ese mismo padre). Con asesor activo, el enlace compartido lleva el
   segmento `referido/{code}` (insertado o reemplazando el que haya). El cliente que reserva
   desde ese enlace queda a nombre del asesor, por el mismo camino que los enlaces de
   referido actuales. Sin asesor activo el enlace no cambia.

Alquicarros no tiene botón compartir en el resumen; ahí solo aplica el punto 1.

## Texto por marca

Datos comunes a las 3 marcas:

- Total con IVA por gama, el mismo número que en el #519 (`getActualTotalPrice`).
- Las gamas agotadas y las de precio ≤ 0 se excluyen.
- El nombre de la gama es la descripción que muestra la tarjeta, **sin el código de gama**.
- «COP» después de cada valor.
- Validez de 20 minutos y los 6 beneficios del bot, cada marca con su redacción.
- Sin enlace y sin firma.
- Ninguna versión menciona el deducible.

Las versiones de ejemplo (Cali Aeropuerto → Cali Norte Chipichape, 2 días + 3 horas extra,
Seguro Total, silla de bebé) están aprobadas así:

### Alquilame

Formato nuevo aprobado por el dueño el 2026-10-23 (reemplaza al del 2026-10-20). Ejemplo: Bogotá
Aeropuerto, 7 días, seguro básico, silla $12.000/día y lavado prepagado $20.000 del catálogo.

```
Esta es tu cotización:

📍*Recoges:*
Bogotá Aeropuerto
viernes 23 oct. 12:00pm
📍*Entregas:*
Bogotá Aeropuerto
viernes 30 oct. 12:00pm

🚗 Compacto Mecánico
*$1.155.000 COP*
🚗 Compacto Automático
*$1.232.000 COP*
🚗 Sedán Mecánico
*$1.281.000 COP*
🚗 Sedán Automático
*$1.470.000 COP*
🚗 Sedán Automático Híbrido
*$1.708.000 COP*
🚙 Camioneta MT 4X4
*$2.387.000 COP*
🚙 Camioneta AT Híbrida 7 puestos
*$3.773.000 COP*
🚙 Camioneta AT Especial
*$3.038.000 COP*

*Cantidad:* 7 días
*Seguro:* Seguro básico
*Impuestos:* Incluye IVA y Tax
*Kilometraje:* Ilimitado
*Precio:* Se mantiene 20 minutos, luego debes recotizar

*OPCIONALES*
*Silla de bebé:*
$84.000 COP por 7 días
*Lavada pago anticipado:*
$20.000 COP

*Con Alquilame:*
✅ Reservas con 4 datos y congelas el precio
✅ No pagas nada hoy y no bloqueamos cupo de tarjeta
✅ Cancelas cuando quieras y pagas al recoger
```

Reglas de Alquilame:
- 🚙 si la descripción empieza por «Camioneta», 🚗 en las demás. Camionetas con MT/AT como en
  Alquilatucarro.
- *Seguro:* «Seguro básico» o «Seguro Total»; gama sin Seguro Total → « (sin Seguro Total)» tras
  el precio en negrilla.
- *OPCIONALES* siempre (silla «por N días» o «por el mes», lavado `getWashPrice`); el panel de
  Alquilame no tiene casilla de silla.
- Variantes como Alquilatucarro: «*Cantidad:* 7 días + 3 horas extra»; línea «*Devolución en otra
  sede:* Incluida en el precio» tras *Impuestos* solo con cargo; mensual «*Cantidad:* 30 días» y
  «*Kilometraje:* 1.000 km al mes» (planes distintos: «Según el plan de cada gama» y « (plan 2.000
  km)» por gama).
- La columna Alquilame de la tabla de variantes de abajo queda sustituida por estas reglas.

### Alquilatucarro

Formato nuevo aprobado por el dueño el 2026-10-22 (reemplaza al del 2026-10-20). Ejemplo:
Barranquilla Aeropuerto, 7 días, Seguro Total, silla $12.000/día y lavado prepagado $20.000 del
catálogo.

```
Le comparto la cotización solicitada:

*RECOGIDA*
Barranquilla Aeropuerto
viernes 23 oct. 12:00pm
*DEVOLUCIÓN*
Barranquilla Aeropuerto
viernes 30 oct. 12:00pm

*Compacto Mecánico:*
$1.608.195 COP
*Compacto Automático:*
$1.692.194 COP
*Sedán Mecánico:*
$1.720.824 COP
*Sedán Automático:*
$1.909.824 COP
*Sedán Automático Híbrido:*
$2.147.824 COP
*Camioneta MT 4X4:*
$2.740.150 COP
*Camioneta AT Híbrida:*
$3.635.639 COP
*Camioneta AT Híbrida 7 puestos:*
$4.258.639 COP
*Camioneta AT:*
$3.397.639 COP

*Cantidad:* 7 días
*Seguro:* Total
*Impuestos:* Incluidos
*Kilometraje:* Ilimitado
*Precios:* Dinámicos, válidos por 20 minutos.

*OPCIONAL*
*Silla de bebé:*
$84.000 COP por 7 días
*Lavada prepagada:*
$20.000 COP

*¿Por qué reservar con Alquilatucarro?*
•  El precio queda congelado
•  No paga nada por adelantado
•  Puede cancelar sin costo
•  No bloqueamos cupo en su tarjeta
•  Paga al recoger el vehículo
```

Reglas de Alquilatucarro:
- Nombre de gama = descripción del catálogo; solo en las que empiezan por «Camioneta»,
  «Mecánica/Mecánico» → «MT» y «Automática/Automático» → «AT».
- *OPCIONAL* sale siempre: silla = precio diario × días («por N días»; mensual «por el mes»),
  lavado = `getWashPrice` del catálogo. En Alquilatucarro no hay casilla de silla.
- Variantes: horas extra → «*Cantidad:* 7 días + 3 horas extra»; sin Seguro Total → «*Seguro:*
  Básico»; gama sin Seguro Total → « (sin Seguro Total)» tras el precio; cargo por otra sede →
  línea «*Devolución en otra sede:* Incluida en el precio» tras *Impuestos*; mensual →
  «*Cantidad:* 30 días» y «*Kilometraje:* 1.000 km al mes» (planes distintos: «Según el plan de
  cada gama» y « (plan 2.000 km)» por gama).
- La columna Alquilatucarro de la tabla de variantes de abajo queda sustituida por estas reglas.

### Alquicarros

```
Tu cotización Alquicarros 👇

Cali Aeropuerto → Cali Norte Chipichape
vie 23 oct. 7:30am → dom 25 oct. 10:30am
2 días + 3 h extra · Seguro Total

• Económico $668.810 COP
• Sedán $932.301 COP
• Camioneta $1.894.620 COP

Incluye: IVA, horas extra, otra sede, km ilimitado.
+ Silla de bebé $XX.XXX COP (pagas al recoger)
Precio por 20 min.

Sin pagos hoy · sin cupo bloqueado · cancelas gratis · pagas al recoger · reservas con 4 datos · precio congelado.
```

### Variantes (derivadas de las versiones aprobadas; el dueño las revisa en este documento)

| Caso | Alquilame | Alquilatucarro | Alquicarros |
|---|---|---|---|
| Sin Seguro Total | `⏱️ 2 días, con seguro básico` | `*Cobertura:* Seguro básico` | `2 días · Seguro básico` |
| Seguro Total en algunas gamas | la gama que no lo admite lleva ` (sin Seguro Total)` después del precio | igual | igual |
| Sin horas extra | `⏱️ 2 días, con …`; «las horas extra» sale de la frase de lo que incluye el precio | `*Duración:* 2 días`; ídem | `2 días · …`; «horas extra» sale de «Incluye:» |
| Misma sede | se mantienen las dos líneas 📍; «la entrega en otra sede» sale de lo que incluye | ídem con «el cargo por devolver en otra sede» | `Cali Aeropuerto → Cali Aeropuerto`; «otra sede» sale de «Incluye:» |
| Ni horas extra ni otra sede | `El precio ya incluye IVA y kilometraje ilimitado.` | `Valores con IVA incluido. Incluyen kilometraje ilimitado.` | `Incluye: IVA, km ilimitado.` |
| Mensual, mismo plan | `30 días, plan de 1.000 km al mes, con …`; «kilometraje ilimitado» → «1.000 km al mes» | `*Duración:* 30 días, plan de 1.000 km al mes`; ídem | `30 días · plan 1.000 km/mes · …`; «km ilimitado» → «1.000 km/mes» |
| Mensual, planes distintos | la gama lleva ` (plan 2.000 km)`; lo que incluye el precio dice «los km del plan de cada gama» | ídem | ídem, «km del plan de cada gama» |
| Silla mensual | `Silla de bebé: $X COP el mes, se paga al recoger.` | `… $X COP el mes, se paga en la oficina.` | `+ Silla de bebé $X COP el mes (pagas al recoger)` |
| Sin silla | la línea no aparece | ídem | ídem |

Fechas: alquilame y alquilatucarro usan `formatQuoteDateTime` («viernes 23 oct. 7:30am»).
Alquicarros usa un formateador nuevo con el día abreviado, `formatQuoteDateTimeShort`
(«vie 23 oct. 7:30am»), con la misma tabla fija de meses y día en UTC.

## Qué reemplaza del #519

- `buildQuoteText` (texto del bot con código de gama y «(deducible $0)») se reemplaza por un
  modelo de datos común (`QuoteTextInput`) y **tres plantillas**, una por
  marca, elegidas por `rentacarFranchise`. El texto del #519 deja de existir en las 3 marcas.
- Las pruebas del #519 que fijan ese texto (fixture del bot byte a byte, pie con «seguro
  básico», «deducible $0») se reemplazan por fixtures de las 3 versiones aprobadas. Los
  escenarios del #519 que describen el formato del texto (SCEN-001…) quedan **sustituidos**
  por los de esta spec; los de comportamiento (casillas, agotadas, botón oculto con búsqueda
  desactualizada, cliente sin panel) siguen vigentes.
- `useAdvisorMode` pasa de booleano a `{ code, name } | null`.

## Fuera de alcance

- **Precios distintos por marca.** Son el mismo inventario; cambiarlos es una decisión
  comercial.
- **El texto del bot** (`lib/chat-v2/bloque-de-precio.ts` en el panel) sigue igual en las 3
  marcas. Va en un PR aparte del panel, si se decide.
- **Enlaces nuevos.** El único enlace es el del botón compartir que ya existe.

## Riesgos

- **Que el cliente no reserve desde el enlace compartido.** Si busca de nuevo desde la
  portada, el referido se pierde: vive en la ruta, no en `localStorage`. Igual que los
  enlaces de referido actuales.
- **Descripciones de gama largas.** El nombre sale de la descripción de la tarjeta. Se
  verifica en vivo que se lea bien en WhatsApp.
- **Alquicarros no tiene `NUXT_SUPABASE_SERVICE_ROLE_KEY` en su proyecto de Vercel**
  (2026-10-20). Sin ella `/api/asesor` responde 502 y el modo asesor no se activa en esa
  marca; `exists.get.ts` ya fallaba allí por lo mismo. Es una variable «sensible»: Vercel no
  devuelve su valor, así que hay que pegarla desde Supabase (Settings → API, service role).
- **Cualquiera puede escribir `?asesor=daniela`.** No es control de acceso: el panel solo
  copia lo que está en pantalla. El efecto máximo sería atribuirle a Daniela una reserva que
  no gestionó, que ya es posible hoy con el enlace de referido.
