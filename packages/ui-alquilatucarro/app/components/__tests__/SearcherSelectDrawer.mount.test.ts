// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ref, computed } from 'vue';
import SearcherSelectDrawer from '../SearcherSelectDrawer.vue';

// The .vue uses bare `ref`/`computed` (Nuxt auto-imports them). Vitest doesn't
// run Nuxt's auto-import scan, so expose the real Vue functions as globals.
beforeAll(() => {
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('computed', computed);
});
afterAll(() => {
    vi.unstubAllGlobals();
});

// @nuxt/ui + project Icon components aren't registered outside Nuxt, so stub the
// presentation primitives down to plain elements. We assert the DATA contract
// (selected label, filtering, selection event, drawer close) — NOT styling — so
// these scenarios survive purely visual tweaks (font size, alignment, etc.).
const stubs = {
    UFormField: { template: '<div><slot /></div>' },
    UButton: {
        emits: ['click'],
        template: '<button class="trigger" @click="$emit(\'click\')"><slot name="leading" /><slot /></button>',
    },
    USlideover: {
        props: ['open'],
        emits: ['update:open'],
        // Render the body slot only while open, mirroring the real overlay.
        template: '<div v-if="open" class="drawer"><slot name="body" /></div>',
    },
    UInput: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<input class="search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    UIcon: { template: '<span class="icon" />' },
    IconsLocationIcon: { template: '<span />' },
    IconsClockIcon: { template: '<span />' },
    IconsSearchIcon: { template: '<span />' },
};

const branches = [
    { code: 'BOG-A', name: 'Bogotá Aeropuerto' },
    { code: 'MED-P', name: 'Medellín El Poblado' },
    { code: 'CAL-A', name: 'Cali Aeropuerto' },
];

const factory = (props = {}) =>
    mount(SearcherSelectDrawer, {
        props: {
            modelValue: null,
            items: branches,
            valueKey: 'code',
            labelKey: 'name',
            label: 'Lugar de recogida',
            title: 'Lugar de recogida',
            placeholder: 'Selecciona la sucursal',
            searchPlaceholder: 'Buscar sucursal',
            iconType: 'location',
            ...props,
        },
        global: { stubs },
    });

// Option rows are the only real <button> with class "relative"; the trigger stub
// uses class "trigger". Scope by that to ignore the trigger.
const optionButtons = (wrapper: ReturnType<typeof factory>) =>
    wrapper.findAll('button.relative');

describe('SearcherSelectDrawer', () => {
    it('shows the placeholder when no value is selected', () => {
        const w = factory();
        expect(w.find('.trigger').text()).toContain('Selecciona la sucursal');
    });

    it('shows the selected item label when a value is set', () => {
        const w = factory({ modelValue: 'MED-P' });
        expect(w.find('.trigger').text()).toContain('Medellín El Poblado');
    });

    it('opens the drawer and lists every item', async () => {
        const w = factory();
        expect(w.find('.drawer').exists()).toBe(false);
        await w.find('.trigger').trigger('click');
        await flushPromises();
        expect(w.find('.drawer').exists()).toBe(true);
        expect(optionButtons(w)).toHaveLength(branches.length);
    });

    it('filters the options by the search query (case-insensitive)', async () => {
        const w = factory();
        await w.find('.trigger').trigger('click');
        await flushPromises();
        await w.find('input.search').setValue('medell');
        const opts = optionButtons(w);
        expect(opts).toHaveLength(1);
        expect(opts[0]!.text()).toContain('Medellín El Poblado');
    });

    it('emits update:modelValue with the valueKey and closes on selection', async () => {
        const w = factory();
        await w.find('.trigger').trigger('click');
        await flushPromises();
        await optionButtons(w)[1]!.trigger('click');
        expect(w.emitted('update:modelValue')?.[0]).toEqual(['MED-P']);
        // drawer closes after selecting
        expect(w.find('.drawer').exists()).toBe(false);
    });

    it('resets the query when the drawer closes', async () => {
        const w = factory();
        await w.find('.trigger').trigger('click');
        await flushPromises();
        await w.find('input.search').setValue('cali');
        expect(optionButtons(w)).toHaveLength(1);
        // reopen → query cleared → all items again
        await optionButtons(w)[0]!.trigger('click'); // selects + closes
        await w.find('.trigger').trigger('click'); // reopen
        await flushPromises();
        expect(optionButtons(w)).toHaveLength(branches.length);
    });
});
