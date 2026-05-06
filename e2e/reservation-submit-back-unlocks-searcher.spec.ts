import { test, expect, type Page } from '@playwright/test';

/**
 * Holdout: docs/specs/2026-05-06-searcher-back-from-reservado/scenarios/
 *          searcher-back-from-reservado.scenarios.md
 * Issue:   https://github.com/amaw-sas/rentacar-web/issues/25
 *
 * Validates the two-layer fix for the post-reservation Back-button bug:
 *
 *   Layer 1 (root cause): onBeforeRouteLeave in CategorySelectionSection.vue
 *   closes the resume + form slideovers before route unmount, so reka-ui
 *   Dialog modal lock cleanup runs (v-model:open transitions to false). This
 *   prevents `pointer-events: none` from leaking onto the shared <body>.
 *
 *   Layer 2 (defense): Searcher.vue.onMounted sanitizes any stale body lock
 *   on remount. Belt-and-suspenders for any future leak path.
 *
 * The pre-existing pageshow handler (Searcher.vue:357) is dead code in the
 * SPA back-nav flow (pageshow does not fire); validated runtime via
 * /agent-browser. It still covers the rare bfcache cross-document case.
 *
 * Backend dependency: Layer 1 e2e validation requires real categories
 * rendered (admin availability backend). When unavailable, SCEN-001 skips —
 * mirror of e2e/reservation-back-url-cleanup.spec.ts:51 convention.
 */

const searchPath =
  '/bogota/buscar-vehiculos' +
  '/lugar-recogida/bogota-aeropuerto' +
  '/lugar-devolucion/bogota-aeropuerto' +
  '/fecha-recogida/2026-05-10' +
  '/fecha-devolucion/2026-05-12' +
  '/hora-recogida/10:00am' +
  '/hora-devolucion/10:00am';

/**
 * Reads the first category code rendered as a `Grupo X (...)` button.
 * Same pattern as e2e/reservation-back-url-cleanup.spec.ts. Returns null
 * when no category card is visible — used to skip backend-dependent flows.
 */
async function firstAvailableCategoryCode(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(
      (b) => b.textContent ?? '',
    );
    for (const text of buttons) {
      const m = text.match(/Grupo\s+([A-Z0-9]+)\s*\(/);
      if (m) return m[1];
    }
    return null;
  });
}

/**
 * Faithful simulation of the post-submit-success code path in
 * useStoreReservationForm.ts:225-250 (submitForm):
 *   stripReservarParam() → navigateTo({ path: '/reservado/<code>' })
 *
 * Replicated client-side via page.evaluate so the test does not depend on
 * filling a valibot-validated form nor on the admin record endpoint. The
 * slideovers' v-model refs in CategorySelectionSection.vue stay `true` until
 * the route unmount — exactly the production state that triggers the leak.
 */
async function simulatePostSubmitNavigation(page: Page, reserveCode: string) {
  await page.evaluate((code) => {
    const cleanPath = window.location.pathname.replace(/\/categoria\/[^/]+$/, '');
    window.history.replaceState(window.history.state, '', cleanPath);
    const nuxtApp = (window as unknown as {
      useNuxtApp(): { $router: { push: (p: string) => Promise<unknown> } };
    }).useNuxtApp();
    return nuxtApp.$router.push(`/reservado/${code}`);
  }, reserveCode);
}

test.describe('Reservation submit → Back unlocks Searcher (issue #25) — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('SCEN-001: body interactivo y Searcher responde tras submit-Back', async ({
    page,
  }) => {
    // 1. Land on the search page. We avoid `networkidle` because the dev
    //    server may keep retrying admin requests when credentials missing —
    //    instead, wait for either category cards or a known empty-state.
    await page.goto(searchPath);
    await page.waitForLoadState('domcontentloaded');

    // Wait briefly for category cards or the empty-inventory message to
    // settle. If neither appears within the budget, skip the backend-
    // dependent assertions (same convention as reservation-back-url-cleanup
    // .spec.ts:51).
    const code = await Promise.race([
      page
        .waitForFunction(
          () =>
            Array.from(document.querySelectorAll('button')).some((b) =>
              /Grupo\s+[A-Z0-9]+\s*\(/.test(b.textContent ?? ''),
            ),
          { timeout: 15_000 },
        )
        .then(() => firstAvailableCategoryCode(page))
        .catch(() => null),
      page.waitForTimeout(15_000).then(() => null),
    ]);

    test.skip(
      !code,
      'Sin categorías renderizadas (admin de availability no disponible)',
    );

    // 2. Force the URL state that auto-opens both slideovers (resume + form)
    //    via the watcher in CategorySelectionSection.vue:345-381. Same
    //    baseline as reservation-back-url-cleanup.spec.ts.
    await page.goto(`${searchPath}/categoria/${code}?reservar=${code}`);
    await page.waitForLoadState('domcontentloaded');

    // Sanity baseline: dialog visible, body locked by Reka UI Dialog.
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect
      .poll(
        () =>
          page.evaluate(
            () => window.getComputedStyle(document.body).pointerEvents,
          ),
        { timeout: 5_000 },
      )
      .toBe('none');

    // 3. Simulate the post-submit-success navigation: slideover refs stay
    //    `true` until the route unmount — Layer 1 must close them in
    //    onBeforeRouteLeave or the lock leaks.
    const reserveCode = 'TEST123';
    await simulatePostSubmitNavigation(page, reserveCode);
    await page.waitForURL(new RegExp(`/reservado/${reserveCode}$`), {
      timeout: 10_000,
    });

    // 4. SPA back — popstate without pageshow.
    await page.goBack();
    await page.waitForURL(/buscar-vehiculos/, { timeout: 10_000 });

    // 5. Body must be interactive (the central assertion).
    await expect
      .poll(
        () =>
          page.evaluate(
            () => window.getComputedStyle(document.body).pointerEvents,
          ),
        { timeout: 10_000 },
      )
      .not.toBe('none');

    // 6. No residual visible Dialog from the leaked slideover.
    expect(await page.locator('[role="dialog"]:visible').count()).toBe(0);

    // 7. Pickup-location select responds to a click — proves widgets are
    //    actually usable, not just visually present.
    const pickupSelect = page
      .locator('[data-testid="pickup-location-test"]')
      .first();
    await expect(pickupSelect).toBeVisible({ timeout: 10_000 });
    await pickupSelect.click();
    await expect(page.locator('[role="listbox"]').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('SCEN-002: Searcher mount sanitiza body sucio (defensa Layer 2)', async ({
    page,
  }) => {
    // Inject pointer-events: none on body BEFORE any page mount, simulating
    // a leak from any hypothetical future path that bypasses Layer 1. The
    // Searcher's defensive cleanup in onMounted must restore interactivity.
    await page.addInitScript(() => {
      const apply = () => {
        if (document.body) {
          document.body.style.pointerEvents = 'none';
          document.body.setAttribute('data-scroll-locked', '1');
        }
      };
      if (document.body) apply();
      else document.addEventListener('DOMContentLoaded', apply, { once: true });
    });

    // Capture browser console warnings — Layer 2 must log when it cleans.
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'warn') {
        warnings.push(msg.text());
      }
    });

    await page.goto(searchPath);
    await page.waitForLoadState('domcontentloaded');

    // Wait for the Searcher component to be mounted before polling body
    // state — its onMounted hook is the actor we're testing. Both desktop
    // and mobile Searcher instances render at every viewport (CityPage:79+91);
    // either's mount triggers the cleanup so we wait for any visible.
    await page.locator('[data-testid="pickup-location-test"]').first().waitFor({
      state: 'attached',
      timeout: 15_000,
    });

    // Body must be unlocked after Searcher mount.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => window.getComputedStyle(document.body).pointerEvents,
          ),
        { timeout: 20_000, intervals: [100, 250, 500, 1000] },
      )
      .toBe('auto');

    // data-scroll-locked must be removed.
    expect(
      await page.evaluate(() =>
        document.body.hasAttribute('data-scroll-locked'),
      ),
    ).toBe(false);

    // Traceability: Layer 2 emits a warning when it acts.
    const cleanupWarning = warnings.find((w) =>
      /Searcher.*body|body.*Searcher|stale.*lock|stale.*body/i.test(w),
    );
    expect(cleanupWarning).toBeDefined();
  });
});

test.describe('Reservation submit → Back unlocks Searcher (issue #25) — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('SCEN-005: móvil sin slideovers preserva body interactivo (no-regresión)', async ({
    page,
  }) => {
    await page.goto(searchPath);
    await page.waitForLoadState('domcontentloaded');

    // CityPage.vue:79+91 renders two <Searcher /> instances (desktop hidden
    // sm:block, mobile sm:hidden). At mobile viewport the desktop wrapper is
    // display:none so its #pickup-date-mobile is also hidden — pick `.last()`
    // for the mobile Searcher per e2e/searcher-calendar-autoclose.spec.ts:11
    // convention.
    await expect(page.locator('#pickup-date-mobile').last()).toBeVisible({
      timeout: 15_000,
    });

    // Body interactive (no slideover open here).
    await expect
      .poll(
        () =>
          page.evaluate(
            () => window.getComputedStyle(document.body).pointerEvents,
          ),
        { timeout: 5_000 },
      )
      .not.toBe('none');
  });
});
