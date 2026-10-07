// @ts-check
//
// Single flat config for the whole monorepo. ESLint resolves it from the repo
// root AND from inside each package, so `pnpm lint` (one process over all
// 1.177 files) and `pnpm --filter ui-alquilame lint` both use these rules.
//
// Why `@nuxt/eslint-config` and not the `@nuxt/eslint` MODULE: the module
// generates its config into `.nuxt/eslint.config.mjs`, which would make linting
// depend on `nuxt prepare` having run and on each app's build context — three
// configs, three build contexts, one more thing CI can get wrong.
// `createConfigForNuxt` gives the same Nuxt-aware rules with no build context.
//
// `stylistic` stays OFF: this repo has never had a formatter, and turning it on
// reports 26.289 findings across 835 files (71% of the repo). Formatting is a
// separate decision and belongs in its own PR.
// `tooling` (regexp/unicorn/jsdoc) stays OFF for now: +238 findings, ~190 of
// them regex nitpicks inside test assertions. Deferred to a follow-up PR.

import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// CI pins NODE_VERSION 20, and eslint-flat-config-utils (a transitive dependency
// of @nuxt/eslint-config) calls Object.groupBy, which only exists from Node 21.
// Without this, `pnpm lint` dies with "TypeError: Object.groupBy is not a
// function" before linting a single file — green on a dev machine running Node
// 22+, red in CI. Nothing warned: that package declares no `engines` field.
// Delete this shim once CI runs Node >= 21.
if (typeof Object.groupBy !== 'function') {
  Object.groupBy = (items, callback) => {
    const out = Object.create(null)
    let i = 0
    for (const item of items) {
      const key = callback(item, i++)
      ;(out[key] ??= []).push(item)
    }
    return out
  }
}

const TEST_FILES = [
  '**/__tests__/**/*.{ts,js,vue}',
  '**/*.{test,spec}.{ts,js}',
  '**/tests/**/*.{ts,js}',
  'e2e/**/*.{ts,js}',
]

export default createConfigForNuxt({
  features: {
    stylistic: false,
    tooling: false,
  },
  dirs: {
    src: [
      'packages/ui-alquilatucarro/app',
      'packages/ui-alquilame/app',
      'packages/ui-alquicarros/app',
      'packages/logic/src',
    ],
    servers: [
      'packages/ui-alquilatucarro/server',
      'packages/ui-alquilame/server',
      'packages/ui-alquicarros/server',
      'packages/logic/server',
    ],
  },
})
  // The preset forces `ecmaFeatures.jsx: true` on .vue files. No brand uses
  // JSX, and with jsx on, the angle-bracket type assertion `<FAQPage>{...}` in
  // `pages/index.vue` and `pages/blog/[...slug].vue` of all three brands fails
  // to PARSE — six fatal errors on code that compiles and ships fine today.
  // The defect is in the lint parser, not in the repo.
  .append({
    name: 'rentacar/vue-no-jsx',
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: false },
      },
    },
  })

  // DECLARED EXCEPTION 1 — `import/first` off in tests.
  // 51 hits, every one deliberate: the suites import AFTER `vi.mock(...)`, and
  // say so in a comment (see useRecordReservationForm.iva.test.ts: "Imported
  // AFTER vi.mock so the mocked ofetch is bound"). The autofix hoists those
  // imports above the mock, silently changing module init order in the very
  // files that prove the app works. Not a trade worth making.
  .append({
    name: 'rentacar/tests-import-order',
    files: TEST_FILES,
    rules: {
      'import/first': 'off',
    },
  })

  // DECLARED EXCEPTION 2 — allow a documentation comment before the root node.
  // The preset enforces a single template root in pages/layouts (Nuxt page
  // transitions need it) with `disallowComments: true`. All 20 hits here are
  // explanatory comments sitting in front of a SINGLE root element, not two
  // element roots. The rule's real protection stays an error; only the comment
  // clause is relaxed, so those 20 blocks of design rationale survive.
  //
  // `files` must mirror the preset's own scope (pages + layouts). A rules block
  // with no `files` widens the rule to every .vue file, and components ARE
  // allowed several roots in Vue 3 — that widening wrongly flagged three
  // components (CategorySelectionSection ×2, SelectBranch).
  .append({
    name: 'rentacar/template-root-comments',
    files: [
      'packages/*/app/pages/**/*.vue',
      'packages/*/app/layouts/**/*.vue',
    ],
    rules: {
      'vue/no-multiple-template-root': ['error', { disallowComments: false }],
    },
  })

  // DECLARED EXCEPTION 4 — the three Vue FORMATTING rules go with the
  // formatting, i.e. to the follow-up PR, not here.
  // These are pure cosmetics that happen to live in eslint-plugin-vue's
  // recommended set instead of in @stylistic, and they are warnings, so they
  // never blocked `pnpm lint`. Measured cost of fixing them in this PR: 1.308
  // rewritten lines across 95 files — and 131 of those lines come out WORSE,
  // because with `stylistic: false` there is no @stylistic pass to tidy the
  // spacing the fixer leaves behind (`<br />` becomes `<br >`, and
  // `v-text="x"></span>` becomes `v-text="x"/>`). Committing 1.308 lines of
  // churn that make the markup uglier, inside the PR that revives the lint,
  // buries the ~280 real findings. They come back on with @stylistic.
  .append({
    name: 'rentacar/defer-vue-formatting',
    files: ['**/*.vue'],
    rules: {
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      'vue/attribute-hyphenation': 'off',
    },
  })

  // DECLARED EXCEPTION 5 — three grandfathered single-word component names.
  // `Carrusel`, `Logo` and `Searcher` exist in all three brands. The rule guards
  // against clashing with a native HTML element; none of these three clash.
  // Renaming them is not a lint fix: every template, every `#components`
  // auto-import alias and every test that references them would have to change,
  // which is exactly the behaviour-affecting edit this PR must not make.
  // They are listed one by one ON PURPOSE — a NEW single-word component still
  // fails the lint. Renaming the three is tracked as follow-up work.
  // `files` is ONE level deep on purpose. The preset exempts components in
  // sub-directories because Nuxt prefixes their registered name with the folder
  // (`components/home/Hero.vue` registers as `HomeHero`, already multi-word).
  // A `**` here re-enables the rule for all of those and the count jumps from 10
  // to 61; a `**/*.vue` block also drags in pages and layouts, whose names come
  // from routes, and it reaches 125. The three grandfathered files sit directly
  // in `app/components/`.
  .append({
    name: 'rentacar/grandfathered-component-names',
    files: ['packages/*/app/components/*.vue'],
    rules: {
      'vue/multi-word-component-names': ['error', {
        ignores: ['Carrusel', 'Logo', 'Searcher'],
      }],
    },
  })

  // The confirmation-page FIXTURE is a miniature app tree under logic/tests; its
  // `pages/` is not one of this config's `dirs.pages`, so page files there get
  // judged as components. Pages are named after routes — `index.vue` is correct.
  .append({
    name: 'rentacar/fixture-pages',
    files: ['packages/logic/tests/fixtures/**/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  })

  // DECLARED EXCEPTION 6 — `delete obj[key]` stays, in the eight places that
  // clear an object IN PLACE.
  // The rule's suggested alternative (`obj[key] = undefined`) is NOT equivalent:
  // the key survives, so `Object.keys(...).length` stays non-zero and anything
  // keyed on presence changes meaning. All eight sites depend on removal:
  //  - PublicContactForm.vue (×2): empties the reactive `errors` object while
  //    keeping its identity, so Vue's reactivity and `v-if` on a field hold.
  //  - useRentacarData.ts (×2): resets the store's nested maps in place.
  //  - test teardown (×4): restores `globalThis` / `HTMLElement.prototype` to
  //    not leaking the stubbed key into the next test.
  .append({
    name: 'rentacar/delete-clears-in-place',
    rules: {
      '@typescript-eslint/no-dynamic-delete': 'off',
    },
  })

  // A rule OPTION, not an exception: `prefer-const` by default ignores that a
  // binding can be READ before its single assignment. In useRentacarData.ts
  // `freshness` is declared at :193, read at :224 from inside `accept()` — which
  // runs at :227 — and only assigned at :245. As a `const` that read is a
  // temporal-dead-zone ReferenceError. `ignoreReadBeforeAssign` is the rule's
  // own switch for exactly this shape; every other `let` that should be a const
  // is still an error.
  .append({
    name: 'rentacar/prefer-const-read-before-assign',
    rules: {
      'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
    },
  })

  // DECLARED EXCEPTION 3 — `no-explicit-any` as a RATCHET, not a mute.
  // 185 hits in 51 files. Typing them properly is a Supabase/Nuxt typing
  // project, not a lint fix: the production ones are `ref<any>` holding
  // `@internationalized/date` values (Searcher.vue:395-401), and typing them to
  // CalendarDate surfaces real type errors in the date logic of all three
  // brands. So: severity `warn` (printed on every run, never hidden) plus
  // `--max-warnings` in the lint script, which pins the count. The number can
  // only go DOWN — a new `any` pushes it over the cap and fails CI.
  .append({
    name: 'rentacar/explicit-any-ratchet',
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  })
