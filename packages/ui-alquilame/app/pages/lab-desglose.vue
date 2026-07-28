<template>
  <!--
    BORRAR antes de mergear. Mockup del bloque de precios de la card de
    resultados. Se eligió la disposición C (precio final "todo incluido" sin la
    lista larga). Aquí se compara SOLO la redacción del badge de descuento: hoy
    dice "Dto hoy 48%" — abreviatura poco clara — y se prueban alternativas.

    Markup plano a propósito (como lab-tarifas.vue): las cuatro tarjetas repiten
    el bloque para que cada literal (badge, montos) viva en el fuente. Usan el
    CSS REAL de la card y las MISMAS cifras de ejemplo (consistentes: el diario
    $128.721 = (vehículo $311.163 + seguro $75.000)/3; total = subtotal $560.163
    + impuestos $130.231). Cifras de EJEMPLO.
  -->
  <div class="min-h-screen bg-surface-soft py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="font-heading text-3xl font-extrabold text-gray-900">
        Opción C — ¿cómo decimos el descuento?
      </h1>
      <p class="mt-2 text-gray-700 max-w-3xl">
        Disposición C elegida (precio final, todo incluido). El badge actual dice
        <strong>“Dto hoy 48%”</strong>: “Dto” es abreviatura y no dice de qué es
        el descuento. Misma tarjeta, cambia solo el texto del badge.
        <strong>Cifras de ejemplo.</strong>
      </p>

      <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 items-start">

        <!-- ============ ACTUAL (referencia) ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">Actual</h2>
            <p class="text-sm text-gray-600">Lo que hay hoy.</p>
          </header>
          <div class="categoria" data-variante="compacto">
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
                <span class="porcentaje-descuento" data-badge="actual">Dto hoy 48%</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Básico</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">+ Retorno otra sede</span>
                <span class="valor-tarifa text-sm">$ 174.000</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm" data-monto="subtotal">$ 560.163</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm" data-monto="impuestos">$ 130.231</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total" data-monto="total">$ 690.394</span>
              </div>
              <p class="texto-no-incluye text-right">Precio final, todo incluido</p>
            </div>
          </div>
        </section>

        <!-- ============ 1 · Ahorras (recomendada) ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900 flex items-center gap-2">
              1 · Ahorras
              <span class="text-xs font-bold text-green-700 bg-green-500/20 px-2 py-0.5 rounded-full">recomendada</span>
            </h2>
            <p class="text-sm text-gray-600">Verbo directo; se entiende sin pensar.</p>
          </header>
          <div class="categoria" data-variante="compacto">
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
                <span class="porcentaje-descuento" data-badge="alt-ahorras">Ahorras 48%</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Básico</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">+ Retorno otra sede</span>
                <span class="valor-tarifa text-sm">$ 174.000</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 560.163</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 130.231</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 690.394</span>
              </div>
              <p class="texto-no-incluye text-right">Precio final, todo incluido</p>
            </div>
          </div>
        </section>

        <!-- ============ 2 · Descuento completo ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">2 · Descuento completo</h2>
            <p class="text-sm text-gray-600">Sin abreviar; ocupa más ancho.</p>
          </header>
          <div class="categoria" data-variante="compacto">
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
                <span class="porcentaje-descuento" data-badge="alt-descuento">48% de descuento</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Básico</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">+ Retorno otra sede</span>
                <span class="valor-tarifa text-sm">$ 174.000</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 560.163</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 130.231</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 690.394</span>
              </div>
              <p class="texto-no-incluye text-right">Precio final, todo incluido</p>
            </div>
          </div>
        </section>

        <!-- ============ 3 · Menos, con signo ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">3 · Menos, con signo</h2>
            <p class="text-sm text-gray-600">Compacto; el signo lee “rebaja”.</p>
          </header>
          <div class="categoria" data-variante="compacto">
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
                <span class="porcentaje-descuento" data-badge="alt-menos">−48% hoy</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Básico</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">+ Retorno otra sede</span>
                <span class="valor-tarifa text-sm">$ 174.000</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 560.163</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 130.231</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 690.394</span>
              </div>
              <p class="texto-no-incluye text-right">Precio final, todo incluido</p>
            </div>
          </div>
        </section>

        <!-- ============ 4 · Frase completa (idea del usuario) ============ -->
        <section>
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">4 · Frase completa</h2>
            <p class="text-sm text-gray-600">Tu idea: el descuento como frase, no abreviado.</p>
          </header>
          <div class="categoria" data-variante="compacto">
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
                <span class="porcentaje-descuento" data-badge="alt-frase">Hoy con 48% de descuento</span>
                <span class="valor-tarifa precio-diario">$ 128.721</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Seguro Básico</span>
                <span class="valor-tarifa text-sm text-gray-500">incluido</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">+ Retorno otra sede</span>
                <span class="valor-tarifa text-sm">$ 174.000</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal 3 días</span>
                <span class="valor-tarifa text-sm">$ 560.163</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ 130.231</span>
              </div>
              <hr class="separador-tarifa">
              <div class="fila-tarifa">
                <span class="dias-reservados">Total a pagar</span>
                <span class="valor-tarifa precio-total">$ 690.394</span>
              </div>
              <p class="texto-no-incluye text-right">Precio final, todo incluido</p>
            </div>
          </div>
        </section>

      </div>

      <p class="mt-8 text-sm text-gray-600 max-w-3xl">
        El fondo verde y el $ 249.000 tachado al lado ya dicen “esto bajó”; el
        badge solo tiene que nombrar cuánto. <strong>“Ahorras 48%”</strong> es la
        más corta que se entiende sola; “48% de descuento” es la más explícita
        pero la más ancha (ojo en móvil).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ colorMode: 'light' })
useSeoMeta({ robots: 'noindex, nofollow', title: 'Lab · badge de descuento' })
</script>
