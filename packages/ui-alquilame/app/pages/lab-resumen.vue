<template>
  <!--
    BORRAR antes de mergear. Comparativa del slideover "Resumen" (paso previo al
    formulario). Markup plano a propósito, como lab-desglose.vue: cada variante
    repite el bloque para que los literales vivan en el fuente y usan el CSS REAL
    de la card (.fila-tarifa, .valor-tarifa, .precio-total...).

    Cifras REALES de la misma reserva que se ve en /reservas hoy: Gama C, 3 días,
    Bogotá Aeropuerto 10→13 ago 2026. Diaria $249.000 con 48% → $128.721;
    subtotal $386.164; tasa+IVA $119.325; total a pagar $505.488.

    El problema que se compara: la card ya cierra en "Total a pagar $505.488,
    precio final todo incluido" y el Resumen de hoy cierra en "Total renta
    $386.164 — No incluye IVA ni tasa admin".

    Cada columna va al ancho real del slideover (≈420px de contenido) para que la
    comparación no mienta: lo que en una rejilla ancha se ve bien, ahí se rompe.
  -->
  <div class="min-h-screen bg-surface-soft py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="font-heading text-3xl font-extrabold text-gray-900">
        Resumen de reserva — tres maneras
      </h1>
      <p class="mt-2 max-w-3xl text-gray-700">
        El cliente acaba de ver la card con
        <strong>“Total a pagar $ 505.488 · precio final, todo incluido”</strong>
        y al pulsar “Solicitar este vehículo” se encuentra este panel. Hoy le
        dice <strong>$ 386.164</strong> y “no incluye IVA ni tasa admin”.
        Cifras reales de esa reserva.
      </p>

      <div class="mt-10 flex flex-wrap gap-8 items-start">

        <!-- ================= ACTUAL (referencia) ================= -->
        <section class="w-[420px]">
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">Actual</h2>
            <p class="text-sm text-gray-600">Lo que hay hoy. Dos columnas, rojo, sin impuestos.</p>
          </header>

          <div class="lab-panel">
            <div class="lab-panel-head">
              <p class="font-heading text-2xl font-extrabold text-gray-900">Resumen</p>
              <p class="text-sm text-gray-600">Antes de continuar revisa la información</p>
            </div>

            <div class="lab-foto">Fiat Mobi 1.0 · foto 1 de 3</div>

            <div class="grid grid-cols-2 gap-2 px-5 pt-4 text-sm">
              <div class="flex flex-col">
                <div class="mb-2 h-1 w-10 rounded-full bg-red-600"></div>
                <div class="font-heading text-sm font-bold text-red-700">Gama C</div>
                <div class="font-bold leading-tight">Compacto mecánico</div>

                <div class="my-2">
                  <div class="font-bold text-red-700">Recogida:</div>
                  <div>Bogotá Aeropuerto</div>
                  <div>Fecha 10 de agosto de 2026</div>
                  <div>Hora 10:00 a. m.</div>
                </div>
                <div class="mb-3">
                  <div class="font-bold text-red-700">Entrega:</div>
                  <div>Bogotá Aeropuerto</div>
                  <div>Fecha 13 de agosto de 2026</div>
                  <div>Hora 10:00 a. m.</div>
                </div>
                <div>
                  <div class="font-bold text-red-700">Alquiler:</div>
                  <div>3 días</div>
                  <div>Kilometraje ilimitado</div>
                  <div>Con Seguro básico</div>
                </div>
              </div>

              <div class="flex flex-col text-sm">
                <div class="text-right text-sm font-bold">Tarifa Diaria</div>
                <div class="text-right text-sm text-black line-through">$ 249.000</div>
                <div class="text-right">
                  <span class="inline-block rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">Dto Hoy 48 %</span>
                </div>
                <div class="text-right text-sm">$ 128.721</div>

                <div class="mt-3 text-right leading-tight">
                  <div class="text-sm font-bold">Total renta</div>
                  <div class="!text-xl !leading-none font-extrabold text-red-700">$ 386.164</div>
                </div>
                <div class="text-right text-[10px] text-gray-500">No incluye IVA ni tasa admin</div>
              </div>
            </div>

            <div class="lab-panel-foot">
              <span class="lab-boton-gris">Volver</span>
              <span class="lab-boton-rojo">Siguiente ›</span>
            </div>
          </div>

          <p class="mt-3 text-sm text-red-700">
            Cierra en $ 386.164 — $ 119.324 menos que la card, y con una advertencia.
          </p>
        </section>

        <!-- ============ 1 · Espejo del recibo (recomendada) ============ -->
        <section class="w-[420px]">
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900 flex items-center gap-2">
              1 · Espejo del recibo
              <span class="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-700">recomendada</span>
            </h2>
            <p class="text-sm text-gray-600">Misma escalera de precios que la card, en una columna.</p>
          </header>

          <div class="lab-panel">
            <div class="lab-panel-head">
              <p class="font-heading text-2xl font-extrabold text-gray-900">Resumen</p>
              <p class="text-sm text-gray-600">Antes de continuar revisa la información</p>
            </div>

            <div class="lab-foto">Fiat Mobi 1.0 · foto 1 de 3</div>

            <div class="px-5 pt-4">
              <p class="font-heading text-lg font-extrabold text-gray-900">Compacto mecánico</p>
              <p class="text-sm text-gray-600">Grupo C (Económico) · 3 días · Kilometraje ilimitado</p>
            </div>

            <!-- Cuándo y dónde: mismo patrón concepto | valor que los precios -->
            <div class="mx-5 mt-4 border-t border-gray-200 pt-3">
              <div class="fila-tarifa">
                <span class="text-sm text-gray-600">Recoges</span>
                <span class="valor-tarifa text-sm font-bold">10 ago 2026 · 10:00 a. m.</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm text-gray-600"></span>
                <span class="valor-tarifa text-sm">Bogotá Aeropuerto</span>
              </div>
              <div class="fila-tarifa mt-2">
                <span class="text-sm text-gray-600">Entregas</span>
                <span class="valor-tarifa text-sm font-bold">13 ago 2026 · 10:00 a. m.</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm text-gray-600"></span>
                <span class="valor-tarifa text-sm">Bogotá Aeropuerto</span>
              </div>
            </div>

            <!-- Escalera idéntica a la card -->
            <div class="contenedor-tarifas sutil-fondo mt-4">
              <div class="fila-tarifa">
                <span class="text-sm">Tarifa Diaria</span>
                <span class="valor-tarifa precio-base-diario">$ 249.000</span>
              </div>
              <div class="fila-tarifa">
                <span class="porcentaje-descuento">Hoy con 48% Dto.</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Básico</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 386.164</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 119.325</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 505.488</span>
              </div>
              <p class="texto-no-incluye">Precio final, todo incluido</p>
            </div>

            <div class="lab-panel-foot">
              <span class="lab-boton-gris">Volver</span>
              <span class="lab-boton-verde">Siguiente ›</span>
            </div>
          </div>

          <p class="mt-3 text-sm text-gray-600">
            El número con el que llegó es el número que ve. Lee de arriba abajo:
            qué carro, cuándo, cuánto.
          </p>
        </section>

        <!-- ============ 2 · El total primero ============ -->
        <section class="w-[420px]">
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">2 · El total primero</h2>
            <p class="text-sm text-gray-600">La cifra final arriba; el desglose debajo, para quien lo busque.</p>
          </header>

          <div class="lab-panel">
            <div class="lab-panel-head">
              <p class="font-heading text-2xl font-extrabold text-gray-900">Resumen</p>
              <p class="text-sm text-gray-600">Antes de continuar revisa la información</p>
            </div>

            <div class="lab-foto">Fiat Mobi 1.0 · foto 1 de 3</div>

            <div class="px-5 pt-4">
              <p class="font-heading text-lg font-extrabold text-gray-900">Compacto mecánico</p>
              <p class="text-sm text-gray-600">Grupo C (Económico) · 3 días · Kilometraje ilimitado</p>
            </div>

            <!-- El total, arriba y grande -->
            <div class="mx-5 mt-4 rounded-lg bg-gray-100 px-4 py-3">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 505.488</span>
              </div>
              <p class="texto-no-incluye">Precio final, todo incluido</p>
            </div>

            <div class="mx-5 mt-4 border-t border-gray-200 pt-3">
              <div class="fila-tarifa">
                <span class="text-sm text-gray-600">Recoges</span>
                <span class="valor-tarifa text-sm font-bold">10 ago 2026 · 10:00 a. m.</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm text-gray-600"></span>
                <span class="valor-tarifa text-sm">Bogotá Aeropuerto</span>
              </div>
              <div class="fila-tarifa mt-2">
                <span class="text-sm text-gray-600">Entregas</span>
                <span class="valor-tarifa text-sm font-bold">13 ago 2026 · 10:00 a. m.</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm text-gray-600"></span>
                <span class="valor-tarifa text-sm">Bogotá Aeropuerto</span>
              </div>
            </div>

            <div class="contenedor-tarifas sutil-fondo mt-4">
              <p class="mb-1 text-sm font-bold text-gray-700">Cómo se compone</p>
              <div class="fila-tarifa">
                <span class="text-sm">Tarifa Diaria</span>
                <span class="valor-tarifa precio-base-diario">$ 249.000</span>
              </div>
              <div class="fila-tarifa">
                <span class="porcentaje-descuento">Hoy con 48% Dto.</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Básico</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 386.164</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 119.325</span>
              </div>
            </div>

            <div class="lab-panel-foot">
              <span class="lab-boton-gris">Volver</span>
              <span class="lab-boton-verde">Siguiente ›</span>
            </div>
          </div>

          <p class="mt-3 text-sm text-gray-600">
            Menos scroll hasta la cifra. A cambio, el desglose queda debajo del
            pliegue y se lee como letra pequeña.
          </p>
        </section>

      </div>

      <p class="mt-8 max-w-3xl text-sm text-gray-600">
        Las tres llevan el mismo carro y las mismas fechas. La diferencia está en
        con qué número se queda el cliente y en si tiene que buscarlo.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ colorMode: 'light' })
useSeoMeta({ robots: 'noindex, nofollow', title: 'Lab · resumen de reserva' })
</script>

<style scoped>
/* Tailwind v4: @apply in a scoped block resolves utilities only when the theme
   is referenced explicitly; without this line `nuxt build` fails on rounded-xl —
   el de la marca ENTERA, no sólo el de esta página de laboratorio. */
@reference "~/assets/css/main.css";

/* Chrome del slideover, solo para que la comparación se vea en su ancho real. */
.lab-panel {
  @apply flex flex-col overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-200;
}

.lab-panel-head {
  @apply px-5 pt-5 pb-2;
}

.lab-foto {
  @apply mx-5 flex h-40 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-600;
}

.lab-panel-foot {
  @apply mt-5 flex gap-2 border-t border-gray-200 p-4;
}

.lab-boton-gris {
  @apply flex-1 rounded-lg bg-gray-100 py-3 text-center text-sm font-bold text-gray-900;
}

.lab-boton-rojo {
  @apply flex-1 rounded-lg bg-red-700 py-3 text-center text-sm font-bold text-white;
}

.lab-boton-verde {
  @apply flex-1 rounded-lg bg-green-700 py-3 text-center text-sm font-bold text-white;
}
</style>
