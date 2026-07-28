<template>
  <!--
    BORRAR antes de mergear. Comparativa del selector de kilometraje en la card
    MENSUAL. Markup plano a propósito (como lab-desglose.vue / lab-resumen.vue):
    los literales viven en el fuente y usa el CSS REAL de la card
    (.categoria, .fila-tarifa, .valor-tarifa, .precio-total…).

    Cifras REALES medidas el 2026-07-26 en /reservas con búsqueda de 30 días
    (Bogotá Aeropuerto, 10 ago → 9 sep 2026):

      Gama C   1.000 kms 3.806.000 · 2.000 kms 4.252.000 · salto 446.000
      Gama CX  1.000 kms 4.166.000 · 2.000 kms 4.613.000 · salto 447.000

    El salto sale de month_prices['2k_kms'] − month_prices['1k_kms'].
    Dato: 3k_kms vale lo MISMO que 2k_kms en las 7 gamas (nivel muerto).

    Cada columna va al ancho real de la card (384px) para que la comparación no
    mienta.
  -->
  <div class="min-h-screen bg-surface-soft py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="font-heading text-3xl font-extrabold text-gray-900">
        Kilometraje mensual — selector vs. servicio adicional
      </h1>
      <p class="mt-2 max-w-3xl text-gray-800">
        Gama C, 30 días. Hoy el cliente ve dos precios completos y tiene que
        restar de cabeza para saber qué cuesta el kilometraje extra. La propuesta
        escribe ese costo.
      </p>

      <div class="mt-10 flex flex-wrap gap-8 items-start">

        <!-- ================= A · ACTUAL ================= -->
        <section style="width: 384px">
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">A · Actual</h2>
            <p class="text-sm text-gray-700">Selector propio sobre los adicionales.</p>
          </header>

          <div class="categoria flex flex-col">
            <div class="lab-foto">Fiat Mobi 1.0 · foto 1 de 3</div>

            <div class="px-5 pt-4">
              <span class="descripcion-corta">Compacto mecánico</span>
              <span class="fila-etiquetas-grupo">
                <span class="categoria-carro">Grupo C (Económico)</span>
              </span>
            </div>

            <div class="contenedor-tarifas sutil-fondo">
              <div class="contenedor-precios-tarifa">
                <div class="fila-tarifa">
                  <span class="text-sm">Tarifa Diaria</span>
                  <span class="valor-tarifa precio-base-diario">$ 220.000</span>
                </div>
                <div class="fila-tarifa">
                  <span class="porcentaje-descuento">Hoy con 42% Dto.</span>
                  <span class="valor-tarifa precio-diario">$ 126.867</span>
                </div>
                <div class="fila-tarifa">
                  <span class="text-sm">Seguro Básico</span>
                  <span class="valor-tarifa text-sm text-gray-500">incluido</span>
                </div>

                <hr class="separador-tarifa">

                <div class="fila-tarifa">
                  <span class="dias-reservados">Total 30 días</span>
                  <span class="valor-tarifa precio-total">$ 3.806.000</span>
                </div>
                <p class="texto-no-incluye">Incluye IVA y tasa admin</p>
              </div>

              <hr class="separador-tarifa">

              <div>
                <p class="font-bold my-1">Escoge kilometraje:</p>
                <div class="flex gap-6 text-sm">
                  <label class="flex items-center gap-2"><span class="lab-radio lab-radio-on"></span>1000 kms</label>
                  <label class="flex items-center gap-2"><span class="lab-radio"></span>2000 kms</label>
                </div>
              </div>
            </div>

            <div class="lab-adicionales">
              <p class="text-center font-bold py-3">Servicios adicionales</p>
              <ul class="px-5 pb-4 space-y-2 text-sm">
                <li class="flex items-center gap-2"><span class="lab-check"></span>Seguro Total 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Conductor adicional 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Silla para bebe 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Lavado del vehículo</li>
              </ul>
            </div>
          </div>

          <p class="mt-3 text-sm text-gray-700">
            Para saber qué cuesta el salto hay que restar
            <strong>4.252.000 − 3.806.000</strong>. Nadie lo hace.
          </p>
        </section>

        <!-- ================= B · PROPUESTA (sin marcar) ================= -->
        <section style="width: 384px">
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">B · Propuesta, sin marcar</h2>
            <p class="text-sm text-gray-700">Un extra más, con su precio escrito.</p>
          </header>

          <div class="categoria flex flex-col">
            <div class="lab-foto">Fiat Mobi 1.0 · foto 1 de 3</div>

            <div class="px-5 pt-4">
              <span class="descripcion-corta">Compacto mecánico</span>
              <span class="fila-etiquetas-grupo">
                <span class="categoria-carro">Grupo C (Económico)</span>
              </span>
            </div>

            <div class="contenedor-tarifas sutil-fondo">
              <div class="contenedor-precios-tarifa">
                <div class="fila-tarifa">
                  <span class="text-sm">Tarifa Diaria</span>
                  <span class="valor-tarifa precio-base-diario">$ 220.000</span>
                </div>
                <div class="fila-tarifa">
                  <span class="porcentaje-descuento">Hoy con 42% Dto.</span>
                  <span class="valor-tarifa precio-diario">$ 126.867</span>
                </div>
                <div class="fila-tarifa">
                  <span class="text-sm">Seguro Básico</span>
                  <span class="valor-tarifa text-sm text-gray-500">incluido</span>
                </div>
                <div class="fila-tarifa">
                  <span class="text-sm">1.000 kilómetros</span>
                  <span class="valor-tarifa text-sm text-gray-500">incluidos</span>
                </div>

                <hr class="separador-tarifa">

                <div class="fila-tarifa">
                  <span class="dias-reservados">Total 30 días</span>
                  <span class="valor-tarifa precio-total">$ 3.806.000</span>
                </div>
                <p class="texto-no-incluye">Incluye IVA y tasa admin</p>
              </div>
            </div>

            <div class="lab-adicionales">
              <p class="text-center font-bold py-3">Servicios adicionales</p>
              <ul class="px-5 pb-4 space-y-2 text-sm">
                <li class="flex items-center gap-2 lab-destacado">
                  <span class="lab-check"></span>1.000 kilómetros adicionales <span class="text-gray-500">(2.000 en total)</span>
                </li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Seguro Total 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Conductor adicional 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Silla para bebe 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Lavado del vehículo</li>
              </ul>
            </div>
          </div>

          <p class="mt-3 text-sm text-gray-700">
            El bloque "Escoge kilometraje" desaparece del precio. El kilometraje
            vigente se lee como una fila más del desglose.
          </p>
        </section>

        <!-- ================= C · PROPUESTA (marcada) ================= -->
        <section style="width: 384px">
          <header class="mb-3">
            <h2 class="font-heading text-lg font-extrabold text-gray-900">C · Propuesta, marcada</h2>
            <p class="text-sm text-gray-700">El salto entra en la escalera y en el total.</p>
          </header>

          <div class="categoria flex flex-col">
            <div class="lab-foto">Fiat Mobi 1.0 · foto 1 de 3</div>

            <div class="px-5 pt-4">
              <span class="descripcion-corta">Compacto mecánico</span>
              <span class="fila-etiquetas-grupo">
                <span class="categoria-carro">Grupo C (Económico)</span>
              </span>
            </div>

            <div class="contenedor-tarifas sutil-fondo">
              <div class="contenedor-precios-tarifa">
                <div class="fila-tarifa">
                  <span class="text-sm">Tarifa Diaria</span>
                  <span class="valor-tarifa precio-base-diario">$ 220.000</span>
                </div>
                <div class="fila-tarifa">
                  <span class="porcentaje-descuento">Hoy con 42% Dto.</span>
                  <span class="valor-tarifa precio-diario">$ 126.867</span>
                </div>
                <div class="fila-tarifa">
                  <span class="text-sm">Seguro Básico</span>
                  <span class="valor-tarifa text-sm text-gray-500">incluido</span>
                </div>
                <div class="fila-tarifa">
                  <span class="text-sm">1.000 kilómetros</span>
                  <span class="valor-tarifa text-sm text-gray-500">incluidos</span>
                </div>
                <div class="fila-tarifa">
                  <span class="text-sm">+ 1.000 kilómetros adicionales</span>
                  <span class="valor-tarifa text-sm">$ 446.000</span>
                </div>

                <hr class="separador-tarifa">

                <div class="fila-tarifa">
                  <span class="dias-reservados">Total 30 días</span>
                  <span class="valor-tarifa precio-total">$ 4.252.000</span>
                </div>
                <p class="texto-no-incluye">Incluye IVA y tasa admin</p>
              </div>
            </div>

            <div class="lab-adicionales">
              <p class="text-center font-bold py-3">Servicios adicionales</p>
              <ul class="px-5 pb-4 space-y-2 text-sm">
                <li class="flex items-center gap-2 lab-destacado">
                  <span class="lab-check lab-check-on"></span>1.000 kilómetros adicionales <span class="text-gray-500">(2.000 en total)</span>
                </li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Seguro Total 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Conductor adicional 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Silla para bebe 30 días</li>
                <li class="flex items-center gap-2"><span class="lab-check"></span>Lavado del vehículo</li>
              </ul>
            </div>
          </div>

          <p class="mt-3 text-sm text-gray-700">
            3.806.000 + 446.000 = <strong>4.252.000</strong>. Cuadra a la vista, sin restar.
          </p>
        </section>
      </div>

      <div class="mt-12 max-w-3xl text-gray-800">
        <h2 class="font-heading text-xl font-extrabold text-gray-900">Lo que hay que decidir</h2>
        <p class="mt-2">
          El kilometraje <strong>no es aditivo</strong>: no se suma al precio base, lo
          reemplaza. Por eso su línea va arriba, junto a "+ Seguro Total", y no
          abajo con Conductor/Silla/Lavado, que sí se suman después del total. Si
          va abajo, el total se cuenta dos veces.
        </p>
        <p class="mt-3">
          Y el encuadre cambia la percepción: <em>"1.000 kms adicionales por $ 446.000"</em>
          se siente más caro que <em>"2.000 kms por $ 4.252.000"</em>, aunque sea la
          misma plata. Si el objetivo es vender más plan alto, esta propuesta puede
          jugar en contra.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Página de laboratorio: sin lógica, sin datos. Solo maqueta con el CSS real.
useHead({ title: 'Lab · kilometraje mensual' });
</script>

<style scoped>
.lab-foto {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  background: #e6e8ee;
  color: #5b6070;
  font-size: 13px;
}

.lab-adicionales {
  border-top: 1px solid rgb(209 213 219 / 0.7);
}

.lab-radio {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  border: 1px solid #9aa0ac;
  display: inline-block;
}

.lab-radio-on {
  border: 4px solid #111827;
}

.lab-check {
  width: 15px;
  height: 15px;
  border-radius: 4px;
  border: 1px solid #9aa0ac;
  display: inline-block;
  flex: none;
}

.lab-check-on {
  background: #15803d;
  border-color: #15803d;
}

.lab-destacado {
  outline: 2px dashed #15803d;
  outline-offset: 4px;
  border-radius: 4px;
}
</style>
