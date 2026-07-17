<template>
  <div class="categoria flex flex-col">
    <!-- Carrusel -->
    <div class="carrusel">
        <Carrusel
          :models="categoryModels"
          :vehicleModels="modelos"
          :category="categoryCode"
          :priority="priority"
          @select="goNextStep"
        />
      </div>

    <!-- Contenido principal -->
    <div class="w-full">
      <!-- descripcion categoria -->
      <UCollapsible class="contenedor-descripcion-carro">
        <UButton
          class="boton-contenedor-descripcion-carro group"
          size="xl"
          :ui="{
            base: 'rounded-none',
            trailingIcon:
              'group-data-[state=open]:rotate-180 transition-transform duration-200',
          }"
        >
          <template #leading>
            <span class="text-left text-gray-700 items-center">
              <span class="categoria-carro">
                Grupo {{ categoryCode }} ({{ grupo }})
              </span>
              <span class="descripcion-corta">
                {{ vehicleCategory?.descripcion_corta }}
                <CategoryTags :category />
              </span>
            </span>
          </template>
        <template #trailing>
          <ChevronDownIcon cls="size-7" />
        </template>
        </UButton>
        <template #content>
          <div>
            <div class="px-4 py-0 text-sm">
              <p
                class="descripcion-larga"
                v-text="vehicleCategory?.descripcion_larga"
              ></p>
              <div id="etiquetas" class="contenedor-etiquetas">
                <span
                  v-for="tag in vehicleCategory?.tags"
                  :key="`tag-${tag}`"
                  v-text="tag"
                  class="etiqueta-carro"
                ></span>
              </div>
            </div>
          </div>
        </template>
      </UCollapsible>

      <!--==== ini cuerpo t1 ====-->
      <div class="contenedor-tarifas sutil-fondo">
        <!--==== columna izq t1====-->
        <div class="contenedor-precios-tarifa con-borde-difuminado">
          <!-- Issue #313: reserva mensual más allá del horizonte de tarifas no se
               cotiza (todas las cifras de precio son 0). Fail-closed: se reemplaza
               TODA la columna de precio por el estado inline — nunca un "$ 0"
               diario/total fabricado en una superficie visible. -->
          <template v-if="isMonthlyPriceUnavailable">
            <p class="precio-total" data-testid="category-unavailable-test">
              Tarifa no disponible para tu fecha
            </p>
            <p class="texto-no-incluye">Escríbenos y te cotizamos.</p>
          </template>
          <template v-else>
            <p class="text-sm">Tarifa Diaria</p>
            <p class="precio-base-diario">$ {{ currencyDailyBasePrice }}</p>
            <div class="porcentaje-descuento" v-if="hasDiscount()">
              Dto hoy {{ getDiscount }}%
            </div>
            <p class="precio-diario">$ {{ currencyDailyPrice }}</p>
            <p v-if="hasExtraHours()" class="text-sm">
              + {{ extraHoursQuantity }}
              {{ extraHoursQuantity > 1 ? "Horas" : "Hora" }} extra
            </p>
            <p v-if="hasExtraHours()" class="text-sm">
              $ {{ currencyExtraHoursPrice }}
            </p>
            <p v-if="hasReturnFee()" class="text-sm">+ Retorno otra sede</p>
            <p v-if="hasReturnFee()" class="text-sm">$ {{ currencyReturnFee }}</p>
            <p class="dias-reservados">
              Total {{ haveMonthlyReservation ? "30 días" : getFormattedDays }}
            </p>

            <UTooltip :open="totalPriceTooltipOpen" :delay-duration="tooltipOpenDelayMs" :content="{ onEscapeKeyDown: forceTotalPriceTooltipClose, onPointerDownOutside: forceTotalPriceTooltipClose }" :ui="{content: 'h-full select-text bg-white text-gray-900 shadow-lg border border-gray-200'}" @update:open="onTotalPriceTooltipOpenChange">
              <template #content>
                Día: $ {{ dayPriceTooltip }} <br />
                Seguro día: $ {{ coverageDayPriceTooltip }} <br />
                Tasa: $ {{ taxFeePriceTooltip }} <br />
                IVA: $ {{ ivaFeePriceTooltip }} <br />
                Total: $ {{ actualTotalPriceTooltip }} <br />
              </template>
              <ULink raw class="precio-total"> $ <span>{{currencyTotalPrice}}</span></ULink>
            </UTooltip>

            <!-- <div class="font-bold text-xl" style="white-space: nowrap;" v-text="currencyTotalPrice"></div> -->
            <p class="texto-no-incluye" v-if="haveMonthlyReservation">
              Incluye IVA y tasa admin
            </p>
            <p class="texto-no-incluye" v-else>No incluye IVA ni tasa admin</p>
          </template>
        </div>

        <!--==== columna der t1 ====-->
        <div class="pl-5 flex flex-col justify-center">
          <div>
            <p class="text-lg text-gray-700 mb-1">Escoge protección</p>

            <div class="flex flex-col justify-start">
              <div class="opcion-seleccionable">
                <input
                  :id="basicCoverageCheckboxID"
                  v-model="withTotalCoverage"
                  type="radio"
                  class="form-radio"
                  :name="coverageCheckboxName"
                  :value="false"
                />

                <label :for="basicCoverageCheckboxID">Seguro Básico</label>

                <UModal
                  :ui="modalUIConfig"
                  title="Seguro Básico"
                  description="Protección Obligatoria"
                >
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="Más información"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      Esta incluido en el valor de alquiler del vehículo y cubre
                      lo siguiente:
                    </p>
                    <p class="text-sm mb-4">
                      <b>Daños a terceros</b>: Cubre los daños materiales
                      causados a otras personas o propiedades en caso de un
                      accidente, el vehículo de otra persona o propiedades
                      dañadas.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Lesiones personales a terceros</b>: Cubre las lesiones
                      sufridas por otras personas involucradas en el accidente,
                      como peatones o ocupantes de otros vehículos.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Daños al vehículo alquilado</b>: En caso de daños o
                      pérdida total del vehículo, el Seguro Básico cubre la
                      mayor parte del costo de reparación o reposición, dejando
                      al arrendatario responsable solo de una participación
                      obligatoria que varía según la gama. entre $3.570.000 y
                      $4.760.000. Si el costo de reparación es menor a la
                      participación obligatoria, el arrendatario solo pagará el
                      valor real de la reparación.
                    </p>

                    <b class="text-sm mb-4">Ningún seguro cubre</b>
                    <p class="text-sm mb-4">
                      Pérdida de accesorios removibles del vehículo (radios,
                      espejos, farolas, entre otros), ni la pérdida documentos,
                      placas o llaves. Tampoco cubre multas de tránsito o
                      fotomultas generadas durante el período de alquiler
                    </p>
                  </template>
                </UModal>
              </div>
              <!-- Sin fila de pricing activa aplicable a la fecha no hay tarifa
                   de Seguro Total: se omite la opción (fallo visible) en vez de
                   cotizar una tarifa retirada o un upgrade $0. Issue #322 PR10. -->
              <div v-if="canQuoteTotalCoverage" class="opcion-seleccionable">
                <input
                  :id="totalCoverageCheckboxID"
                  v-model="withTotalCoverage"
                  type="radio"
                  class="form-radio"
                  :name="coverageCheckboxName"
                  :value="true"
                />

                <label :for="totalCoverageCheckboxID">Seguro Total</label>

                <UModal
                  :ui="modalUIConfig"
                  title="Seguro Total"
                  description="Protección Obligatoria"
                >
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="Más información"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      El Seguro Total es una opción adicional al Seguro Básico,
                      pero con beneficios ampliados:
                    </p>

                    <p class="text-sm mb-4">
                      <b>Daños a terceros Cobertura completa del vehículo</b>
                      Cubre el 100% de los daños al vehículo alquilado, ya sean
                      parciales o totales, por daño o robo.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Eliminación de la participación obligatoria</b> No
                      tendrás que pagar ningún valor adicional en caso de un
                      siniestro, ya que el seguro cubre la totalidad de los
                      daños sin ningún cargo extra, Este seguro te ofrece una
                      mayor tranquilidad al eliminar la responsabilidad
                      económica en caso de siniestro, asegurando que los daños
                      sean cubiertos completamente.
                    </p>
                    <p class="text-sm mb-4">
                      <b>No cubre</b> perdida de accesorios removibles del
                      vehículo (radios, espejos, farolas, entre otros), ni la
                      pérdida de documentos, placas o llaves. Tampoco cubre
                      multas de tránsito o fotomultas generadas durante el
                      período de alquiler.
                    </p>
                  </template>
                </UModal>
              </div>
            </div>

            <p v-if="haveMonthlyReservation" class="font-bold my-1">
              Escoge kilometraje:
            </p>

            <div
              v-if="haveMonthlyReservation"
              class="flex flex-col justify-start"
            >
              <!-- <URadioGroup
                  v-model="withMileage" 
                  size="sm"
                  :items="[{label: 'Kilometraje 1000 kms', value: '1k_kms'}, {label: 'Kilometraje 2000 kms', value: '2k_kms'}]"
                /> -->
              <div class="opcion-seleccionable">
                <input
                  :id="oneKmMileageCheckboxID"
                  v-model="withMileage"
                  type="radio"
                  class="form-radio"
                  :name="mileageCheckboxName"
                  value="1k_kms"
                />

                <label :for="oneKmMileageCheckboxID">1000 kms</label>

                <UModal :ui="modalUIConfig" title="1000 Kilómetros">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="informacion sobre kilometraje"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      Con nuestro plan de 1000 kilómetros incluidos, disfruta de
                      la libertad de recorrer largas distancias durante tu
                      viaje. Este plan es perfecto para explorar múltiples
                      destinos o realizar trayectos interurbanos cómodamente.
                    </p>
                    <b class="text-sm mb-4"> Ideal para viajes largos:</b>
                    <p class="text-sm mb-4">
                      1000 kilómetros te permiten moverte con tranquilidad y
                      aprovechar al máximo el vehículo.
                    </p>
                    <b class="text-sm mb-4">Kilómetros adicionales:</b>
                    <p class="text-sm mb-4">
                      Si superas el límite, el costo por kilómetro adicional es
                      de $2,300, que se cobrará al momento de retornar el auto.
                    </p>
                  </template>
                </UModal>
              </div>

              <div class="opcion-seleccionable">
                <input
                  :id="twoKmsMileageCheckboxID"
                  v-model="withMileage"
                  type="radio"
                  class="form-radio"
                  :name="mileageCheckboxName"
                  value="2k_kms"
                />

                <label :for="twoKmsMileageCheckboxID">2000 kms</label>

                <UModal :ui="modalUIConfig" title="2000 Kilómetros">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="informacion sobre kilometraje"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      Con nuestro plan de 2000 kilómetros incluidos, disfruta de
                      la libertad de recorrer largas distancias durante tu
                      viaje. Este plan es perfecto para explorar múltiples
                      destinos o realizar trayectos interurbanos cómodamente.
                    </p>
                    <b class="text-sm mb-4"> Ideal para viajes largos:</b>
                    <p class="text-sm mb-4">
                      2000 kilómetros te permiten moverte con tranquilidad y
                      aprovechar al máximo el vehículo.
                    </p>
                    <b class="text-sm mb-4">Kilómetros adicionales:</b>
                    <p class="text-sm mb-4">
                      Si superas el límite, el costo por kilómetro adicional es
                      de $2,300, que se cobrará al momento de retornar el auto.
                    </p>
                  </template>
                </UModal>
              </div>

              <div v-if="false" class="opcion-seleccionable">
                <input
                  :id="threeKmsMileageCheckboxID"
                  v-model="withMileage"
                  type="radio"
                  class="form-radio"
                  :name="mileageCheckboxName"
                  value="3k_kms"
                />

                <label :for="threeKmsMileageCheckboxID">3000 kms</label>

                <UModal :ui="modalUIConfig" title="2000 Kilómetros">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="informacion sobre kilometraje"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      Con nuestro plan de 2000 kilómetros incluidos, disfruta de
                      la libertad de recorrer largas distancias durante tu
                      viaje. Este plan es perfecto para explorar múltiples
                      destinos o realizar trayectos interurbanos cómodamente.
                    </p>
                    <b class="text-sm mb-4"> Ideal para viajes largos:</b>
                    <p class="text-sm mb-4">
                      2000 kilómetros te permiten moverte con tranquilidad y
                      aprovechar al máximo el vehículo.
                    </p>
                    <b class="text-sm mb-4">Kilómetros adicionales:</b>
                    <p class="text-sm mb-4">
                      Si superas el límite, el costo por kilómetro adicional es
                      de $2,300, que se cobrará al momento de retornar el auto.
                    </p>
                  </template>
                </UModal>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- adicionales cabezera t1-->

      <UCollapsible class="contenedor-adicionales-carro">
        <UButton
          class="boton-contenedor-adicionales-carro group"
          size="xl"
          :ui="{
            base: 'rounded-none',
            trailingIcon:
              'group-data-[state=open]:rotate-180 transition-transform duration-200 bg-black',
          }"
        >
          <template #trailing>
            <ChevronDownIcon cls="size-7" />
          </template>
          <template #leading>
            <!-- Contenedor del texto centrado horizontalmente -->
            <span class="flex-1 text-center">
              <span class="roboto-bold text-lg text-gray-700"
                >Servicios adicionales</span
              >
            </span>
          </template>
        </UButton>
        <template #content>
          <div class="flex flex-col gap-1 px-5 pt-3 pb-4 adicionales-contenido">
            <div class="flex items-center justify-between">
              <div class="flex">
                <UCheckbox
                  v-model="withExtraDriver"
                  color="success"
                  class="opcion-seleccionable"
                >
                  <template #label>
                    Conductor adicional {{ getFormattedDays }}
                  </template>
                </UCheckbox>

                <UModal :ui="modalUIConfig" title="Conductor adicional">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="Más información"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      Si deseas que otra persona, además del titular del
                      contrato, esté autorizada para conducir el vehículo,
                      puedes incluir un conductor adicional. Este servicio es
                      opcional y garantiza que el conductor adicional cuente con
                      la cobertura del seguro necesaria para usar el vehículo.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Requisitos:</b><br />La reserva debe realizarse a
                      nombre del titular de la tarjeta de crédito.<br />
                      Tanto el titular como el conductor adicional deben
                      presentarse en la agencia para firmar el contrato.
                    </p>
                  </template>
                </UModal>
              </div>
              <span v-show="withExtraDriver" class="ml-4"
                >$ {{ currencyExtraDriverPrice }}</span
              >
            </div>

            <div class="flex items-center justify-between">
              <div class="flex">
                <UCheckbox v-model="withBabySeat" color="success" class="opcion-seleccionable">
                  <template #label>
                    Silla para bebe {{ getFormattedDays }}
                  </template>
                </UCheckbox>

                <UModal :ui="modalUIConfig" title="Silla para bebe">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="Más información"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      Para la seguridad de los más pequeños, ofrecemos sillas
                      para bebé como un servicio adicional opcional. Estas
                      sillas están diseñadas para cumplir con los estándares de
                      seguridad vial y garantizar un viaje cómodo y protegido
                      para los niños. Recuerda que es responsabilidad del
                      cliente devolver la silla en las mismas condiciones en que
                      fue entregada.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Disponibilidad:</b> Sujeto a reserva previa y bajo
                      disponibilidad de la agencia.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Tipos de sillas:</b> Contamos con diferentes modelos
                      adaptados a la edad y peso del niño.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Instalación:</b> Nuestro personal estará disponible
                      para ayudar con la instalación adecuada de la silla.
                    </p>
                  </template>
                </UModal>
              </div>
              <span v-show="withBabySeat" id="precio4" class="ml-4"
                >$ {{ currencyBabySeatPrice }}</span
              >
            </div>

            <div class="flex items-center justify-between">
              <div class="flex">
                <UCheckbox v-model="withWash" color="success" class="opcion-seleccionable">
                  <template #label> Lavado del vehículo </template>
                </UCheckbox>

                <UModal :ui="modalUIConfig" title="Lavado del Vehículo">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="Más información"
                    class="cursor-pointer"
                    :ui="questionButtonUIConfig"
                  >
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>

                  <template #body>
                    <p class="text-sm mb-4">
                      El servicio de lavado del vehículo es opcional, sin
                      embargo, es importante que el automóvil sea entregado en
                      las mismas condiciones de limpieza en las que fue
                      recibido. Este servicio está disponible tanto al momento
                      de hacer su reserva como al devolver el vehículo.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Tarifas:</b><br />Al recoger el vehiculo: $ {{ currencyWashPrice }} (IVA
                      incluido).<br />
                      Al devolver el vehículo: $ {{ currencyWashOnsitePrice }} (IVA incluido).
                    </p>
                    <p class="text-sm mb-4">
                      <b>Cobros adicionales:</b><br />
                      Se aplicarán tarifas especiales si el vehículo presenta
                      condiciones que requieren un lavado profundo, como:
                      Transporte de mascotas, Olor fuerte a cigarrillo o
                      alcohol, Exceso de barro debido a conducción en
                      condiciones adversas. En estos casos, las tarifas serán
                      las siguientes:
                    </p>
                    <p class="text-sm mb-4">
                      <b>Tarifas especiales:</b><br />
                      Lavado completo con aspirado: $ {{ currencyWashDeepPrice }} (IVA incluido).<br />
                      Lavado completo con aspirado y limpieza de tapicería:
                      $ {{ currencyWashDeepUpholsteryPrice }} (IVA incluido).<br />
                    </p>
                  </template>
                </UModal>
              </div>
              <span v-show="withWash" id="precio3" class="ml-4"
                >$ {{ currencyWashPrice }}</span
              >
            </div>
          </div>
        </template>
      </UCollapsible>

      <div class="seccion-boton-seleccion">
        <!-- Único método de pago (issue #124): info sobre el CTA, mismo fondo difuminado -->
        <div class="metodo-pago">
          <span class="metodo-pago-label">
            Único método de pago
            <UPopover :ui="{ content: 'bg-white ring-1 ring-gray-200' }">
              <UButton
                variant="ghost"
                color="neutral"
                size="xs"
                aria-label="Más información sobre el método de pago"
                class="cursor-pointer p-0 -my-1"
                :ui="questionButtonUIConfig"
              >
                <template #leading>
                  <InfoQuestionIcon cls="size-3.5 text-gray-400" />
                </template>
              </UButton>
              <template #content>
                <p class="max-w-[280px] p-3 text-sm font-normal text-gray-700">
                  El pago se realiza al recoger el vehículo en la sede, únicamente con tarjeta de crédito. No se acepta efectivo, Nequi u otros medios de pago.
                </p>
              </template>
            </UPopover>
          </span>
          <span class="metodo-pago-valor">Tarjeta de crédito en sede</span>
        </div>

        <UButton
          class="boton-seleccion"
          size="xl"
          :disabled="isMonthlyPriceUnavailable"
          data-testid="category-solicitar-test"
          @click.prevent="goNextStep()"
          >
          <template v-if="!isMonthlyPriceUnavailable" #trailing>
            <ChevronRightIcon cls="size-5" />
          </template>
          {{ isMonthlyPriceUnavailable ? 'Tarifa no disponible para tu fecha' : 'Solicitar este vehículo' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** imports */
import {
  IconsInfoQuestionIcon as InfoQuestionIcon,
  IconsChevronDownIcon as ChevronDownIcon,
  IconsChevronRightIcon as ChevronRightIcon
} from '#components';
import { defineAsyncComponent } from 'vue'
const Carrusel = defineAsyncComponent(() => import('./Carrusel.vue'))

/** types */
import type { CategoryProps } from '@rentacar-main/logic/utils';

/** props */
// `priority` es local a la card (LCP): NO se agrega al tipo compartido CategoryProps,
// se extiende por intersección. Solo la primera card lo recibe en true.
const props = withDefaults(defineProps<CategoryProps & { priority?: boolean }>(), {
  showButton: true,
  priority: false,
});

/** emits */
const emit = defineEmits<{
  selectedCategory: [category: ReturnType<typeof useCategory>];
}>();

/** stores — haveMonthlyReservation only for UI (mostrar bloque km) */
const { haveMonthlyReservation } = storeToRefs(useStoreReservationForm());

/** category composable */
const category: ReturnType<typeof useCategory> = useCategory(props.category);
const {
  coverageCheckboxName,
  basicCoverageCheckboxID,
  totalCoverageCheckboxID,
  mileageCheckboxName,
  oneKmMileageCheckboxID,
  twoKmsMileageCheckboxID,
  threeKmsMileageCheckboxID,
  canQuoteTotalCoverage,
  withTotalCoverage,
  withMileage,
  withExtraDriver,
  withBabySeat,
  withWash,
  extraHoursQuantity,
  extraHoursTotalAmount,
  categoryCode,
  categoryDescription,
  categoryModels,
  isMonthlyPriceUnavailable,
  currencyTotalPrice,
  currencyDailyPrice,
  currencyDailyBasePrice,
  currencyExtraHoursPrice,
  currencyReturnFee,
  getDiscount,
  getFormattedDays,
  isPicoyPlacaExempt,
  hasDiscount,
  hasExtraHours,
  hasReturnFee,
  currencyExtraDriverPrice,
  currencyBabySeatPrice,
  currencyWashPrice,
  currencyWashOnsitePrice,
  currencyWashDeepPrice,
  currencyWashDeepUpholsteryPrice,

  // tooltip stuff
  dayPriceTooltip,
  coverageDayPriceTooltip,
  taxFeePriceTooltip,
  ivaFeePriceTooltip,
  actualTotalPriceTooltip,
} = category;

const { modelos, grupo } = props.vehicleCategory;

// Test-only knob: in dev, ?e2eTooltipDelays=1 shrinks the open/close delays so
// the tooltip contract can be driven deterministically in e2e (Reka's 3s
// hover-intent open is too flaky headless). Gated on import.meta.dev so it is
// tree-shaken out of production builds — in prod the query param has no effect
// and both delays stay at 3000ms.
const tooltipFastDelays = import.meta.dev && useRoute().query.e2eTooltipDelays === '1';
const tooltipOpenDelayMs = tooltipFastDelays ? 50 : 3000;
const tooltipCloseDelayMs = tooltipFastDelays ? 600 : 3000;
const {
  open: totalPriceTooltipOpen,
  onOpenChange: onTotalPriceTooltipOpenChange,
  forceClose: forceTotalPriceTooltipClose,
} = useDelayedClose(tooltipCloseDelayMs);

/** Product Schema for SEO */
useProductSchema({
  category: props.category,
  vehicleCategory: props.vehicleCategory
});

// issue 322: si la URL pide Seguro Total para ESTA gama, la card arranca en Total
// (misma instancia que el usuario ve y emite al solicitar).
const route = useRoute();
const urlCategoryCode = computed(() => {
  const param = route.params.categoria;
  const fromParam = (typeof param === 'string' ? param : param?.[0])?.toUpperCase();
  const fromQuery = (
    (route.query.resumen as string | undefined) ||
    (route.query.reservar as string | undefined)
  )?.toUpperCase();
  return fromParam || fromQuery;
});
function readSeguroTotalFromUrl(): boolean {
  if (route.query.seguro === 'total') return true;
  if (import.meta.client) {
    return new URLSearchParams(window.location.search).get('seguro') === 'total';
  }
  return false;
}
watch(
  () => [urlCategoryCode.value, categoryCode.value] as const,
  ([urlCode, code]) => {
    if (urlCode && urlCode === code && readSeguroTotalFromUrl()) {
      withTotalCoverage.value = true;
    }
  },
  { immediate: true },
);

/** functions */
function goNextStep() {
  // Issue #313: fail-closed — más allá del horizonte de tarifas no se cotiza,
  // así que no se puede solicitar (defensa; el botón ya viene deshabilitado).
  if (isMonthlyPriceUnavailable.value) return;
  // Flags del form: el watcher de CategorySelectionSection los deriva de la
  // instancia emitida (single source, issue 322 / #308).
  emit("selectedCategory", category);
}

const questionButtonUIConfig = {
  leadingIcon: 'text-gray-400'
};

const modalUIConfig = {
  content: 'bg-white',
  header: 'bg-white',
  title: 'text-gray-900',
  description: 'text-gray-600',
  body: 'text-gray-800 bg-white',
  close: 'bg-black text-white rounded-full'
};

</script>
