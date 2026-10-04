// Strict-privacy browsers throw a SecurityError on the PROPERTY ACCESS
// `window.sessionStorage` / `window.localStorage` — and `typeof sessionStorage`
// evaluates that same getter, so the usual `typeof x !== 'undefined'` feature
// detection throws instead of answering. These helpers are the one safe way to
// feature-detect web storage: the access itself is inside the try, and every
// failure mode (SSR, privacy mode, disabled storage) degrades to `null`.
//
// Callers still need try/catch around individual getItem/setItem calls: Safari
// private mode hands out a Storage whose WRITES throw even though the property
// access works.

export function getSessionStorageSafe(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null; // access denied (privacy mode / disabled storage)
  }
}

export function getLocalStorageSafe(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // access denied (privacy mode / disabled storage)
  }
}
