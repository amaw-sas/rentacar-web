import { test, expect } from '@playwright/test';

// Holdout SCEN-001 from
// docs/specs/2026-05-06-faqs-supabase-migration/scenarios/faqs-supabase-migration.scenarios.md
//
// SCEN-001: with the 11 FAQs living in Supabase (Step 7 backfill), `/` must
// serve server-rendered HTML containing the labels and content fragments
// in display_order. We assert by concrete body content to resist reward
// hacking — flipping a flag or rendering via CSR does not satisfy; the
// text must be present in the initial HTML response.
//
// SCEN-002 (inactive rows are filtered) and SCEN-008 (grep guard against
// useAppConfig().faqs) are verified outside Playwright:
//   - SCEN-002: pre-insert a row with status='inactive' via Supabase MCP,
//     curl /, assert the label is absent, delete the row.
//   - SCEN-008: `git grep -nE "useAppConfig\(\)\.faqs|appConfig\.faqs"
//     packages/` returns no matches (exit 1). CI gate.

test.describe('FAQs content from Supabase (#12, holdout SCEN-001)', () => {
  test('SCEN-001: home HTML contains the first three FAQs in display_order with content', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);

    // display_order = 0 — first FAQ label
    await expect(
      page.getByText('¿Cómo puedo hacer una reserva?', { exact: false }),
    ).toBeVisible();

    // display_order = 1 — second FAQ label
    await expect(
      page.getByText('¿Se puede realizar un alquiler de carros sin tarjeta de crédito?', { exact: false }),
    ).toBeVisible();

    // display_order = 2 — third FAQ label
    await expect(
      page.getByText('¿No tengo todo el cupo en la tarjeta, puedo hacer la reserva?', { exact: false }),
    ).toBeVisible();

    // Fragment of the FAQ #0 content body — confirms `content` field
    // traveled through Supabase → transformer → endpoint → composable → page,
    // not just the label.
    await expect(
      page.getByText('Para realizar un alquiler de carros debe generar una reserva', { exact: false }),
    ).toBeVisible();
  });

  test('SCEN-001: order preservation — label[0] appears before label[1] in HTML', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const html = await response!.text();

    const idx0 = html.indexOf('¿Cómo puedo hacer una reserva?');
    const idx1 = html.indexOf('¿Se puede realizar un alquiler de carros sin tarjeta de crédito?');
    const idx2 = html.indexOf('¿No tengo todo el cupo en la tarjeta, puedo hacer la reserva?');

    expect(idx0).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeGreaterThan(idx0);
    expect(idx2).toBeGreaterThan(idx1);
  });

  test('SCEN-001: #faqs section is populated with at least 11 accordion items', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('section#faqs');
    await expect(section).toBeVisible();

    // UAccordion renders one button per item with data-state attribute.
    // The exact selector for an accordion trigger in @nuxt/ui v4 is
    // [data-orientation] button or similar; using a class-agnostic query
    // makes the test robust to minor UI library updates.
    const triggers = section.locator('button[aria-expanded]');
    await expect(triggers).toHaveCount(11);
  });
});
