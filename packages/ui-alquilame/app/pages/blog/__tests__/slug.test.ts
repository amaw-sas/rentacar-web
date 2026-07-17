/**
 * F4 step02 — blog detail (`[...slug].vue`) + callouts (`blog.css`) brand guard.
 *
 * Encodes the observable F4 detail scenarios as static-source assertions
 * (full runtime/visual check deferred to the orchestrator's preview pass):
 *   - SCEN-F4-05/06/14: hero overlay uses the Tailwind 4 `bg-linear-to-t`
 *     (never the v3 `bg-gradient-to-*` that renders transparent), and the prose
 *     MDC accents (link / blockquote / code) are brand #cc022b, not red-700.
 *   - SCEN-F4-08: share buttons keep their PLATFORM colors (WhatsApp green,
 *     Facebook blue, X black) in BOTH locations; only the copy-link button
 *     debrands from gray to a brand token.
 *   - SCEN-F4-07: BOTH reserve CTAs (sidebar + bio) point to /reservas and NO
 *     bare `to="/"` reserve target survives (anti-reward-hack); /blog nav stays.
 *   - SCEN-F4-14: chrome (back button, 404, bio card, sidebar panels) uses
 *     surface/brand tokens, never `bg-gray-200 text-black` / raw `bg-gray-50`.
 *   - SCEN-F4-11: the <script setup> SEO/schema (BlogPosting, BreadcrumbList,
 *     article meta) is preserved untouched.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGES = join(__dirname, '..')
const ROOT = join(__dirname, '..', '..', '..', '..')

const slug = readFileSync(join(PAGES, '[...slug].vue'), 'utf-8')
const blogCss = readFileSync(
  join(ROOT, 'app/assets/css/rentacar-main/blog.css'),
  'utf-8',
)

// The script block carries SEO/schema/behavior; it must survive the reskin.
const scriptBlock = slug.slice(slug.indexOf('<script setup'))

describe('SCEN-F4-05/06/14 — overlay v4 + prose brand accents', () => {
  it('hero overlay uses bg-linear-to-t, never the broken bg-gradient-to-*', () => {
    expect(slug).toMatch(/bg-linear-to-t/)
    expect(slug).not.toMatch(/bg-gradient-to-/)
  })

  it('.prose a / a:hover use brand #cc022b/#94001e, not red-700 rgb(185, 28, 28)', () => {
    expect(slug).not.toMatch(/rgb\(185, 28, 28\)/)
    expect(slug).toMatch(/\.prose a\s*{[^}]*color:\s*#cc022b/)
    expect(slug).toMatch(/\.prose a:hover\s*{[^}]*color:\s*#94001e/)
  })

  it('.prose blockquote / code accents use brand #cc022b', () => {
    expect(slug).toMatch(/\.prose blockquote\s*{[\s\S]*?border-color:\s*#cc022b/)
    expect(slug).toMatch(/\.prose code\s*{[\s\S]*?color:\s*#cc022b/)
  })

  it('blog.css callouts use the brand #cc022b accent, no red-700', () => {
    expect(blogCss).not.toMatch(/rgb\(185, 28, 28\)/)
    expect(blogCss).toMatch(/#cc022b/)
  })
})

describe('SCEN-F4-08 — share platform colors preserved, copy debranded', () => {
  it('keeps WhatsApp green / Facebook blue / X black in BOTH locations', () => {
    expect((slug.match(/bg-green-500/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect((slug.match(/bg-blue-600/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect((slug.match(/bg-black/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('copy-link button debrands to a brand token, never bg-gray-600', () => {
    expect(slug).not.toMatch(/bg-gray-600/)
    // Both copy buttons (desktop sidebar + mobile bar) carry the brand fill.
    const copyButtons = (slug.match(/@click="copyLink"[\s\S]*?aria-label="Copiar enlace"/g) ?? [])
    expect(copyButtons.length).toBe(2)
    for (const btn of copyButtons) {
      expect(btn).toMatch(/bg-brand-600 hover:bg-brand-700/)
    }
  })
})

describe('SCEN-F4-07 — reserve CTAs centralized, anti-reward-hack', () => {
  it('both reserve CTAs point to /reservas', () => {
    expect((slug.match(/to="\/reservas"/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('no bare to="/" reserve target survives', () => {
    expect(slug).not.toMatch(/to="\/"/)
  })

  it('keeps /blog navigation links intact', () => {
    expect(slug).toMatch(/to="\/blog"/)
  })
})

describe('SCEN-F4-14 — chrome rebranded to surface/brand tokens', () => {
  it('back button is surface-soft + brand accent, not bg-gray-200 text-black', () => {
    expect(slug).not.toMatch(/bg-gray-200/)
    expect(slug).not.toMatch(/text-black/)
  })

  it('bio card + sidebar panels use bg-surface-softer, not raw bg-gray-50', () => {
    expect(slug).not.toMatch(/bg-gray-50\b/)
    expect((slug.match(/bg-surface-softer/g) ?? []).length).toBeGreaterThanOrEqual(4)
  })

  it('section grounds + 404 use surface tokens, not raw bg-gray-100', () => {
    expect(slug).not.toMatch(/bg-gray-100/)
    expect(slug).toMatch(/bg-surface-soft\b/)
  })
})

describe('SCEN-F4-11 — SEO / schema preserved in <script setup>', () => {
  it('keeps the BlogPosting + BreadcrumbList JSON-LD', () => {
    expect(scriptBlock).toMatch(/useSchemaOrg/)
    expect(scriptBlock).toMatch(/BlogPosting/)
    expect(scriptBlock).toMatch(/BreadcrumbList/)
  })

  it('keeps all article meta keys intact', () => {
    expect(scriptBlock).toMatch(/useSeoMeta/)
    for (const key of [
      'articlePublishedTime',
      'articleModifiedTime',
      'articleAuthor',
      'articleSection',
      'articleTag',
    ]) {
      expect(scriptBlock).toContain(key)
    }
  })

  it('keeps the copyLink + share behavior', () => {
    expect(scriptBlock).toMatch(/function copyLink/)
  })
})

describe('SEO audit P0 — BlogPosting author is a Person, not an Organization', () => {
  // The page renders a human author (avatar + name + bio), so the JSON-LD author
  // must be a Person carrying that name and avatar — an Organization author on a
  // by-lined post is a structured-data mismatch.
  const authorStart = scriptBlock.indexOf('author: {')
  // Slice only the author object (up to its closing brace) so the following
  // publisher block — legitimately an Organization — never bleeds in.
  // End at '},' (not '}') — the avatar template literal contains '}' chars.
  const authorBlock = scriptBlock.slice(
    authorStart,
    scriptBlock.indexOf('},', authorStart),
  )

  it('the BlogPosting author uses @type Person with the post author name + image', () => {
    expect(authorBlock).toMatch(/'@type':\s*'Person'/)
    expect(authorBlock).toMatch(/name:\s*post\.value\.author\.name/)
    // Avatar must be an absolute URL — schema.org consumers ignore relative paths.
    expect(authorBlock).toMatch(
      /image:\s*`\$\{franchise\.website\}\$\{post\.value\.author\.avatar\}`/,
    )
    expect(authorBlock).not.toMatch(/'@type':\s*'Organization'/)
  })
})
