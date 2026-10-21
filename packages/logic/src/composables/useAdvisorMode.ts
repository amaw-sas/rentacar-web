/**
 * useAdvisorMode — identifies a sales advisor's device so advisor-only tools
 * (the copy-quote panel) show for them and never for customers.
 *
 * `?asesor=<code>` is verified against `GET /api/asesor/<code>`; on 200 the
 * `{ code, name }` is stored in localStorage and exposed as `advisor`. `?asesor=0`
 * forgets it. Without the param a stored advisor shows immediately and is
 * revalidated once per mount of the consuming component (404 drops it; network/5xx/429 keeps it).
 * With no param and nothing stored there is no network call at all.
 *
 * Everything resolves in `onMounted`, so the server render (and hydration)
 * always sees `null`. The param is stripped from the address bar in every case
 * (router.replace, other query keys kept) so a shared URL never carries it.
 * The watch reacts only to a present value, never to the key vanishing.
 */
import { onMounted, readonly, ref, watch } from 'vue';
import { normalizeAdvisorCode } from '../utils/advisor/advisorCode';
import {
  clearStoredAdvisor,
  readStoredAdvisor,
  writeStoredAdvisor,
  type StoredAdvisor,
} from '../utils/advisor/advisorStorage';

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

export default function useAdvisorMode() {
  const route = useRoute();
  const router = useRouter();
  const toast = useToast();
  const advisor = ref<StoredAdvisor | null>(null);
  // Only the latest request may touch state: a slow older answer must never
  // resurrect an advisor that `?asesor=0` or a newer code already replaced.
  let seq = 0;

  const stripParam = () => {
    const { asesor: _asesor, ...rest } = route.query;
    router.replace({ query: rest });
  };

  const notFound = () =>
    toast.add({ title: 'Código de asesor no encontrado', color: 'error' });

  const applyParam = async (raw: unknown) => {
    stripParam();
    const mySeq = ++seq;
    if (Array.isArray(raw) ? raw[0] === '0' : raw === '0') {
      clearStoredAdvisor();
      advisor.value = null;
      return;
    }
    const code = normalizeAdvisorCode(raw);
    if (!code) return void notFound();
    try {
      const found = await fetchAdvisor(code);
      if (mySeq !== seq) return;
      writeStoredAdvisor(found);
      advisor.value = found;
    } catch (err) {
      if (mySeq !== seq) return;
      if (getStatusCode(err) === 404) notFound();
      else toast.add({ title: 'No se pudo verificar el código, intenta de nuevo', color: 'error' });
    }
  };

  const revalidate = async (stored: StoredAdvisor) => {
    const mySeq = ++seq;
    try {
      const fresh = await fetchAdvisor(stored.code);
      if (mySeq !== seq) return;
      writeStoredAdvisor(fresh);
      advisor.value = fresh;
    } catch (err) {
      if (mySeq !== seq) return;
      if (getStatusCode(err) === 404) {
        clearStoredAdvisor();
        advisor.value = null;
      }
      // other failures: keep the stored advisor
    }
  };

  // `?asesor` with no value arrives as null: still present (bad code -> toast).
  const isPresent = (raw: unknown) => raw !== undefined;

  onMounted(() => {
    const raw = route.query.asesor;
    // A stored advisor shows even when the param is a typo: a bad code never
    // drops a good activation.
    const stored = readStoredAdvisor();
    if (stored) advisor.value = stored;
    if (isPresent(raw)) void applyParam(raw);
    else if (stored) void revalidate(stored);
    watch(
      () => route.query.asesor,
      (next) => {
        if (isPresent(next)) void applyParam(next);
      },
    );
  });

  return { advisor: readonly(advisor) };
}
