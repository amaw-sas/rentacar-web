// @vitest-environment jsdom
//
// SDD: source-string tests (UnableCategoryCard.test.ts) grep the .vue file for
// literal markers. They cannot detect a regression where the template renders
// the literal but the runtime binding is dead — e.g. v-if condition flipped,
// composable result discarded, click handler swallowed. This mount-based test
// observes the rendered DOM + a real click event to bridge that gap.
//
// Both tests coexist intentionally: source-string is fast and stable across
// Vue refactors that swap reactivity primitives; mount catches behavioral
// regressions the source layer cannot see.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { defineComponent, h, ref } from 'vue';

// ─────────────────────────────────────────────────────────────────────────
// Mocks: Nuxt globals + heavy child components
// ─────────────────────────────────────────────────────────────────────────

const ADMIN_PAYLOAD = {
  categories: [],
  branches: [
    {
      id: 1,
      code: 'AABOT',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: '',
    },
  ],
  extras: undefined,
  vehicleCategories: {},
};

// In a Nuxt build `useUnavailabilityContext` comes from the layer's auto-imports
// so the .vue source uses it bare. Vitest doesn't run Nuxt's auto-import scan,
// so the identifier is undefined at compile time. We re-stub it as a global in
// beforeEach (alongside useState/useToast) — `vi.unstubAllGlobals` in afterEach
// would otherwise blow away a top-level stub after the first test.
const stubbedUnavailabilityContext = () => ({
  bannerText: ref('No disponible para el 12 de mayo en Bogotá Aeropuerto'),
  pickupDateLabel: ref('12 de mayo'),
  locationLabel: ref('Bogotá Aeropuerto'),
  isSpecific: ref(true),
});

// Stub the async carousel + chevron icon — their real implementations pull
// Nuxt-only globals and are not relevant to the contract we're verifying.
//
// vue-test-utils 2.4's `createDefaultStub` probes the mocked module namespace
// for many Vue-internal markers (`__isTeleport`, `__isFragment`, `__isSuspense`,
// `__isKeepAlive`, …). vitest's strict mock guards throw if any probe hits an
// undefined export. We wrap the export object in a Proxy that returns `false`
// for any unknown key — passes every introspection without enumerating.
//
// Factories must be inline because `vi.mock` is hoisted above any local const.
vi.mock(
  '/home/pabloandi/proyectos/amaw/rentacar/rentacar-web/packages/ui-alquilatucarro/app/components/Carrusel.vue',
  async () => {
    const { defineComponent, h } = await import('vue');
    const stub = defineComponent({
      name: 'CarruselStub',
      props: ['models', 'vehicleModels', 'category'],
      render() {
        return h('div', { class: 'carrusel-stub', 'data-testid': 'carrusel-stub' });
      },
    });
    return new Proxy(
      { default: stub },
      {
        get(target, key) {
          if (key in target) return (target as Record<string | symbol, unknown>)[key];
          return undefined;
        },
        has() {
          return true;
        },
      },
    );
  },
);

vi.mock(
  '/home/pabloandi/proyectos/amaw/rentacar/rentacar-web/packages/ui-alquilatucarro/app/components/Icons/ChevronRightIcon.vue',
  async () => {
    const { defineComponent, h } = await import('vue');
    const stub = defineComponent({
      name: 'ChevronRightIconStub',
      props: ['cls'],
      render() {
        return h('span', { class: 'chevron-stub' });
      },
    });
    return new Proxy(
      { default: stub },
      {
        get(target, key) {
          if (key in target) return (target as Record<string | symbol, unknown>)[key];
          return undefined;
        },
        has() {
          return true;
        },
      },
    );
  },
);

// UButton + UIcon: minimal stubs that forward attrs/listeners. We only care
// that the rendered text and click bubbling work — not Nuxt UI's full theming.
const UButtonStub = defineComponent({
  name: 'UButtonStub',
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    return () =>
      h(
        'button',
        {
          class: ['ubutton-stub', attrs.class],
          onClick: attrs.onClick,
        },
        [slots.default ? slots.default() : null, slots.trailing ? slots.trailing() : null],
      );
  },
});

const UIconStub = defineComponent({
  name: 'UIconStub',
  props: ['name'],
  render() {
    return h('span', { class: 'uicon-stub', 'data-name': this.name });
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Mount setup
// ─────────────────────────────────────────────────────────────────────────

import UnableCategoryCard from '../Placeholders/UnableCategoryCard.vue';

const baseProps = {
  category: {
    categoryCode: 'C',
    categoryDescription: 'Económico',
    categoryModels: [],
    totalAmount: 999999999,
    estimatedTotalAmount: 999999999,
    vehicleDayCharge: 0,
    numberDays: 3,
    taxFeeAmount: 0,
    taxFeePercentage: 0,
    IVAFeeAmount: 0,
    coverageUnitCharge: 0,
    coverageQuantity: 0,
    coverageTotalAmount: 0,
    totalCoverageUnitCharge: 0,
    referenceToken: '',
    rateQualifier: '',
  },
  vehicleCategory: {
    descripcion_corta: 'Chevrolet Spark',
    descripcion_larga: '',
    modelos: [],
  },
};

function mountCard() {
  return mount(UnableCategoryCard, {
    // Cast: vue-tsc resolves the .vue's prop type to the strict CategoryProps
    // (categoryCode is a literal union, not `string`). The test fixture is
    // intentionally minimal — `as unknown as` avoids dragging the full type
    // surface into a test that only verifies render + click behavior.
    props: baseProps as unknown as InstanceType<typeof UnableCategoryCard>['$props'],
    global: {
      plugins: [createPinia()],
      stubs: {
        UButton: UButtonStub,
        UIcon: UIconStub,
        // Override the resolved async component by name. The SFC binds it as
        // `Carrusel` via `defineAsyncComponent(() => import('../Carrusel.vue'))`,
        // so name-based stubbing prevents the real Carrusel module from
        // running its UCarousel slot logic during mount (and avoids the
        // unhandled rejection from the async import resolving post-teardown).
        Carrusel: true,
        ChevronRightIcon: true,
      },
    },
  });
}

describe('UnableCategoryCard mount — observable behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD));
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }));
    vi.stubGlobal('useUnavailabilityContext', stubbedUnavailabilityContext);
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the banner with "No disponible" title and the bannerText reason', () => {
    const wrapper = mountCard();
    const banner = wrapper.find('.bg-red-50.border-l-4.border-red-500');
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain('No disponible');
    expect(banner.text()).toContain('12 de mayo');
    expect(banner.text()).toContain('Bogotá Aeropuerto');
  });

  it('renders both CTAs by accessible label', () => {
    const wrapper = mountCard();
    const labels = wrapper.findAll('button').map((b) => b.text().trim());
    expect(labels.some((l) => l.includes('Probar otras fechas'))).toBe(true);
    expect(labels.some((l) => l.includes('Probar otra sucursal cercana'))).toBe(true);
  });

  it('does NOT render the legacy red pill (bg-red-100)', () => {
    const wrapper = mountCard();
    expect(wrapper.html()).not.toContain('bg-red-100');
  });

  it('does NOT render any Solicitar/Reservar/Cotizar CTA inside the card', () => {
    const wrapper = mountCard();
    const html = wrapper.html();
    expect(html).not.toMatch(/Solicitar reserva/);
    expect(html).not.toMatch(/Reservar/);
    expect(html).not.toMatch(/Cotizar/);
  });

  it('CTA click invokes scrollIntoView on #searcher with smooth behavior', async () => {
    const scrollSpy = vi.fn();
    const fakeAnchor = { scrollIntoView: scrollSpy } as unknown as HTMLElement;
    vi.spyOn(document, 'getElementById').mockReturnValue(fakeAnchor);

    const wrapper = mountCard();
    const probarFechas = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Probar otras fechas'));
    expect(probarFechas).toBeDefined();

    await probarFechas!.trigger('click');

    expect(document.getElementById).toHaveBeenCalledWith('searcher');
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', block: 'start' }),
    );
  });

  it('does NOT render any aria-expanded toggle (legacy accordion gone)', () => {
    const wrapper = mountCard();
    expect(wrapper.findAll('[aria-expanded]').length).toBe(0);
  });
});
