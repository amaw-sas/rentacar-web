/**
 * useAdvisorMode — flags a sales advisor's device so advisor-only tools (the
 * copy-quote button) show for them and never for customers.
 *
 * `?asesor=1` turns it on and remembers it in localStorage; `?asesor=0` turns it
 * off and forgets it. Without the param the stored value decides. Resolved in
 * `onMounted` only, so the server render (and hydration) always sees `false`.
 * Storage may be missing or throw (Safari private mode): then advisor mode lasts
 * only while the URL carries `?asesor=1`. The query is read, never rewritten.
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
    // storage unavailable: advisor mode then lives only while the URL has ?asesor=1
  }
}

export default function useAdvisorMode() {
  const route = useRoute();
  const isAdvisor = ref(false);

  const resolve = () => {
    const raw = route.query.asesor;
    const param = Array.isArray(raw) ? raw[0] : raw;
    if (param === '1') {
      writeStored('1');
      isAdvisor.value = true;
    } else if (param === '0') {
      writeStored(null);
      isAdvisor.value = false;
    } else {
      isAdvisor.value = readStored();
    }
  };

  onMounted(() => {
    resolve();
    watch(() => route.query.asesor, resolve);
  });

  return { isAdvisor: readonly(isAdvisor) };
}
