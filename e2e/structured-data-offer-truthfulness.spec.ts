import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type JsonLdNode = Record<string, unknown>;

const readJsonLdNodes = async (page: Page) => {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();

  const nodes: JsonLdNode[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;

    const node = value as JsonLdNode;
    if (typeof node['@type'] === 'string') nodes.push(node);
    Object.values(node).forEach(visit);
  };

  for (const block of blocks) visit(JSON.parse(block));
  return nodes;
};

const byType = (nodes: JsonLdNode[], type: string) =>
  nodes.filter((node) => node['@type'] === type);

const byPriceAndCurrency = (
  left: { price: number; currency: string },
  right: { price: number; currency: string },
) => left.price - right.price || left.currency.localeCompare(right.currency);

test.describe('JSON-LD Offer truthfulness', () => {
  test('city output only emits offers backed by explicit visible offer elements', async ({ page }) => {
    const response = await page.goto('/bogota');
    expect(response?.status()).toBe(200);

    const nodes = await readJsonLdNodes(page);
    const directOffers = byType(nodes, 'Offer');
    const aggregateOffers = byType(nodes, 'AggregateOffer');
    const visibleOffers = await page.locator('[data-schema-offer-price]').evaluateAll(
      (elements) => elements.map((element) => ({
        price: Number(element.getAttribute('data-schema-offer-price')),
        currency: element.getAttribute('data-schema-offer-currency') ?? '',
      })),
    );

    // A future structured offer must opt into this 1:1 DOM contract. Global
    // seasonal rows are not page-visible city/date offers and have no marker.
    expect(visibleOffers.every(({ price, currency }) =>
      Number.isFinite(price) && price > 0 && currency.length > 0,
    )).toBe(true);

    if (aggregateOffers.length > 0) {
      expect(directOffers).toHaveLength(0);
      expect(aggregateOffers).toHaveLength(1);

      const aggregate = aggregateOffers[0]!;
      const visiblePrices = visibleOffers.map(({ price }) => price);
      expect(Number(aggregate.offerCount)).toBe(visibleOffers.length);
      expect(Number(aggregate.lowPrice)).toBe(Math.min(...visiblePrices));
      expect(Number(aggregate.highPrice)).toBe(Math.max(...visiblePrices));
      expect(visibleOffers.every(({ currency }) =>
        currency === aggregate.priceCurrency,
      )).toBe(true);
    } else {
      const structuredOffers = directOffers
        .map((offer) => ({
          price: Number(offer.price),
          currency: String(offer.priceCurrency ?? ''),
        }))
        .sort(byPriceAndCurrency);
      const sortedVisibleOffers = [...visibleOffers]
        .sort(byPriceAndCurrency);

      expect(structuredOffers).toEqual(sortedVisibleOffers);
    }

    expect(directOffers).toHaveLength(0);
    expect(aggregateOffers).toHaveLength(0);

    const cityService = byType(nodes, 'Service').find((node) =>
      String(node['@id']).includes('/bogota#vehicle-rental-booking-service'),
    );
    expect(cityService).toBeTruthy();
    expect(cityService).not.toHaveProperty('offers');
  });

  test('Alquilatucarro home keeps promotion copy visible without a fake promotion Offer', async ({ page }) => {
    test.skip((process.env.BRAND ?? 'alquilatucarro') !== 'alquilatucarro');

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.getByText('Hasta 60% de Descuento', { exact: true })).toBeVisible();

    const nodes = await readJsonLdNodes(page);
    const renderedJsonLd = JSON.stringify(nodes);

    expect(byType(nodes, 'Offer')).toHaveLength(0);
    expect(byType(nodes, 'AggregateOffer')).toHaveLength(0);
    expect(renderedJsonLd).not.toContain('#promotion');
    expect(renderedJsonLd).not.toContain('referenceQuantity');
  });
});
