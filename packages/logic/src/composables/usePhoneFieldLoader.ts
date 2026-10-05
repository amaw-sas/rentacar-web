// External dependencies
import { markRaw, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { Component } from 'vue';

// Internal dependencies
import useStoreReservationForm from '../stores/useStoreReservationForm';
import { loadPhoneValidator, setActivePhoneCountry } from '../utils/validation/phoneValidator';
import { fetchVisitorCountry } from '../utils/fetchVisitorCountry';
import { pickPhoneCountry } from '../utils/pickPhoneCountry';

// Loads the reservation form's phone field: the input component, the full phone
// metadata and the visitor's country, in parallel, and exposes the component only
// once all three have settled.
//
// Not defineAsyncComponent: Nuxt wraps pages in <Suspense>, and a suspensible
// async component ignores its loadingComponent, so the same-height placeholder
// could not be shown. The brand forms render `phoneComponent` with v-if and the
// placeholder with v-else instead.
//
// The country is decided BEFORE the component is exposed: vue-tel-input reads
// defaultCountry once, on mount. Deciding first means the flag is never changed
// under the customer after the field appears (spec §2, "Por qué la bandera nunca
// cambia por debajo").
//
// Failures stay silent on purpose (privacy-strict browsers, PR #501): no console
// output, and the next mount retries because both loaders forget failed attempts
// and `importComponent` is called again. A remount rarely helps, though: browsers
// keep a failed module import for the life of the document (whatwg/html#6768), so
// `phoneLoadFailed` lets the form tell the customer and offer a page reload instead
// of a grey box that never turns into a field.
//
// `onCountryChanged` runs after every flag change, once the store and the validator
// know the new flag. Changing only the flag leaves `telefono` untouched, so the
// form's debounced revalidation never fires; the form uses this to re-check a
// message that described the old flag.

interface CountryEntry {
  iso2?: unknown;
}

function knownCountries(component: Component): Set<string> {
  const allCountries = (component as { props?: { allCountries?: { default?: unknown } } })
    .props?.allCountries?.default;
  if (typeof allCountries !== 'function') return new Set();
  const entries = allCountries() as CountryEntry[] | undefined;
  if (!Array.isArray(entries)) return new Set();
  return new Set(
    entries
      .map((entry) => entry?.iso2)
      .filter((iso2): iso2 is string => typeof iso2 === 'string'),
  );
}

interface PhoneFieldLoaderOptions {
  onCountryChanged?: () => void;
}

export default function usePhoneFieldLoader(
  importComponent: () => Promise<Component>,
  options: PhoneFieldLoaderOptions = {},
) {
  const store = useStoreReservationForm();

  const phoneComponent = shallowRef<Component | null>(null);
  const phoneInitialCountry = ref<string>('CO');
  const phoneLoadFailed = ref<boolean>(false);

  let active = true;

  onMounted(() => {
    // Resolves to null on any failure; fetchVisitorCountry never rejects. The
    // failure is reported right away, without waiting for the country.
    const ready = Promise.all([importComponent(), loadPhoneValidator()]).then(
      ([component]) => component,
      () => {
        if (active) phoneLoadFailed.value = true;
        return null;
      },
    );

    Promise.all([ready, fetchVisitorCountry()]).then(([component, visitor]) => {
      if (!active || !component) return;
      phoneInitialCountry.value = pickPhoneCountry(
        store.telefonoPais,
        visitor,
        knownCountries(component),
      );
      phoneComponent.value = markRaw(component);
    });
  });

  onBeforeUnmount(() => {
    active = false;
  });

  function onPhoneCountryChanged(country: { iso2?: string }) {
    if (!country?.iso2) return;
    const iso2 = country.iso2.toUpperCase();
    store.telefonoPais = iso2;
    setActivePhoneCountry(iso2);
    options.onCountryChanged?.();
  }

  return {
    phoneComponent,
    phoneInitialCountry,
    phoneLoadFailed,
    onPhoneCountryChanged,
  };
}
