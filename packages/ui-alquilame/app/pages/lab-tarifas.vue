<template>
  <!--
    BORRAR antes de mergear. Página de comparación para decidir el layout del
    bloque de precios de la card de resultados: las tres variantes usan el CSS
    REAL (`.categoria` de assets/css/rentacar-main/category.css) y las mismas
    cifras, así que lo único que cambia entre ellas es la disposición. Los radios
    son estáticos — aquí no hay lógica de reserva, solo forma.
  -->
  <div class="min-h-screen bg-surface-soft py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="font-heading text-3xl font-extrabold text-gray-900">
        Bloque de precios — tres disposiciones
      </h1>
      <p class="mt-2 text-gray-700 max-w-2xl">
        Mismos datos, mismo CSS de la card. Cambia solo cómo se ordenan.
        Redimensiona la ventana para ver el comportamiento en angosto.
      </p>

      <div class="mt-10 grid gap-8 lg:grid-cols-3 items-start">
        <!-- ============ A · lo que hay hoy ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">A · Actual</h2>
            <p class="text-sm text-gray-600">Dos columnas: precios | protección.</p>
          </header>

          <div class="categoria" data-variante="actual">
            <div class="contenedor-tarifas sutil-fondo">
              <div class="contenedor-precios-tarifa con-borde-difuminado">
                <p class="text-sm">Tarifa Diaria</p>
                <p class="precio-base-diario">$ 369.000</p>
                <div class="porcentaje-descuento">Dto hoy 47%</div>
                <p class="precio-diario">$ 194.726</p>
                <p class="dias-reservados">Total 5 días</p>
                <p class="precio-total">$ 973.629</p>
                <p class="texto-no-incluye">No incluye IVA ni tasa admin</p>
              </div>

              <div class="pl-5 flex flex-col justify-center">
                <div>
                  <p class="body-lg mb-1">Escoge protección</p>
                  <div class="flex flex-col justify-start">
                    <div class="opcion-seleccionable">
                      <input type="radio" class="form-radio" name="cob-a" checked>
                      <label>Seguro Básico</label>
                    </div>
                    <div class="opcion-seleccionable">
                      <input type="radio" class="form-radio" name="cob-a">
                      <label>Seguro Total</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ============ B · una sola columna ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">B · Una columna</h2>
            <p class="text-sm text-gray-600">
              Todo apilado a la izquierda, separado por reglas finas.
            </p>
          </header>

          <div class="categoria" data-variante="una-columna">
            <div class="sutil-fondo px-5 py-4 text-gray-800">
              <p class="text-sm">Tarifa Diaria</p>
              <p class="flex items-center gap-2">
                <span class="precio-base-diario">$ 369.000</span>
                <span class="porcentaje-descuento">Dto hoy 47%</span>
              </p>
              <p class="precio-diario">$ 194.726</p>

              <hr class="my-3 border-gray-300/70">

              <p class="dias-reservados !mt-0">Total 5 días</p>
              <p class="precio-total">$ 973.629</p>
              <p class="texto-no-incluye">No incluye IVA ni tasa admin</p>

              <hr class="my-3 border-gray-300/70">

              <p class="body-lg mb-1">Escoge protección</p>
              <div class="flex flex-col justify-start">
                <div class="opcion-seleccionable">
                  <input type="radio" class="form-radio" name="cob-b" checked>
                  <label>Seguro Básico</label>
                </div>
                <div class="opcion-seleccionable">
                  <input type="radio" class="form-radio" name="cob-b">
                  <label>Seguro Total</label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ============ C · descripción | precio ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">
              C · Descripción | precio
            </h2>
            <p class="text-sm text-gray-600">
              Concepto a la izquierda, cifra a la derecha. Protección a lo ancho.
            </p>
          </header>

          <div class="categoria" data-variante="dos-columnas">
            <div class="sutil-fondo px-5 py-4 text-gray-800">
              <div class="flex items-baseline justify-between gap-3">
                <span class="text-sm">Tarifa Diaria</span>
                <span class="precio-base-diario">$ 369.000</span>
              </div>
              <div class="flex items-center justify-between gap-3 mt-1">
                <span class="porcentaje-descuento">Dto hoy 47%</span>
                <span class="precio-diario">$ 194.726</span>
              </div>

              <hr class="my-3 border-gray-300/70">

              <div class="flex items-baseline justify-between gap-3">
                <span class="dias-reservados !mt-0">Total 5 días</span>
                <span class="precio-total">$ 973.629</span>
              </div>
              <p class="texto-no-incluye text-right">No incluye IVA ni tasa admin</p>

              <hr class="my-3 border-gray-300/70">

              <p class="body-lg mb-1">Escoge protección</p>
              <div class="grid grid-cols-2 gap-x-2">
                <div class="opcion-seleccionable">
                  <input type="radio" class="form-radio" name="cob-c" checked>
                  <label>Seguro Básico</label>
                </div>
                <div class="opcion-seleccionable">
                  <input type="radio" class="form-radio" name="cob-c">
                  <label>Seguro Total</label>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// BORRAR antes de mergear — superficie de decisión, no de producto.
definePageMeta({ colorMode: 'light' })

useSeoMeta({ robots: 'noindex, nofollow', title: 'Lab · bloque de precios' })
</script>
