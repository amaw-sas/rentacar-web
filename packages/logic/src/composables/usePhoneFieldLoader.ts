// External dependencies
import { markRaw, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { Component } from 'vue';

// Internal dependencies
import useStoreReservationForm from '../stores/useStoreReservationForm';
import { loadPhoneValidator } from '../utils/validation/phoneValidator';
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
// Failures stay silent on purpose (privacy-strict browsers, PR #501): the field
// just does not appear, and the next mount retries because both loaders forget
// failed attempts and `importComponent` is called again.

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

export default function usePhoneFieldLoader(importComponent: () => Promise<Component>) {
  const store = useStoreReservationForm();

  const phoneComponent = shallowRef<Component | null>(null);
  const phoneInitialCountry = ref<string>('CO');

  let active = true;

  onMounted(() => {
    // Resolves to null on any failure; fetchVisitorCountry never rejects.
    const ready = Promise.all([importComponent(), loadPhoneValidator()]).then(
      ([component]) => component,
      () => null,
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
    if (country?.iso2) store.telefonoPais = country.iso2.toUpperCase();
  }

  return {
    phoneComponent,
    phoneInitialCountry,
    onPhoneCountryChanged,
  };
}
