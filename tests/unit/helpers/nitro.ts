// Plain Vitest has no Nitro runtime. This replaces exactly two Nitro auto-imports,
// `defineCachedFunction` and `useRuntimeConfig`, and must run before the handlers are imported.
import { createApp, createRouter, toWebHandler } from 'h3'
import { vi } from 'vitest'

export const TEST_CONFIG = {
  sportsdbApiKey: 'test-key',
  sportsdbBaseUrl: 'https://upstream.test/api/v1/json',
}

interface CachedOptions<A extends unknown[]> {
  name?: string
  getKey?: (...args: A) => string
  maxAge?: number
  swr?: boolean
}

export interface CachedDeclaration {
  name?: string
  maxAge?: number
  swr?: boolean
  hasGetKey: boolean
}

export interface NitroStubs {
  /** Every `defineCachedFunction` call, in declaration order. */
  declarations: CachedDeclaration[]
  /** The cache key of every call to a cached function. */
  keys: Array<{ name?: string, key: string }>
}

/**
 * `memoise: false` — a recording pass-through: every call runs the function.
 * `memoise: true` — a fake cache that, like Nitro, stores resolved values per key and never stores
 * a thrown error, so a call after a failure runs the function again.
 */
export function installNitroStubs({ memoise }: { memoise: boolean }): NitroStubs {
  const stubs: NitroStubs = { declarations: [], keys: [] }

  function defineCachedFunction<A extends unknown[], R>(
    fn: (...args: A) => Promise<R>,
    options: CachedOptions<A>,
  ): (...args: A) => Promise<R> {
    stubs.declarations.push({
      name: options.name,
      maxAge: options.maxAge,
      swr: options.swr,
      hasGetKey: typeof options.getKey === 'function',
    })
    const stored = new Map<string, R>()
    return async (...args: A): Promise<R> => {
      const key = options.getKey?.(...args) ?? ''
      stubs.keys.push({ name: options.name, key })
      const cached = memoise ? stored.get(key) : undefined
      if (cached !== undefined) return cached
      const value = await fn(...args)
      if (memoise) stored.set(key, value)
      return value
    }
  }

  vi.stubGlobal('defineCachedFunction', defineCachedFunction)
  vi.stubGlobal('useRuntimeConfig', () => TEST_CONFIG)
  return stubs
}

/** Mounts the API handlers on a real h3 app; returns a `Request → Response` function. */
export async function loadApiRoutes(): Promise<(path: string) => Promise<Response>> {
  const [{ default: leagues }, { default: seasons }, { default: details }] = await Promise.all([
    import('#server/api/leagues/index.get'),
    import('#server/api/leagues/[id]/seasons.get'),
    import('#server/api/leagues/[id]/index.get'),
  ])
  const router = createRouter()
    .get('/api/leagues', leagues)
    .get('/api/leagues/:id/seasons', seasons)
    .get('/api/leagues/:id', details)
  const handle = toWebHandler(createApp().use(router))
  return path => handle(new Request(`http://localhost${path}`))
}
