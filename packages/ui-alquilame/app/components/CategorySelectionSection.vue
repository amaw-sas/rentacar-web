<template>
  <div v-if="isServerError && !pendingSearch" class="text-center [--ctx-text-primary:#fff]">
    <div class="text-white text-center">
      <div class="heading-section text-3xl">Servicio temporalmente no disponible</div>
      <p class="text-lg mt-2">
        Estamos experimentando problemas técnicos. Por favor, intenta de nuevo en unos minutos.
      </p>
      <p class="text-lg mt-2">Si deseas hacer una reserva, contáctanos:</p>
      <p class="text-lg mt-1">
        <a :href="`https://wa.me/57${whatsappContact.phone}`" target="_blank" rel="noopener" class="text-yellow-400 underline">
          WhatsApp {{ whatsappContact.display }}
        </a>
      </p>
      <p class="text-base mt-2 font-semibold">Horario de atención</p>
      <p class="text-sm text-gray-300">
        Lunes a viernes: 07:00am - 07:00pm<br>
        Sábados: 07:00am - 04:00pm<br>
        Domingos y festivos: Cerrado
      </p>
    </div>
  </div>
  <div v-else-if="!hasRenderableAvailable && !pendingSearch && isInventoryEmpty" class="text-center [--ctx-text-primary:#fff]">
    <div class="text-white text-center">
      <div class="heading-section text-3xl">¡Oops!</div>
      <div class="text-lg">
        Nos quedamos sin carritos en {{pickupCityName}} para el {{ humanFormattedPickupDate }}.
      </div>
      <p class="text-lg">
        pero no te preocupes, nuestro sistema se actualiza cada hora, <br>
        puedes intentar más tarde o intenta cambiar la fecha o el lugar de recogida
      </p>
    </div>
  </div>
  <template v-if="!pendingSearch">
    <div v-if="hasRenderableAvailable" class="text-white text-center [--ctx-text-primary:#fff] mb-6">
      <span class="inline-block h-1 w-10 rounded-full bg-white/80 mb-3" aria-hidden="true"></span>
      <div class="heading-section text-lg md:text-2xl font-extrabold">¡Vehículos Disponibles!</div>
      <div class="text-sm md:text-base mt-1">
        <span>En <span class="text-yellow-400 font-semibold">{{ pickupBranchName }}</span> para el <span class="text-yellow-400 font-semibold">{{ humanFormattedPickupDateShort }}</span>.</span>
        <span class="block md:inline"> ¡No te quedes sin el tuyo, Reserva ahora!</span>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Iterate renderableCategories so iteration === render and the
           availability banner (hasRenderableAvailable) can't disagree with the
           grid. A category missing from vehicleCategories has no card to show
           and is excluded at the source rather than dropped mid-loop. #22. -->
      <template v-for="(category, index) in renderableCategories" :key="`cat-${category.categoryCode}`">
        <placeholders-unable-category-card
          v-if="category.estimatedTotalAmount == 999999999"
          :category
          :vehicleCategory="vehicleCategories[category.categoryCode]"
        />
        <category-card
          v-else
          :category
          :vehicle-category="vehicleCategories[category.categoryCode]"
          :priority="index === 0"
          @selected-category="setSelectedCategory"
        />
      </template>
    </div>
    <!-- UN SOLO slideover con `slideoverStep` interno (issue #65). El diálogo se
         abre y cierra UNA vez por flujo; "Resumen" y "Datos" son pasos que
         intercambian su contenido dentro del mismo [role=dialog]. Antes eran dos
         slideovers (anidados en main, hermanos en el primer fix de #65); en
         ambos, el hand-off entre dos capas modales corrompía el conteo de reka-ui
         y dejaba `pointer-events:none` pegado en <body> con 0 diálogos, matando
         la grilla (regresión SCEN-011). Con un único DialogContent el invariante
         "0 o 1 [role=dialog]" es estructural y no hay swap de capas. -->
    <u-slideover
      :open="slideoverOpen"
      @update:open="(v: boolean) => { if (!v) requestSlideoverClose() }"
      :title="slideoverStep === 'datos' ? 'Datos para reservar' : 'Resumen'"
      :description="slideoverStep === 'datos' ? undefined : 'Antes de continuar revisa la información'"
      :overlay="false"
      :content="modalContentProps"
      :close="{ color: 'neutral', variant: 'outline', class: 'text-gray-700 border-gray-300 hover:bg-gray-100' }"
      :ui="{
        content: 'bg-white',
        header: 'bg-white border-b-2 border-red-600/15',
        title: 'heading-card font-heading text-gray-900 text-2xl font-extrabold',
        description: 'text-gray-600',
        body: 'bg-white text-gray-900',
        footer: 'bg-white gap-2 border-t-0',
        close: 'absolute top-4 end-4 z-10',
      }"
    >
      <template #title>
        <template v-if="slideoverStep === 'datos'">
          Datos para reservar <span class="text-base font-normal text-gray-500">(último paso)</span>
        </template>
        <template v-else>Resumen</template>
      </template>
      <template #body>
        <reservation-resume v-if="slideoverStep === 'resumen'" :category="selectedCategory"></reservation-resume>
        <reservation-form
          v-else
          ref="reservationFormComponent"
          @submit="submitForm"
        />
      </template>
      <template #footer>
        <!-- Paso "Resumen": cápsula de compartir + Volver/Siguiente. -->
        <div v-if="slideoverStep === 'resumen'" class="w-full flex flex-col gap-3">
          <!-- Share Capsule -->
          <div class="flex justify-center">
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <span class="text-sm text-gray-600 font-medium">Compartir</span>
              <button
                @click="shareWhatsApp"
                class="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                aria-label="Compartir en WhatsApp"
              >
                <WhatsappIcon cls="size-4 text-white" />
              </button>
              <button
                @click="shareFacebook"
                class="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                aria-label="Compartir en Facebook"
              >
                <FacebookIcon cls="size-4 text-white" />
              </button>
              <button
                @click="shareTwitter"
                class="flex items-center justify-center w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-full transition-colors"
                aria-label="Compartir en X"
              >
                <XIcon cls="size-4 text-white" />
              </button>
              <button
                @click="copyReservationLink"
                class="flex items-center justify-center w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
                aria-label="Copiar enlace"
              >
                <UIcon :name="linkCopied ? 'i-lucide-check' : 'i-lucide-link'" class="size-4" />
              </button>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex gap-2">
            <u-button
              label="Volver"
              color="neutral"
              variant="solid"
              size="xl"
              class="flex-1 py-4 justify-center bg-gray-200 !text-black hover:bg-gray-300"
              data-testid="reservation-resume-back-test"
              @click="backFromResume"
            />
            <!-- "Siguiente" cambia el paso a "datos" SIN cerrar/reabrir el
                 diálogo (issue #65): no hay swap de capas modales. -->
            <u-button
              label="Siguiente"
              color="neutral"
              size="xl"
              class="flex-1 py-4 justify-center bg-brand-600 hover:bg-brand-700 text-white"
              data-testid="reservation-next-test"
              @click="goToForm"
            >
              <template #trailing>
                <ChevronRightIcon cls="size-5" />
              </template>
            </u-button>
          </div>
        </div>
        <!-- Paso "Datos": Volver (al resumen) + Solicitar reserva. -->
        <template v-else>
          <u-button
            label="Volver"
            color="neutral"
            variant="solid"
            size="xl"
            class="flex-1 py-4 justify-center bg-gray-200 !text-black hover:bg-gray-300"
            data-testid="reservation-form-back-test"
            @click="backToResume"
          />
          <u-button
            color="neutral"
            size="xl"
            class="flex-1 py-4 justify-center whitespace-nowrap bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600 aria-disabled:bg-brand-600 disabled:opacity-80 aria-disabled:opacity-80 text-white"
            :loading="isSubmittingForm"
            :disabled="isSubmittingForm"
            @click="reservationFormComponent?.submit()"
            >{{ isSubmittingForm ? 'Solicitando' : 'Solicitar reserva' }}
            <template #trailing>
              <ChevronRightIcon v-if="!isSubmittingForm" cls="size-5" />
            </template>
          </u-button>
        </template>
      </template>
    </u-slideover>
  </template>
  <template v-else>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <placeholders-category-card />
      <placeholders-category-card class="hidden md:block" />
      <placeholders-category-card class="hidden lg:block" />
    </div>
  </template>
</template>

<script setup lang="ts">
/** components */
import {
  PlaceholdersCategoryCard,
  PlaceholdersUnableCategoryCard,
  CategoryCard,
  ReservationResume,
  ReservationForm,
  IconsChevronRightIcon as ChevronRightIcon,
  IconsWhatsappIcon as WhatsappIcon,
  IconsFacebookIcon as FacebookIcon,
  IconsXIcon as XIcon
} from "#components";

// Note: composables and functions are auto-imported by Nuxt

/** stores */
const storeSearch = useStoreSearchData();
const storeForm = useStoreReservationForm();

/** refs */
const {
  pending: pendingSearch,
  selectedCategory,
  filteredCategories,
  error: searchError,
} = storeToRefs(storeSearch);
const {
  vehiculo,
  humanFormattedPickupDate,
  humanFormattedPickupDateShort,
  isSubmittingForm,
  selectedPickupLocation,
  haveTotalInsurance,
  haveMonthlyReservation,
  selectedMonthlyMileage,
} = storeToRefs(storeForm);

/**
 * Fuente única de los flags del payload (useRecordReservationForm), espejo del
 * watcher de ReservationWizard (#308 / issue 322 PR1). selectedCategory manda;
 * el store solo refleja. Sin esto, un deep-link /categoria/X en mensual deja
 * selectedMonthlyMileage=null → total_price 0 y sin monthly_mileage.
 */
watch(
  () => [
    haveMonthlyReservation.value,
    selectedCategory.value?.withTotalCoverage,
    selectedCategory.value?.withMileage,
  ],
  () => {
    const sc = selectedCategory.value;
    haveTotalInsurance.value = !!sc?.withTotalCoverage;
    selectedMonthlyMileage.value =
      haveMonthlyReservation.value && sc ? (sc.withMileage ?? null) : null;
  },
  { immediate: true, flush: 'sync' },
);

// Nueva búsqueda: limpiar selección (espejo del wizard / issue 322 PR1).
watch(pendingSearch, (isPending, wasPending) => {
  if (isPending && !wasPending) {
    selectedCategory.value = null;
    vehiculo.value = null;
    if (slideoverOpen.value) {
      urlSyncDepth.value++;
      slideoverOpen.value = false;
      nextTick(() => { urlSyncDepth.value--; });
    }
  }
});

const isServerError = computed(() => searchError.value?.error === 'server_error');
// Inline "¡Oops! Nos quedamos sin carritos" is reserved for genuine empty
// inventory (LLNRAG009) or no error at all. Other Localiza errors surface
// via toast — issue #10 SCEN-002.
const isInventoryEmpty = computed(
  () => !searchError.value || searchError.value?.error === 'no_available_categories_error',
);
const config = useRuntimeConfig();
const whatsappContacts: Record<string, { phone: string; display: string }> = {
  alquilatucarro: { phone: "3016729250", display: "301 672 9250" },
  alquilame: { phone: "3002436677", display: "300 243 6677" },
  alquicarros: { phone: "3187703670", display: "318 770 3670" },
};
const whatsappContact = whatsappContacts[config.public.rentacarFranchise as string] ?? whatsappContacts.alquilatucarro;
const { vehicleCategories } = useFetchRentacarData();
// Categories the grid can actually render (those with presentation metadata in
// vehicleCategories). The grid AND the availability banner both derive from
// this single source so they can never disagree — a category with real
// availability but no metadata must not flip the banner to "available" while
// the grid renders nothing. Issue #22.
const renderableCategories = computed(() =>
  filteredCategories.value.filter((c: { categoryCode: string }) => vehicleCategories[c.categoryCode]),
);
const hasRenderableAvailable = computed(() =>
  renderableCategories.value.some((c: { estimatedTotalAmount: number }) => c.estimatedTotalAmount !== 999999999),
);
// Un solo slideover modal con dos pasos (issue #65). `slideoverStep` decide
// título/descripción/body/footer; `slideoverOpen` gobierna la única capa modal.
// El flujo Resumen↔Datos solo cambia `slideoverStep` (el diálogo permanece
// abierto), evitando el swap de dos capas que dejaba `pointer-events:none`
// pegado en <body> (regresión SCEN-011).
const slideoverOpen = ref<boolean>(false);
const slideoverStep = ref<'resumen' | 'datos'>('resumen');
const reservationFormComponent = ref(null);
const linkCopied = ref(false);

// Issue #65: reka-ui Dialog (vía @nuxt/ui Slideover) no setea aria-modal y su
// tipo `content` (DialogContentProps) no expone el atributo, aunque el elemento
// sí lo acepta. Lo inyectamos por la prop `content`; el cast cubre el hueco de
// tipos de la dependencia para un atributo ARIA estándar.
const modalContentProps = { 'aria-modal': 'true' } as Record<string, string>;

/** Share functions */
function getReservationShareUrl() {
  if (!import.meta.client) return '';
  const router = useRouter();
  const route = useRoute();

  if (vehiculo.value) {
    // Generar URL semántica con /categoria/[codigo], incluyendo el seguro elegido
    // (issue 322 SCEN-322-M04) para que el enlace compartido reproduzca la cobertura.
    const currentPath = route.path;
    const basePathWithoutCategoria = currentPath.replace(/\/categoria\/[^\/]+$/, '');
    const newPath = `${basePathWithoutCategoria}/categoria/${vehiculo.value.toLowerCase()}`;
    const suffix = haveTotalInsurance.value ? '?seguro=total' : '';
    return `${window.location.origin}${newPath}${suffix}`;
  }

  return window.location.href;
}

function shareWhatsApp() {
  const url = getReservationShareUrl();
  const text = encodeURIComponent(`¡Mira esta opción de alquiler de carro! ${url}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareFacebook() {
  const url = encodeURIComponent(getReservationShareUrl());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareTwitter() {
  const url = encodeURIComponent(getReservationShareUrl());
  const text = encodeURIComponent('¡Mira esta opción de alquiler de carro!');
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
}

async function copyReservationLink() {
  try {
    await navigator.clipboard.writeText(getReservationShareUrl());
    linkCopied.value = true;
    setTimeout(() => { linkCopied.value = false; }, 2000);
  } catch (err) {
    console.error('Error al copiar enlace:', err);
  }
}

/** Soporte para deep-linking de categorías:
 * /categoria/[codigo] → ruta semántica (preferida)
 * ?resumen=CODIGO  → query param legacy (retrocompatibilidad)
 * ?reservar=CODIGO → query param para abrir formulario directo
 */
const route = useRoute();
const categoriaParam = computed(() => {
  const param = route.params.categoria;
  return (typeof param === 'string' ? param : param?.[0])?.toUpperCase();
});
const resumenParam = computed(() => route.query.resumen as string | undefined);
const reservarParam = computed(() => route.query.reservar as string | undefined);
// issue 322 SCEN-322-M05: cobertura en la URL. También leemos location.search
// porque updateCategoriaUrl usa history.*State (no actualiza route.query).
function readSeguroTotalFromUrl(): boolean {
  if (route.query.seguro === 'total') return true;
  if (import.meta.client) {
    return new URLSearchParams(window.location.search).get('seguro') === 'total';
  }
  return false;
}
const codigoCategoria = computed(() => categoriaParam.value || resumenParam.value || reservarParam.value);
const abrirFormularioDirecto = computed(() => !!reservarParam.value);
// El slideover se auto-abre SOLO cuando la URL lo pide EXPLÍCITAMENTE por query
// (?resumen / ?reservar — retrocompat de links legacy). Un `categoria` en el PATH
// (link del operador: /reservas/.../categoria/[X]) preselecciona y hace scroll a
// la card SIN abrir el slideover, para que el cliente elija seguro + adicionales
// en la card y luego "Solicitar" → resumen → datos.
const abrirSlideoverDesdeUrl = computed(() => !!resumenParam.value || !!reservarParam.value);

// Profundidad de sincronización URL→estado (contador, no booleano): enmascara
// el watcher de URL mientras abrimos el slideover desde la URL. Es un CONTADOR
// para ser reentrante — si el watcher de auto-apertura se dispara otra vez
// antes de que el reset diferido corra (p.ej. filteredCategories emite dos
// veces, o navegación rápida entre /categoria), un booleano lo desenmascararía
// a mitad de transición (edge-case #65 HIGH). Con el contador, el reset de la
// primera invocación no abre la ventana mientras la segunda sigue en vuelo.
const urlSyncDepth = ref(0);

// Cuántas entradas de historial empujó este slideover (0 cerrado, 1 resumen,
// 2 datos). Lo usa la X / Esc para retroceder TODAS de una y no dejar entradas
// que reabran el slideover con el botón "atrás". El retroceso normal lo decrementa.
let pushedEntries = 0;

// Actualizar URL con categoría sin disparar navegación Vue Router.
// Usa history.replaceState para evitar que Nuxt desmonte/remonte la página
// (la ruta /categoria/[codigo] es una página Nuxt separada, y router.replace
// causaba re-mount → re-search → scroll al tope → loop).
function updateCategoriaUrl(codigoCategoria?: string, reservar?: boolean, mode: 'push' | 'replace' = 'replace') {
  if (!import.meta.client) return;

  const currentPath = window.location.pathname;
  const basePathWithoutCategoria = currentPath.replace(/\/categoria\/[^/]+$/, '');
  // `push` agrega una entrada de historial (el botón "atrás" del navegador cierra
  // el slideover / baja de paso en vez de abandonar el listado); `replace`
  // sobrescribe la actual (cambios sin nueva entrada: cierre, sync desde URL).
  const write = (url: string) => {
    const current = window.location.pathname + window.location.search;
    // Flujo operador (/reservas/.../categoria/X): la URL YA trae la categoría antes
    // de abrir el slideover, así que un `push` agregaría una entrada de historial
    // DUPLICADA — "atrás" caería en el gemelo /categoria y handleSlideoverPopState
    // lo reabriría dejando el slideover pegado y <body> con pointer-events:none
    // (regresión #25/#65). Si el destino no cambia respecto a la URL actual,
    // degradamos a replace: no se empuja entrada y "atrás" cierra el slideover
    // saliendo de la ruta (onBeforeRouteLeave desbloquea el body).
    if (mode === 'push' && url !== current) {
      window.history.pushState({ slideover: true }, '', url);
      pushedEntries++;
    } else {
      window.history.replaceState(window.history.state, '', url);
    }
  };

  if (codigoCategoria) {
    const newPath = `${basePathWithoutCategoria}/categoria/${codigoCategoria.toLowerCase()}`;
    // Componer la query preservando el seguro elegido (issue 322 SCEN-322-M04).
    const params = new URLSearchParams();
    if (reservar) params.set('reservar', codigoCategoria);
    if (haveTotalInsurance.value) params.set('seguro', 'total');
    const qs = params.toString();
    write(qs ? `${newPath}?${qs}` : newPath);
  } else {
    pushedEntries = 0; // cierre/limpieza: ya no poseemos entradas
    write(basePathWithoutCategoria);
  }
}

// Sincronizar URL con (apertura, paso) del único slideover.
// - cerrado            → URL base (sin /categoria ni ?reservar)
// - abierto + resumen  → /categoria/X
// - abierto + datos    → /categoria/X?reservar=X
// Con un solo slideover NO hay transición Resumen→Datos que cierre una capa y
// abra otra, así que no hace falta el guard que antes preservaba ?reservar
// durante el swap: el cambio de paso solo reescribe la query (issue #65).
// El slideover usa UNA SOLA entrada de historial (la de abrir). El paso
// Resumen↔Datos solo reescribe la URL (replace), NO empuja otra entrada: si
// empujara una `/categoria/X?reservar`, al dar "atrás" esa URL difiere de la
// ruta donde Vue Router cree estar (el listado) y dispararía navegación →
// re-montaje → "recargar los carros". Con una sola entrada, "atrás" desde
// CUALQUIER paso vuelve al listado (misma ruta → sin navegación → sin
// re-búsqueda, conserva scroll). El retroceso pasa por handleSlideoverPopState.
let prevSlideoverOpen = false;
watch([slideoverOpen, slideoverStep], ([open, step]) => {
  if (urlSyncDepth.value > 0) {
    prevSlideoverOpen = open;
    return;
  }

  // Cerrado → limpiar la URL SIEMPRE, sin gatear por `vehiculo`: si el form se
  // reseteó (submit fallido, rehidratación) `vehiculo` puede quedar vacío con el
  // slideover aún abierto, y el `/categoria/X(?reservar)` NO debe sobrevivir al
  // cierre (si no, un reload reabriría un slideover ya descartado).
  if (!open) {
    updateCategoriaUrl(undefined);
  } else if (vehiculo.value) {
    // Empujar solo al ABRIR (cerrado→abierto); el cambio de paso usa replace.
    const opening = !prevSlideoverOpen;
    updateCategoriaUrl(vehiculo.value, step === 'datos', opening ? 'push' : 'replace');
  }
  prevSlideoverOpen = open;
});

// Auto-abrir el slideover cuando carguen las categorías y exista el param.
watch(
  [filteredCategories, codigoCategoria],
  ([categories, codigo]) => {
    if (!codigo || categories.length === 0) return;

    // Tras enviar, el historial puede conservar `/categoria/X` (el slideover
    // empuja entradas). Si el usuario retrocede hasta ahí, NO reabrir: consumir
    // el guard una vez y mostrar el listado. Sin esto, el Back post-submit
    // reabriría el resumen (regresión de reservation-back-url-cleanup).
    if (codigo === storeForm.lastSubmittedCode) {
      storeForm.lastSubmittedCode = null;
      return;
    }

    // Excluir el centinela "unable" (999999999): filteredCategories incluye gamas
    // sin stock; sin este filtro un deep-link a gama agotada preselecciona basura
    // (issue 322 SCEN-322-M01).
    const categoryData = categories.find(
      (c) => c.categoryCode === codigo && c.estimatedTotalAmount !== 999999999,
    );
    if (!categoryData || !vehicleCategories[codigo]) {
      if (vehiculo.value === codigo) {
        selectedCategory.value = null;
        vehiculo.value = null;
        if (slideoverOpen.value) {
          urlSyncDepth.value++;
          slideoverOpen.value = false;
          nextTick(() => { urlSyncDepth.value--; });
        }
      }
      return;
    }

    // Ya tenemos esta gama: no recrear instancia (conserva extras/seguro).
    const currentCode = selectedCategory.value?.categoryCode as string | undefined;
    if (currentCode === codigo && selectedCategory.value) {
      if (!slideoverOpen.value && abrirSlideoverDesdeUrl.value) {
        urlSyncDepth.value++;
        nextTick(() => {
          slideoverStep.value = abrirFormularioDirecto.value ? 'datos' : 'resumen';
          slideoverOpen.value = true;
          nextTick(() => { urlSyncDepth.value--; });
        });
      }
      return;
    }

    // Marcar que estamos actualizando desde la URL (contador reentrante)
    urlSyncDepth.value++;

    // Seleccionar categoría. Restaurar Seguro Total ANTES de asignar al store
    // (SCEN-322-M05 / M02).
    const category = useCategory(categoryData, vehicleCategories[codigo]);
    if (readSeguroTotalFromUrl()) {
      category.withTotalCoverage.value = true;
    }
    vehiculo.value = category.categoryCode.value;
    selectedCategory.value = category;

    // Abrir el slideover en el paso correcto (issue #65): ?reservar=X → "datos";
    // /categoria/X o ?resumen=X → "resumen". `abrirFormularioDirecto` deriva
    // solo de reservarParam, así que ?resumen=X cae en la rama "resumen".
    nextTick(() => {
      if (abrirSlideoverDesdeUrl.value) {
        // ?reservar=X → "datos"; ?resumen=X → "resumen" (retrocompat legacy).
        slideoverStep.value = abrirFormularioDirecto.value ? 'datos' : 'resumen';
        slideoverOpen.value = true;
      } else {
        // categoria en el PATH (flujo operador): NO abrir; la card ya quedó
        // preseleccionada arriba — solo hacer scroll a ella para que el cliente
        // vea los selectores de seguro/adicionales y pulse "Solicitar".
        document
          .getElementById(`categoria-${codigo}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Reset diferido (nextTick anidado): el watcher de URL (flush:'pre')
      // dispara tras abrir el slideover y ANTES de este reset, así queda
      // enmascarado. Decremento (no =0) por reentrancia.
      nextTick(() => {
        urlSyncDepth.value--;
      });
    });
  },
  { immediate: true }
);

// Issue #25: cerrar el slideover (reka-ui Dialog modal:true) ANTES del unmount
// por route change. Sin esto, el cleanup interno de Reka UI no corre y
// `pointer-events: none` queda inline en <body> — DOM compartido en SPA —
// bloqueando el Searcher cuando el usuario regresa via Back. El contador
// `urlSyncDepth` evita que el watcher de URL dispare replaceState redundante
// mientras navegamos a otra ruta.
onBeforeRouteLeave(async () => {
  if (slideoverOpen.value) {
    urlSyncDepth.value++;
    slideoverOpen.value = false;
    await nextTick();
    urlSyncDepth.value--;
  }
});

// "Atrás" del navegador (y los botones internos vía history.back): el navegador
// ya cambió la URL; aquí solo reconciliamos el estado del slideover, paso a paso:
//   - en "datos" → baja a "resumen" (no cierra)
//   - en "resumen" → cierra y deja el listado
// Enmascaramos el watcher de URL (urlSyncDepth) para no reescribir la URL que el
// navegador ya retrocedió.
function handleSlideoverPopState() {
  if (!slideoverOpen.value) return;
  // Reconciliar por la URL ya retrocedida (robusto si el navegador colapsa
  // varios popstate en uno, p.ej. la X que hace history.go(-2)):
  //   - sin /categoria/ → volvimos al listado → cerrar
  //   - /categoria/X    → resumen
  const hasCategoria = /\/categoria\//.test(window.location.pathname);
  urlSyncDepth.value++;
  if (!hasCategoria) {
    slideoverOpen.value = false;
    pushedEntries = 0;
  } else {
    slideoverStep.value = 'resumen';
    pushedEntries = 1;
  }
  nextTick(() => {
    urlSyncDepth.value--;
  });
}
onMounted(() => {
  if (import.meta.client) window.addEventListener('popstate', handleSlideoverPopState);
});
onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('popstate', handleSlideoverPopState);
});

/** functions */
function setSelectedCategory(category: ReturnType<typeof useCategory>) {
  vehiculo.value = category.categoryCode.value;
  selectedCategory.value = category;
  // Abrir en el paso "resumen"; el watcher [slideoverOpen, slideoverStep]
  // sincroniza la URL a /categoria/X.
  slideoverStep.value = 'resumen';
  slideoverOpen.value = true;
}

// Transiciones Resumen↔Datos (issue #65): solo cambian `slideoverStep`. El
// diálogo permanece abierto (una sola capa modal de reka-ui), el contenido del
// body y el footer se intercambian. Sin cerrar/reabrir → sin corromper el
// manejo de pointer-events de reka (regresión SCEN-011). Invariante: a lo sumo
// un [role=dialog], garantizado estructuralmente por el único DialogContent.
function goToForm() {
  slideoverStep.value = 'datos';
}
// Botón "Volver" en Datos: solo cambia de paso a Resumen (NO toca el historial;
// el slideover tiene una sola entrada). El watcher reescribe la URL a
// /categoria/X. El botón "atrás" del navegador, en cambio, cierra al listado.
function backToResume() {
  slideoverStep.value = 'resumen';
}
// Botón "Volver" en Resumen: retrocede la única entrada (Resumen→cerrar→listado).
function backFromResume() {
  if (import.meta.client) window.history.back();
  else slideoverOpen.value = false;
}
// X / Esc / clic fuera: cierre TOTAL desde cualquier paso. Retrocede todas las
// entradas que empujamos (history.go), así el botón "atrás" no reabre el
// slideover. Sin entradas propias (deep-link) cierra directo y limpia la URL.
function requestSlideoverClose() {
  if (import.meta.client && pushedEntries > 0) {
    window.history.go(-pushedEntries);
  } else {
    slideoverOpen.value = false;
  }
}

const { submitForm } = storeForm;

/** Ciudad de recogida seleccionada (no la de la landing) */
const { getCityById } = useData();
const pickupCityName = computed(() => {
  const citySlug = selectedPickupLocation.value?.city;
  if (!citySlug) return null;
  const cityData = getCityById(citySlug);
  return cityData?.name ?? null;
});

// Nombre de la sede de recogida (incluye la ciudad, p.ej. "Bogotá Centro
// Nuestro"); cae a la ciudad si por alguna razón no hubiera sede seleccionada.
const pickupBranchName = computed(
  () => selectedPickupLocation.value?.name ?? pickupCityName.value,
);
</script>
