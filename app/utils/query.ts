import type { LocationQueryValue } from 'vue-router'

/** A single string query value as written; arrays, `null`, empty and blank values are `undefined`. */
export function queryValue(value: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}
