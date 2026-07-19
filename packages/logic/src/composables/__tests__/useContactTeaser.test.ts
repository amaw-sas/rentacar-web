import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createContactTeaser,
  getOrCreateTeaser,
  isContactTeaserRouteExcluded,
  useContactTeaser,
  TEASER_FIRST_DELAY_MS,
  TEASER_SECOND_DELAY_MS,
  TEASER_SUPPRESS_MS,
  type ContactTeaserConfig,
} from '../useContactTeaser';

// Contact teaser: proactive greeting + synthetic FAB badge
// (contact-teaser-synthetic-badge.scenarios.md). Browser access in the factory
// is feature-detected, so we drive it with hand-rolled stubs (no jsdom here) for
// sessionStorage / localStorage / window, plus vitest fake timers for the 5s/20s
// progression. The synthetic state lives ONLY in the rentacar-teaser:* namespace.

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    _store: store,
  };
}

// Storage whose reads and writes throw (Safari private mode) — fail-open path.
function makeThrowingStorage() {
  return {
    getItem: () => {
      throw new Error('private mode');
    },
    setItem: () => {
      throw new Error('private mode');
    },
    removeItem: () => {
      throw new Error('private mode');
    },
    clear: () => {},
  };
}

function makeWindow() {
  const events: Array<{ name: string; params?: Record<string, unknown> }> = [];
  return {
    gtag: (_kind: string, name: string, params?: Record<string, unknown>) =>
      void events.push({ name, params }),
    events,
  };
}

let session: ReturnType<typeof makeStorage>;
let local: ReturnType<typeof makeStorage>;
let win: ReturnType<typeof makeWindow>;

function setupBrowser() {
  session = makeStorage();
  local = makeStorage();
  win = makeWindow();
  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('window', win);
}

let brandSeq = 0;
function cfg(): ContactTeaserConfig {
  const brand = `t${brandSeq++}`;
  return {
    brand,
    shownKey: `rentacar-teaser:${brand}:shown`,
    engagedKey: `rentacar-teaser:${brand}:engagedAt`,
  };
}

// Names of every event the gtag stub received, in order.
function firedEvents(): string[] {
  return win.events.map((e) => e.name);
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('SCEN-001/002 — greeting at 5s, second line at +20s (badge capped at 2)', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('SCEN-001: fires step 1 at 5s → badge 1, emoji-free announce, event {step:1}, session flag', () => {
    const c = cfg();
    const inst = createContactTeaser(c);
    inst.start({ realUnread: () => 0 });
    expect(inst.teaserStep.value).toBe(0);

    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(1);
    expect(inst.syntheticCount.value).toBe(1);
    expect(inst.teaserVisible.value).toBe(true);
    expect(inst.teaserAnnounce.value.length).toBeGreaterThan(0);
    expect(inst.teaserAnnounce.value).not.toContain('👋');
    const shown = win.events.find((e) => e.name === 'contact_teaser_shown');
    expect(shown?.params).toEqual({ brand: c.brand, step: 1 });
    expect(session.getItem(c.shownKey)).toBe('1');
  });

  it('SCEN-002: fires step 2 at +20s → badge 2, capped, event {step:2}', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    vi.advanceTimersByTime(TEASER_SECOND_DELAY_MS);
    expect(inst.teaserStep.value).toBe(2);
    expect(inst.syntheticCount.value).toBe(2);
    // Nothing pushes past 2 — no further timer exists.
    vi.advanceTimersByTime(TEASER_SECOND_DELAY_MS * 5);
    expect(inst.syntheticCount.value).toBe(2);
    const shownSteps = win.events
      .filter((e) => e.name === 'contact_teaser_shown')
      .map((e) => e.params?.step);
    expect(shownSteps).toEqual([1, 2]);
  });
});

describe('SCEN-003 — dismiss cancels the +20s timer and clears', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('dismiss after step 1 clears state, emits dismissed, and step 2 never fires', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(1);

    inst.dismiss();
    expect(inst.teaserVisible.value).toBe(false);
    expect(inst.syntheticCount.value).toBe(0);
    expect(firedEvents()).toContain('contact_teaser_dismissed');

    vi.advanceTimersByTime(TEASER_SECOND_DELAY_MS);
    expect(inst.teaserStep.value).toBe(0);
  });
});

describe('SCEN-004 — engage clears, stamps 15d, emits only when a teaser was active', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('engage while active clears, writes engagedAt, and emits contact_teaser_engaged {target}', () => {
    const c = cfg();
    const inst = createContactTeaser(c);
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);

    inst.engage('whatsapp');
    expect(inst.teaserVisible.value).toBe(false);
    expect(inst.syntheticCount.value).toBe(0);
    expect(local.getItem(c.engagedKey)).not.toBeNull();
    const engaged = win.events.find((e) => e.name === 'contact_teaser_engaged');
    expect(engaged?.params).toEqual({ brand: c.brand, target: 'whatsapp' });
  });

  it('engage with NO active teaser still stamps engagedAt but emits no event', () => {
    const c = cfg();
    const inst = createContactTeaser(c);
    // Never started → no teaser up.
    inst.engage('chat');
    expect(local.getItem(c.engagedKey)).not.toBeNull();
    expect(firedEvents()).not.toContain('contact_teaser_engaged');
  });
});

describe('SCEN-005 — frequency caps: session flag + 15-day boundary', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('session flag already set → never shows', () => {
    const c = cfg();
    session.setItem(c.shownKey, '1');
    const inst = createContactTeaser(c);
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(0);
  });

  it('engagedAt just under 15 days → suppressed; just over → allowed', () => {
    const under = cfg();
    local.setItem(under.engagedKey, String(Date.now() - (TEASER_SUPPRESS_MS - 1)));
    const a = createContactTeaser(under);
    a.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(a.teaserStep.value).toBe(0);

    const over = cfg();
    local.setItem(over.engagedKey, String(Date.now() - (TEASER_SUPPRESS_MS + 1)));
    const b = createContactTeaser(over);
    b.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(b.teaserStep.value).toBe(1);
  });
});

describe('SCEN-006 — real unread always wins; zero rentacar-chat:* writes', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('realUnread > 0 at start → never shows', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 1 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(0);
    expect(inst.syntheticCount.value).toBe(0);
  });

  it('realUnread flips positive at fire time → suppressed AND session cap NOT consumed', () => {
    const c = cfg();
    let ru = 0;
    const inst = createContactTeaser(c);
    inst.start({ realUnread: () => ru });
    ru = 1; // a genuine reply landed during the 5s wait
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(0);
    // Session flag never written → a later session with no real unread can show.
    expect(session.getItem(c.shownKey)).toBeNull();
  });

  it('a full lifecycle writes ZERO keys in the rentacar-chat:* namespace', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    vi.advanceTimersByTime(TEASER_SECOND_DELAY_MS);
    inst.engage('whatsapp');
    const allKeys = [...session._store.keys(), ...local._store.keys()];
    expect(allKeys.some((k) => k.startsWith('rentacar-chat:'))).toBe(false);
    expect(allKeys.every((k) => k.startsWith('rentacar-teaser:'))).toBe(true);
  });
});

describe('SCEN-007 — SSR guard + per-brand client singleton', () => {
  it('per-brand memo: same brand → same instance; different brand differs', () => {
    setupBrowser();
    const c = cfg();
    const a = getOrCreateTeaser(c.brand, () => createContactTeaser(c));
    const b = getOrCreateTeaser(c.brand, () => createContactTeaser(c));
    expect(b).toBe(a);
    const c2 = cfg();
    const other = getOrCreateTeaser(c2.brand, () => createContactTeaser(c2));
    expect(other).not.toBe(a);
  });

  it('SSR path (no browser globals): distinct inert instances that schedule nothing', () => {
    // No window/storage stubs → true SSR. Only the Nuxt context is stubbed.
    vi.stubGlobal('useAppConfig', () => ({ franchise: { shortname: 'ssrbrand' } }));
    vi.useFakeTimers();
    const a = useContactTeaser();
    const b = useContactTeaser();
    expect(b).not.toBe(a); // fresh per call, never memoized on the server
    a.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS * 4);
    expect(a.teaserStep.value).toBe(0); // no window → nothing scheduled
  });
});

describe('review hardening — fail-open storage, stop, idempotent start', () => {
  beforeEach(() => vi.useFakeTimers());

  it('throwing storage → start/step/engage still run (fail-open)', () => {
    win = makeWindow();
    vi.stubGlobal('window', win);
    vi.stubGlobal('sessionStorage', makeThrowingStorage());
    vi.stubGlobal('localStorage', makeThrowingStorage());
    const inst = createContactTeaser(cfg());
    expect(() => {
      inst.start({ realUnread: () => 0 });
      vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    }).not.toThrow();
    expect(inst.teaserStep.value).toBe(1); // shows anyway
    expect(() => inst.engage('llamada')).not.toThrow();
  });

  it('stop() cancels the pending timer before it fires', () => {
    setupBrowser();
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    inst.stop();
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(0);
  });

  it('start() is idempotent — a second call does not double-schedule', () => {
    setupBrowser();
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    const shown = win.events.filter((e) => e.name === 'contact_teaser_shown');
    expect(shown.length).toBe(1);
  });

  it('SCEN-003: dismiss with NO active teaser does not emit contact_teaser_dismissed', () => {
    setupBrowser();
    const inst = createContactTeaser(cfg());
    // Never started → nothing showing.
    inst.dismiss();
    expect(firedEvents()).not.toContain('contact_teaser_dismissed');
  });
});

describe('SCEN-005 resume — unmount clears timers but the teaser still shows once', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('start → stop (unmount before 5s) → start (remount) re-schedules; shows exactly once', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(2_000); // navigate away at t=2s, before step 1
    inst.stop(); // clears the pending timer1, state stays resumable (step 0)
    expect(inst.teaserStep.value).toBe(0);

    inst.start({ realUnread: () => 0 }); // remount at t=6s → re-schedule
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserStep.value).toBe(1);
    const shown = win.events.filter((e) => e.name === 'contact_teaser_shown');
    expect(shown.length).toBe(1); // shown once, not zero, not twice
  });

  it('unmount BETWEEN step 1 and step 2 then remount → step 2 still fires (badge → 2)', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS); // step 1
    expect(inst.teaserStep.value).toBe(1);
    inst.stop(); // unmount mid-progression: clears the pending timer2
    inst.start({ realUnread: () => 0 }); // remount → re-arm timer2
    vi.advanceTimersByTime(TEASER_SECOND_DELAY_MS);
    expect(inst.teaserStep.value).toBe(2);
    expect(inst.syntheticCount.value).toBe(2);
  });
});

describe('SCEN-006 permanent suppression — real unread ends the teaser for the session', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('real unread at fire time fully resets the synthetic state (not a bare early-return)', () => {
    let ru = 0;
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => ru });
    ru = 1; // a genuine reply landed during the 5s wait
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserVisible.value).toBe(false);
    expect(inst.syntheticCount.value).toBe(0);
    expect(inst.teaserStep.value).toBe(0);
  });

  it('once suppressed by a real reply, it never resurrects when unread returns to 0', () => {
    let ru = 1;
    const inst = createContactTeaser(cfg());
    // Step 1 is live, then a real reply arrives → the widget calls suppressForSession.
    inst.start({ realUnread: () => ru });
    // Simulate the ChatWidget unread watcher firing when the real reply lands.
    inst.suppressForSession();
    expect(inst.teaserVisible.value).toBe(false);
    // User reads the real reply → unread back to 0 → later start() must stay inert.
    ru = 0;
    inst.start({ realUnread: () => ru });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS);
    expect(inst.teaserStep.value).toBe(0);
    expect(inst.teaserVisible.value).toBe(false);
  });

  it('suppressForSession is terminal — a later start() is a no-op and emits nothing', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS); // step 1 showing
    inst.suppressForSession();
    inst.start({ realUnread: () => 0 }); // terminal → no-op
    vi.advanceTimersByTime(TEASER_SECOND_DELAY_MS * 3);
    expect(inst.teaserStep.value).toBe(0);
    // No dedicated analytics event for suppression.
    expect(firedEvents()).not.toContain('contact_teaser_suppressed');
  });
});

describe('Burbuja chat mission E1–E4', () => {
  beforeEach(() => {
    setupBrowser();
    vi.useFakeTimers();
  });

  it('E1 — an OFF gate schedules no invitation, badge or announcement', () => {
    let chatEnabled = false;
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0, allowed: () => chatEnabled });

    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS);
    expect(inst.teaserVisible.value).toBe(false);
    expect(inst.syntheticCount.value).toBe(0);
    expect(inst.teaserAnnounce.value).toBe('');

    // The initial fail-closed value is not terminal: a later confirmed ON can
    // start the normal behavior for enabled brands.
    chatEnabled = true;
    inst.start({ realUnread: () => 0, allowed: () => chatEnabled });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.teaserVisible.value).toBe(true);
  });

  it('E2 — summary and every following /reservas funnel URL are excluded', () => {
    expect(isContactTeaserRouteExcluded('/reservas')).toBe(true);
    expect(isContactTeaserRouteExcluded('/reservas/')).toBe(true);
    expect(
      isContactTeaserRouteExcluded(
        '/reservas/lugar-recogida/bogota/categoria/CCAR',
      ),
    ).toBe(true);
    expect(isContactTeaserRouteExcluded('/')).toBe(false);
    expect(isContactTeaserRouteExcluded('/carros')).toBe(false);
  });

  it('E3 — dismiss is local state only and leaves the current URL untouched', () => {
    const location = { href: 'https://alquicarros.com/reservas?paso=seguro' };
    vi.stubGlobal('window', { ...makeWindow(), location });
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0 });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);

    inst.dismiss();

    expect(location.href).toBe('https://alquicarros.com/reservas?paso=seguro');
    expect(inst.teaserVisible.value).toBe(false);
  });

  it('E4 — an ON gate preserves the existing two-step teaser behavior', () => {
    const inst = createContactTeaser(cfg());
    inst.start({ realUnread: () => 0, allowed: () => true });
    vi.advanceTimersByTime(TEASER_FIRST_DELAY_MS);
    expect(inst.syntheticCount.value).toBe(1);
    vi.advanceTimersByTime(TEASER_SECOND_DELAY_MS);
    expect(inst.syntheticCount.value).toBe(2);
  });
});
