/**
 * useContactTeaser — proactive greeting + synthetic unread badge for the contact FAB.
 *
 * A few seconds after landing, a greeting bubble appears next to the single
 * contact FAB and the red chip shows 1-2 synthetic "messages" — the "someone
 * wrote you" nudge — until the visitor engages any channel (WhatsApp / Llamar /
 * open Chat) or dismisses the bubble.
 *
 * CRITICAL BOUNDARY: this is PURELY synthetic. It never reads or writes the
 * `rentacar-chat:*` namespace or `lastReadMessageId`, and the REAL unread always
 * wins — when a genuine chat reply is unread the synthetic badge is fully
 * suppressed (see ChatWidget's badgeCount merge). Keys live in the separate
 * `rentacar-teaser:*` namespace.
 *
 * Same proven shape as useChatConversation: a pure, unit-testable factory
 * (createContactTeaser) whose browser access is FEATURE-DETECTED, plus a
 * client-only per-brand singleton wrapper with a hard SSR guard.
 */
import { ref } from 'vue';
import { trackAnalyticsEvent } from '@rentacar-main/logic/utils';
// Suppress-after-engagement window is aligned with the chat's local TTL (15d):
// after a contact action, no teaser for the same span the chat history lives.
import { CHAT_TTL_MS } from './useChatConversation';

export const TEASER_FIRST_DELAY_MS = 5_000;
export const TEASER_SECOND_DELAY_MS = 20_000;
export const TEASER_SUPPRESS_MS = CHAT_TTL_MS; // 15 days
// Displayed lines (line 1 carries an emoji for the visible bubble).
export const TEASER_LINE_1 = '¡Hola! 👋 ¿Buscas carro? Escríbenos, respondemos ya.';
export const TEASER_LINE_2 = '¿Dudas de requisitos o precios? Estamos en línea.';
// Screen-reader copy: emoji-free (line 1 without the waving hand). The visible
// bubble uses the constants above; teaserAnnounce uses these.
const TEASER_LINE_1_PLAIN = '¡Hola! ¿Buscas carro? Escríbenos, respondemos ya.';

export type TeaserTarget = 'whatsapp' | 'llamada' | 'chat';

// Per-instance config resolved once from the Nuxt context by the wrapper below,
// so the factory itself is free of Nuxt auto-imports and unit-testable.
export interface ContactTeaserConfig {
  brand: string;
  // sessionStorage: at most one teaser per browser session.
  shownKey: string;
  // localStorage: epoch ms of the last contact engagement (15d suppression).
  engagedKey: string;
}

// The teaser instance. Browser access is FEATURE-DETECTED (typeof
// window/sessionStorage/localStorage) so it stays inert during SSR and is
// drivable under vitest with stubbed globals; the wrapper's import.meta.client
// guard is what prevents cross-request memo pollution on the server.
export function createContactTeaser(cfg: ContactTeaserConfig) {
  const { brand, shownKey, engagedKey } = cfg;
  const hasWindow = typeof window !== 'undefined';
  const hasSession = typeof sessionStorage !== 'undefined';
  const hasLocal = typeof localStorage !== 'undefined';

  const syntheticCount = ref<0 | 1 | 2>(0);
  const teaserStep = ref<0 | 1 | 2>(0);
  const teaserVisible = ref(false);
  const teaserAnnounce = ref('');

  let realUnread: () => number = () => 0;
  // Terminal latch (suppressed | dismissed | engaged). Once set, start() is a
  // no-op for the rest of this instance's life — the teaser is DONE for the
  // session. NOT a "started" flag: an unshown/mid-progression teaser stays
  // resumable across stop()+start() (unmount → remount) so "once per session"
  // means once actually SHOWN, not once attempted.
  let terminal = false;
  let timer1: ReturnType<typeof setTimeout> | null = null;
  let timer2: ReturnType<typeof setTimeout> | null = null;

  function clearTimers() {
    if (timer1 !== null) {
      clearTimeout(timer1);
      timer1 = null;
    }
    if (timer2 !== null) {
      clearTimeout(timer2);
      timer2 = null;
    }
  }

  // --- Storage (fail-open) ----------------------------------------------------
  // Every access is try/catch-guarded: Safari private mode throws on write, and
  // the accepted trade-off is the teaser may re-show rather than break.
  function sessionShown(): boolean {
    if (!hasSession) return false;
    try {
      return sessionStorage.getItem(shownKey) === '1';
    } catch {
      return false;
    }
  }
  function markSessionShown() {
    if (!hasSession) return;
    try {
      sessionStorage.setItem(shownKey, '1');
    } catch {
      /* private mode — fail-open */
    }
  }
  function recentlyEngaged(): boolean {
    if (!hasLocal) return false;
    try {
      const raw = localStorage.getItem(engagedKey);
      if (!raw) return false;
      const at = Number(raw);
      if (!Number.isFinite(at)) return false;
      return Date.now() - at < TEASER_SUPPRESS_MS;
    } catch {
      return false;
    }
  }
  function stampEngaged() {
    if (!hasLocal) return;
    try {
      localStorage.setItem(engagedKey, String(Date.now()));
    } catch {
      /* private mode — fail-open */
    }
  }

  // --- State machine: idle → step1 → step2 (terminals: suppressed | dismissed |
  // engaged). Progress lives in teaserStep + the terminal latch, so unmount
  // (stop → clear timers) leaves an unshown/mid-progression teaser resumable. --
  function showStep1() {
    timer1 = null;
    // Re-check the REAL unread at fire time (closes the race with a chat reply
    // that landed during the 5s wait). A real reply means the teaser is DONE for
    // the session (full reset, terminal) — never resurrects. markSessionShown
    // runs only when step 1 actually renders, so a suppressed fire does NOT
    // consume the persistent session cap.
    if (realUnread() > 0) return suppressForSession();
    markSessionShown();
    teaserStep.value = 1;
    syntheticCount.value = 1;
    teaserVisible.value = true;
    teaserAnnounce.value = TEASER_LINE_1_PLAIN;
    trackAnalyticsEvent('contact_teaser_shown', { brand, step: 1 });
    timer2 = setTimeout(showStep2, TEASER_SECOND_DELAY_MS);
  }

  function showStep2() {
    timer2 = null;
    if (realUnread() > 0) return suppressForSession();
    teaserStep.value = 2;
    syntheticCount.value = 2; // capped at 2
    teaserVisible.value = true;
    teaserAnnounce.value = `${TEASER_LINE_1_PLAIN} ${TEASER_LINE_2}`;
    trackAnalyticsEvent('contact_teaser_shown', { brand, step: 2 });
  }

  // Resumable scheduling: NOT a one-shot. A remount (stop cleared the pending
  // timer, state stayed non-terminal) re-enters here and continues where it left
  // off — schedule step 1 if unshown, re-arm step 2 if mid-progression. Terminal
  // → done. "unless already pending" keeps it idempotent within a mounted
  // lifetime (double start never double-schedules).
  function start(deps: { realUnread: () => number }) {
    realUnread = deps.realUnread;
    if (terminal) return;
    if (!hasWindow) return;
    if (teaserStep.value === 0) {
      if (timer1 !== null) return; // already pending
      // Guards only gate the first scheduling: session cap, 15d suppression, and
      // the real unread taking precedence.
      if (sessionShown()) return;
      if (recentlyEngaged()) return;
      if (realUnread() > 0) return;
      timer1 = setTimeout(showStep1, TEASER_FIRST_DELAY_MS);
    } else if (teaserStep.value === 1) {
      if (timer2 !== null) return; // already pending
      timer2 = setTimeout(showStep2, TEASER_SECOND_DELAY_MS);
    }
    // step === 2 → nothing left to schedule.
  }

  function clearVisual() {
    clearTimers();
    teaserVisible.value = false;
    syntheticCount.value = 0;
    teaserStep.value = 0;
    teaserAnnounce.value = '';
  }

  // Called on unmount: drop pending timers only. Leaves the state machine
  // resumable (non-terminal step survives) so a remount continues via start().
  function stop() {
    clearTimers();
  }

  // A real chat reply appeared (fire-time race OR the ChatWidget unread watcher):
  // the synthetic teaser is DONE for the session, permanently. Full reset +
  // terminal latch so it never resurrects when unread later returns to 0. No
  // analytics event (it's a real conversation, not a teaser outcome).
  function suppressForSession() {
    clearVisual();
    terminal = true;
  }

  // The X on the bubble. Terminal for the session; does NOT stamp the 15d window.
  function dismiss() {
    const wasActive = teaserVisible.value || syntheticCount.value > 0;
    clearVisual();
    terminal = true;
    if (wasActive) trackAnalyticsEvent('contact_teaser_dismissed', { brand });
  }

  // Any contact action (WhatsApp / Llamar / open Chat). Stamps the 15d
  // suppression ALWAYS — even with no active teaser, an engaged visitor should
  // not be nudged for 15 days — but emits the engaged event only when a teaser
  // was actually up (so a plain chat-open with no teaser is not miscounted).
  function engage(target: TeaserTarget) {
    const wasActive = teaserVisible.value || syntheticCount.value > 0;
    stampEngaged();
    clearVisual();
    terminal = true;
    if (wasActive) trackAnalyticsEvent('contact_teaser_engaged', { brand, target });
  }

  return {
    syntheticCount,
    teaserStep,
    teaserVisible,
    teaserAnnounce,
    start,
    stop,
    dismiss,
    engage,
    suppressForSession,
  };
}

export type ContactTeaser = ReturnType<typeof createContactTeaser>;

// Client-only per-brand memo (mirrors useChatConversation): one teaser owner per
// brand so a re-mounted FAB does not restart the timers. Never populated on the
// server (see the wrapper's guard).
const teaserInstances = new Map<string, ContactTeaser>();

// Exported for unit tests: proves the client memo semantics independent of the
// SSR guard.
export function getOrCreateTeaser(brand: string, factory: () => ContactTeaser): ContactTeaser {
  let inst = teaserInstances.get(brand);
  if (!inst) {
    inst = factory();
    teaserInstances.set(brand, inst);
  }
  return inst;
}

export function useContactTeaser(): ContactTeaser {
  const { franchise } = useAppConfig();
  const brand = franchise.shortname as string;
  const cfg: ContactTeaserConfig = {
    brand,
    shownKey: `rentacar-teaser:${brand}:shown`,
    engagedKey: `rentacar-teaser:${brand}:engagedAt`,
  };

  // HARD SSR guard: on the server return a FRESH, never-memoized instance per
  // call so two concurrent renders can never share state. The module memo is
  // only ever touched on the client.
  if (!import.meta.client) return createContactTeaser(cfg);
  return getOrCreateTeaser(brand, () => createContactTeaser(cfg));
}
