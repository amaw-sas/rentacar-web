<template>
  <div class="categoria flex flex-col">
    <!-- Carrusel -->
    <div class="carrusel">
        <Carrusel
          :models="categoryModels"
          :vehicleModels="modelos"
          :category="categoryCode"
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
                <CategoryTags :category />
              </span>
              <span class="descripcion-corta">
                {{ vehicleCategory?.descripcion_corta }}
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

          <UTooltip :delay-duration="3000" :ui="{content: 'h-full select-text bg-white text-gray-900 shadow-lg border border-gray-200'}">
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
                    alt="info"
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
              <div class="opcion-seleccionable">
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
                    alt="info"
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
                    alt="info"
                    class="cursor-pointer"
                    aria-label="informacion sobre kilometraje"
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
                    alt="info"
                    class="cursor-pointer"
                    aria-label="informacion sobre kilometraje"
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
                    alt="info"
                    class="cursor-pointer"
                    aria-label="informacion sobre kilometraje"
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
          <div class="flex flex-col gap-1 px-5 pt-3 pb-4 sutil-fondo">
            <div class="flex items-center justify-between">
              <div class="flex">
                <UCheckbox
                  v-model="withExtraDriver"
                  color="neutral"
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
                    alt="info"
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
                <UCheckbox v-model="withBabySeat" color="neutral" class="opcion-seleccionable">
                  <template #label>
                    Silla para bebe {{ getFormattedDays }}
                  </template>
                </UCheckbox>

                <UModal :ui="modalUIConfig" title="Silla para bebe">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    alt="info"
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
                <UCheckbox v-model="withWash" color="neutral" class="opcion-seleccionable">
                  <template #label> Lavado del vehículo </template>
                </UCheckbox>

                <UModal :ui="modalUIConfig" title="Lavado del Vehículo">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    alt="info"
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
                      <b>Tarifas:</b><br />Al recoger el vehiculo: $20.000 (IVA
                      incluido).<br />
                      Al devolver el vehículo: $30.000 (IVA incluido).
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
                      Lavado completo con aspirado: $150.000 (IVA incluido).<br />
                      Lavado completo con aspirado y limpieza de tapicería:
                      $225.000 (IVA incluido).<br />
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
        <UButton
          class="boton-seleccion"
          size="xl"
          @click.prevent="goNextStep()"
          >
          <template #trailing>
            <ChevronRightIcon cls="size-5" />
          </template>
          Solicitar este vehículo
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
const props = withDefaults(defineProps<CategoryProps>(), {
  showButton: true,
});

/** emits */
const emit = defineEmits<{
  selectedCategory: [category: ReturnType<typeof useCategory>];
}>();

/** stores */
const { haveTotalInsurance, haveMonthlyReservation, selectedMonthlyMileage } =
  storeToRefs(useStoreReservationForm());

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
  currencyTotalPrice,
  currencyDailyPrice,
  currencyDailyBasePrice,
  currencyExtraHoursPrice,
  currencyReturnFee,
  getDiscount,
  getFormattedDays,
  hasPicoyPlaca,
  hasDiscount,
  hasExtraHours,
  hasReturnFee,
  currencyExtraDriverPrice,
  currencyBabySeatPrice,
  currencyWashPrice,

  // tooltip stuff
  dayPriceTooltip,
  coverageDayPriceTooltip,
  taxFeePriceTooltip,
  ivaFeePriceTooltip,
  actualTotalPriceTooltip,
} = category;

const { modelos, grupo } = props.vehicleCategory;

/** Product Schema for SEO */
useProductSchema({
  category: props.category,
  vehicleCategory: props.vehicleCategory
});

/** functions */
function goNextStep() {
  haveTotalInsurance.value = withTotalCoverage.value;
  if (haveMonthlyReservation.value)
    selectedMonthlyMileage.value = withMileage.value;
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
