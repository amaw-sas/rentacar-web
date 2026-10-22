/**
 * useAdvisorMode — read-only view of the advisor identified on this device.
 *
 * The activation itself (`?asesor=<code>`, storage, revalidation, toasts) lives
 * in plugins/advisor-mode.client.ts + utils/advisor/advisorSession.ts, so it
 * works on any page. The state is `null` on the server and during hydration;
 * the plugin fills it after the app mounts.
 */
import { readonly } from 'vue';
import type { StoredAdvisor } from '../utils/advisor/advisorStorage';

export default function useAdvisorMode() {
  const advisor = useState<StoredAdvisor | null>('rentacar:advisor', () => null);
  return { advisor: readonly(advisor) };
}
