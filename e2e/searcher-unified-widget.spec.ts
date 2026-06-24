import { test, expect, type Page, type Locator } from '@playwright/test';

// Holdout: docs/specs/2026-06-22-searcher-unified-widget/scenarios/
//          searcher-unified-widget.scenarios.md
// Design:  docs/specs/2026-06-22-searcher-unified-widget-design.md
//
// Native mobile <select> (lugar/hora) and <input type="date"> were removed in
// all 3 brands and replaced by full-screen @nuxt/ui drawers (u-slideover
// side=bottom, h-dvh): lugar/hora via SearcherSelectDrawer (trigger button +
// non-autofocus search + option buttons), dates via a slideover with u-calendar.
// Desktop keeps the u-select-menu + u-popover/u-calendar widget unchanged.
//
// SUPERSEDES the native-mobile contract:
//   - e2e/searcher-mobile-label-click.spec.ts (native select#pickup-location-mobile
//     + input#pickup-date-mobile) — DELETED, those elements no longer exist.
//   - e2e/searcher-mobile-date-no-clear.spec.ts (native date no-clear guard) —
//     DELETED, superseded by SCEN-011 (the calendar drawer has no clear affordance).
//   - searcher-calendar-autoclose's "SCEN-004: Móvil intacto" (native input) — the
//     mobile assertion in e2e/searcher-calendar-autoclose.spec.ts is updated to the
//     drawer-trigger equivalent; the desktop popover autoclose tests stay intact.

// ── Brand entry divergence ──────────────────────────────────────────────────
// alquilatucarro / alquicarros: <Searcher> renders INLINE on the city page /{city}.
// alquilame (reskin F3, issue #112): the city hero is marketing; the Searcher
// engine lives on the centralized /reservas page. We navigate straight there.
const SEARCHER_HERO = process.env.BRAND === 'alquilame' ? '/reservas' : '/bogota';

// Two <Searcher> instances render in CityPage.vue: a desktop column (hidden
// lg:flex) and a mobile column (lg:hidden). At mobile viewport the .last() one
// (mobile column) is the visible instance — same .first()/.last() convention as
// e2e/searcher-calendar-autoclose.spec.ts. Each instance contains BOTH the mobile
// drawer triggers (sm:hidden) and the desktop fields (hidden sm:block); the sm:
// breakpoint inside Searcher decides which is visible at a given viewport.

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

/** Resolve the visible mobile searcher field by testid (the .last() instance). */
function mobileField(page: Page, testid: string): Locator {
  return page.getByTestId(testid).last();
}

/** Reveal the searcher: alquilame's /reservas mounts it inline; defensively, if
 *  the pickup-location trigger isn't visible, click a "Reservar ahora" CTA. */
async function revealSearcher(page: Page): Promise<void> {
  const trigger = mobileField(page, 'pickup-location-test');
  try {
    await trigger.waitFor({ state: 'visible', timeout: 3000 });
    return;
  } catch {
    const cta = page.getByRole('link', { name: /reservar ahora/i }).first();
    if (await cta.isVisible().catch(() => false)) {
      await cta.click();
      await page.waitForLoadState('networkidle');
      await trigger.waitFor({ state: 'visible', timeout: 8000 });
    } else {
      await trigger.waitFor({ state: 'visible', timeout: 8000 });
    }
  }
}

/** A future, enabled, non-selected calendar day cell. */
const AVAILABLE_DAY =
  '[role="dialog"] [data-reka-calendar-cell-trigger]:not([data-disabled]):not([data-unavailable]):not([data-outside-view]):not([data-selected])';

/** `#pickup-date` / `#return-date` are hidden <input> elements that mirror the
 *  store-backed date in ISO ("YYYY-MM-DD"). They live in the desktop variant
 *  (hidden at mobile viewport via `hidden sm:block`) but stay in the DOM and
 *  reflect the SAME store ref the mobile drawer writes — a locale-independent,
 *  observable proxy for the store value. */
async function readDateISO(page: Page, inputId: string): Promise<string> {
  return (await page.locator(`#${inputId}`).first().getAttribute('value')) || '';
}

// ── Mobile drawer scenarios ───────────────────────────────────────────────────
test.describe('Searcher unified widget — mobile drawers', () => {
  test.use({ viewport: MOBILE });

  test.beforeEach(async ({ page }) => {
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');
    await revealSearcher(page);
  });

  test('SCEN-006/007: lugar/hora vía drawer full-screen sin <select> nativo', async ({ page }) => {
    // No native <select> anywhere in the searcher view.
    await expect(page.locator('select')).toHaveCount(0);

    const trigger = mobileField(page, 'pickup-location-test');
    await expect(trigger).toBeVisible();

    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Full-height bottom sheet (h-dvh): dialog height ≈ viewport height.
    await expect(dialog).toHaveAttribute('data-side', 'bottom');
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(MOBILE.height * 0.85);

    // Search input is NOT autofocused on open (no involuntary keyboard).
    const search = page.getByTestId('pickup-location-test-search');
    await expect(search).toBeVisible();
    const searchIsFocused = await search.evaluate(
      (el) => el === document.activeElement,
    );
    expect(searchIsFocused).toBe(false);

    // Typing filters the option list down. The first button[type=button] is the
    // slideover close affordance (empty label) — filter to the labelled options.
    const optionButtons = dialog.locator('button[type="button"]').filter({ hasText: /\S/ });
    const countBefore = await optionButtons.count();
    expect(countBefore).toBeGreaterThan(1);

    const firstLabel = (await optionButtons.first().innerText()).trim();
    await search.fill(firstLabel.slice(0, Math.min(4, firstLabel.length)));
    await expect
      .poll(async () => optionButtons.count())
      .toBeLessThanOrEqual(countBefore);

    // Selecting an option closes the dialog and the trigger reflects the choice.
    const chosen = (await optionButtons.first().innerText()).trim();
    await optionButtons.first().click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toContainText(chosen);
  });

  test('SCEN-007: hora vía drawer con buscador — store en formato 24h', async ({ page }) => {
    await expect(page.locator('select')).toHaveCount(0);

    const trigger = mobileField(page, 'pickup-hour-test');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The search input is present and not autofocused.
    const search = page.getByTestId('pickup-hour-test-search');
    await expect(search).toBeVisible();
    expect(await search.evaluate((el) => el === document.activeElement)).toBe(false);

    // Filter to the 3:00 pm slot and pick it. formatHumanTime renders "3:00 p. m."
    // (with NBSP); match on the locale-stable "3:00" prefix instead.
    await search.fill('3:00 p');
    const option = dialog.locator('button[type="button"]', { hasText: /3:00/ }).first();
    await expect(option).toBeVisible();
    const optionText = (await option.innerText()).trim();
    await option.click();

    await expect(dialog).toBeHidden();
    // Trigger shows the human label (observable proxy of store horaRecogida=15:00).
    await expect(trigger).toContainText(optionText);
    await expect(trigger).toContainText('3:00');
  });

  test('SCEN-001/002: fecha vía slideover con u-calendar, sin input[type=date]', async ({ page }) => {
    // No native date input anywhere.
    await expect(page.locator('input[type="date"]')).toHaveCount(0);

    const trigger = mobileField(page, 'pickup-date-mobile-trigger');
    await expect(trigger).toBeVisible();
    const labelBefore = (await trigger.innerText()).trim();

    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-side', 'bottom');
    await expect(dialog.getByRole('grid')).toHaveCount(1);

    const day = page.locator(AVAILABLE_DAY).first();
    const targetISO = await day.getAttribute('data-value');
    expect(targetISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await day.click();

    await expect(dialog).toBeHidden();
    // Trigger now shows a (different) formatted date; store mirror = clicked ISO.
    await expect(trigger).not.toHaveText(labelBefore);
    expect(await readDateISO(page, 'pickup-date')).toBe(targetISO);

    // SCEN-002: the return date slideover is independent and also works.
    const returnTrigger = mobileField(page, 'return-date-mobile-trigger');
    await returnTrigger.scrollIntoViewIfNeeded();
    await returnTrigger.click();
    const returnDialog = page.getByRole('dialog');
    await expect(returnDialog).toBeVisible();
    await expect(returnDialog.getByRole('grid')).toHaveCount(1);
    const returnDay = page.locator(AVAILABLE_DAY).first();
    const returnISO = await returnDay.getAttribute('data-value');
    await returnDay.click();
    await expect(returnDialog).toBeHidden();
    expect(await readDateISO(page, 'return-date')).toBe(returnISO);
  });

  test('SCEN-003: un solo calendario — sin calendario fantasma portaleado', async ({ page }) => {
    const trigger = mobileField(page, 'pickup-date-mobile-trigger');
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Exactly ONE calendar grid in the DOM (the desktop popover must NOT also
    // render its portaled calendar at mobile viewport — the prototype bug).
    await expect(page.getByRole('grid')).toHaveCount(1);
  });

  test('SCEN-004: body recupera interactividad tras 3 ciclos abrir/cerrar', async ({ page }) => {
    const pickupTrigger = mobileField(page, 'pickup-date-mobile-trigger');
    const returnTrigger = mobileField(page, 'return-date-mobile-trigger');
    const searchButton = page.getByRole('link', { name: /BUSCAR/i }).last();

    for (let i = 0; i < 3; i++) {
      // Open + close pickup (close via day selection).
      await pickupTrigger.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.locator(AVAILABLE_DAY).first().click();
      await expect(page.getByRole('dialog')).toBeHidden();
      await assertBodyUnlocked(page, searchButton);

      // Open + close return (close via the slideover "Cerrar" / Escape).
      await returnTrigger.scrollIntoViewIfNeeded();
      await returnTrigger.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
      await assertBodyUnlocked(page, searchButton);
    }
  });

  test('SCEN-008: días pasados deshabilitados (reemplaza el clamp nativo)', async ({ page }) => {
    // Structural: no native date input ⇒ no Android dark-mode validation balloon.
    await expect(page.locator('input[type="date"]')).toHaveCount(0);

    const trigger = mobileField(page, 'pickup-date-mobile-trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Disabled cells (past days / closed days) exist and a click does not change
    // the date mirror. min-value disables days before minPickupDate.
    const before = await readDateISO(page, 'pickup-date');
    const disabled = dialog
      .locator('[data-reka-calendar-cell-trigger][data-disabled]')
      .first();
    if (await disabled.count()) {
      await disabled.click({ force: true }).catch(() => {});
      expect(await readDateISO(page, 'pickup-date')).toBe(before);
    }
  });

  test('SCEN-009: devolución auto +7 días y badge consistente', async ({ page }) => {
    const pickupTrigger = mobileField(page, 'pickup-date-mobile-trigger');
    await pickupTrigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const day = page.locator(AVAILABLE_DAY).first();
    const pickupISO = await day.getAttribute('data-value');
    expect(pickupISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await day.click();
    await expect(dialog).toBeHidden();

    // Return auto-set to pickup + 7 days (useSearch watcher).
    const [py, pm, pd] = pickupISO!.split('-').map((n) => parseInt(n, 10));
    const ret = new Date(py, pm - 1, pd);
    ret.setDate(ret.getDate() + 7);
    const expectedReturnISO =
      `${ret.getFullYear()}-` +
      `${String(ret.getMonth() + 1).padStart(2, '0')}-` +
      `${String(ret.getDate()).padStart(2, '0')}`;

    await expect
      .poll(() => readDateISO(page, 'return-date'))
      .toBe(expectedReturnISO);

    // Badge shows "7 días" (the brand-colored day-count badge). The badge renders
    // in every Searcher instance/column; assert at least one VISIBLE match at this
    // viewport (the desktop-column instance is hidden via `hidden lg:flex`).
    await expect(page.getByText(/^7 días$/).locator('visible=true').first()).toBeVisible();
  });

  test('SCEN-011: el campo de fecha nunca queda en blanco al cerrar sin elegir', async ({ page }) => {
    const trigger = mobileField(page, 'pickup-date-mobile-trigger');
    const labelBefore = (await trigger.innerText()).trim();
    const isoBefore = await readDateISO(page, 'pickup-date');

    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    // Trigger keeps the previous date; store mirror unchanged.
    await expect(trigger).toHaveText(labelBefore);
    expect(await readDateISO(page, 'pickup-date')).toBe(isoBefore);
  });

  test('SCEN-014: marca — cero <select> y cero input[type=date], badge con color de marca', async ({ page }) => {
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.locator('input[type="date"]')).toHaveCount(0);

    // Brand-colored day badge: lime+black for alquilatucarro/alquicarros,
    // red-600+white for alquilame. Set a pickup date to surface the badge.
    const trigger = mobileField(page, 'pickup-date-mobile-trigger');
    await trigger.click();
    await page.locator(AVAILABLE_DAY).first().click();
    await expect(page.getByRole('dialog')).toBeHidden();

    const badge = page.getByText(/\d+ días?$/).locator('visible=true').first();
    await expect(badge).toBeVisible();
    const expectedClass =
      process.env.BRAND === 'alquilame' ? /bg-red-600/ : /bg-\[#a3f78b\]/;
    await expect(badge).toHaveClass(expectedClass);
  });
});

/** body must not be left inert after a slideover closes (regression #25), and
 *  the BUSCAR link stays clickable. */
async function assertBodyUnlocked(page: Page, searchButton: Locator): Promise<void> {
  const lock = await page.evaluate(() => ({
    pe: document.body.style.pointerEvents,
    scrollLocked: document.body.hasAttribute('data-scroll-locked'),
  }));
  expect(lock.pe === '' || lock.pe === undefined).toBe(true);
  expect(lock.scrollLocked).toBe(false);
  await expect(searchButton).toBeEnabled();
}

// ── Desktop scenario ──────────────────────────────────────────────────────────
test.describe('Searcher unified widget — desktop sin regresión', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await page.goto(SEARCHER_HERO);
    await page.waitForLoadState('networkidle');
  });

  test('SCEN-005: popover/segmentos/select-menu desktop; triggers móviles ocultos', async ({ page }) => {
    // Desktop date segments present; mobile drawer triggers hidden at this viewport.
    await expect(page.locator('#pickup-date').first()).toBeVisible();
    await expect(page.locator('#return-date').first()).toBeVisible();
    await expect(page.getByTestId('pickup-date-mobile-trigger').first()).toBeHidden();
    await expect(page.getByTestId('pickup-location-test').first()).toBeHidden();

    // Desktop USelectMenu triggers present.
    await expect(page.getByTestId('pickup-location-desktop-test').first()).toBeVisible();

    // The desktop calendar popover opens and selecting a day closes it.
    const popoverTrigger = page
      .locator('button[aria-label="Seleccione una día de recogida"]')
      .first();
    await popoverTrigger.click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveCount(1);
    await page.locator(AVAILABLE_DAY).first().click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    // Date mirror updated.
    expect(await readDateISO(page, 'pickup-date')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── Home city selector (SelectBranch) ─────────────────────────────────────────
// alquilatucarro: SelectBranch INLINE in the home hero.
// alquilame / alquicarros: SelectBranch lives inside a Fleet-section modal CTA
// ("Ver disponibilidad") — click it to reveal the selector.
test.describe('SelectBranch home — drawer móvil + navegación', () => {
  test.use({ viewport: MOBILE });

  // alquilatucarro: SelectBranch is inline in the home hero → the trigger is
  // already present. alquilame/alquicarros: it lives inside a Fleet-section modal
  // CTA ("Ver disponibilidad", lazy-hydrated below the fold) → scroll the CTA into
  // view, click it to open the modal, then the trigger becomes visible.
  async function revealSelectBranch(page: Page): Promise<Locator> {
    const selector = page.locator('#select-branch-mobile');
    if (await selector.isVisible().catch(() => false)) return selector;

    const cta = page.getByRole('button', { name: /ver disponibilidad/i }).first();
    if (await cta.count()) {
      await cta.scrollIntoViewIfNeeded();
      await expect(cta).toBeVisible();
      await cta.click();
    }
    await selector.waitFor({ state: 'visible', timeout: 8000 });
    return selector;
  }

  test('SCEN-016: selector de ciudad es <button>, drawer full-screen, navega al elegir', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const selector = await revealSelectBranch(page);

    // No native <select> in the home selector; trigger is a <button>.
    await expect(page.locator('#select-branch-mobile')).toHaveJSProperty(
      'tagName',
      'BUTTON',
    );
    await expect(selector).toBeVisible();

    await selector.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-side', 'bottom');

    // "Buscar ciudad" search present and NOT autofocused.
    const search = dialog.getByPlaceholder('Buscar ciudad');
    await expect(search).toBeVisible();
    expect(await search.evaluate((el) => el === document.activeElement)).toBe(false);

    // Selecting a city navigates to that city's reservation route. The first
    // button[type=button] in the dialog is the slideover close affordance (empty
    // label); the city options carry the branch name — filter to a labelled one.
    const cityButton = dialog
      .locator('button[type="button"]')
      .filter({ hasText: /\S/ })
      .first();
    await expect(cityButton).toBeVisible();
    await cityButton.click();
    await page.waitForURL(/\/[^/]+\/buscar-vehiculos\//, { timeout: 15000 });
    expect(page.url()).toMatch(/\/buscar-vehiculos\//);
  });
});
