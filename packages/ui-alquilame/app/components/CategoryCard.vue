<template>
  <!-- id scrolleable: el deep-link /reservas/.../categoria/[X] preselecciona y
       hace scroll a esta card (flujo operador) sin abrir el slideover. -->
  <div :id="`categoria-${categoryCode}`" class="categoria flex flex-col">
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
            <!-- Orden de lectura: nombre del vehículo y, debajo, una sola fila
                 con las etiquetas ("sin pico y placa") seguidas del grupo. El
                 código de gama es metadato de operación, así que cierra la
                 línea. Sin etiquetas, .etiquetas-categoria se colapsa
                 (empty:hidden) y el grupo queda solo en esa fila. -->
            <span class="text-left text-gray-700 items-center">
              <span class="descripcion-corta">
                {{ vehicleCategory?.descripcion_corta }}
              </span>
              <span class="fila-etiquetas-grupo">
                <CategoryTags :category />
                <span class="categoria-carro">
                  Grupo {{ categoryCode }} ({{ grupo }})
                </span>
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
      <!--
        Disposición "concepto | cifra" (patrón de recibo): el concepto ancla la
        lectura a la izquierda y la cifra se alinea al margen derecho, así el ojo
        baja por los conceptos y salta al número solo cuando le interesa. Antes
        eran dos columnas (precios | protección) con TODO alineado a la derecha,
        conceptos incluidos, así que nada anclaba la lectura y la protección
        quedaba estrecha. La protección ahora va a lo ancho, bajo un separador.
      -->
      <div class="contenedor-tarifas sutil-fondo">
        <div class="contenedor-precios-tarifa">
          <!-- Issue #313: reserva mensual más allá del horizonte de tarifas no se
               cotiza (todas las cifras de precio son 0). Fail-closed: se reemplaza
               TODA la zona de precio por el estado inline — nunca un "$ 0"
               diario/total fabricado en una superficie visible. -->
          <template v-if="isMonthlyPriceUnavailable">
            <p class="precio-total" data-testid="category-unavailable-test">
              Tarifa no disponible para tu fecha
            </p>
            <p class="texto-no-incluye">Escríbenos y te cotizamos.</p>
          </template>
          <template v-else>
            <div class="fila-tarifa">
              <span class="text-sm">Tarifa Diaria</span>
              <span class="valor-tarifa precio-base-diario">$ {{ currencyDailyBasePrice }}</span>
            </div>
            <!-- Sin descuento la fila queda sin concepto: la cifra se alinea
                 igual a la derecha porque `valor-tarifa` usa `ms-auto`. -->
            <div class="fila-tarifa">
              <span class="porcentaje-descuento" v-if="hasDiscount()">
                Hoy con {{ getDiscount }}% Dto.
              </span>
              <!-- Diario SIEMPRE con Seguro Básico: no cambia al marcar Total (que
                   ahora es un extra aparte). En mensual sí usa el diario del mes. -->
              <span class="valor-tarifa precio-diario">$ {{ haveMonthlyReservation ? currencyDailyPrice : currencyBasicDailyPrice }}</span>
            </div>
            <!-- El Seguro Básico va siempre incluido en el diario. Su detalle de
                 coberturas queda accesible en el "?". -->
            <div class="fila-tarifa">
              <span class="text-sm inline-flex items-center gap-1">
                Seguro Básico
                <UModal :ui="modalUIConfig" title="Seguro Básico" description="Protección Obligatoria">
                  <UButton variant="ghost" color="neutral" size="xs" aria-label="Coberturas del Seguro Básico" class="cursor-pointer" :ui="questionButtonUIConfig">
                    <template #leading>
                      <InfoQuestionIcon cls="size-3 text-gray-400" />
                    </template>
                  </UButton>
                  <template #body>
                    <p class="text-sm mb-4">
                      Está incluido en el valor de alquiler del vehículo y cubre lo siguiente:
                    </p>
                    <p class="text-sm mb-4">
                      <b>Daños a terceros</b>: Cubre los daños materiales causados a otras
                      personas o propiedades en caso de un accidente.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Lesiones personales a terceros</b>: Cubre las lesiones sufridas por
                      otras personas involucradas en el accidente.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Daños al vehículo alquilado</b>: En caso de daños o pérdida total,
                      cubre la mayor parte del costo, dejando al arrendatario responsable solo
                      de una participación obligatoria que varía según la gama (entre
                      $3.570.000 y $4.760.000).
                    </p>
                    <b class="text-sm mb-4">Ningún seguro cubre</b>
                    <p class="text-sm mb-4">
                      Pérdida de accesorios removibles del vehículo, documentos, placas o
                      llaves. Tampoco multas de tránsito o fotomultas.
                    </p>
                  </template>
                </UModal>
              </span>
              <span class="valor-tarifa text-sm text-gray-500">incluido</span>
            </div>
            <!-- Seguro Total: extra opcional que se marca en "Servicios
                 adicionales". Aquí aparece su sobrecosto (pre-impuestos), que es
                 justo lo que sube el subtotal. Gate a por-día: en mensual el
                 diario ya lo incluye y duplicaría. -->
            <div v-if="withTotalCoverage && !haveMonthlyReservation" class="fila-tarifa">
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

            <!--
              Opción C (2026-07-24): el precio "todo incluido" a la vista. Cuando
              hay impuestos que mostrar (getActualTotalPrice > getTotalPrice, i.e.
              NO mensual) se surge la escalera: subtotal + (tasa+IVA) → total a
              pagar. En mensual el total ya los incluye ⇒ getIvaAndTax = 0 ⇒ se
              cae al total único de siempre, sin una línea "+ $0".
            -->
            <template v-if="hasSurfacedTaxes">
              <div class="fila-tarifa">
                <span class="text-sm">Subtotal {{ getFormattedDays }}</span>
                <span class="valor-tarifa text-sm">$ {{ currencyTotalPrice }}</span>
              </div>
              <div class="fila-tarifa">
                <span class="text-sm">Tasa administrativa + IVA</span>
                <span class="valor-tarifa text-sm">$ {{ currencyIvaAndTax }}</span>
              </div>

              <hr class="separador-tarifa">

              <!--
                Adicionales SIN IVA (Conductor/Silla/Lavado): se suman tras el
                "Total renta", no en el subtotal, porque no se les aplica IVA
                (getTotalToPayWithAdditionals = total renta + adicionales). Cada
                línea aparece al marcar su selector abajo; su precio ya no vive en
                la sección de adicionales, se inyecta aquí.
              -->
              <template v-if="hasSelectedAdditionals">
                <div class="fila-tarifa">
                  <span class="text-sm">Total renta</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyActualTotalPrice }}</span>
                </div>
                <div v-if="withExtraDriver" class="fila-tarifa">
                  <span class="text-sm">+ Conductor adicional {{ getFormattedDays }}</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyExtraDriverPrice }}</span>
                </div>
                <div v-if="withBabySeat" class="fila-tarifa">
                  <span class="text-sm">+ Silla para bebé {{ getFormattedDays }}</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyBabySeatPrice }}</span>
                </div>
                <div v-if="withWash" class="fila-tarifa">
                  <span class="text-sm">+ Lavado del vehículo</span>
                  <span class="valor-tarifa text-sm">$ {{ currencyWashPrice }}</span>
                </div>

                <hr class="separador-tarifa">
              </template>
            </template>

            <div class="fila-tarifa">
              <span class="dias-reservados" v-if="hasSurfacedTaxes">Total a pagar</span>
              <span class="dias-reservados" v-else>
                Total {{ haveMonthlyReservation ? "30 días" : getFormattedDays }}
              </span>

              <span class="valor-tarifa">
                <UTooltip :open="totalPriceTooltipOpen" :delay-duration="tooltipOpenDelayMs" :content="{ onEscapeKeyDown: forceTotalPriceTooltipClose, onPointerDownOutside: forceTotalPriceTooltipClose }" :ui="{content: 'h-full select-text bg-white text-gray-900 shadow-lg border border-gray-200'}" @update:open="onTotalPriceTooltipOpenChange">
                  <template #content>
                    Día: $ {{ dayPriceTooltip }} <br />
                    Seguro día: $ {{ coverageDayPriceTooltip }} <br />
                    Tasa: $ {{ taxFeePriceTooltip }} <br />
                    IVA: $ {{ ivaFeePriceTooltip }} <br />
                    Total: $ {{ actualTotalPriceTooltip }} <br />
                  </template>
                  <ULink raw class="precio-total"> $ <span>{{ hasSurfacedTaxes ? (hasSelectedAdditionals ? currencyTotalToPayWithAdditionals : currencyActualTotalPrice) : currencyTotalPrice }}</span></ULink>
                </UTooltip>
              </span>
            </div>

            <p class="texto-no-incluye" v-if="hasSurfacedTaxes">Precio final, todo incluido</p>
            <p class="texto-no-incluye" v-else-if="haveMonthlyReservation">
              Incluye IVA y tasa admin
            </p>
            <p class="texto-no-incluye" v-else>No incluye IVA ni tasa admin</p>
          </template>
        </div>

        <!--
          "Escoge protección" desapareció: el Seguro Básico va siempre incluido
          (se ve en el desglose) y el Seguro Total pasó a ser un extra opcional en
          "Servicios adicionales". Esta sección ahora solo aloja el selector de
          kilometraje, que es exclusivo de la reserva mensual — por eso el
          contenedor entero se muestra solo en ese caso.
        -->
        <div v-if="haveMonthlyReservation" class="contenedor-protecciones">
          <div>
            <p class="font-bold my-1">
              Escoge kilometraje:
            </p>

            <div
              v-if="haveMonthlyReservation"
              class="grid grid-cols-2 gap-x-2"
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
            <!--
              Seguro Total como extra opcional (antes vivía en "Escoge
              protección"). Reusa withTotalCoverage: al marcarlo, el diario sigue
              en Básico y sube el subtotal por su sobrecosto (la línea
              "+ Seguro Total" del desglose). Solo si es cotizable a la fecha.
            -->
            <div v-if="canQuoteTotalCoverage" class="flex items-center justify-between">
              <div class="flex">
                <UCheckbox
                  v-model="withTotalCoverage"
                  color="success"
                  class="opcion-seleccionable"
                >
                  <template #label>
                    Seguro Total {{ getFormattedDays }}
                  </template>
                </UCheckbox>

                <UModal :ui="modalUIConfig" title="Seguro Total" description="Protección ampliada">
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
                      <b>Cobertura completa del vehículo</b>: cubre el 100% de los
                      daños al vehículo alquilado, parciales o totales, por daño o robo.
                    </p>
                    <p class="text-sm mb-4">
                      <b>Eliminación de la participación obligatoria</b>: no pagas
                      ningún valor adicional en caso de siniestro; el seguro cubre la
                      totalidad de los daños sin cargo extra.
                    </p>
                    <p class="text-sm mb-4">
                      <b>No cubre</b>: pérdida de accesorios removibles del vehículo
                      (radios, espejos, farolas), documentos, placas o llaves. Tampoco
                      multas de tránsito o fotomultas.
                    </p>
                  </template>
                </UModal>
              </div>
              <span v-show="withTotalCoverage && !hasSurfacedTaxes" class="ml-4">$ {{ currencyTotalCoveragePrice }}</span>
            </div>
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
              <span v-show="withExtraDriver && !hasSurfacedTaxes" class="ml-4"
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
              <span v-show="withBabySeat && !hasSurfacedTaxes" id="precio4" class="ml-4"
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
              <span v-show="withWash && !hasSurfacedTaxes" id="precio3" class="ml-4"
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
  currencyActualTotalPrice,
  currencyTotalToPayWithAdditionals,
  currencyIvaAndTax,
  currencyTotalCoveragePrice,
  currencyBasicDailyPrice,
  getTotalPrice,
  getActualTotalPrice,
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

// Opción C: ¿hay tasa/IVA que surgir? getIvaAndTax = actualTotal − subtotal, y
// en mensual actualTotal === subtotal ⇒ 0. Compuerta de la escalera de precios.
const hasSurfacedTaxes = computed(() => getActualTotalPrice.value > getTotalPrice.value);

// Adicionales que se INYECTAN en el desglose (sin IVA, tras "Total renta"):
// Conductor, Silla y Lavado. El Seguro Total NO cuenta aquí — ese va en el
// subtotal (con IVA) como línea propia. Cuando hay alguno, el total prominente
// pasa a currencyTotalToPayWithAdditionals.
const hasSelectedAdditionals = computed(
  () => withExtraDriver.value || withBabySeat.value || withWash.value,
);

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

// issue 322 SCEN-322-M05 (alquilame path deep-link): la card es una instancia
// useCategory distinta a la del store. Sin este seed, /categoria/X?seguro=total
// restaura Total en el store, la card muestra Básico, y "Solicitar" pisa el store.
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
// Solo al montar / cuando cambia el código de URL: no re-forzar si el usuario
// eligió Básico a mano con la query aún presente.
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
  // instancia emitida (single source, issue 322 / #308). No escribir el store aquí.
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
