<template>
  <div class="reservation-resume">
      <div class="carrusel-container">
        <carrusel
          :models="categoryModels"
          :vehicle-models="vehicleCategories[categoryCode]?.modelos"
          :category="categoryCode"
        />
        <!--
          Compartir vive con la ficha, no con la decisión: en el footer competía
          de frente con "Siguiente". Monocromas y en el lenguaje del chrome que
          ya cuelga de esta foto (nombre del modelo arriba, contador abajo) para
          que nada le dispute la atención al precio ni al CTA.

          Esquina superior derecha: es la única libre. `@click.stop` es seguro
          extra —las fichas son hermanas del slide, no descendientes, así que el
          clic no llega a su handler de reserva ni sin él—.
        -->
        <div class="acciones-compartir">
          <button
            type="button"
            class="ficha-compartir"
            aria-label="Compartir por WhatsApp"
            @click.stop="emit('shareWhatsapp')"
          >
            <WhatsappIcon cls="size-4 text-white" />
          </button>
          <button
            type="button"
            class="ficha-compartir"
            :aria-label="linkCopied ? 'Enlace copiado' : 'Copiar enlace'"
            @click.stop="emit('copyLink')"
          >
            <UIcon :name="linkCopied ? 'i-lucide-check' : 'i-lucide-link'" class="size-4" />
          </button>
        </div>
      </div>
      <!--
        Una sola columna. La rejilla `grid-cols-2` (datos | precios) se eliminó:
        a ~420px de ancho de slideover apretaba las cifras contra el borde
        derecho y no daba espacio al desglose completo de la card.
      -->
      <div class="resumen-cuerpo">
        <!--
          Encabezado FUERA del bloque gris, como en la card: allí el nombre del
          vehículo y el grupo van sobre blanco y el gris empieza en los precios.
          Aquí el gris agrupa los datos de la reserva, así que el encabezado le
          queda por encima.

          El vehículo manda y la gama acompaña, en una línea: misma relación que
          en la card (.descripcion-corta grande / .categoria-carro gris pequeña),
          donde la gama es metadato y no titular.
        -->
        <div class="resumen-encabezado">
          <div class="category-heading">
            <span class="category-description" v-text="categoryDescription"></span>
            <span class="category-name" v-text="`Gama ${categoryCode}`"></span>
          </div>
          <div v-if="isPicoyPlacaExempt()" class="category-picoyplaca" >
            <span>sin pico y placa</span>
          </div>
        </div>

        <div class="reservation-data">
          <!--
            Recogida y Entrega en dos columnas y sin las etiquetas "Fecha"/"Hora":
            son bloques cortos, simétricos e idénticos en estructura, y enfrentados
            se comparan de un vistazo. La fecha y la hora se leen solas — nadie
            confunde "10 de agosto de 2026" con otra cosa.
          -->
          <div class="pickup-return-grid">
            <div class="pickup-info">
              <div class="pickup-location-label">Recogida:</div>
              <div class="pickup-location-text" v-text="selectedPickupLocation?.name"></div>
              <div class="pickup-date-text" v-text="formattedPickupDate"></div>
              <div class="pickup-hour-text" v-text="formattedPickupHour"></div>
            </div>

            <div class="return-info">
              <div class="return-location-label">Entrega:</div>
              <div class="return-location-text" v-text="selectedReturnLocation?.name"></div>
              <div class="return-date-text" v-text="formattedReturnDate"></div>
              <div class="return-hour-text" v-text="formattedReturnHour"></div>
            </div>
          </div>

          <!-- Días y kilometraje en una sola línea: dos datos cortos que no
               justifican un renglón cada uno. -->
          <div class="renting">
            <span class="renting-label">Alquiler:</span>
            <span class="renting-item">
              {{ selectedDays }} {{ (selectedDays > 1) ? 'días' : 'día' }}
              <span v-if="hasExtraHours() && extraHoursQuantity">
                + {{ extraHoursQuantity }} {{ (extraHoursQuantity > 1) ? 'Horas extras' : 'Hora extra'  }}
              </span>
            </span>
            <span class="renting-separador" aria-hidden="true">·</span>
            <span v-if="selectedMonthlyMileage == '1k_kms'" class="renting-item">
              Kilometraje 1.000 km
            </span>
            <span v-else-if="selectedMonthlyMileage == '2k_kms'" class="renting-item">
              Kilometraje 2.000 km
            </span>
            <span v-else-if="selectedMonthlyMileage == '3k_kms'" class="renting-item">
              Kilometraje 3.000 km
            </span>
            <span v-else class="renting-item">Kilometraje ilimitado</span>
          </div>
        </div>

        <!--
          Escalera de precios: espejo EXACTO del desglose de CategoryCard.vue.
          Mismas filas, mismo orden, mismas variables y mismas clases. El padre
          (CategorySelectionSection) pasa la MISMA instancia de useCategory que
          ya usó la card, así que las cifras no pueden divergir.

          Antes esta zona calculaba su propio cierre: "Total renta" con
          `currencyTotalPrice` y "No incluye IVA ni tasa admin", mientras la card
          prometía "Total a pagar, precio final todo incluido" con
          `currencyActualTotalPrice`. Para la misma reserva eran $ 386.164 y
          $ 505.488 — el paso de datos subía el precio después de que el cliente
          ya había elegido.
        -->
        <div class="contenedor-precios-tarifa">
          <!-- Issue #313: mensual más allá del horizonte de tarifas no se cotiza
               (todas las cifras son 0). Fail-closed igual que la card: nunca un
               "$ 0" fabricado en una superficie visible. -->
          <template v-if="isMonthlyPriceUnavailable">
            <p class="precio-total" data-testid="resume-unavailable-test">
              Tarifa no disponible para tu fecha
            </p>
            <p class="texto-no-incluye">Escríbenos y te cotizamos.</p>
          </template>
          <template v-else>
            <!-- SCEN-M7: gateado por las dos cifras impresas, no por hasDiscount():
                 una reserva mensual tacha one_day_price, que hasDiscount() ignora,
                 así que el tachado mensual legítimo nunca llegaba al resumen. Sin
                 nada que tachar la fila entera desaparece y "Tarifa Diaria" baja a
                 rotular el precio real, igual que en la card. El `v-if` del span es
                 el que lee la guardia estructural: no lo quites por redundante. -->
            <div class="fila-tarifa" v-if="hasStruckBasePrice">
              <span class="text-sm">Tarifa Diaria</span>
              <span class="valor-tarifa precio-base-diario" v-if="hasStruckBasePrice">$ {{ currencyDailyBasePrice }}</span>
            </div>
            <div class="fila-tarifa">
              <span class="text-sm" v-if="!hasStruckBasePrice">Tarifa Diaria</span>
              <span class="porcentaje-descuento" v-if="hasDiscountToShow">
                Hoy con {{ getDiscount }}% Dto.
              </span>
              <!-- La diaria SIEMPRE con Seguro Básico (currencyBasicDailyPrice),
                   como la card. `currencyDailyPrice` incluiría el Seguro Total
                   cuando está marcado y las dos diarias se separarían. -->
              <span class="valor-tarifa precio-diario">$ {{ haveMonthlyReservation ? currencyDailyPrice : currencyBasicDailyPrice }}</span>
            </div>
            <div class="fila-tarifa">
              <span class="text-sm">Seguro Básico</span>
              <span class="valor-tarifa text-sm text-gray-500">incluido</span>
            </div>
            <div v-if="haveMonthlyReservation" class="fila-tarifa" data-testid="resume-monthly-mileage-included-test">
              <span class="text-sm">1.000 kilómetros</span>
              <span class="valor-tarifa text-sm text-gray-500">incluidos</span>
            </div>
            <div v-if="haveMonthlyReservation && withMileageUpgrade" class="fila-tarifa" data-testid="resume-monthly-mileage-upgrade-line-test">
              <span class="text-sm">+ 1.000 kilómetros adicionales</span>
              <span class="valor-tarifa text-sm">$ {{ currencyMileageUpgradePrice }}</span>
            </div>
            <div v-if="withTotalCoverage" class="fila-tarifa">
              <span class="text-sm">+ Seguro Total {{ getFormattedDays }}</span>
              <span class="valor-tarifa text-sm">$ {{ currencyTotalCoveragePrice }}</span>
            </div>
            <div v-if="hasExtraHours()" class="fila-tarifa">
              <span class="text-sm">
                + {{ extraHoursQuantity }}
                {{ extraHoursQuantity > 1 ? "Horas" : "Hora" }} extra
              </span>
              <span class="valor-tarifa text-sm">$ {{ currencyExtraHoursPrice }}</span>
            </div>
            <div v-if="hasReturnFee()" class="fila-tarifa">
              <span class="text-sm">+ Retorno otra sede</span>
              <span class="valor-tarifa text-sm">$ {{ currencyReturnFee }}</span>
            </div>

            <hr class="separador-tarifa">

            <template v-if="hasSurfacedTaxes">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal {{ getFormattedDays }}</span>
                <span class="valor-tarifa text-sm">$ {{ currencyTotalPrice }}</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ {{ currencyIvaAndTax }}</span>
              </div>

            </template>

            <!-- Adicionales SIN IVA: se suman tras el "Total renta", no en el
                 subtotal. El Seguro Total NO cuenta aquí — ese va arriba.
                 El separador vive DENTRO de este bloque: fuera quedaba colgando
                 al final de la escalera cuando no había adicionales.

                 Cuelga de `hasSelectedAdditionals` a secas, NO de
                 `hasSurfacedTaxes`: anidado ahí, en mensual —donde el total ya
                 trae IVA y tasa— los extras desaparecían de la escalera y del
                 total, y el cliente marcaba $ 360.000 sin que la cifra se
                 moviera. -->
            <template v-if="hasSelectedAdditionals">
              <!-- En mensual no hay desglose intermedio de impuestos: el
                   separador general de arriba ya divide la tarifa de los
                   adicionales. Mostrar este segundo <hr> dejaba dos líneas
                   consecutivas sin contenido entre ellas. -->
              <hr v-if="hasSurfacedTaxes" class="separador-tarifa">

                <div class="fila-tarifa">
                  <span class="text-sm">Total renta</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyActualTotalPrice }}</span>
                </div>
                <div v-if="withExtraDriver" class="fila-tarifa" data-testid="extra-driver-line">
                  <span class="text-sm">+ Conductor adicional {{ getFormattedDays }}</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyExtraDriverPrice }}</span>
                </div>
                <div v-if="withBabySeat" class="fila-tarifa" data-testid="baby-seat-line">
                  <span class="text-sm">+ Silla para bebé {{ getFormattedDays }}</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyBabySeatPrice }}</span>
                </div>
                <div v-if="withWash" class="fila-tarifa" data-testid="wash-line">
                  <span class="text-sm">+ Lavado del vehículo</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyWashPrice }}</span>
                </div>
            </template>

          </template>
        </div>
      </div>

      <!--
        El cierre cuelga de la RAÍZ, no del bloque de precios. `sticky` solo
        puede moverse dentro de su bloque contenedor: anidado en el desglose
        (≈257px) se quedaba sin recorrido y el total volvía a caer bajo el
        pliegue en cuanto había scroll. Colgando de la raíz, su contenedor es el
        panel entero y el anclaje funciona en cualquier pantalla.

        Con contenido corto no hay overflow y `sticky` queda inerte; ahí el
        `mt-auto` lo baja a pegarse a los botones.
      -->
      <div v-if="!isMonthlyPriceUnavailable" class="cierre-precio">
        <div class="cierre-precio-panel">
          <div class="fila-tarifa">
            <span class="dias-reservados" v-if="hasSurfacedTaxes">Total a pagar</span>
            <span class="dias-reservados" v-else>
              Total {{ haveMonthlyReservation ? "30 días" : getFormattedDays }}
            </span>
            <span class="valor-tarifa precio-total">
              $ {{ hasSelectedAdditionals ? currencyTotalToPayWithAdditionals : (hasSurfacedTaxes ? currencyActualTotalPrice : currencyTotalPrice) }}
            </span>
          </div>

          <p class="texto-no-incluye" v-if="hasSurfacedTaxes">Precio final, todo incluido</p>
          <p class="texto-no-incluye" v-else-if="haveMonthlyReservation">
            Incluye IVA y tasa admin
          </p>
          <p class="texto-no-incluye" v-else>No incluye IVA ni tasa admin</p>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
// Note: composables are auto-imported by Nuxt
import { defineAsyncComponent } from 'vue'
const Carrusel = defineAsyncComponent(() => import('./Carrusel.vue'))

// Los iconos viven en components/Icons/, así que el auto-import los expone con
// el prefijo de carpeta: sin este alias, <WhatsappIcon> se renderiza como
// elemento desconocido y la ficha sale como un círculo negro vacío.
import { IconsWhatsappIcon as WhatsappIcon } from '#components'

/** types */
import type ReservationResumeProps from '@rentacar-main/logic/utils/types/props/ReservationResumeProps';

/** props */
// `linkCopied` se declara aquí y no en ReservationResumeProps: ese tipo lo
// comparten las tres marcas y esta cápsula de compartir es solo de alquilame.
const props = defineProps<ReservationResumeProps & { linkCopied?: boolean }>();

// El Resumen solo avisa. La URL a compartir la arma el padre
// (getReservationShareUrl), que es donde viven sus entradas: `vehiculo`, el
// router y el seguro elegido en el store.
const emit = defineEmits<{
  shareWhatsapp: [];
  copyLink: [];
}>();

/** stores */
const storeForm = useStoreReservationForm();
const storeSearch = useStoreSearchData();

/** refs */
const {
  categoryModels,
  categoryCode,
  categoryDescription,
  extraHoursQuantity,
  currencyExtraHoursPrice,
  currencyReturnFee,
  currencyTotalPrice,
  currencyDailyBasePrice,
  currencyDailyPrice,
  currencyBasicDailyPrice,
  currencyExtraDriverPrice,
  currencyBabySeatPrice,
  currencyWashPrice,
  currencyTotalCoveragePrice,
  currencyMileageUpgradePrice,
  currencyActualTotalPrice,
  currencyTotalToPayWithAdditionals,
  currencyIvaAndTax,
  getFormattedDays,
  isMonthlyPriceUnavailable,
  numberDays,
  isPicoyPlacaExempt,
  hasDiscount,
  hasDiscountToShow,
  hasStruckBasePrice,
  hasExtraHours,
  hasReturnFee,
  getDiscount,
  withTotalCoverage,
  withMileageUpgrade,
  withExtraDriver,
  withBabySeat,
  withWash,
} = props.category;

// Mismas dos compuertas que CategoryCard.vue: comparan las mismas dos cifras de
// la misma instancia de useCategory, así que la escalera surge en el Resumen
// exactamente cuando surge en la card.
//
// OJO con el acceso. `selectedCategory` es un ref profundo en el padre, así que
// su valor pasa por reactive() y los refs de useCategory llegan aquí YA
// DESENVUELTOS: `props.category.getActualTotalPrice` es el número, no un ref, y
// pedirle `.value` da undefined —sin lanzar—, lo que dejaba las dos compuertas
// en false y el Resumen cerrando en el subtotal. `toValue` funciona en los dos
// casos, y leer a través de `props.category` (en vez de desestructurar) mantiene
// la reactividad del proxy. La card no sufre esto porque construye su instancia
// localmente con useCategory(props.category), sin pasar por props.
const hasSurfacedTaxes = computed(
  () => toValue(props.category.getActualTotalPrice) > toValue(props.category.getTotalPrice),
);

const hasSelectedAdditionals = computed(() => Boolean(
  toValue(props.category.withExtraDriver)
  || toValue(props.category.withBabySeat)
  || toValue(props.category.withWash),
));

const {
    selectedPickupLocation,
    selectedReturnLocation,
    selectedMonthlyMileage,
    selectedDays,
    haveMonthlyReservation,
    humanFormattedPickupDate: formattedPickupDate,
    humanFormattedReturnDate: formattedReturnDate,
    humanFormattedPickupHour: formattedPickupHour,
    humanFormattedReturnHour: formattedReturnHour,
} = storeToRefs(storeForm);

/** vars */
const { vehicleCategories } = useFetchRentacarData();

</script>
