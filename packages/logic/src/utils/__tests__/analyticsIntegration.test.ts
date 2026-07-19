import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BRANDS = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const;

function repoFile(relativePath: string): string {
  return fileURLToPath(new URL(`../../../../../${relativePath}`, import.meta.url));
}

function read(relativePath: string): string {
  return readFileSync(repoFile(relativePath), 'utf8');
}

describe('GA4 integration wiring', () => {
  it('uses the shared manual page-view tracker on every GA4-enabled brand', () => {
    const integrations = [
      ['ui-alquilatucarro', 'G-1G7MWTDK71'],
      ['ui-alquilame', 'G-ZPZC1TP9T0'],
    ] as const;

    for (const [brand, measurementId] of integrations) {
      const config = read(`packages/${brand}/nuxt.config.ts`);
      const plugin = read(`packages/${brand}/app/plugins/page-view.client.ts`);
      expect(config).toContain(
        `gtag('config','${measurementId}',{send_page_view:false})`,
      );
      expect(config.match(/googletagmanager\.com\/gtag\/js\?id=/g)).toHaveLength(1);
      expect(plugin).toContain(
        "import { createSpaPageViewTracker } from '@rentacar-main/logic/utils'",
      );
      expect(plugin).toContain("nuxtApp.hook('page:finish', trackFinalRoute)");
      expect(plugin).not.toContain('sanitizePageViewUrl');
    }

    expect(existsSync(repoFile('packages/ui-alquicarros/app/plugins/page-view.client.ts'))).toBe(false);
  });

  it('removes the narrow reservation-result sender to prevent duplicate page views', () => {
    expect(existsSync(repoFile('packages/logic/src/composables/useResultPageView.ts'))).toBe(false);
    for (const brand of BRANDS) {
      for (const page of [
        'app/pages/pendiente.vue',
        'app/pages/sindisponibilidad.vue',
        'app/pages/reservado/[reserveCode]/index.vue',
      ]) {
        expect(read(`packages/${brand}/${page}`)).not.toContain('useResultPageView');
      }
    }
  });

  it('installs the shared delegated contact contract on all brands', () => {
    for (const brand of BRANDS) {
      const plugin = read(`packages/${brand}/app/plugins/contact-analytics.client.ts`);
      expect(plugin).toContain('createContactClickHandler');
      expect(plugin).toContain("document.addEventListener('click', handler, true)");
    }
    const config = read('packages/ui-alquilatucarro/nuxt.config.ts');
    expect(config).not.toContain('clic_boton_whatsapp');
    expect(config).not.toContain('clic_boton_llamada');
  });

  it('wires every funnel stage at an authoritative transition', () => {
    expect(read('packages/logic/src/composables/useSearch.ts')).toContain(
      "trackAnalyticsEvent('rental_search'",
    );
    const searchStore = read('packages/logic/src/stores/useStoreSearchData.ts');
    expect(searchStore).toContain("trackAnalyticsEvent('view_item_list'");
    expect(searchStore).toContain("trackAnalyticsEvent('select_item'");
    expect(searchStore).toContain("trackAnalyticsEvent('begin_checkout'");
    expect(read('packages/logic/src/composables/useRecordReservationForm.ts')).toContain(
      "trackAnalyticsEvent('reservation_submit'",
    );
    expect(read('packages/logic/src/stores/useStoreReservationForm.ts')).toContain(
      "'reservation_confirmed'",
    );
  });

  it('routes chat open, first message, and quote receipt through the typed helper', () => {
    const chat = read('packages/logic/src/composables/useChatConversation.ts');
    expect(chat).toContain("trackAnalyticsEvent('chat_open'");
    expect(chat).toContain("trackAnalyticsEvent('chat_message_sent'");
    expect(chat).toContain("trackAnalyticsEvent('chat_quote_received'");
    expect(chat).not.toContain('function emitChatEvent');
  });
});
