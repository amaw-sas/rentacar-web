// Per-session browsing trail the chat forwards to the dashboard, so an advisor sees
// where the visitor entered and which pages they browsed before writing. Pathname
// only: query/hash stripped (utm params) and reservation codes redacted
// (/reservado/<code> is stored as /reservado), so neither ever leaves the browser.
//
// /chat is not a browsed page: on mobile the chat FAB navigates to that full-screen
// route, so it is never recorded, and a message sent from it reports the last page
// the visitor was on before opening the chat.
//
// sessionStorage, not localStorage: "entry" means the first page of THIS visit.
// Storage is injected so the logic is testable, and every access is guarded — SSR,
// privacy mode and quota errors degrade to an empty result instead of throwing; a
// tracker must never break browsing or the chat.

export const VISIT_ENTRY_KEY = 'rentacar_visit_entry';
export const VISIT_TRAIL_KEY = 'rentacar_visit_trail';
export const VISIT_TRAIL_MAX = 10;
const CHAT_PATH = '/chat';

export type TrailStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface VisitorTrail {
  entry: string | null;
  trail: string[];
}

export interface ChatContext extends VisitorTrail {
  page: string;
}

function defaultStorage(): TrailStorage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null; // access denied (privacy mode / disabled storage)
  }
}

function toPathname(path: string): string {
  if (typeof path !== 'string') return ''; // JS callers can still pass junk
  let pathname = path.split(/[?#]/)[0] ?? '';
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '') || '/';
  return /^\/reservado\/./.test(pathname) ? '/reservado' : pathname;
}

// Callers wrap this in their own try/catch (getItem can throw); only parse is local.
function readTrailList(storage: TrailStorage): string[] {
  const raw = storage.getItem(VISIT_TRAIL_KEY);
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return []; // corrupt JSON
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((p): p is string => typeof p === 'string' && p !== '');
}

export function recordVisit(
  path: string,
  storage: TrailStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  const pathname = toPathname(path);
  if (!pathname || pathname === CHAT_PATH) return;
  try {
    if (!storage.getItem(VISIT_ENTRY_KEY)) storage.setItem(VISIT_ENTRY_KEY, pathname);
    const trail = readTrailList(storage);
    if (trail[trail.length - 1] === pathname) return; // reload / same-route navigation
    trail.push(pathname);
    storage.setItem(VISIT_TRAIL_KEY, JSON.stringify(trail.slice(-VISIT_TRAIL_MAX)));
  } catch {
    /* quota exceeded / disabled — non-fatal */
  }
}

export function readVisitorTrail(
  storage: TrailStorage | null = defaultStorage(),
): VisitorTrail {
  if (!storage) return { entry: null, trail: [] };
  try {
    const entry = storage.getItem(VISIT_ENTRY_KEY);
    return { entry: entry || null, trail: readTrailList(storage) };
  } catch {
    return { entry: null, trail: [] };
  }
}

export function buildChatContext(
  storage: TrailStorage | null = defaultStorage(),
  page?: string,
): ChatContext {
  try {
    const current = toPathname(page ?? (typeof window !== 'undefined' ? window.location.pathname : ''));
    const visited = readVisitorTrail(storage);
    const where = current === CHAT_PATH ? (visited.trail[visited.trail.length - 1] ?? '') : current;
    return { page: where, ...visited };
  } catch {
    return { page: '', entry: null, trail: [] };
  }
}
