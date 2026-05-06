<template>
  <div v-if="isServerError && !pendingSearch" class="text-center">
    <div class="text-white text-center">
      <div class="text-3xl">Servicio temporalmente no disponible</div>
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
  <div v-else-if="!hasAvailableCategories && !pendingSearch && isInventoryEmpty" class="text-center">
    <div class="text-white text-center">
      <div class="text-3xl">¡Oops!</div>
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
    <div v-if="hasAvailableCategories" class="text-white text-center">
      <div class="text-lg md:text-xl font-bold">¡Vehículos Disponibles!</div>
      <div class="text-sm md:text-base">
        <span>En <span class="text-yellow-400 font-semibold">{{pickupCityName}}</span> para el <span class="text-yellow-400 font-semibold">{{ humanFormattedPickupDate }}</span>.</span>
        <span class="block md:inline"> ¡No te quedes sin el tuyo, Reserva ahora!</span>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <template v-for="category in filteredCategories" :key="`cat-${category.categoryCode}`">
        <placeholders-unable-category-card
          v-if="
            category.estimatedTotalAmount == 999999999 &&
            vehicleCategories[category.categoryCode]
          "
          :category
          :vehicleCategory="vehicleCategories[category.categoryCode]"
        />
        <category-card
          v-else-if="vehicleCategories[category.categoryCode]"
          :category
          :vehicle-category="vehicleCategories[category.categoryCode]"
          @selected-category="setSelectedCategory"
        />
      </template>
    </div>
    <u-slideover
      v-model:open="slideoverReservationResume"
      title="Resumen de la reserva"
      description="Antes de continuar revisa la información"
      :overlay="false"
      :close="{ color: 'neutral', variant: 'outline', class: 'text-gray-700 border-gray-300 hover:bg-gray-100' }"
      :ui="{
        content: 'bg-white',
        header: 'bg-white',
        title: 'text-gray-900 text-2xl font-bold',
        description: 'text-gray-600',
        body: 'bg-white text-gray-900',
        footer: 'bg-white gap-2 border-t-0',
        close: 'absolute top-4 end-4 z-10',
      }"
    >
      <template #body>
        <reservation-resume :category="selectedCategory"></reservation-resume>
      </template>
      <template #footer>
        <div class="w-full flex flex-col gap-3">
          <!-- Share Capsule -->
          <div class="flex justify-center">
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <span class="text-sm text-gray-600 font-medium">Compartir</span>
              <button
                @click="shareWhatsApp"
                class="flex items-center justify-center w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                aria-label="Compartir en WhatsApp"
              >
                <UIcon name="i-lucide-message-circle" class="size-4" />
              </button>
              <button
                @click="shareFacebook"
                class="flex items-center justify-center w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                aria-label="Compartir en Facebook"
              >
                <UIcon name="i-lucide-facebook" class="size-4" />
              </button>
              <button
                @click="shareTwitter"
                class="flex items-center justify-center w-9 h-9 bg-black hover:bg-gray-800 text-white rounded-full transition-colors"
                aria-label="Compartir en X"
              >
                <UIcon name="i-lucide-twitter" class="size-4" />
              </button>
              <button
                @click="copyReservationLink"
                class="flex items-center justify-center w-9 h-9 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
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
              @click="slideoverReservationResume = false"
            />
            <u-slideover
          v-model:open="slideoverReservationForm"
          title="Datos para reservas"
          description="Completa tus datos y solicita la reserva"
          :overlay="false"
          :close="{ color: 'neutral', variant: 'outline', class: 'text-gray-700 border-gray-300 hover:bg-gray-100' }"
          :ui="{
            content: 'bg-white',
            header: 'bg-white',
            title: 'text-gray-900 text-2xl font-bold',
            description: 'text-gray-600',
            body: 'bg-white text-gray-900',
            footer: 'bg-white gap-2 border-t-0',
            close: 'absolute top-4 end-4 z-10',
          }"
        >
          <u-button label="Siguiente" color="neutral" size="xl" class="flex-1 py-4 justify-center bg-green-700 hover:bg-green-800 text-white">
            <template #trailing>
              <ChevronRightIcon cls="size-5" />
            </template>
          </u-button>

          <template #body>
            <reservation-form
              ref="reservationFormComponent"
              @submit="submitForm"
            />
          </template>

          <template #footer>
            <u-button
              label="Volver"
              color="neutral"
              variant="solid"
              size="xl"
              class="flex-1 py-4 justify-center bg-gray-200 !text-black hover:bg-gray-300"
              @click="slideoverReservationForm = false"
            />
            <u-button
              color="neutral"
              size="xl"
              class="flex-1 py-4 justify-center bg-green-700 hover:bg-green-800 disabled:bg-green-700 aria-disabled:bg-green-700 disabled:opacity-80 aria-disabled:opacity-80 text-white"
              :loading="isSubmittingForm"
              :disabled="isSubmittingForm"
              @click="reservationFormComponent.submit()"
              >Solicitar reserva
              <template #trailing>
                <ChevronRightIcon v-if="!isSubmittingForm" cls="size-5" />
              </template>
            </u-button>
          </template>
        </u-slideover>
          </div>
        </div>
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
  IconsChevronRightIcon as ChevronRightIcon
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
  hasAvailableCategories,
  error: searchError,
} = storeToRefs(storeSearch);
const { vehiculo, humanFormattedPickupDate, isSubmittingForm, selectedPickupLocation } = storeToRefs(storeForm);

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
const slideoverReservationResume = ref<boolean>(false);
const slideoverReservationForm = ref<boolean>(false);
const reservationFormComponent = ref(null);
const linkCopied = ref(false);

/** Share functions */
function getReservationShareUrl() {
  if (!import.meta.client) return '';
  const router = useRouter();
  const route = useRoute();

  if (vehiculo.value) {
    // Generar URL semántica con /categoria/[codigo]
    const currentPath = route.path;
    const basePathWithoutCategoria = currentPath.replace(/\/categoria\/[^\/]+$/, '');
    const newPath = `${basePathWithoutCategoria}/categoria/${vehiculo.value.toLowerCase()}`;
    return `${window.location.origin}${newPath}`;
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
const codigoCategoria = computed(() => categoriaParam.value || resumenParam.value || reservarParam.value);
const abrirFormularioDirecto = computed(() => !!reservarParam.value);

// Flag para evitar loops cuando actualizamos la URL programáticamente
const isUpdatingFromUrl = ref(false);

// Actualizar URL con categoría sin disparar navegación Vue Router.
// Usa history.replaceState para evitar que Nuxt desmonte/remonte la página
// (la ruta /categoria/[codigo] es una página Nuxt separada, y router.replace
// causaba re-mount → re-search → scroll al tope → loop).
function updateCategoriaUrl(codigoCategoria?: string, reservar?: boolean) {
  if (!import.meta.client) return;

  const currentPath = window.location.pathname;
  const basePathWithoutCategoria = currentPath.replace(/\/categoria\/[^/]+$/, '');

  if (codigoCategoria) {
    const newPath = `${basePathWithoutCategoria}/categoria/${codigoCategoria.toLowerCase()}`;
    const newUrl = reservar ? `${newPath}?reservar=${codigoCategoria}` : newPath;
    window.history.replaceState(window.history.state, '', newUrl);
  } else {
    window.history.replaceState(window.history.state, '', basePathWithoutCategoria);
  }
}

// Limpiar URL cuando se cierra el slideover de resumen
watch(slideoverReservationResume, (isOpen) => {
  if (isUpdatingFromUrl.value) return;

  if (!isOpen) {
    updateCategoriaUrl(undefined);
  }
});

// Sincronizar URL con estado del slideover de formulario
watch(slideoverReservationForm, (isOpen) => {
  if (isUpdatingFromUrl.value) return;
  if (!vehiculo.value) return;

  const codigo = vehiculo.value;
  if (isOpen) {
    updateCategoriaUrl(codigo, true);
  } else {
    // Volver a mostrar solo categoría sin query param reservar
    if (slideoverReservationResume.value) {
      updateCategoriaUrl(codigo, false);
    }
  }
});

// Auto-abrir slideover cuando se carguen las categorías y exista el param
watch(
  [filteredCategories, codigoCategoria],
  ([categories, codigo]) => {
    if (!codigo || categories.length === 0) return;

    const categoryData = categories.find(c => c.categoryCode === codigo);
    if (!categoryData || !vehicleCategories[codigo]) return;

    // Marcar que estamos actualizando desde la URL
    isUpdatingFromUrl.value = true;

    // Seleccionar categoría
    const category = useCategory(categoryData, vehicleCategories[codigo]);
    vehiculo.value = category.categoryCode.value;
    selectedCategory.value = category;

    // Abrir slideover correspondiente
    nextTick(() => {
      slideoverReservationResume.value = true;
      if (abrirFormularioDirecto.value) {
        nextTick(() => {
          slideoverReservationForm.value = true;
          // Resetear flag después de que todo esté abierto
          nextTick(() => {
            isUpdatingFromUrl.value = false;
          });
        });
      } else {
        // Resetear flag
        nextTick(() => {
          isUpdatingFromUrl.value = false;
        });
      }
    });
  },
  { immediate: true }
);

// Issue #25: cerrar slideovers (reka-ui Dialog modal:true) ANTES del unmount
// por route change. Sin esto, el cleanup interno de Reka UI no corre y
// `pointer-events: none` queda inline en <body> — DOM compartido en SPA —
// bloqueando el Searcher cuando el usuario regresa via Back. El guard
// `isUpdatingFromUrl` evita que los watchers de URL disparen replaceState
// redundante mientras navegamos a otra ruta.
onBeforeRouteLeave(async () => {
  if (slideoverReservationForm.value || slideoverReservationResume.value) {
    isUpdatingFromUrl.value = true;
    slideoverReservationForm.value = false;
    slideoverReservationResume.value = false;
    await nextTick();
    isUpdatingFromUrl.value = false;
  }
});

/** functions */
function setSelectedCategory(category: ReturnType<typeof useCategory>) {
  vehiculo.value = category.categoryCode.value;
  selectedCategory.value = category;
  slideoverReservationResume.value = true;
  // Actualizar URL con el código de la categoría
  updateCategoriaUrl(category.categoryCode.value, false);
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
</script>
