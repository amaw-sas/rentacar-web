import { getLocalStorageSafe } from '../safeWebStorage';

export interface StoredAdvisor {
  code: string;
  name: string;
}

const ADVISOR_KEY = 'rentacar:asesor';

function isStoredAdvisor(v: unknown): v is StoredAdvisor {
  if (!v || typeof v !== 'object') return false;
  const { code, name } = v as Record<string, unknown>;
  return typeof code === 'string' && code !== '' && typeof name === 'string';
}

// Survives blocked/unavailable storage for the life of the page session.
let memoryAdvisor: StoredAdvisor | null = null;

/** Test-only: drops the in-memory copy so tests do not leak into each other. */
export function __resetAdvisorMemoryForTests(): void {
  memoryAdvisor = null;
}

function removeFromStorage(): void {
  try {
    getLocalStorageSafe()?.removeItem(ADVISOR_KEY);
  } catch {
    // storage unavailable
  }
}

export function clearStoredAdvisor(): void {
  memoryAdvisor = null;
  removeFromStorage();
}

/** Legacy '1' (#519), invalid JSON or a wrong shape are removed and read as null. */
export function readStoredAdvisor(): StoredAdvisor | null {
  try {
    const storage = getLocalStorageSafe();
    const raw = storage?.getItem(ADVISOR_KEY);
    if (raw == null) return memoryAdvisor;
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // falls through to removal
    }
    if (isStoredAdvisor(parsed)) return { code: parsed.code, name: parsed.name };
    removeFromStorage();
    return memoryAdvisor;
  } catch {
    return memoryAdvisor;
  }
}

export function writeStoredAdvisor(advisor: StoredAdvisor): void {
  memoryAdvisor = { code: advisor.code, name: advisor.name };
  try {
    getLocalStorageSafe()?.setItem(
      ADVISOR_KEY,
      JSON.stringify({ code: advisor.code, name: advisor.name }),
    );
  } catch {
    // storage unavailable: advisor lasts only for this page session
  }
}
