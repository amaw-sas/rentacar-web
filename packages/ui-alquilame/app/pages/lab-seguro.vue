<template>
  <!--
    BORRAR antes de mergear. Mockup: mover "Seguro Total" del bloque "Escoge
    protección" (dos radios) a un toggle dentro de "Servicios adicionales". El
    Seguro Básico queda siempre incluido (ya se ve en el desglose C); la única
    decisión es subir a Total, así que va como extra opcional.

    OJO para la implementación real: la sección "Escoge protección" también
    contiene el selector de kilometraje mensual — ese se queda. Y el precio del
    upgrade: hoy los radios de seguro NO muestran precio (el total se recalcula).
    Dos variantes abajo, A con sobrecosto visible y B sin precio aparte.

    CSS real de la card, cifras de ejemplo (con Total: +$150.000; el resto sale
    del desglose C aprobado).
  -->
  <div class="min-h-screen bg-surface-soft py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="font-heading text-3xl font-extrabold text-gray-900">
        Seguro Total como adicional
      </h1>
      <p class="mt-2 text-gray-700 max-w-3xl">
        Sin bloque “Escoge protección”. El Básico va incluido; el Total es un
        toggle en “Servicios adicionales”. La diferencia entre A y B es cómo se
        muestra el sobrecosto. <strong>Cifras de ejemplo.</strong>
      </p>

      <div class="mt-10 grid gap-8 sm:grid-cols-2 items-start">

        <!-- ============ A · con sobrecosto visible ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">A · Con sobrecosto</h2>
            <p class="text-sm text-gray-600">
              El upgrade muestra “+$” como los demás adicionales; el total sube.
            </p>
          </header>
          <div class="categoria" data-variante="con-precio">
            <div class="px-5 pt-4">
              <p class="descripcion-corta">Compacto mecánico</p>
              <p class="categoria-carro">Grupo C (Económico)</p>
            </div>
            <div class="contenedor-tarifas sutil-fondo">
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
                <span class="text-sm">+ Seguro Total (3 días)</span>
                <span class="valor-tarifa text-sm">$ 150.000</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 710.163</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 165.231</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 875.394</span>
              </div>
              <p class="texto-no-incluye text-right">Precio final, todo incluido</p>
            </div>

            <!-- Servicios adicionales (abierto para el mockup) -->
            <div class="border-t border-gray-200">
              <div class="px-5 py-3 text-center">
                <span class="roboto-bold text-lg text-gray-700">Servicios adicionales</span>
              </div>
              <div class="flex flex-col gap-2 px-5 pb-4">
                <label class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <input type="checkbox" checked class="form-checkbox accent-green-600">
                    Seguro Total (3 días)
                  </span>
                  <span class="text-sm">$ 150.000</span>
                </label>
                <label class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <input type="checkbox" class="form-checkbox accent-green-600">
                    Conductor adicional (3 días)
                  </span>
                </label>
                <label class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <input type="checkbox" class="form-checkbox accent-green-600">
                    Silla para bebé (3 días)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- ============ B · sin precio aparte ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">B · Sin precio aparte</h2>
            <p class="text-sm text-gray-600">
              Como hoy: el toggle no muestra “+$”, la línea pasa a “Seguro Total” y
              el total se recalcula.
            </p>
          </header>
          <div class="categoria" data-variante="sin-precio">
            <div class="px-5 pt-4">
              <p class="descripcion-corta">Compacto mecánico</p>
              <p class="categoria-carro">Grupo C (Económico)</p>
            </div>
            <div class="contenedor-tarifas sutil-fondo">
              <div class="fila-tarifa">
                <span class="text-sm">Tarifa Diaria</span>
                <span class="valor-tarifa precio-base-diario">$ 249.000</span>
              </div>
              <div class="fila-tarifa">
                <span class="porcentaje-descuento">Hoy con 48% Dto.</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Total</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 710.163</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 165.231</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 875.394</span>
              </div>
              <p class="texto-no-incluye text-right">Precio final, todo incluido</p>
            </div>

            <div class="border-t border-gray-200">
              <div class="px-5 py-3 text-center">
                <span class="roboto-bold text-lg text-gray-700">Servicios adicionales</span>
              </div>
              <div class="flex flex-col gap-2 px-5 pb-4">
                <label class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <input type="checkbox" checked class="form-checkbox accent-green-600">
                    Seguro Total
                  </span>
                  <span class="text-sm text-gray-500">sube el total</span>
                </label>
                <label class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <input type="checkbox" class="form-checkbox accent-green-600">
                    Conductor adicional (3 días)
                  </span>
                </label>
                <label class="flex items-center justify-between">
                  <span class="flex items-center gap-2">
                    <input type="checkbox" class="form-checkbox accent-green-600">
                    Silla para bebé (3 días)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

      </div>

      <p class="mt-8 text-sm text-gray-600 max-w-3xl">
        En reserva mensual, el selector de <strong>kilometraje</strong> (1000/2000
        kms) sigue donde está; solo se van los dos radios de seguro. La opción A es
        más transparente (ves el sobrecosto); la B calca el comportamiento actual
        (el seguro nunca mostró precio suelto).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ colorMode: 'light' })
useSeoMeta({ robots: 'noindex, nofollow', title: 'Lab · seguro como adicional' })
</script>
