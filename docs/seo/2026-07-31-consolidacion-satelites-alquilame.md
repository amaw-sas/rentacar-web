# Consolidación de los 19 dominios de la familia alquilame

**Fecha:** 2026-07-31 · **Estado:** plan, sin ejecutar
**Decisión del dueño:** redirigir cada dominio satélite a su página de ciudad en `alquilame.co`, para que la autoridad se acumule en una sola marca.

---

## De dónde viene esto

El negocio empezó con `alquilerdecarrosencali.com`. Funcionó, así que se compró el de Bogotá, y luego el resto, hasta tener uno por ciudad. Cada dominio servía para pautar con **palabra clave exacta** en Google Ads. Más tarde se creó `alquilame.co` como marca sombrilla de todos ellos.

Hoy los 19 llevan el logo y el teléfono de alquilame, con contenido propio de su ciudad. **Las campañas de Ads ya no los usan**, así que son puramente orgánicos.

## Por qué consolidar es lo correcto

La auditoría del 2026-07-30 concluyó que el montaje encaja en el ejemplo de `doorway abuse` de Google — no por textos copiados, sino por la arquitectura: muchos dominios de ciudad canalizando al mismo servicio. **El remedio que Google plantea para eso es exactamente esto: consolidar con 301 hacia la página equivalente.**

No hay sanción hoy: las 43 pantallas de Acciones manuales están limpias. Se consolida para dejar de correr el riesgo y para que una sola marca acumule lo que hoy está repartido.

---

## Lo que está en juego

Search Console, 90 días (2026-05-02 a 2026-07-31):

| Dominio | → Destino | Clics | Impresiones | Posición |
|---|---|---:|---:|---:|
| alquilerdecarrosenibague.com | `/ibague` | 747 | 10.478 | **6,0** |
| alquilerdecarrosenarmenia.com | `/armenia` | 656 | 12.582 | **6,9** |
| alquilerdecarrosenmanizales.com | `/manizales` | 611 | 11.578 | **6,8** |
| alquilerdecarrosenbucaramanga.com | `/bucaramanga` | 459 | 18.442 | 8,4 |
| alquilerdecarrosenvalledupar.com | `/valledupar` | 405 | 6.404 | 6,4 |
| alquilerdecarrosenpalmira.com | `/palmira` | 376 | 5.624 | 7,7 |
| alquilerdecarrosenvillavicencio.com | `/villavicencio` | 331 | 9.024 | 7,5 |
| alquilerdecarrosenneiva.com | `/neiva` | 310 | 7.892 | 7,0 |
| alquilerdecarrosencali.com | `/cali` | 274 | 23.156 | 11,4 |
| alquilerdecarrosensantamarta.com | `/santa-marta` | 223 | 17.810 | 9,6 |
| alquilerdecarrosencartagena.com | `/cartagena` | 159 | 18.043 | 16,3 |
| alquilerdecarrosenpereira.com | `/pereira` | 106 | 8.045 | 12,9 |
| alquilerdecarrosenbarranquilla.com | `/barranquilla` | 99 | 9.184 | 13,4 |
| alquilerdecarrosencucuta.com | `/cucuta` | 81 | 6.077 | 9,3 |
| alquilerdecarrosensoledad.com | `/soledad` | 37 | 1.308 | 13,8 |
| alquilerdecarrosenmedellin.info | `/medellin` | 22 | 2.592 | 30,2 |
| alquilerdecarrosenfloridablanca.com | `/floridablanca` | 21 | 1.225 | 10,6 |
| alquilerdecarrosenbogota.info | `/bogota` | 6 | 3.255 | 15,8 |
| **alquilerdecarrosenbogota.com** | **caso aparte, ver abajo** | 13 | 2.048 | 8,9 |

**Total: 4.936 clics en 90 días.**

### El dato incómodo

**Los satélites rankean mejor que el destino.**

| Ciudad | Satélite | `alquilame.co` |
|---|---|---|
| Armenia | posición **6,9** · 656 clics | posición 18,4 · 5 clics |
| Manizales | posición **6,8** · 611 clics | posición 23,0 · 1 clic |
| Ibagué | posición **6,0** · 747 clics | posición 7,7 · 19 clics |

Se están entregando posiciones 6-7 a páginas que hoy están en 18-23. Un 301 transfiere la mayor parte de la señal, no toda. **Por eso el orden importa y los tres grandes van al final.**

---

## Verificaciones hechas antes de proponer nada

| Qué | Resultado |
|---|---|
| ¿Existen los 19 destinos? | **Sí**, las 19 páginas de ciudad responden 200 |
| ¿El destino es más flaco que el satélite? | **No.** Armenia: satélite 1.847 palabras con 1 solo H2; `alquilame.co/armenia` 1.784 palabras con **15 H2** y el doble de imágenes |
| ¿Hay doble H1 en las páginas de ciudad? | **No.** Un H1 por página, correcto (un conteo previo dio falso positivo por menciones de `h1` dentro del CSS) |
| ¿Las campañas de Ads dependen de estos dominios? | **No**, ya no se usan |

---

## El caso aparte: `alquilerdecarrosenbogota.com`

No es un satélite de ciudad. **Es un blog con 53 artículos propios**, ya indexados, con la marca alquilame.

| | |
|---|---|
| Artículos | **53** |
| Palabras: mediana | **894** |
| El más corto | 443 |
| Con 800 palabras o más | 30 de 53 |

**Y son justo el contenido que la parrilla no tenía:**

- **Festivos y puentes:** Semana Santa (×2), Reyes Magos, Día de Velitas, 20 de Julio, festivos de junio
- **Ferias de ciudad:** Feria de Cali, Feria de Manizales, Feria de las Flores, Alumbrados de Medellín, Independencia de Cartagena, 500 años de Santa Marta
- **Eventos B2B:** Andina Pack, Salón Ferretero, Congreso de la Caña de Azúcar, Feria del Hogar
- **Festivales:** Festival Cordillera, Festival del Sabor Bogotá

Los eventos B2B son un hallazgo por sí solos: ferias comerciales que mueven alquiler y que no estaban en ninguna hipótesis previa.

**Este dominio NO se redirige en bloque.** Mandar 53 artículos a `/bogota` tira la relevancia de cada uno. El tratamiento correcto es **migrar el contenido al blog de alquilame** —que hoy tiene 1 artículo— y después redirigir cada URL a su nuevo destino, uno a uno.

Eso convierte el silo de calendario de la parrilla, que estaba vacío, en algo que ya existe y solo hay que actualizar por temporada. Y las URLs migradas deben perder el año del slug, según la regla ya adoptada.

---

## Plan de ejecución

### Fase 1 — Piloto (5 dominios, 86 clics en riesgo)

| Dominio | → Destino | Clics |
|---|---|---:|
| alquilerdecarrosenbogota.info | `/bogota` | 6 |
| alquilerdecarrosenfloridablanca.com | `/floridablanca` | 21 |
| alquilerdecarrosenmedellin.info | `/medellin` | 22 |
| alquilerdecarrosensoledad.com | `/soledad` | 37 |

Cuatro dominios, **86 clics** de los 4.936. Es lo máximo que se pierde si el mecanismo falla.

**Criterio de éxito, a 4-6 semanas:** los clics e impresiones que perdía el satélite aparecen en `alquilame.co/{ciudad}` en Search Console. Si no aparecen, **no se avanza** y se investiga por qué.

### Fase 2 — Tanda media (7 dominios, 796 clics)

Cúcuta, Barranquilla, Pereira, Cartagena, Santa Marta, Cali, Neiva. Solo si la fase 1 transfirió.

### Fase 3 — Los grandes (6 dominios, 3.058 clics)

Villavicencio, Palmira, Valledupar, Bucaramanga, Manizales, Armenia, Ibagué. **Al final, y de a uno**, porque son las mejores posiciones del portafolio.

### Fase 4 — El blog

Migrar los 53 artículos y redirigir por URL. Va aparte y no depende de las anteriores.

---

## Reglas técnicas

1. **301 permanente**, nunca 302. Un 302 no transfiere autoridad.
2. **Un solo salto.** Nada de `satélite → /ciudad/ → /ciudad`. Apuntar a la URL final exacta, sin barra final.
3. **A la página equivalente**, jamás a la home. Redirigir todo a la raíz es lo que Google llama "soft 404" y desperdicia la señal.
4. **`www` y sin `www` al mismo destino**, en un solo salto cada uno.
5. **Los dominios se quedan pagados y respondiendo, por años.** Google sigue consultando el 301 mucho tiempo. Dejar caer un dominio borra lo transferido.
6. **Search Console: no quitar las propiedades de los satélites.** Son la única forma de ver si el traspaso ocurrió.

## Cómo se mide

**No depende de arreglar la atribución.** Search Console basta: se compara la serie de clics e impresiones del satélite contra la de `alquilame.co/{ciudad}` antes y después.

Lo que **no** se podrá medir todavía es el efecto en reservas: hoy solo 2 de 6.476 reservas de 12 meses tienen origen atribuible a un satélite. Arreglar eso es trabajo aparte y no bloquea esta consolidación.

## Qué esperar

Una caída temporal es normal. Google necesita semanas para procesar un cambio de dominio, y el desagrupado de duplicados puede tardar hasta dos semanas más. **Un bajón en la semana 2 no es motivo para revertir.** El criterio es la serie a 4-6 semanas, no el susto del primer lunes.

## Rollback

Quitar el 301 y devolver el dominio a su contenido anterior. Funciona bien si se hace pronto; cuanto más tiempo pase, más ha consolidado Google y más confuso resulta revertir. Por eso el piloto es pequeño: para equivocarse barato.
