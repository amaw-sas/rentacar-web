# Formato 12h en URLs - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans OR superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Convert URL time parameters from 24h format (`13:00`) to 12h format (`01:00pm`) with full backward compatibility.

**Architecture:** Add utility functions for 12h conversion in `useDateFunctions.ts`, update URL generation in composables, add middleware redirect for legacy 24h URLs, maintain internal 24h format in store.

**Tech Stack:** TypeScript, Nuxt 4, Vitest, @internationalized/date

---

## Task 1: Setup Vitest Configuration

**Files:**
- Create: `packages/logic/vitest.config.ts`

**Step 1: Create vitest config**

```typescript
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@rentacar-main/logic': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

**Step 2: Verify vitest runs**

Run: `cd packages/logic && pnpm test`
Expected: "No test files found" (vitest works but no tests yet)

**Step 3: Commit**

```bash
git add packages/logic/vitest.config.ts
git commit -m "test: add vitest configuration for logic package"
```

---

## Task 2: Add Time Format Detection Functions (TDD)

**Files:**
- Modify: `packages/logic/src/utils/useDateFunctions.ts`
- Create: `packages/logic/src/utils/__tests__/useDateFunctions.test.ts`

**Step 1: Write failing tests for format detection**

Create `packages/logic/src/utils/__tests__/useDateFunctions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  isTime12hFormat,
  isTime24hFormat
} from '../useDateFunctions';

describe('format detection', () => {
  it('detects 12h format', () => {
    expect(isTime12hFormat('01:00pm')).toBe(true);
    expect(isTime12hFormat('12:30am')).toBe(true);
    expect(isTime12hFormat('11:59PM')).toBe(true);
    expect(isTime12hFormat('13:00')).toBe(false);
    expect(isTime12hFormat('invalid')).toBe(false);
  });

  it('detects 24h format', () => {
    expect(isTime24hFormat('13:00')).toBe(true);
    expect(isTime24hFormat('00:00')).toBe(true);
    expect(isTime24hFormat('23:59')).toBe(true);
    expect(isTime24hFormat('01:00pm')).toBe(false);
    expect(isTime24hFormat('invalid')).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/logic && pnpm test`
Expected: FAIL - "isTime12hFormat is not defined" and "isTime24hFormat is not defined"

**Step 3: Implement detection functions**

Add to `packages/logic/src/utils/useDateFunctions.ts` (at end of file):

```typescript
/**
 * Check if time string is in 12h format (hh:mm[am|pm])
 * @param timeString - time string to check
 * @returns true if format is 12h
 */
export function isTime12hFormat(timeString: string): boolean {
  return /^\d{1,2}:\d{2}(am|pm)$/i.test(timeString);
}

/**
 * Check if time string is in 24h format (HH:mm)
 * @param timeString - time string to check
 * @returns true if format is 24h
 */
export function isTime24hFormat(timeString: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeString);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/logic && pnpm test`
Expected: PASS - All format detection tests pass

**Step 5: Commit**

```bash
git add packages/logic/src/utils/useDateFunctions.ts packages/logic/src/utils/__tests__/useDateFunctions.test.ts
git commit -m "test: add time format detection functions with tests"
```

---

## Task 3: Add formatTime12h Function (TDD)

**Files:**
- Modify: `packages/logic/src/utils/useDateFunctions.ts`
- Modify: `packages/logic/src/utils/__tests__/useDateFunctions.test.ts`

**Step 1: Write failing tests for formatTime12h**

Add to `packages/logic/src/utils/__tests__/useDateFunctions.test.ts`:

```typescript
import {
  formatTime12h,
  isTime12hFormat,
  isTime24hFormat,
  createCurrentDateObject,
  createTimeFromString,
  toDatetime
} from '../useDateFunctions';

describe('formatTime12h', () => {
  it('converts 13:00 to 01:00pm', () => {
    const time = createTimeFromString('13:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('01:00pm');
  });

  it('converts 00:00 to 12:00am', () => {
    const time = createTimeFromString('00:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('12:00am');
  });

  it('converts 12:00 to 12:00pm', () => {
    const time = createTimeFromString('12:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('12:00pm');
  });

  it('converts 23:30 to 11:30pm', () => {
    const time = createTimeFromString('23:30');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('11:30pm');
  });

  it('converts 01:00 to 01:00am', () => {
    const time = createTimeFromString('01:00');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('01:00am');
  });

  it('converts 11:45 to 11:45am', () => {
    const time = createTimeFromString('11:45');
    const datetime = toDatetime(createCurrentDateObject(), time);
    expect(formatTime12h(datetime)).toBe('11:45am');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/logic && pnpm test`
Expected: FAIL - "formatTime12h is not defined"

**Step 3: Implement formatTime12h**

Add to `packages/logic/src/utils/useDateFunctions.ts` (before format detection functions):

```typescript
/**
 * Format a datetime object to 12h format (hh:mm[am|pm])
 * @param datetime DateTimeObject
 * @returns string - formato: "01:00pm", "12:00am"
 */
export function formatTime12h(datetime: DateTimeObject): string {
  const hour = datetime.hour;
  const minute = datetime.minute.toString().padStart(2, '0');

  // Convert 24h to 12h
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? 'pm' : 'am';

  return `${hour12.toString().padStart(2, '0')}:${minute}${period}`;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/logic && pnpm test`
Expected: PASS - All formatTime12h tests pass

**Step 5: Commit**

```bash
git add packages/logic/src/utils/useDateFunctions.ts packages/logic/src/utils/__tests__/useDateFunctions.test.ts
git commit -m "feat: add formatTime12h function with comprehensive tests"
```

---

## Task 4: Add parseTime12hOr24h Function (TDD)

**Files:**
- Modify: `packages/logic/src/utils/useDateFunctions.ts`
- Modify: `packages/logic/src/utils/__tests__/useDateFunctions.test.ts`

**Step 1: Write failing tests for parseTime12hOr24h**

Add to `packages/logic/src/utils/__tests__/useDateFunctions.test.ts`:

```typescript
import {
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat,
  isTime24hFormat,
  createCurrentDateObject,
  createTimeFromString,
  toDatetime
} from '../useDateFunctions';

describe('parseTime12hOr24h', () => {
  it('parses 24h format', () => {
    const time = parseTime12hOr24h('13:00');
    expect(time?.hour).toBe(13);
    expect(time?.minute).toBe(0);
  });

  it('parses 12h format with pm', () => {
    const time = parseTime12hOr24h('01:00pm');
    expect(time?.hour).toBe(13);
    expect(time?.minute).toBe(0);
  });

  it('parses 12h format with am', () => {
    const time = parseTime12hOr24h('01:00am');
    expect(time?.hour).toBe(1);
    expect(time?.minute).toBe(0);
  });

  it('parses midnight correctly', () => {
    const time = parseTime12hOr24h('12:00am');
    expect(time?.hour).toBe(0);
    expect(time?.minute).toBe(0);
  });

  it('parses noon correctly', () => {
    const time = parseTime12hOr24h('12:00pm');
    expect(time?.hour).toBe(12);
    expect(time?.minute).toBe(0);
  });

  it('parses 11:59pm correctly', () => {
    const time = parseTime12hOr24h('11:59pm');
    expect(time?.hour).toBe(23);
    expect(time?.minute).toBe(59);
  });

  it('parses case insensitive (AM/PM)', () => {
    const timeUpper = parseTime12hOr24h('01:00PM');
    const timeLower = parseTime12hOr24h('01:00pm');
    expect(timeUpper?.hour).toBe(13);
    expect(timeLower?.hour).toBe(13);
  });

  it('returns null for invalid format', () => {
    expect(parseTime12hOr24h('25:00')).toBeNull();
    expect(parseTime12hOr24h('13:00xm')).toBeNull();
    expect(parseTime12hOr24h('invalid')).toBeNull();
    expect(parseTime12hOr24h('1:00pm')).toBeNull(); // single digit hour
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/logic && pnpm test`
Expected: FAIL - "parseTime12hOr24h is not defined"

**Step 3: Implement parseTime12hOr24h**

Add to `packages/logic/src/utils/useDateFunctions.ts` (after formatTime12h):

```typescript
/**
 * Parse time string in either 12h or 24h format
 * @param timeString - "13:00" (24h) or "01:00pm" (12h)
 * @returns TimeObject or null if invalid
 */
export function parseTime12hOr24h(timeString: string): TimeObject | null {
  // Try 24h format first (existing behavior)
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    try {
      return parseTime(timeString);
    } catch {
      return null;
    }
  }

  // Try 12h format: 01:00pm, 12:30am
  const match = timeString.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  // Convert to 24h
  if (period === 'am') {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }

  try {
    return parseTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  } catch {
    return null;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/logic && pnpm test`
Expected: PASS - All parseTime12hOr24h tests pass (16 total tests passing)

**Step 5: Commit**

```bash
git add packages/logic/src/utils/useDateFunctions.ts packages/logic/src/utils/__tests__/useDateFunctions.test.ts
git commit -m "feat: add parseTime12hOr24h with backward compatibility"
```

---

## Task 5: Export New Functions

**Files:**
- Modify: `packages/logic/src/utils/index.ts`

**Step 1: Read current exports**

Run: `cat packages/logic/src/utils/index.ts`
Verify: Check if explicit exports exist or just `export * from './useDateFunctions'`

**Step 2: Add explicit exports**

Add to `packages/logic/src/utils/index.ts` (after existing exports):

```typescript
// Time format conversion (12h/24h)
export {
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat,
  isTime24hFormat
} from './useDateFunctions';
```

**Step 3: Verify exports work**

Run: `cd packages/logic && pnpm test`
Expected: PASS - All tests still pass (exports don't break anything)

**Step 4: Commit**

```bash
git add packages/logic/src/utils/index.ts
git commit -m "feat: export time format conversion functions"
```

---

## Task 6: Update Default Route Params

**Files:**
- Modify: `packages/logic/src/composables/useDefaultRouteParams.ts`

**Step 1: Read current file**

Run: `cat packages/logic/src/composables/useDefaultRouteParams.ts | grep -A 2 defaultHora`
Verify: Current values are '12:00' in 24h format

**Step 2: Update to 12h format**

Find and replace in `packages/logic/src/composables/useDefaultRouteParams.ts`:

```typescript
// OLD:
const defaultHoraRecogida = ref<string | null>('12:00');
const defaultHoraDevolucion = ref<string | null>('12:00');

// NEW:
const defaultHoraRecogida = ref<string | null>('12:00pm');
const defaultHoraDevolucion = ref<string | null>('12:00pm');
```

**Step 3: Commit**

```bash
git add packages/logic/src/composables/useDefaultRouteParams.ts
git commit -m "feat: update default time values to 12h format"
```

---

## Task 7: Update URL Generation (useSearch.ts)

**Files:**
- Modify: `packages/logic/src/composables/useSearch.ts`

**Step 1: Read current searchLinkParams**

Run: `grep -A 20 "const searchLinkParams" packages/logic/src/composables/useSearch.ts`
Verify: Currently generates hora_recogida/hora_devolucion with direct values

**Step 2: Update searchLinkParams computed**

Find the `searchLinkParams` computed and update:

```typescript
const searchLinkParams = computed(() => {
  const pickupBranch = searchBranchByCode(lugarRecogida.value ?? '');
  const returnBranch = searchBranchByCode(lugarDevolucion.value ?? '');

  // Convert stored 24h format to 12h for URLs
  const pickupTime = horaRecogida.value
    ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaRecogida.value)))
    : null;
  const returnTime = horaDevolucion.value
    ? formatTime12h(toDatetime(createCurrentDateObject(), createTimeFromString(horaDevolucion.value)))
    : null;

  return {
    referido: referido.value,
    lugar_recogida: pickupBranch?.slug,
    lugar_devolucion: returnBranch?.slug,
    fecha_recogida: fechaRecogida.value,
    fecha_devolucion: fechaDevolucion.value,
    hora_recogida: pickupTime,
    hora_devolucion: returnTime,
  };
});
```

**Step 3: Verify imports**

Ensure these imports exist at top of file:
```typescript
import {
  createTimeFromString,
  createCurrentDateObject,
  toDatetime,
  formatHumanTime,
  formatTime,
  formatTime12h,
} from '@rentacar-main/logic/utils';
```

**Step 4: Commit**

```bash
git add packages/logic/src/composables/useSearch.ts
git commit -m "feat: generate URLs with 12h time format"
```

---

## Task 8: Update Route Params Reader

**Files:**
- Modify: `packages/logic/src/composables/useSearchByRouteParams.ts`

**Step 1: Read current onMounted**

Run: `grep -A 30 "onMounted" packages/logic/src/composables/useSearchByRouteParams.ts`
Verify: Currently sets hora values directly from params

**Step 2: Update time parsing in onMounted**

Find the lines setting horaRecogida and horaDevolucion and replace:

```typescript
// OLD:
horaRecogida.value = route.params.hora_recogida as string;
horaDevolucion.value = route.params.hora_devolucion as string;

// NEW:
// Parse times (supporting both 12h and 24h formats)
const pickupTimeString = route.params.hora_recogida as string;
const returnTimeString = route.params.hora_devolucion as string;

const pickupTime = parseTime12hOr24h(pickupTimeString);
const returnTime = parseTime12hOr24h(returnTimeString);

// Convert to 24h format for internal store
horaRecogida.value = pickupTime
  ? formatTime(toDatetime(createCurrentDateObject(), pickupTime))
  : null;
horaDevolucion.value = returnTime
  ? formatTime(toDatetime(createCurrentDateObject(), returnTime))
  : null;
```

**Step 3: Verify imports**

Add `parseTime12hOr24h` to imports if not present.

**Step 4: Commit**

```bash
git add packages/logic/src/composables/useSearchByRouteParams.ts
git commit -m "feat: parse both 12h and 24h time formats from URLs"
```

---

## Task 9: Update Middleware - alquilatucarro

**Files:**
- Modify: `packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts`

**Step 1: Find insertion point**

Run: `grep -n "// Continue with existing date validations" packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts`
Or find line after branch slug validation (around line 77)

**Step 2: Add time format validation and redirect**

Insert after branch slug validation (after line ~77):

```typescript
// Validate time formats and redirect legacy 24h to 12h
const hora_recogida = to.params.hora_recogida as string;
const hora_devolucion = to.params.hora_devolucion as string;

// Detect legacy 24h format and redirect to 12h
const isPickup12h = isTime12hFormat(hora_recogida);
const isReturn12h = isTime12hFormat(hora_devolucion);

if (!isPickup12h || !isReturn12h) {
  // Parse times (supporting both formats)
  const pickupTime = parseTime12hOr24h(hora_recogida);
  const returnTime = parseTime12hOr24h(hora_devolucion);

  if (!pickupTime || !returnTime) {
    // Invalid time format - fallback to defaults
    const {
      defaultLugarRecogida,
      defaultLugarDevolucion,
      defaultFechaRecogida,
      defaultFechaDevolucion,
      defaultHoraRecogida,
      defaultHoraDevolucion
    } = useDefaultRouteParams();

    to.params.lugar_recogida = defaultLugarRecogida.value as string;
    to.params.lugar_devolucion = defaultLugarDevolucion.value as string;
    to.params.fecha_recogida = defaultFechaRecogida.value as string;
    to.params.fecha_devolucion = defaultFechaDevolucion.value as string;
    to.params.hora_recogida = defaultHoraRecogida.value as string;
    to.params.hora_devolucion = defaultHoraDevolucion.value as string;

    createMessage({
      type: "info",
      message: "Formato de hora inválido. Se ajustó al valor por defecto.",
    });

    return navigateTo({ name: to.name, params: to.params, query: to.query });
  }

  // Legacy 24h format detected - redirect to 12h URL
  to.params.hora_recogida = formatTime12h(toDatetime(createCurrentDateObject(), pickupTime));
  to.params.hora_devolucion = formatTime12h(toDatetime(createCurrentDateObject(), returnTime));

  return navigateTo({ name: to.name, params: to.params, query: to.query });
}
```

**Step 3: Verify imports**

Add to imports at top:
```typescript
import {
  // ... existing imports
  formatTime12h,
  parseTime12hOr24h,
  isTime12hFormat,
  isTime24hFormat,
  toDatetime,
} from '@rentacar-main/logic/utils';
```

**Step 4: Commit**

```bash
git add packages/ui-alquilatucarro/app/middleware/validateSearchParams.ts
git commit -m "feat(alquilatucarro): add 12h time format validation with redirect"
```

---

## Task 10: Update Middleware - alquilame

**Files:**
- Modify: `packages/ui-alquilame/app/middleware/validateSearchParams.ts`

**Step 1-4: Repeat same changes as Task 9**

Apply identical changes to `packages/ui-alquilame/app/middleware/validateSearchParams.ts`

**Step 5: Commit**

```bash
git add packages/ui-alquilame/app/middleware/validateSearchParams.ts
git commit -m "feat(alquilame): add 12h time format validation with redirect"
```

---

## Task 11: Update Middleware - alquicarros

**Files:**
- Modify: `packages/ui-alquicarros/app/middleware/validateSearchParams.ts`

**Step 1-4: Repeat same changes as Task 9**

Apply identical changes to `packages/ui-alquicarros/app/middleware/validateSearchParams.ts`

**Step 5: Commit**

```bash
git add packages/ui-alquicarros/app/middleware/validateSearchParams.ts
git commit -m "feat(alquicarros): add 12h time format validation with redirect"
```

---

## Task 12: Manual Testing - alquilatucarro

**Step 1: Start dev server**

Run: `pnpm dev:alquilatucarro` (from root)
Wait: Server starts on port 3000

**Step 2: Test 12h format URL**

Navigate: `http://localhost:3000/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-04/fecha-devolucion/2026-02-11/hora-recogida/01:00pm/hora-devolucion/01:00pm`

Verify:
- ✅ Page loads without errors
- ✅ URL stays as 01:00pm (no redirect)
- ✅ Search results display correctly

**Step 3: Test 24h format URL (legacy)**

Navigate: `http://localhost:3000/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-02-04/fecha-devolucion/2026-02-11/hora-recogida/13:00/hora-devolucion/13:00`

Verify:
- ✅ Page redirects to 01:00pm format
- ✅ URL changes to 01:00pm automatically
- ✅ Search results display correctly

**Step 4: Test edge cases**

Test midnight: `.../hora-recogida/12:00am/hora-devolucion/12:00am`
Verify: Works correctly

Test noon: `.../hora-recogida/12:00pm/hora-devolucion/12:00pm`
Verify: Works correctly

Test invalid: `.../hora-recogida/25:00/hora-devolucion/25:00`
Verify: Falls back to default 12:00pm

**Step 5: Stop server**

Run: Ctrl+C

---

## Task 13: Manual Testing - alquilame

**Repeat Task 12 steps** but with:
- Run: `pnpm dev:alquilame` (port 3002)
- Navigate: `http://localhost:3002/...`

---

## Task 14: Manual Testing - alquicarros

**Repeat Task 12 steps** but with:
- Run: `pnpm dev:alquicarros` (port 3001)
- Navigate: `http://localhost:3001/...`

---

## Task 15: Final Verification

**Step 1: Run all unit tests**

Run: `cd packages/logic && pnpm test`
Expected: PASS - All 16 tests passing

**Step 2: Verify test coverage**

Run: `cd packages/logic && pnpm test:coverage`
Expected: High coverage on new functions (>90%)

**Step 3: Review all commits**

Run: `git log --oneline -15`
Verify: Clean commit history with descriptive messages

**Step 4: Create summary commit**

```bash
git add -A
git status
# Verify no uncommitted changes
```

---

## Task 16: Create Pull Request

**Step 1: Push branch**

Run: `git push -u origin feature/12h-time-format-urls`
Expected: Branch pushed successfully

**Step 2: Create PR using gh CLI**

```bash
gh pr create --title "feat: convert URL time format from 24h to 12h" --body "$(cat <<'EOF'
## Summary
- Convert URL time parameters from 24h (`13:00`) to 12h format (`01:00pm`)
- Full backward compatibility with legacy 24h URLs via automatic redirect
- Internal store maintains 24h format (no API changes)

## Changes
- ✅ Add `formatTime12h()` - converts to 12h format
- ✅ Add `parseTime12hOr24h()` - parses both formats
- ✅ Add format detection functions
- ✅ Update URL generation to use 12h format
- ✅ Add middleware redirect for legacy 24h URLs
- ✅ Update default values to 12h
- ✅ Comprehensive unit tests (16 tests)
- ✅ Vitest configuration

## Testing
- ✅ Unit tests: 16/16 passing
- ✅ Manual testing: all 3 brands (alquilatucarro, alquilame, alquicarros)
- ✅ Legacy URL redirect tested
- ✅ Edge cases: midnight, noon, invalid formats

## Implementation Pattern
Follows same pattern as branch slugs backward compatibility (commit b547558):
- Dual format support in parser
- Middleware detection and redirect
- Zero breaking changes

## Files Changed
- **New**: vitest.config.ts, useDateFunctions.test.ts
- **Modified**: useDateFunctions.ts, useSearch.ts, useSearchByRouteParams.ts, useDefaultRouteParams.ts, 3x validateSearchParams.ts

## Before/After
**Before**: `/bogota/.../hora-recogida/13:00/hora-devolucion/13:00`
**After**: `/bogota/.../hora-recogida/01:00pm/hora-devolucion/01:00pm`
**Legacy**: Old URLs redirect automatically to new format

## Test Plan
- [x] Unit tests pass
- [x] 12h format URLs work
- [x] 24h format URLs redirect to 12h
- [x] Midnight (12:00am) works
- [x] Noon (12:00pm) works
- [x] Invalid formats fallback to default
- [x] All 3 brands tested manually
EOF
)"
```

**Step 3: Copy PR URL**

Run: `gh pr view --web`
Share URL with team for review

---

## Rollback Plan

If critical issues found post-merge:

```bash
# Find the merge commit
git log --oneline -10

# Revert the merge
git revert -m 1 <merge-commit-hash>
git push origin main
```

Alternatively, revert the feature branch:
```bash
git revert <first-commit>..<last-commit>
git push origin main
```

## Post-Deployment Monitoring

**First 24 hours:**
1. Monitor error logs for time parsing errors
2. Check redirect metrics (should see 24h → 12h redirects)
3. Verify user-facing URLs show 12h format
4. Monitor performance (redirect overhead should be <50ms)

**Metrics to track:**
- Parse errors: Should be near zero
- Redirect rate: Will decrease over time as URLs update
- User feedback: Should be positive (more readable URLs)
