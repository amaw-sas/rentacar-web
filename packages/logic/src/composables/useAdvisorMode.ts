/**
 * useAdvisorMode — flags a sales advisor's device so advisor-only tools (the
 * copy-quote button) show for them and never for customers.
 *
 * `?asesor=1` turns it on and remembers it in localStorage; `?asesor=0` turns it
 * off and forgets it. Without the param the stored value decides. Resolved in
 * `onMounted` only, so the server render (and hydration) always sees `false`.
 * Once read, the param is stripped from the address bar (router.replace, other
 * query keys kept) so a shared page URL never turns a customer's phone into an
 * advisor device. The watch reacts only to '1'/'0', never to the key vanishing,
 * so with blocked storage the in-memory flag lasts for the page session.
 */
import { onMounted, readonly, ref, watch } from 'vue';
import { getLocalStorageSafe } from '../utils/safeWebStorage';

const ADVISOR_KEY = 'rentacar:asesor';

function readStored(): boolean {
  try {
    return getLocalStorageSafe()?.getItem(ADVISOR_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStored(value: '1' | null): void {
  try {
    const storage = getLocalStorageSafe();
    if (!storage) return;
    if (value) storage.setItem(ADVISOR_KEY, value);
    else storage.removeItem(ADVISOR_KEY);
  } catch {
    // storage unavailable: advisor mode then lasts only for this page session
  }
}

export default function useAdvisorMode() {
  const route = useRoute();
  const router = useRouter();
  const isAdvisor = ref(false);

  const stripParam = () => {
    const { asesor: _asesor, ...rest } = route.query;
    router.replace({ query: rest });
  };

  const apply = (param: string | undefined) => {
    if (param === '1') {
      writeStored('1');
      isAdvisor.value = true;
    } else if (param === '0') {
      writeStored(null);
      isAdvisor.value = false;
    } else {
      return false;
    }
    stripParam();
    return true;
  };

  const readParam = (raw: unknown): string | undefined =>
    (Array.isArray(raw) ? raw[0] : raw) as string | undefined;

  onMounted(() => {
    if (!apply(readParam(route.query.asesor))) isAdvisor.value = readStored();
    watch(() => route.query.asesor, (raw) => void apply(readParam(raw)));
  });

  return { isAdvisor: readonly(isAdvisor) };
}
