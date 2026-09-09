/**
 * Helper utility to safely interact with browser localStorage.
 * Prevents DOMExceptions like QuotaExceededError or SecurityError from crashing React components.
 */

export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to set key "${key}":`, err);
    return false;
  }
}

export function safeGetLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to get key "${key}":`, err);
    return null;
  }
}

export function safeRemoveLocalStorage(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to remove key "${key}":`, err);
    return false;
  }
}
