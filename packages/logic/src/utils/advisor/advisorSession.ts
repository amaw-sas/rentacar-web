/**
 * Advisor session — identifies a sales advisor's device so advisor-only tools
 * (the copy-quote panel) show for them and never for customers. Route-agnostic:
 * the layer plugin (plugins/advisor-mode.client.ts) drives it on the initial
 * load and on every client-side navigation, so `?asesor=<code>` works on any page.
 *
 * `?asesor=<code>` is verified against `GET /api/asesor/<code>`; on 200 the
 * `{ code, name }` is stored in localStorage and published to the shared state.
 * `?asesor=0` forgets it. Without the param a stored advisor shows immediately
 * and is revalidated once per page load (404 drops it; network/5xx/429 keeps it).
 * With no param and nothing stored there is no network call at all.
 *
 * The param is stripped from the address bar in every case (other query keys
 * kept) so a shared URL never carries it. Navigation reacts only to a present
 * value, never to the key vanishing.
 */
import { normalizeAdvisorCode } from './advisorCode';
import {
  clearStoredAdvisor,
  readStoredAdvisor,
  writeStoredAdvisor,
  type StoredAdvisor,
} from './advisorStorage';

export interface AdvisorSessionDeps {
  setAdvisor: (advisor: StoredAdvisor | null) => void;
  /** Rewrites the address bar with the given query (the param already removed). */
  replaceQuery: (query: Record<string, unknown>) => void;
  notify: (title: string) => void;
}

type Query = Record<string, unknown>;

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as { statusCode?: unknown; status?: unknown; response?: { status?: unknown } };
  for (const v of [e.statusCode, e.status, e.response?.status]) {
    if (typeof v === 'number') return v;
  }
  return undefined;
}

async function fetchAdvisor(code: string): Promise<StoredAdvisor> {
  const res = await $fetch<{ code: string; name: string }>(`/api/asesor/${encodeURIComponent(code)}`);
  return { code: res.code, name: res.name };
}

// `?asesor` with no value arrives as null: still present (bad code -> toast).
const isPresent = (raw: unknown) => raw !== undefined;

export function createAdvisorSession({ setAdvisor, replaceQuery, notify }: AdvisorSessionDeps) {
  // Only the latest request may touch state: a slow older answer must never
  // resurrect an advisor that `?asesor=0` or a newer code already replaced.
  let seq = 0;

  const notFound = () => notify('Código de asesor no encontrado');

  const applyParam = async (query: Query) => {
    const { asesor: raw, ...rest } = query;
    replaceQuery(rest);
    const mySeq = ++seq;
    if (Array.isArray(raw) ? raw[0] === '0' : raw === '0') {
      clearStoredAdvisor();
      setAdvisor(null);
      return;
    }
    const code = normalizeAdvisorCode(raw);
    if (!code) return void notFound();
    try {
      const found = await fetchAdvisor(code);
      if (mySeq !== seq) return;
      writeStoredAdvisor(found);
      setAdvisor(found);
    } catch (err) {
      if (mySeq !== seq) return;
      if (getStatusCode(err) === 404) notFound();
      else notify('No se pudo verificar el código, intenta de nuevo');
    }
  };

  const revalidate = async (stored: StoredAdvisor) => {
    const mySeq = ++seq;
    try {
      const fresh = await fetchAdvisor(stored.code);
      if (mySeq !== seq) return;
      writeStoredAdvisor(fresh);
      setAdvisor(fresh);
    } catch (err) {
      if (mySeq !== seq) return;
      if (getStatusCode(err) === 404) {
        clearStoredAdvisor();
        setAdvisor(null);
      }
      // other failures: keep the stored advisor
    }
  };

  return {
    /** Once per page load, after hydration. */
    start(query: Query) {
      // A stored advisor shows even when the param is a typo: a bad code never
      // drops a good activation.
      const stored = readStoredAdvisor();
      if (stored) setAdvisor(stored);
      if (isPresent(query.asesor)) void applyParam(query);
      else if (stored) void revalidate(stored);
    },
    /** Every successful client-side navigation. */
    onNavigate(query: Query) {
      if (isPresent(query.asesor)) void applyParam(query);
    },
  };
}
