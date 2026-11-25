import type { LocationQuery, LocationQueryValue } from 'vue-router'

/** A single string query value as written; arrays, `null`, empty and blank values are `undefined`. */
export function queryValue(value: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

type QueryEntry = [key: string, value: LocationQuery[string]]

/**
 * The query after applying `patch`, in the same key order (so an unchanged query is the same URL
 * and the router skips the navigation). Patched keys with no value or a blank one are removed.
 */
export function patchedQuery(current: LocationQuery, patch: Record<string, string | undefined>): LocationQuery {
  const isKept = ([key]: [string, unknown]): boolean => !(key in patch) || !!patch[key]?.trim()
  return Object.fromEntries(
    Object.entries({ ...current, ...patch }).filter((entry): entry is QueryEntry => isKept(entry)),
  )
}
