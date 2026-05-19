---
name: blob-storage-rename
created_by: pablo-diaz
created_at: 2026-05-19T00:00:00Z
---

# Blob storage rename — regression contract

Behavior-preserving refactor. Holdout = existing storage behavior stays
satisfied AND the rename is complete and clean. Baseline = `origin/main`
(495d2f0). Project typecheck baseline is red (~1531 errors, cross-brand
drift) — SCEN-006 uses delta-vs-baseline, never absolute green.

## SCEN-001: storage API unchanged under the new module path
**Given**: `server/utils/firebase-storage.ts` renamed to `server/utils/blob-storage.ts` in the 3 brand packages
**When**: the storage unit suite (`server/utils/__tests__/vercel-blob-storage.test.ts`) runs importing from `../blob-storage`
**Then**: every storage test that passed on baseline still passes; no assertion weakened, skipped, or deleted
**Evidence**: vitest output for the storage suite — pass count ≥ baseline pass count, same test names

## SCEN-002: no source references the old module name
**When**: grep `firebase-storage` over `packages/**` excluding `.nuxt/` and `node_modules/`
**Then**: zero matches — utils, importers, and `vi.mock(...)` paths across all 3 brands all updated
**Evidence**: `grep -rn 'firebase-storage' packages | grep -v .nuxt | grep -v node_modules` → empty

## SCEN-003: dead Firebase stub removed
**When**: grep `getFirebaseApp` and `firebaseStorageBucket` over `packages/**` excluding `.nuxt/`/`node_modules/`
**Then**: zero matches — the throwing `getFirebaseApp()` export and its test mocks are gone
**Evidence**: grep output → empty

## SCEN-004: blog endpoint suites unaffected
**Given**: `[slug].delete`, `upload-image.post`, `wordpress-sync.post` tests mocked the storage module
**When**: those suites run after the rename
**Then**: pass count ≥ baseline pass count for the same suites (delta-vs-baseline; baseline may be non-green)
**Evidence**: vitest output, baseline run vs post-change run, side by side

## SCEN-005: out-of-scope artifacts untouched
**When**: `git diff --name-only origin/main` after the change
**Then**: the list contains no `firebase.json` and no `.firebaserc` (Firebase Hosting config explicitly out of scope)
**Evidence**: `git diff --name-only origin/main` output

## SCEN-006: import resolution intact (delta vs baseline)
**When**: `pnpm --filter ui-alquilatucarro typecheck` after the change
**Then**: no NEW `TS2307` / module-not-found error referencing the `blob-storage` path; total error count not higher than baseline by any error attributable to the rename
**Evidence**: typecheck output, baseline vs post-change error count + absence of new blob-storage path errors
