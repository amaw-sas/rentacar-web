/**
 * Dogfood high-severity fixes — regression sentinels.
 *
 * Encodes SCEN-004 of
 * docs/specs/alquilame-mobile-menu-and-touch-cta/scenarios/alquilame-mobile-menu-and-touch-cta.scenarios.md
 *
 * The user-observable behavior (SCEN-001/002/003) is verified in the browser
 * (mobile viewport): the toggle icon is visibly dark, and a single tap opens the
 * "Ver disponibilidad" modal / a FAQ answer. These source guards keep the fix
 * mechanism from silently regressing:
 *   - ISSUE-001: the header toggle must carry an explicit non-white text color,
 *     or the neutral/ghost icon reverts to white-on-white and disappears.
 *   - ISSUE-002: the conversion CTAs must hydrate on visibility, not on
 *     interaction — `hydrate-on-interaction` drops the first tap on touch
 *     (no pointerenter), so the user taps and nothing opens.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const APP = join(__dirname, '..', 'app')
const LAYOUT = join(APP, 'layouts/default.vue')
const FLEET = join(APP, 'components/home/Fleet.vue')
const FAQ = join(APP, 'components/home/Faq.vue')
const BASE_CSS = join(APP, 'assets/css/rentacar-main/base.css')

describe('ISSUE-001: mobile menu toggle icon stays visible on the white header', () => {
  it('the UHeader :toggle config sets an explicit dark text color', () => {
    const src = readFileSync(LAYOUT, 'utf-8')
    // Grab the :toggle="{...}" object literal passed to UHeader.
    const toggle = src.match(/:toggle="\{[\s\S]*?\}"/)
    expect(toggle, ':toggle config not found on UHeader').not.toBeNull()
    // A non-white text utility (text-gray-700 / text-gray-900 / etc.) so the
    // icon never inherits the white neutral-ghost default against the white bg.
    expect(toggle![0]).toMatch(/text-(?:gray|zinc|neutral|slate)-[5-9]\d{2}/)
  })

  it('the white home header scopes its hamburger toggle to a dark (non-white) color', () => {
    // Real root cause: a global `!important` rule painted the toggle white,
    // invisible on the white header. The fix scopes a dark override to
    // `header.bg-white`. Guard that override exists and is never white.
    const css = readFileSync(BASE_CSS, 'utf-8')
    const darkRules = css.match(
      /header\.bg-white\s+\[data-slot="right"\]\s+button(?:\s+\.iconify)?\s*\{[^}]*\}/g,
    )
    expect(
      darkRules,
      'no white-header-scoped hamburger rule found in base.css',
    ).not.toBeNull()
    expect(darkRules!.length, 'expected button + .iconify rules').toBeGreaterThanOrEqual(2)
    for (const block of darkRules!) {
      expect(
        block,
        `white-header hamburger must be dark, not white:\n${block}`,
      ).not.toMatch(/(?:color|background-color)\s*:\s*(?:white|#fff(?:fff)?)\b/i)
    }
  })

  it('the default (dark-header) toggle rule stays white so /gana is not inverted', () => {
    // Regression guard for the cross-layout break the dark recolor would cause:
    // /gana has a dark header and relies on the unscoped white toggle rule.
    const css = readFileSync(BASE_CSS, 'utf-8')
    const base = css.match(
      /(?<!\.bg-white\s)header \[data-slot="right"\] button \{[^}]*\}/,
    )
    expect(base, 'unscoped (dark-header) toggle rule not found').not.toBeNull()
    expect(base![0]).toMatch(/color:\s*white/i)
  })
})

describe('ISSUE-002: conversion CTAs hydrate before the tap, not on it', () => {
  it('Fleet "Ver disponibilidad" is a direct button, never an interaction-hydrated island', () => {
    // The CTA changed from a LazyUModal (branch picker) to a plain UButton that
    // navigates to /reservas. A non-lazy button hydrates with the page, so the
    // first-tap-loss that motivated ISSUE-002 cannot occur here. Guard that the CTA
    // never regresses back to an interaction-hydrated island, and that the direct
    // navigation is in place.
    const src = readFileSync(FLEET, 'utf-8')
    expect(src).not.toMatch(/hydrate-on-interaction/)
    expect(src).not.toMatch(/LazyUModal/)
    expect(src).toContain("navigateTo('/reservas')")
  })

  it('FAQ accordion hydrates on visible, not on interaction', () => {
    const src = readFileSync(FAQ, 'utf-8')
    expect(src).toMatch(/hydrate-on-visible/)
    expect(src).not.toMatch(/hydrate-on-interaction/)
  })
})
