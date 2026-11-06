/**
 * A tiny external store that plugs into React's useSyncExternalStore.
 * Optionally persisted to localStorage. Reads are validated, writes are try/caught, and
 * other tabs stay in sync through the `storage` event. Server render always sees `initial`,
 * so there are no hydration mismatches.
 */
export interface Store<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T | ((previous: T) => T)) => void;
  reset: () => void;
}

export function createStore<T>(
  initial: T,
  persistence?: { key: string; parse: (raw: unknown) => T | null },
): Store<T> {
  let state = initial;
  let loaded = !persistence;
  let storageBound = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  function load() {
    loaded = true;
    if (!persistence || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(persistence.key);
      if (!raw) return;
      const parsed = persistence.parse(JSON.parse(raw));
      if (parsed) state = parsed;
    } catch {
      // Corrupt JSON or blocked storage: fall back to the initial state.
    }
  }

  function write(value: T) {
    if (!persistence || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(persistence.key, JSON.stringify(value));
    } catch {
      // Quota exceeded / private mode: keep working in memory.
    }
  }

  function onStorage(event: StorageEvent) {
    if (!persistence || (event.key !== null && event.key !== persistence.key)) return;
    state = initial;
    load();
    emit();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (persistence && !storageBound && typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
        storageBound = true;
      }
      return () => {
        listeners.delete(listener);
        if (persistence && storageBound && listeners.size === 0 && typeof window !== "undefined") {
          window.removeEventListener("storage", onStorage);
          storageBound = false;
        }
      };
    },
    getSnapshot() {
      if (!loaded) load();
      return state;
    },
    getServerSnapshot: () => initial,
    set(next) {
      if (!loaded) load();
      const value = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      write(value);
      emit();
    },
    reset() {
      state = initial;
      if (persistence && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(persistence.key);
        } catch {
          /* ignore */
        }
      }
      emit();
    },
  };
}
