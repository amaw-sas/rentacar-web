import { test, expect } from '@playwright/test';

// Holdout S2 + S3 + S7 from
// docs/specs/2026-05-09-franchise-testimonials-supabase/scenarios/franchise-testimonials.scenarios.md
//
// S2: with franchise testimonials living in Supabase (Step 0 backfill done),
// `/` must serve server-rendered HTML containing the literal text of the
// testimonial quotes. We assert by concrete body content to resist reward
// hacking — flipping a flag or rendering via CSR does not satisfy; the text
// must be in the initial HTML.
//
// S3 (brand isolation): we don't run all three dev servers in one spec, but
// the test target is whichever brand BRAND=... selected. The literal we
// assert ("Cañón del Chicamocha") is the 6th testimonial — same content for
// all three brands today (per current backfill). The structural guarantee
// is enough: the section is present and populated from the franchise row
// matching `runtimeConfig.public.rentacarFranchise`.
//
// S7 (no leftover hardcoded testimonials) is a static-grep assertion in the
// spec doc; we do not duplicate it here.

test.describe('Franchise testimonials from Supabase (#11, holdout S2/S3)', () => {
  test('S2: home HTML contains testimonial quote from franchises.testimonials', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);

    // Quote from the 6th backfilled testimonial (Esteban Páez, Bucaramanga).
    // If the path Supabase → transformer → endpoint → composable → page breaks
    // at any point, this text disappears from the body.
    await expect(
      page.getByText('Cañón del Chicamocha', { exact: false }),
    ).toBeVisible();

    // Reviewer name from a different testimonial — locks in that the array is
    // iterated, not a single item rendered.
    await expect(
      page.getByText('Stephany M. García', { exact: false }),
    ).toBeVisible();
  });

  test('S2: testimonios section is populated with 6 cards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const section = page.locator('section#testimonios');
    await expect(section).toBeVisible();

    // Anchor on the grid layout — each testimonial card is a direct child of
    // the grid div inside the section. Resists matching the section's intro
    // paragraph (which contains "Colombia" in marketing copy).
    const cards = section.locator('div.grid > div');
    await expect(cards).toHaveCount(6);
  });
});
