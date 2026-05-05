export async function register() {
  // ── Required environment variable check ────────────────────────────────────
  // Fail loudly at startup rather than silently at runtime.
  if (typeof window === 'undefined') {
    const required = ['NEXTAUTH_SECRET', 'DATABASE_URL']
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(
          `[Jasper] Required environment variable "${key}" is not set. ` +
          'The server cannot start safely without it.'
        )
      }
    }
  }

  // ── Node.js 22+ broken localStorage patch ──────────────────────────────────
  // Node.js 22+ exposes a native localStorage global when Next.js Turbopack
  // passes --localstorage-file. If the path is invalid the object exists but
  // has no working methods, crashing SSR. Patch it with a no-op store.
  if (
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.getItem !== 'function'
  ) {
    const store = {}
    globalThis.localStorage = {
      getItem:    (k) => store[k] ?? null,
      setItem:    (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
      clear:      () => { Object.keys(store).forEach(k => delete store[k]) },
      get length() { return Object.keys(store).length },
      key:        (i) => Object.keys(store)[i] ?? null,
    }
  }
}
